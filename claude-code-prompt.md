# Claude Code Prompt — Branch Compliance Document Manager

> Paste everything below into Claude Code. Build it in the phases listed at the end rather than all at once.

---

## Context & Goal

Build an internal web app for a multi-branch food & beverage business in Egypt to organize and track the legal/compliance documents that must be present and up to date at every branch. Each document has an attachment, a start date, and an expiry date. Branch managers maintain their own branch's documents; the legal department head oversees all branches. The system must warn people before documents expire.

This is a single multi-branch application with role-based access — **not** one app per branch. The legal head's "all branches" view is simply the admin role's view of the same data.

## Tech Stack

- **Next.js** (App Router, TypeScript) for frontend + API routes
- **Supabase** for Postgres database, authentication, and file storage
- **Supabase Row-Level Security (RLS)** to enforce that branch managers can only access their own branch's data
- **Tailwind CSS** for styling
- **Resend** (or similar) for reminder emails
- **Vercel Cron** for the daily expiry-check job
- Deployable to Vercel + Supabase

## Roles

- `branch_manager` — assigned to exactly one branch. Can view and edit only that branch's company documents, employees, and employee documents.
- `legal_admin` — can view all branches and all documents, run the compliance dashboard, manage document types/branches/users, and receive all reminders.

## Data Model

Design the schema to be **data-driven** (document types live in tables, not hardcoded) and to **preserve history** (renewing a document creates a new record; the current one is the latest by start date).

Tables:

