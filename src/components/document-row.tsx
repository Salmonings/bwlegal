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
      className="grid grid-cols-12 gap-3 border-b border-line px-4 py-3 text-sm last:border-b-0"
    >
      <input type="hidden" name="branchId" value={props.branchId} />
      <input type="hidden" name="documentTypeId" value={props.documentTypeId} />
      {props.existingDocumentId && (
        <input type="hidden" name="existingDocumentId" value={props.existingDocumentId} />
      )}

      <div className="col-span-3 flex flex-col">
        <span className="font-medium text-ink">{props.nameEn}</span>
        <span dir="rtl" className="text-xs text-muted">
          {props.nameAr}
        </span>
      </div>

      <div className="col-span-1 flex items-center">
        <StatusBadge status={isNotApplicable ? "na" : props.status} t={t} />
      </div>

      <div className="col-span-2 flex flex-col gap-1">
        <input
          type="date"
          name="startDate"
          defaultValue={props.startDate ?? ""}
          disabled={!props.canEdit}
          className="rounded-lg border border-line px-2 py-1 text-xs disabled:bg-cream"
        />
        <input
          type="date"
          name="expiryDate"
          defaultValue={props.expiryDate ?? ""}
          disabled={!props.canEdit}
          className="rounded-lg border border-line px-2 py-1 text-xs disabled:bg-cream"
        />
      </div>

      <div className="col-span-2 flex flex-col gap-1">
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

      <div className="col-span-2">
        <textarea
          name="notes"
          defaultValue={props.notes ?? ""}
          disabled={!props.canEdit}
          rows={2}
          placeholder={t.notes}
          className="w-full resize-none rounded-lg border border-line px-2 py-1 text-xs disabled:bg-cream"
        />
      </div>

      <div className="col-span-1 flex items-center gap-1">
        <input
          type="checkbox"
          name="isNotApplicable"
          checked={isNotApplicable}
          onChange={(e) => setIsNotApplicable(e.target.checked)}
          disabled={!props.canEdit}
        />
        <label className="text-xs text-muted">{t.statusNa}</label>
      </div>

      <div className="col-span-1 flex items-start justify-end">
        {props.canEdit && (
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-ink px-2.5 py-1 text-xs font-medium text-white transition hover:bg-orange disabled:opacity-50"
          >
            {pending ? t.saving : t.save}
          </button>
        )}
      </div>

      {state.error && (
        <p className="col-span-12 text-xs text-red-600">{state.error}</p>
      )}
    </form>
  );
}
