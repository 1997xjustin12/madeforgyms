import { useState } from 'react';
import { ClipboardCheck, Check, X, ChevronDown, ChevronUp, Clock, UserPlus, RefreshCw, AlertTriangle } from 'lucide-react';
import { useGym } from '../context/GymContext';
import Navbar from '../components/Navbar';
import { formatDate } from '../utils/helpers';
import toast from 'react-hot-toast';

const STATUS_TABS = ['pending', 'approved', 'rejected', 'all'];

const TYPE_LABEL = { new_member: 'New Member', renewal: 'Renewal' };
const TYPE_ICON  = { new_member: <UserPlus size={14} />, renewal: <RefreshCw size={14} /> };
const TYPE_COLOR = { new_member: 'text-sky-400 bg-sky-500/10', renewal: 'text-green-400 bg-green-500/10' };

export default function StaffApprovals() {
  const { pendingMemberships, loadPendingMemberships, approvePendingMembership, rejectPendingMembership, isAdmin } = useGym();
  const [tab, setTab] = useState('pending');
  const [expandedId, setExpandedId] = useState(null);
  const [rejectModal, setRejectModal] = useState(null); // { id, memberName }
  const [rejectNotes, setRejectNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const filtered = pendingMemberships.filter((p) => tab === 'all' || p.status === tab);
  const pendingCount = pendingMemberships.filter((p) => p.status === 'pending').length;

  const handleApprove = async (id) => {
    setLoading(id);
    try {
      await approvePendingMembership(id);
      toast.success('Approved and processed!');
      setExpandedId(null);
    } catch (err) {
      toast.error(err.message || 'Failed to approve.');
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setLoading(rejectModal.id);
    try {
      await rejectPendingMembership(rejectModal.id, rejectNotes);
      toast.success('Request rejected.');
      setRejectModal(null);
      setRejectNotes('');
      setExpandedId(null);
    } catch (err) {
      toast.error(err.message || 'Failed to reject.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar title="Staff Approvals" showBack />

      <div className="max-w-3xl mx-auto px-4 py-6 pb-24 sm:pb-8 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">{isAdmin ? 'Staff Approvals' : 'My Requests'}</h1>
            <p className="text-slate-400 text-sm">{isAdmin ? `${pendingCount} pending review` : `${pendingCount} pending`}</p>
          </div>
          <button
            onClick={loadPendingMemberships}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-800/60 rounded-2xl p-1">
          {STATUS_TABS.map((t) => {
            const count = t === 'all' ? pendingMemberships.length : pendingMemberships.filter((p) => p.status === t).length;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${
                  tab === t ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {t}
                {count > 0 && (
                  <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    t === 'pending' ? 'bg-blue-500 text-white' :
                    t === 'approved' ? 'bg-green-500/20 text-green-400' :
                    t === 'rejected' ? 'bg-red-500/20 text-red-400' :
                    'bg-slate-600 text-slate-300'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <ClipboardCheck size={40} className="text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">No {tab === 'all' ? '' : tab} requests</p>
            <p className="text-slate-600 text-sm mt-1">
              {tab === 'pending' ? 'All caught up! Nothing waiting for approval.' : `No ${tab} requests to show.`}
            </p>
          </div>
        )}

        {/* Request cards */}
        <div className="space-y-3">
          {filtered.map((req) => {
            const isExpanded = expandedId === req.id;
            const fd = req.form_data || {};
            return (
              <div
                key={req.id}
                className="rounded-2xl border border-slate-700/60 overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.02)' }}
              >
                {/* Collapsed row */}
                <button
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-white/[0.02] transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : req.id)}
                >
                  {/* Type chip */}
                  <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 ${TYPE_COLOR[req.type]}`}>
                    {TYPE_ICON[req.type]} {TYPE_LABEL[req.type]}
                  </span>

                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{req.member_name}</p>
                    <p className="text-slate-500 text-xs">by {req.submitted_by_name} · {formatDate(req.created_at)}</p>
                  </div>

                  {/* Status badge */}
                  {req.status === 'pending' && (
                    <span className="flex items-center gap-1 text-yellow-400 text-xs font-semibold shrink-0">
                      <Clock size={12} className="animate-pulse" /> Pending
                    </span>
                  )}
                  {req.status === 'approved' && (
                    <span className="flex items-center gap-1 text-green-400 text-xs font-semibold shrink-0">
                      <Check size={12} /> Approved
                    </span>
                  )}
                  {req.status === 'rejected' && (
                    <span className="flex items-center gap-1 text-red-400 text-xs font-semibold shrink-0">
                      <X size={12} /> Rejected
                    </span>
                  )}

                  {isExpanded ? <ChevronUp size={16} className="text-slate-500 shrink-0" /> : <ChevronDown size={16} className="text-slate-500 shrink-0" />}
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-slate-700/60 px-4 py-4 space-y-4">

                    {/* Form data summary */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      {req.type === 'new_member' && (
                        <>
                          <div><p className="text-slate-500 text-xs">Name</p><p className="text-white font-medium">{req.member_name}</p></div>
                          <div><p className="text-slate-500 text-xs">Contact</p><p className="text-white font-medium">{fd.contactNumber || '—'}</p></div>
                          <div><p className="text-slate-500 text-xs">Plan</p><p className="text-white font-medium capitalize">{fd.membershipType || '—'}</p></div>
                          <div><p className="text-slate-500 text-xs">Start Date</p><p className="text-white font-medium">{fd.membershipStartDate ? formatDate(fd.membershipStartDate) : '—'}</p></div>
                          {fd.notes && <div className="col-span-2"><p className="text-slate-500 text-xs">Notes</p><p className="text-white font-medium">{fd.notes}</p></div>}
                        </>
                      )}
                      {req.type === 'renewal' && (
                        <>
                          <div><p className="text-slate-500 text-xs">Plan</p><p className="text-white font-medium capitalize">{fd.membershipType || '—'}</p></div>
                          <div><p className="text-slate-500 text-xs">Payment</p><p className="text-white font-medium capitalize">{fd.paymentMethod || '—'}</p></div>
                        </>
                      )}
                    </div>

                    {/* Reviewed info */}
                    {req.reviewed_by && (
                      <div className="text-xs text-slate-500">
                        {req.status === 'approved' ? 'Approved' : 'Rejected'} by <span className="text-slate-300">{req.reviewed_by}</span>
                        {req.reviewed_at && ` on ${formatDate(req.reviewed_at)}`}
                      </div>
                    )}
                    {req.admin_notes && (
                      <div className="bg-red-500/8 border border-red-500/20 rounded-xl px-3 py-2">
                        <p className="text-xs text-red-400 font-medium mb-0.5">Rejection reason</p>
                        <p className="text-sm text-slate-300">{req.admin_notes}</p>
                      </div>
                    )}

                    {/* Action buttons — only for admin reviewing pending */}
                    {req.status === 'pending' && isAdmin && (
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => handleApprove(req.id)}
                          disabled={loading === req.id}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
                          style={{ background: 'linear-gradient(135deg,#16a34a,#4ade80)' }}
                        >
                          {loading === req.id ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={15} />}
                          Approve
                        </button>
                        <button
                          onClick={() => { setRejectModal({ id: req.id, memberName: req.member_name }); setRejectNotes(''); }}
                          disabled={loading === req.id}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-all disabled:opacity-50"
                        >
                          <X size={15} /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Reject modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setRejectModal(null)}>
          <div className="bg-slate-800 rounded-2xl w-full max-w-sm border border-slate-700 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-700">
              <div className="w-9 h-9 bg-red-500/15 rounded-xl flex items-center justify-center">
                <AlertTriangle size={18} className="text-red-400" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">Reject Request</p>
                <p className="text-slate-400 text-xs">{rejectModal.memberName}</p>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-1.5">Reason (optional)</label>
                <textarea
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  placeholder="Let the staff know why this was rejected..."
                  rows={3}
                  className="w-full bg-slate-700 border border-slate-600 focus:border-red-500 text-white rounded-xl px-4 py-3 outline-none transition-colors placeholder:text-slate-500 text-sm resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleReject}
                  disabled={loading === rejectModal.id}
                  className="flex-1 py-3 rounded-xl font-bold text-sm text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  Confirm Reject
                </button>
                <button
                  onClick={() => setRejectModal(null)}
                  className="px-5 py-3 rounded-xl font-bold text-sm text-slate-400 border border-slate-600 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
