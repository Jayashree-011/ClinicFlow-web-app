import { Trash2 } from 'lucide-react';

interface DeleteConfirmModalProps {
  deleteTarget: { type: 'invoice' | 'payment'; id: number } | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmModal({ deleteTarget, onCancel, onConfirm }: DeleteConfirmModalProps) {
  if (!deleteTarget) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl border border-slate-100 overflow-hidden">
        <div className="p-6">
          <div className="w-10 h-10 bg-rose-50 rounded-full flex items-center justify-center mb-4">
            <Trash2 className="w-5 h-5 text-rose-500" />
          </div>
          <h2 className="text-base font-bold text-slate-900 mb-1">
            Delete {deleteTarget.type === 'invoice' ? 'Invoice' : 'Payment'} #{deleteTarget.id}?
          </h2>
          <p className="text-xs text-slate-500">This action cannot be undone.</p>
        </div>
        <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-2">
          <button onClick={onCancel}
            className="px-4 py-2 border border-slate-200 bg-white text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
          <button onClick={onConfirm}
            className="px-4 py-2 bg-rose-600 text-white text-xs font-semibold rounded-xl hover:bg-rose-700 transition-colors shadow-sm">Delete</button>
        </div>
      </div>
    </div>
  );
}
