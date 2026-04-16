import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, totalPages, total, pageSize, onPrev, onNext }) {
  if (totalPages <= 1) return null;

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between pt-1">
      <p className="text-slate-500 text-sm">
        {total === 0 ? 'No results' : `${from}–${to} of ${total}`}
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={onPrev}
          disabled={page === 1}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 border border-slate-700 rounded-xl text-slate-300 text-sm font-medium transition-colors"
        >
          <ChevronLeft size={15} /> Prev
        </button>
        <span className="text-slate-400 text-sm min-w-[52px] text-center">
          {page} / {totalPages}
        </span>
        <button
          onClick={onNext}
          disabled={page >= totalPages}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 border border-slate-700 rounded-xl text-slate-300 text-sm font-medium transition-colors"
        >
          Next <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}
