-- Seed data: branches, company document types, employee document types.
-- Arabic strings are best-effort legal/administrative translations —
-- have someone fluent in Egyptian legal terminology review before production use.

insert into public.branches (name) values
  ('Branch 1'),
  ('Branch 2'),
  ('Branch 3'),
  ('Branch 4'),
  ('Branch 5'),
  ('Branch 6'),
  ('Branch 7'),
  ('Branch 8'),
  ('Branch 9'),
  ('Branch 10'),
  ('Branch 11'),
  ('Branch 12'),
  ('Central Kitchen');

insert into public.document_types (name_ar, display_order, default_lead_time_days) values
  ('عقد المبنى', 1, 30),
  ('السجل التجاري للشركة', 2, 30),
  ('البطاقة الضريبية', 3, 30),
  ('ترخيص مزاولة النشاط', 4, 30),
  ('شهادة سلامة الغذاء والصحة', 5, 30),
  ('شهادة التسجيل في ضريبة القيمة المضافة', 6, 30),
  ('التسجيل البيئي', 7, 30),
  ('تقرير الحماية المدنية', 8, 30),
  ('رخصة التصنيف', 9, 30);

insert into public.employee_document_types (name_ar, display_order, default_lead_time_days) values
  ('عقد العمل', 1, 30),
  ('استمارات التأمينات الاجتماعية', 2, 30),
  ('بطاقة الرقم القومي', 3, 30),
  ('شهادة الموقف من التجنيد', 4, 30),
  ('شهادة الموقف الجنائي', 5, 30),
  ('الشهادة الصحية', 6, 30);
