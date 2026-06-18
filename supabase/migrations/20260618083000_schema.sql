-- Branch Compliance Document Manager: core schema
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- branches
-- ---------------------------------------------------------------------------
create table public.branches (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- profiles (extends auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('branch_manager', 'legal_admin')),
  branch_id uuid references public.branches (id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint profiles_branch_matches_role check (
    (role = 'branch_manager' and branch_id is not null) or
    (role = 'legal_admin' and branch_id is null)
  )
);

create index profiles_branch_id_idx on public.profiles (branch_id);

-- ---------------------------------------------------------------------------
-- document_types / employee_document_types (data-driven catalogs)
-- ---------------------------------------------------------------------------
create table public.document_types (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  display_order int not null default 0,
  default_lead_time_days int not null default 30,
  is_active boolean not null default true
);

create table public.employee_document_types (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  display_order int not null default 0,
  default_lead_time_days int not null default 30,
  is_active boolean not null default true
);

-- ---------------------------------------------------------------------------
-- documents (branch company documents) — history preserved, no overwrite
-- ---------------------------------------------------------------------------
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches (id) on delete cascade,
  document_type_id uuid not null references public.document_types (id) on delete restrict,
  file_path text,
  start_date date,
  expiry_date date,
  is_not_applicable boolean not null default false,
  notes text,
  uploaded_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index documents_branch_type_start_idx
  on public.documents (branch_id, document_type_id, start_date desc, created_at desc);

-- ---------------------------------------------------------------------------
-- employees
-- ---------------------------------------------------------------------------
create table public.employees (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches (id) on delete cascade,
  full_name text not null,
  title text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index employees_branch_id_idx on public.employees (branch_id);

-- ---------------------------------------------------------------------------
-- employee_documents — history preserved, no overwrite
-- ---------------------------------------------------------------------------
create table public.employee_documents (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  employee_document_type_id uuid not null references public.employee_document_types (id) on delete restrict,
  file_path text,
  start_date date,
  expiry_date date,
  is_not_applicable boolean not null default false,
  notes text,
  uploaded_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index employee_documents_employee_type_start_idx
  on public.employee_documents (employee_id, employee_document_type_id, start_date desc, created_at desc);

-- ---------------------------------------------------------------------------
-- audit_logs
-- ---------------------------------------------------------------------------
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);

-- ---------------------------------------------------------------------------
-- reminder_log — dedupe sent reminders
-- ---------------------------------------------------------------------------
create table public.reminder_log (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('document', 'employee_document')),
  entity_id uuid not null,
  reminder_stage text not null check (reminder_stage in ('60', '30', '7', 'expired')),
  sent_at timestamptz not null default now(),
  channel text not null default 'email',
  unique (entity_type, entity_id, reminder_stage)
);

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger documents_set_updated_at
  before update on public.documents
  for each row execute function public.set_updated_at();

create trigger employee_documents_set_updated_at
  before update on public.employee_documents
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- derived status views (security_invoker so RLS applies to the querying user)
-- ---------------------------------------------------------------------------
create view public.v_branch_document_status
with (security_invoker = true) as
select
  b.id as branch_id,
  b.name as branch_name,
  dt.id as document_type_id,
  dt.name_ar as document_type_name_ar,
  dt.display_order,
  d.id as document_id,
  d.file_path,
  d.start_date,
  d.expiry_date,
  d.is_not_applicable,
  d.notes,
  case
    when d.id is null then 'missing'
    when d.is_not_applicable then 'na'
    when d.expiry_date is null then 'missing'
    when d.expiry_date <= current_date then 'expired'
    when d.expiry_date <= current_date + dt.default_lead_time_days then 'expiring_soon'
    else 'valid'
  end as status
from public.branches b
cross join public.document_types dt
left join lateral (
  select doc.*
  from public.documents doc
  where doc.branch_id = b.id and doc.document_type_id = dt.id
  order by doc.start_date desc nulls last, doc.created_at desc
  limit 1
) d on true
where dt.is_active;

create view public.v_employee_document_status
with (security_invoker = true) as
select
  e.id as employee_id,
  e.branch_id,
  e.full_name as employee_full_name,
  e.title as employee_title,
  edt.id as employee_document_type_id,
  edt.name_ar as employee_document_type_name_ar,
  edt.display_order,
  ed.id as employee_document_id,
  ed.file_path,
  ed.start_date,
  ed.expiry_date,
  ed.is_not_applicable,
  ed.notes,
  case
    when ed.id is null then 'missing'
    when ed.is_not_applicable then 'na'
    when ed.expiry_date is null then 'missing'
    when ed.expiry_date <= current_date then 'expired'
    when ed.expiry_date <= current_date + edt.default_lead_time_days then 'expiring_soon'
    else 'valid'
  end as status
from public.employees e
cross join public.employee_document_types edt
left join lateral (
  select edoc.*
  from public.employee_documents edoc
  where edoc.employee_id = e.id and edoc.employee_document_type_id = edt.id
  order by edoc.start_date desc nulls last, edoc.created_at desc
  limit 1
) ed on true
where e.is_active and edt.is_active;