- **branches**: `id`, `name`, `created_at`
- **profiles** (extends Supabase `auth.users`): `id`, `full_name`, `role` (`branch_manager` | `legal_admin`), `branch_id` (nullable for admins), `created_at`
- **document_types** (company-level documents): `id`, `name_en`, `name_ar`, `display_order`, `default_lead_time_days` (how many days before expiry to start warning, default 30), `is_active`
- **employee_document_types**: `id`, `name_en`, `name_ar`, `display_order`, `is_active`
- **documents** (a branch's company documents): `id`, `branch_id`, `document_type_id`, `file_path`, `start_date`, `expiry_date`, `is_not_applicable` (boolean), `notes`, `uploaded_by`, `created_at`, `updated_at`
- **employees**: `id`, `branch_id`, `full_name`, `title`, `is_active`, `created_at`
- **employee_documents**: `id`, `employee_id`, `employee_document_type_id`, `file_path`, `start_date`, `expiry_date`, `is_not_applicable` (boolean), `notes`, `uploaded_by`, `created_at`, `updated_at`
- **audit_logs**: `id`, `actor_id`, `action`, `entity_type`, `entity_id`, `metadata` (jsonb), `created_at`
- **reminder_log**: `id`, `entity_type`, `entity_id`, `reminder_stage` (e.g. `60`, `30`, `7`, `expired`), `sent_at`, `channel` — used to avoid sending the same reminder twice

### RLS policies
- `branch_manager`: can `select`/`insert`/`update` rows in `documents`, `employees`, and `employee_documents` only where the row's `branch_id` (directly, or via the employee for employee_documents) equals their `profiles.branch_id`.
- `legal_admin`: full read across all tables; write access to all tables and to settings tables (`document_types`, `employee_document_types`, `branches`, `profiles`).
- Storage bucket is **private**; files are served via short-lived signed URLs, and file paths are scoped per branch (e.g. `branch_{id}/...`).

### Status logic (derived, not stored)
For each document or employee document:
- **N/A** — `is_not_applicable` is true
- **Missing** — no record exists for a required type
- **Expired** — `expiry_date <= today`
- **Expiring soon** — `today < expiry_date <= today + lead_time_days`
- **Valid** — `expiry_date > today + lead_time_days`

Use the type's `default_lead_time_days` for the threshold.

## Features & Pages

- **/login** — Supabase email/password auth.
- **/ (dashboard)** — role-aware:
  - `branch_manager`: their branch's compliance checklist — the company documents (items 1–9) each showing status, dates, and attachment, plus an "Employee Documents" card (item 10) linking into the employee section.
  - `legal_admin`: a **compliance matrix** of all branches × all document types, color-coded by status (green = valid, amber = expiring soon, red = expired, grey = missing/N/A), with counts of expiring/expired, and the ability to click into any branch.
- **/branches/[branchId]** — branch detail: the 9 company document types listed with status, dates, upload/replace, notes, and N/A toggle; plus the "Employee Documents" card.
- **/branches/[branchId]/employees** — list of that branch's employees showing **name, title**, and a per-employee compliance status. Includes add/edit/deactivate employee.
- **/branches/[branchId]/employees/[employeeId]** — that employee's document list (the 6 employee document types) each with status, start/expiry dates, and attachment; upload/replace + N/A toggle.

  > This implements the requested flow: clicking item 10 ("Employee-Related Documents") on a branch opens the employee list (names + titles); clicking a name opens that employee's documents with dates and attachments.

- **/expiring** (admin) — table of everything expiring soon or already expired across all branches, filterable by branch, document type, and status, sorted by soonest expiry.
- **/settings** (admin) — manage document types, employee document types, branches, and users/roles.

## File Uploads
- Accept PDF, JPG, PNG. Enforce a max file size (e.g. 15 MB).
- Show an inline preview / "view" link for the current attachment via a signed URL.
- Store files in the private Supabase storage bucket, path-scoped per branch.

## Reminders System
- A **Vercel Cron** job runs daily, hitting a protected API route.
- The route finds all documents and employee documents that are expiring soon (at the 60, 30, and 7-day marks) or already expired, skipping anything already logged for that stage in `reminder_log`.
- It emails the relevant **branch manager** and **all legal_admins** a summary (branch, document, expiry date, days remaining), then records each send in `reminder_log`.
- Also surface these as an in-app badge/notification count.

## UI / UX
- Clean, dense, table-friendly admin UI; mobile-responsive (managers upload from phones).
- Status shown as colored badges everywhere.
- **Bilingual English + Arabic with full RTL support** (the document type tables already carry `name_en` and `name_ar`); a language toggle.
- Empty/missing documents should be visually obvious so managers know what's outstanding.

## Security & Compliance
- Authentication required on every page and API route.
- RLS enforced at the database level (don't rely on UI checks alone).
- Private file storage + signed URLs only.
- Employee data (National ID, Criminal Record, etc.) is sensitive — keep access strictly role-scoped and write an `audit_logs` entry on every create/update/delete of a document, employee, or employee document.

## Seed Data

Seed these on first run.

**Branches:**
Zayed, Downtown, O West, Marina, Mountain View, Mangroovy, Sokhna, Al-Ahyaa, Hurghada, Metro, Sahl Hasheesh, Makadi, Main Kitchen

**Company document types (items 1–9):**
1. Premises Contract
2. Company Commercial Registration
3. Tax Card
4. Business License
5. Food Safety and Health Certificate
6. Value Added Tax Registration Certificate
7. Environmental Registration
8. Civil Defense Report
9. Classification License

**Employee document types (item 10 drill-down):**
1. Employment Contract
2. Employee Insurance Forms
3. National ID Card
4. Military Service Certificate
5. Criminal Record Check / Criminal Status Certificate
6. Health Certificate

(Provide Arabic names for each as well; leave a sensible placeholder if unsure and flag it.)

## Build Order (do these as separate, working steps)
1. Project setup, Supabase connection, full schema + RLS policies + seed data.
2. Authentication, profiles, and role-based routing.
3. Branch company-document CRUD with file upload, dates, N/A toggle, and derived status.
4. Legal-admin dashboard: the compliance matrix + the `/expiring` view.
5. Employees + employee documents (the item-10 drill-down flow).
6. Reminders: Vercel Cron job + email sending + `reminder_log` + in-app notifications.
7. Polish: Arabic/RTL i18n, audit logging on all mutations, and the settings screens.

At each step, give me the commands to run and confirm it works before moving on.
