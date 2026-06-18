-- Seed data: branches, company document types, employee document types.
-- Arabic strings are best-effort legal/administrative translations —
-- have someone fluent in Egyptian legal terminology review before production use.

insert into public.branches (name) values
  ('Zayed'),
  ('Downtown'),
  ('O West'),
  ('Marina'),
  ('Mountain View'),
  ('Mangroovy'),
  ('Sokhna'),
  ('Al-Ahyaa'),
  ('Hurghada'),
  ('Metro'),
  ('Sahl Hasheesh'),
  ('Makadi'),
  ('Main Kitchen');

insert into public.document_types (name_en, name_ar, display_order, default_lead_time_days) values
  ('Premises Contract', 'عقد المبنى', 1, 30),
  ('Company Commercial Registration', 'السجل التجاري للشركة', 2, 30),
  ('Tax Card', 'البطاقة الضريبية', 3, 30),
  ('Business License', 'ترخيص مزاولة النشاط', 4, 30),
  ('Food Safety and Health Certificate', 'شهادة سلامة الغذاء والصحة', 5, 30),
  ('Value Added Tax Registration Certificate', 'شهادة التسجيل في ضريبة القيمة المضافة', 6, 30),
  ('Environmental Registration', 'التسجيل البيئي', 7, 30),
  ('Civil Defense Report', 'تقرير الحماية المدنية', 8, 30),
  ('Classification License', 'رخصة التصنيف', 9, 30);

insert into public.employee_document_types (name_en, name_ar, display_order, default_lead_time_days) values
  ('Employment Contract', 'عقد العمل', 1, 30),
  ('Employee Insurance Forms', 'استمارات التأمينات الاجتماعية', 2, 30),
  ('National ID Card', 'بطاقة الرقم القومي', 3, 30),
  ('Military Service Certificate', 'شهادة الموقف من التجنيد', 4, 30),
  ('Criminal Record Check / Criminal Status Certificate', 'شهادة الموقف الجنائي', 5, 30),
  ('Health Certificate', 'الشهادة الصحية', 6, 30);
