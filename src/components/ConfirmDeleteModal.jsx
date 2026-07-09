import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

const CONFIRM_WORD = "DELETE";


function ConfirmDeleteModal({ title, description, confirmLabel = "Delete Permanently", busy, onConfirm, onClose }) {
  const [typed, setTyped] = useState("");
  const matches = typed.trim().toUpperCase() === CONFIRM_WORD;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
              <AlertTriangle size={20} />
            </span>
            <h3 className="text-lg font-bold text-slate-950">{title}</h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <p className="mt-4 text-sm text-slate-600">{description}</p>

        <p className="mt-4 text-sm font-semibold text-slate-800">
          Type <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-red-600">DELETE</span> to confirm.
        </p>
        <input
          autoFocus
          className="field-input mt-2"
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          placeholder="Type DELETE"
        />

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="secondary-button">
            Cancel
          </button>
          <button
            type="button"
            disabled={!matches || busy}
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Deleting..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDeleteModal;