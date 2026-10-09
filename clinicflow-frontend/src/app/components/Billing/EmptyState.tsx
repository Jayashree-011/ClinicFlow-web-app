import { InboxIcon } from 'lucide-react';

interface EmptyStateProps {
  message: string;
  sub: string;
  colSpan?: number;
}

export function EmptyState({ message, sub, colSpan = 9 }: EmptyStateProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-16 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center">
            <InboxIcon className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-slate-700">{message}</p>
          <p className="text-xs text-slate-400 max-w-xs">{sub}</p>
        </div>
      </td>
    </tr>
  );
}
