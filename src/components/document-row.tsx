"use client";

import { useActionState, useState } from "react";
import { saveDocumentAction } from "@/lib/actions/documents";
import { StatusBadge, type DocumentStatus } from "@/components/status-badge";
import type { Dictionary } from "@/lib/i18n/en";

type Props = {
  branchId: string;
  documentTypeId: string;
  nameEn: string;
  nameAr: string;
  status: DocumentStatus;
  startDate: string | null;
  expiryDate: string | null;
  isNotApplicable: boolean;
  notes: string | null;
  existingDocumentId: string | null;
  signedUrl: string | null;
  canEdit: boolean;
  t: Dictionary;
};

type ActionState = { error: string | null };

async function action(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return saveDocumentAction(formData);
}

export function DocumentRow(props: Props) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, {
    error: null,
  });
  const [isNotApplicable, setIsNotApplicable] = useState(props.isNotApplicable);
  const { t } = props;

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 border-b border-line px-4 py-3 text-sm last:border-b-0 sm:grid sm:grid-cols-12 sm:items-center"
    >
      <input type="hidden" name="branchId" value={props.branchId} />
      <input type="hidden" name="documentTypeId" value={props.documentTypeId} />
      {props.existingDocumentId && (
        <input type="hidden" name="existingDocumentId" value={props.existingDocumentId} />
      )}

      <div className="flex items-center justify-between gap-2 sm:col-span-3 sm:flex-col sm:items-start">
        <div className="flex flex-col">
          <span className="font-medium text-ink">{props.nameEn}</span>
          <span dir="rtl" className="text-xs text-muted">
            {props.nameAr}
          </span>
        </div>
        <div className="sm:hidden">
          <StatusBadge status={isNotApplicable ? "na" : props.status} t={t} />
        </div>
      </div>

      <div className="hidden sm:col-span-1 sm:flex sm:items-center">
        <StatusBadge status={isNotApplicable ? "na" : props.status} t={t} />
      </div>

      <div className="flex flex-col gap-1 sm:col-span-2">
        <span className="text-xs font-medium text-muted sm:hidden">{t.dates}</span>
        <input
          type="date"
          name="startDate"
          defaultValue={props.startDate ?? ""}
          disabled={!props.canEdit}
          className="rounded-lg border border-line px-2 py-1.5 text-xs disabled:bg-cream sm:py-1"
        />
        <input
          type="date"
          name="expiryDate"
          defaultValue={props.expiryDate ?? ""}
          disabled={!props.canEdit}
          className="rounded-lg border border-line px-2 py-1.5 text-xs disabled:bg-cream sm:py-1"
        />
      </div>

      <div className="flex flex-col gap-1 sm:col-span-2">
        <span className="text-xs font-medium text-muted sm:hidden">{t.file}</span>
        <input
          type="file"
          name="file"
          accept=".pdf,.jpg,.jpeg,.png"
          disabled={!props.canEdit}
          className="text-xs"
        />
        {props.signedUrl && (
          <a
            href={props.signedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-orange hover:underline"
          >
            {t.viewCurrentFile}
          </a>
        )}
      </div>

      <div className="sm:col-span-2">
        <span className="text-xs font-medium text-muted sm:hidden">{t.notes}</span>
        <textarea
          name="notes"
          defaultValue={props.notes ?? ""}
          disabled={!props.canEdit}
          rows={2}
          placeholder={t.notes}
          className="w-full resize-none rounded-lg border border-line px-2 py-1.5 text-xs disabled:bg-cream sm:py-1"
        />
      </div>

      <div className="flex items-center justify-between gap-2 sm:col-span-2 sm:justify-self-end sm:gap-3">
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            name="isNotApplicable"
            checked={isNotApplicable}
            onChange={(e) => setIsNotApplicable(e.target.checked)}
            disabled={!props.canEdit}
          />
          <span className="text-xs text-muted">{t.statusNa}</span>
        </label>

        {props.canEdit && (
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-ink px-3 py-1.5 text-xs font-medium text-white transition hover:bg-orange disabled:opacity-50"
          >
            {pending ? t.saving : t.save}
          </button>
        )}
      </div>

      {state.error && <p className="text-xs text-red-600 sm:col-span-12">{state.error}</p>}
    </form>
  );
}
