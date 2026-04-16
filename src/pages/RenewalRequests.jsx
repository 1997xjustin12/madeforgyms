import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, CreditCard, AlertTriangle, ImageIcon, ChevronDown, Trash2, Dumbbell } from 'lucide-react';
import { useGym } from '../context/GymContext';
import { supabase } from '../lib/supabase';
import Navbar from '../components/Navbar';
import Pagination from '../components/Pagination';
import toast from 'react-hot-toast';

const PLAN_LABELS = {
  monthly:       '1 Month',
  quarterly:     '3 Months',
  'semi-annual': '6 Months',
  annual:        '1 Year',
  student:       'Student',
};

const STATUS_CFG = {
  pending:  { label: 'Pending',  color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30' },
  approved: { label: 'Approved', color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/30'   },
  rejected: { label: 'Rejected', color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/30'       },
};

function fmtDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function RenewalRequests() {
  const { renewalRequests, pendingRenewals, approveRenewalRequest, rejectRenewalRequest } = useGym();
  const [filter, setFilter]             = useState('pending');
  const [processing, setProcessing]     = useState(null);
  const [expandedId, setExpandedId]     = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectNotes, setRejectNotes]   = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);
  const [page, setPage]                 = useState(1);
  const PAGE_SIZE                       = 10;

  const filtered    = filter === 'all'
    ? renewalRequests
    : renewalRequests.filter((r) => r.status === filter);
  const totalPages  = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset to page 1 when filter changes
  useEffect(() => { setPage(1); setExpandedId(null); }, [filter]);

  const toggleExpand = (id) => setExpandedId((prev) => (prev === id ? null : id));

  const handleApprove = async (req) => {
    setProcessing(req.id);
    try {
      await approveRenewalRequest(req);
      toast.success(`✅ Membership renewed for ${req.member_name}!`);
      setExpandedId(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setProcessing(null);
    }
  };

  const openReject = (req) => {
    setRejectTarget({ id: req.id, name: req.member_name });
    setRejectNotes('');
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setProcessing(rejectTarget.id);
    try {
      await rejectRenewalRequest(rejectTarget.id, rejectNotes);
      toast.success('Request rejected.');
      setRejectTarget(null);
      setExpandedId(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('renewal_requests')
        .delete()
        .eq('id', deleteTarget.id);
      if (error) throw error;
      toast.success('Record deleted.');
      setDeleteTarget(null);
      setExpandedId(null);
    } catch (err) {
      toast.error('Failed to delete: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  const FILTERS = [
    { key: 'pending',  label: 'Pending',  count: renewalRequests.filter((r) => r.status === 'pending').length },
    { key: 'approved', label: 'Approved', count: renewalRequests.filter((r) => r.status === 'approved').length },
    { key: 'rejected', label: 'Rejected', count: renewalRequests.filter((r) => r.status === 'rejected').length },
    { key: 'all',      label: 'All',      count: renewalRequests.length },
  ];

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6 pb-24 sm:pb-8">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
            <CreditCard size={20} className="text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Renewal Requests</h1>
            <p className="text-slate-400 text-sm">
              {pendingRenewals.length > 0
                ? `${pendingRenewals.length} pending payment${pendingRenewals.length > 1 ? 's' : ''} awaiting your approval`
                : 'GCash payment requests from members'}
            </p>
          </div>
        </div>

        {/* Pending alert */}
        {pendingRenewals.length > 0 && (
          <div className="flex items-center gap-3 bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4">
            <AlertTriangle size={18} className="text-orange-400 shrink-0" />
            <p className="text-orange-300 text-sm">
              Verify each reference number in your GCash app before approving.
            </p>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => { setFilter(key); setExpandedId(null); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                filter === key
                  ? 'bg-orange-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
              }`}
            >
              {label}
              {count > 0 && (
                <span className={`text-xs font-bold rounded-full px-1.5 py-0.5 ${
                  filter === key ? 'bg-white/20 text-white' : 'bg-orange-500 text-white'
                }`}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <CreditCard size={40} className="mx-auto text-slate-700 mb-3" />
            <p className="text-slate-500 font-medium">No {filter === 'all' ? '' : filter} requests</p>
          </div>
        ) : (
          <div className="space-y-2">
            {paginated.map((req) => {
              const cfg      = STATUS_CFG[req.status] || STATUS_CFG.pending;
              const busy     = processing === req.id;
              const expanded = expandedId === req.id;

              return (
                <div
                  key={req.id}
                  className={`bg-slate-800 rounded-2xl border overflow-hidden transition-all ${
                    expanded ? 'border-orange-500/40' : 'border-slate-700/50'
                  }`}
                >
                  {/* ── Collapsed row (always visible) ── */}
                  <button
                    onClick={() => toggleExpand(req.id)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-700/30 transition-colors"
                  >
                    {/* Status dot */}
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      req.status === 'pending'  ? 'bg-orange-400 animate-pulse' :
                      req.status === 'approved' ? 'bg-green-400' : 'bg-red-400'
                    }`} />

                    {/* Name + sub-info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-white font-semibold text-sm truncate">{req.member_name}</p>
                        {req.coaching_requested && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 shrink-0">
                            <Dumbbell size={9} /> Coaching
                          </span>
                        )}
                      </div>
                      <p className="text-slate-500 text-xs">
                        {PLAN_LABELS[req.membership_type] || req.membership_type}
                        {' · '}
                        <span className="text-green-400 font-medium">₱{Number(req.amount).toLocaleString()}</span>
                        {' · '}
                        {fmtDate(req.created_at)}
                      </p>
                    </div>

                    {/* Status badge */}
                    <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.color}`}>
                      {cfg.label}
                    </span>

                    {/* Chevron */}
                    <ChevronDown
                      size={16}
                      className={`shrink-0 text-slate-500 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {/* ── Expanded details ── */}
                  {expanded && (
                    <div className="border-t border-slate-700/50">
                      <div className="px-5 py-4 space-y-3">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          <InfoBox label="Plan"      value={PLAN_LABELS[req.membership_type] || req.membership_type} />
                          <InfoBox label="Amount"    value={`₱${Number(req.amount).toLocaleString()}`} highlight />
                          {req.coaching_requested && (
                            <InfoBox label="Coaching Fee" value={`₱${Number(req.coaching_price).toLocaleString()}`} highlight />
                          )}
                          {req.gcash_reference && (
                            <InfoBox label="GCash Ref #" value={req.gcash_reference} mono />
                          )}
                          <InfoBox label="Contact"   value={req.contact_number || '—'} />
                          <InfoBox label="Submitted" value={fmtDate(req.created_at)} />
                          {req.status !== 'pending' && (
                            <InfoBox label="Resolved" value={fmtDate(req.updated_at)} />
                          )}
                          {req.admin_notes && (
                            <InfoBox label="Notes" value={req.admin_notes} className="col-span-2 sm:col-span-3" />
                          )}
                        </div>

                        {/* Receipt image */}
                        {req.receipt_url && (
                          <div>
                            <p className="text-slate-500 text-xs mb-2 flex items-center gap-1.5">
                              <ImageIcon size={12} /> Payment Screenshot
                            </p>
                            <a href={req.receipt_url} target="_blank" rel="noopener noreferrer">
                              <img
                                src={req.receipt_url}
                                alt="Payment receipt"
                                className="w-full max-h-64 object-contain bg-slate-700 rounded-xl hover:opacity-90 transition-opacity cursor-zoom-in"
                              />
                              <p className="text-sky-400 text-xs mt-1 text-center">Tap to open full size</p>
                            </a>
                          </div>
                        )}

                        {!req.gcash_reference && !req.receipt_url && (
                          <p className="text-slate-600 text-xs italic">No proof submitted</p>
                        )}
                      </div>

                      {/* Student ID reminder */}
                      {req.membership_type === 'student' && (req.status === 'pending' || req.status === 'rejected') && (
                        <div className="flex items-start gap-2.5 mx-5 mb-3 bg-sky-500/10 border border-sky-500/30 rounded-xl px-4 py-3">
                          <span className="text-sky-400 text-base shrink-0">🎓</span>
                          <p className="text-sky-300 text-xs leading-relaxed">
                            Remind member to present a valid school ID before approving.
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 px-5 pb-4">
                        {(req.status === 'pending' || req.status === 'rejected') && (
                          <>
                            <button
                              onClick={() => handleApprove(req)}
                              disabled={busy}
                              className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition-colors text-sm"
                            >
                              {busy
                                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                : <><CheckCircle size={16} /> Approve &amp; Renew</>
                              }
                            </button>
                            {req.status === 'pending' && (
                              <button
                                onClick={() => openReject(req)}
                                disabled={busy}
                                className="flex-1 flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-bold py-2.5 rounded-xl transition-colors text-sm"
                              >
                                <XCircle size={16} /> Reject
                              </button>
                            )}
                          </>
                        )}
                        {(req.status === 'approved' || req.status === 'rejected') && (
                          <button
                            onClick={() => setDeleteTarget({ id: req.id, name: req.member_name, status: req.status })}
                            disabled={busy}
                            className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-red-500/20 hover:border-red-500/40 border border-slate-600 text-slate-400 hover:text-red-400 font-medium py-2.5 px-4 rounded-xl transition-colors text-sm"
                          >
                            <Trash2 size={15} /> Delete Record
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <Pagination
          page={page}
          totalPages={totalPages}
          total={filtered.length}
          pageSize={PAGE_SIZE}
          onPrev={() => { setPage((p) => p - 1); setExpandedId(null); }}
          onNext={() => { setPage((p) => p + 1); setExpandedId(null); }}
        />
      </div>

      {/* Reject modal */}
      {rejectTarget && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-sm border border-slate-700 shadow-2xl">
            <div className="px-5 py-4 border-b border-slate-700">
              <h3 className="text-white font-bold">Reject Request</h3>
              <p className="text-slate-400 text-sm mt-0.5">For {rejectTarget.name}</p>
            </div>
            <div className="p-5 space-y-4">
              <textarea
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                placeholder="Reason for rejection (optional)"
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-3 outline-none resize-none h-24 text-sm placeholder:text-slate-500"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setRejectTarget(null)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-medium text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={processing === rejectTarget.id}
                  className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white py-3 rounded-xl font-bold text-sm transition-colors"
                >
                  {processing === rejectTarget.id ? '...' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Delete confirm modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-sm border border-slate-700 shadow-2xl">
            <div className="px-5 py-4 border-b border-slate-700">
              <h3 className="text-white font-bold">Delete Record?</h3>
              <p className="text-slate-400 text-sm mt-0.5">For {deleteTarget.name}</p>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-start gap-3 bg-slate-700/40 rounded-xl p-3">
                <AlertTriangle size={16} className="text-yellow-400 shrink-0 mt-0.5" />
                <p className="text-slate-300 text-sm leading-relaxed">
                  This removes the payment record only.{' '}
                  {deleteTarget.status === 'approved'
                    ? "The member's renewed membership is not affected."
                    : 'This rejected request will be permanently removed.'}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-medium text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white py-3 rounded-xl font-bold text-sm transition-colors"
                >
                  {deleting
                    ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <><Trash2 size={15} /> Delete</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoBox({ label, value, highlight, mono, className = '' }) {
  return (
    <div className={`bg-slate-700/40 rounded-xl p-3 ${className}`}>
      <p className="text-slate-500 text-xs mb-0.5">{label}</p>
      <p className={`font-semibold text-sm break-all ${highlight ? 'text-green-400' : mono ? 'text-sky-300 font-mono' : 'text-white'}`}>
        {value}
      </p>
    </div>
  );
}
