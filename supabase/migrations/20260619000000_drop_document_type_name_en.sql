-- The app is now Arabic-only; document_types/employee_document_types no
-- longer carry an English name. Views depend on the column being dropped,
-- so they're recreated here verbatim (minus the name_en columns).
drop view if exists public.v_branch_document_status;
drop view if exists public.v_employee_document_status;

alter table public.document_types drop column if exists name_en;
alter table public.employee_document_types drop column if exists name_en;

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
