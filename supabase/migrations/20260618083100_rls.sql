-- Row Level Security policies
-- Helper functions are SECURITY DEFINER so policies can read profiles
-- without triggering recursive RLS evaluation on profiles itself.

create function public.current_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create function public.current_branch_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select branch_id from public.profiles where id = auth.uid();
$$;

create function public.is_legal_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.current_role() = 'legal_admin';
$$;

-- ---------------------------------------------------------------------------
-- branches
-- ---------------------------------------------------------------------------
alter table public.branches enable row level security;

create policy "branches_select" on public.branches
  for select using (public.is_legal_admin() or id = public.current_branch_id());

create policy "branches_admin_write" on public.branches
  for all using (public.is_legal_admin()) with check (public.is_legal_admin());

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

create policy "profiles_select" on public.profiles
  for select using (public.is_legal_admin() or id = auth.uid());

create policy "profiles_admin_write" on public.profiles
  for insert with check (public.is_legal_admin());

create policy "profiles_admin_update" on public.profiles
  for update using (public.is_legal_admin()) with check (public.is_legal_admin());

create policy "profiles_admin_delete" on public.profiles
  for delete using (public.is_legal_admin());

-- ---------------------------------------------------------------------------
-- document_types / employee_document_types
-- ---------------------------------------------------------------------------
alter table public.document_types enable row level security;
alter table public.employee_document_types enable row level security;

create policy "document_types_select" on public.document_types
  for select using (auth.uid() is not null);

create policy "document_types_admin_write" on public.document_types
  for all using (public.is_legal_admin()) with check (public.is_legal_admin());

create policy "employee_document_types_select" on public.employee_document_types
  for select using (auth.uid() is not null);

create policy "employee_document_types_admin_write" on public.employee_document_types
  for all using (public.is_legal_admin()) with check (public.is_legal_admin());

-- ---------------------------------------------------------------------------
-- documents
-- ---------------------------------------------------------------------------
alter table public.documents enable row level security;

create policy "documents_select" on public.documents
  for select using (
    public.is_legal_admin() or branch_id = public.current_branch_id()
  );

create policy "documents_insert" on public.documents
  for insert with check (
    public.is_legal_admin() or
    (public.current_role() = 'branch_manager' and branch_id = public.current_branch_id())
  );

create policy "documents_update" on public.documents
  for update using (
    public.is_legal_admin() or
    (public.current_role() = 'branch_manager' and branch_id = public.current_branch_id())
  ) with check (
    public.is_legal_admin() or
    (public.current_role() = 'branch_manager' and branch_id = public.current_branch_id())
  );

create policy "documents_admin_delete" on public.documents
  for delete using (public.is_legal_admin());

-- ---------------------------------------------------------------------------
-- employees
-- ---------------------------------------------------------------------------
alter table public.employees enable row level security;

create policy "employees_select" on public.employees
  for select using (
    public.is_legal_admin() or branch_id = public.current_branch_id()
  );

create policy "employees_insert" on public.employees
  for insert with check (
    public.is_legal_admin() or
    (public.current_role() = 'branch_manager' and branch_id = public.current_branch_id())
  );

create policy "employees_update" on public.employees
  for update using (
    public.is_legal_admin() or
    (public.current_role() = 'branch_manager' and branch_id = public.current_branch_id())
  ) with check (
    public.is_legal_admin() or
    (public.current_role() = 'branch_manager' and branch_id = public.current_branch_id())
  );

create policy "employees_admin_delete" on public.employees
  for delete using (public.is_legal_admin());

-- ---------------------------------------------------------------------------
-- employee_documents (branch-scoped via the parent employee)
-- ---------------------------------------------------------------------------
alter table public.employee_documents enable row level security;

create policy "employee_documents_select" on public.employee_documents
  for select using (
    public.is_legal_admin() or
    exists (
      select 1 from public.employees e
      where e.id = employee_documents.employee_id
        and e.branch_id = public.current_branch_id()
    )
  );

create policy "employee_documents_insert" on public.employee_documents
  for insert with check (
    public.is_legal_admin() or
    (
      public.current_role() = 'branch_manager' and
      exists (
        select 1 from public.employees e
        where e.id = employee_documents.employee_id
          and e.branch_id = public.current_branch_id()
      )
    )
  );

create policy "employee_documents_update" on public.employee_documents
  for update using (
    public.is_legal_admin() or
    (
      public.current_role() = 'branch_manager' and
      exists (
        select 1 from public.employees e
        where e.id = employee_documents.employee_id
          and e.branch_id = public.current_branch_id()
      )
    )
  ) with check (
    public.is_legal_admin() or
    (
      public.current_role() = 'branch_manager' and
      exists (
        select 1 from public.employees e
        where e.id = employee_documents.employee_id
          and e.branch_id = public.current_branch_id()
      )
    )
  );

create policy "employee_documents_admin_delete" on public.employee_documents
  for delete using (public.is_legal_admin());

-- ---------------------------------------------------------------------------
-- audit_logs — append-only, admin-readable
-- ---------------------------------------------------------------------------
alter table public.audit_logs enable row level security;

create policy "audit_logs_select" on public.audit_logs
  for select using (public.is_legal_admin());

create policy "audit_logs_insert" on public.audit_logs
  for insert with check (actor_id = auth.uid());

-- no update/delete policies: log rows are immutable once written

-- ---------------------------------------------------------------------------
-- reminder_log — internal bookkeeping; cron uses the service role (bypasses RLS)
-- ---------------------------------------------------------------------------
alter table public.reminder_log enable row level security;

create policy "reminder_log_admin_select" on public.reminder_log
  for select using (public.is_legal_admin());
