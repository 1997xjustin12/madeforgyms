import { useState, useEffect, useCallback } from 'react';
import { UserPlus, Pencil, Trash2, MessageSquare, RefreshCw, ClipboardList, Search, X, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { supabase } from '../lib/supabase';
import Navbar from '../components/Navbar';
import Pagination from '../components/Pagination';
import toast from 'react-hot-toast';

const ACTION_CONFIG = {
  MEMBER_ADDED:       { label: 'Member Added',    icon: <UserPlus size={14} />,      bg: 'bg-green-500/20',  text: 'text-green-400',  border: 'border-green-500/30' },
  MEMBER_UPDATED:     { label: 'Member Updated',  icon: <Pencil size={14} />,        bg: 'bg-sky-500/20',    text: 'text-sky-400',    border: 'border-sky-500/30' },
  MEMBER_DELETED:     { label: 'Member Deleted',  icon: <Trash2 size={14} />,        bg: 'bg-red-500/20',    text: 'text-red-400',    border: 'border-red-500/30' },
  MEMBERSHIP_RENEWED: { label: 'Renewed',         icon: <RefreshCw size={14} />,     bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
  SMS_SENT:           { label: 'SMS Sent',        icon: <MessageSquare size={14} />, bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
};

const FILTERS = [
  { value: 'all',                label: 'All' },
  { value: 'MEMBER_ADDED',       label: 'Added' },
  { value: 'MEMBER_UPDATED',     label: 'Updated' },
  { value: 'MEMBERSHIP_RENEWED', label: 'Renewed' },
  { value: 'MEMBER_DELETED',     label: 'Deleted' },
  { value: 'SMS_SENT',           label: 'SMS' },
];

const PAGE_SIZE = 20;

export default function AdminLogs() {
  const [logs, setLogs]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState('all');
  const [query, setQuery]           = useState('');
  const [page, setPage]             = useState(1);
  const [total, setTotal]           = useState(0);
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing]     = useState(false);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      let q = supabase
        .from('activity_logs')
        .select('*', { count: 'exact' })
        .order('performed_at', { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

      if (filter !== 'all') q = q.eq('action', filter);
      if (query.trim())     q = q.ilike('member_name', `%${query.trim()}%`);

      const { data, count, error } = await q;
      if (error) throw error;

      setLogs(data || []);
      setTotal(count || 0);
    } catch {
      toast.error('Failed to load logs');
    } finally {
      setLoading(false);
    }
  }, [filter, query, page]);

  // Reset to page 1 on filter/search change
  useEffect(() => { setPage(1); }, [filter, query]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleClearAll = async () => {
    setClearing(true);
    try {
      const { error } = await supabase.from('activity_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
      setLogs([]);
      setTotal(0);
      setPage(1);
      toast.success('All logs cleared');
      setConfirmClear(false);
    } catch {
      toast.error('Failed to clear logs');
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar title="Activity Logs" showBack />

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4 pb-24 sm:pb-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Activity Logs</h1>
            <p className="text-slate-400 text-sm">All admin actions are recorded here</p>
          </div>
          <button
            onClick={() => setConfirmClear(true)}
            className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 px-3 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            <Trash2 size={14} /> Clear All
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by member name..."
            className="w-full bg-slate-800 border border-slate-700 focus:border-orange-500/60 text-white rounded-xl pl-10 pr-10 py-3 outline-none transition-colors placeholder:text-slate-600 text-sm"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`shrink-0 px-3.5 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                filter === f.value
                  ? 'bg-orange-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Logs list */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ClipboardList size={28} className="text-slate-600" />
            </div>
            <p className="text-slate-400 font-semibold">No logs found</p>
            <p className="text-slate-600 text-sm mt-1">Actions taken by the admin will appear here</p>
          </div>
        ) : (
          <div className="bg-slate-800 rounded-2xl border border-slate-700/50 divide-y divide-slate-700/50 overflow-hidden">
            {logs.map((log) => {
              const config = ACTION_CONFIG[log.action] || ACTION_CONFIG.MEMBER_UPDATED;
              return (
                <div key={log.id} className="flex items-start gap-3 px-4 py-3.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${config.bg} ${config.text}`}>
                    {config.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${config.bg} ${config.text} ${config.border}`}>
                        {config.label}
                      </span>
                    </div>
                    <p className="text-slate-200 text-sm mt-1">{log.description}</p>
                    <p className="text-slate-500 text-xs mt-0.5">
                      {formatDistanceToNow(parseISO(log.performed_at), { addSuffix: true })}
                      {log.performed_by && (
                        <span className="ml-2 text-slate-600">· {log.performed_by}</span>
                      )}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={PAGE_SIZE}
          onPrev={() => setPage((p) => p - 1)}
          onNext={() => setPage((p) => p + 1)}
        />
      </div>

      {/* Confirm Clear Modal */}
      {confirmClear && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6">
          <div className="bg-slate-800 rounded-2xl w-full max-w-sm p-6 border border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-400" />
              </div>
              <h3 className="text-white font-bold text-lg">Clear All Logs?</h3>
            </div>
            <p className="text-slate-400 text-sm mb-6">
              This will permanently delete all activity logs. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmClear(false)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAll}
                disabled={clearing}
                className="flex-1 flex items-center justify-center bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white py-3 rounded-xl font-semibold transition-colors"
              >
                {clearing ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Clear All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
