-- Private storage bucket for compliance documents, path-scoped per branch:
--   branch_{branchId}/documents/{documentTypeId}/{timestamp}_{filename}
--   branch_{branchId}/employees/{employeeId}/{employeeDocumentTypeId}/{timestamp}_{filename}
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'compliance-documents',
  'compliance-documents',
  false,
  15728640, -- 15 MB
  array['application/pdf', 'image/jpeg', 'image/png']
);

create policy "compliance_documents_select" on storage.objects
  for select using (
    bucket_id = 'compliance-documents' and (
      public.is_legal_admin() or
      (storage.foldername(name))[1] = 'branch_' || public.current_branch_id()::text
    )
  );

create policy "compliance_documents_insert" on storage.objects
  for insert with check (
    bucket_id = 'compliance-documents' and (
      public.is_legal_admin() or
      (storage.foldername(name))[1] = 'branch_' || public.current_branch_id()::text
    )
  );

create policy "compliance_documents_update" on storage.objects
  for update using (
    bucket_id = 'compliance-documents' and (
      public.is_legal_admin() or
      (storage.foldername(name))[1] = 'branch_' || public.current_branch_id()::text
    )
  ) with check (
    bucket_id = 'compliance-documents' and (
      public.is_legal_admin() or
      (storage.foldername(name))[1] = 'branch_' || public.current_branch_id()::text
    )
  );

create policy "compliance_documents_admin_delete" on storage.objects
  for delete using (
    bucket_id = 'compliance-documents' and public.is_legal_admin()
  );
