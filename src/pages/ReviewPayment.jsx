import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, XCircle, ImageIcon, Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { addDays, addMonths } from 'date-fns';
import toast, { Toaster } from 'react-hot-toast';
import { useGym } from '../context/GymContext';

const PLAN_LABELS = {
  monthly:       '1 Month',
  quarterly:     '3 Months',
  'semi-annual': '6 Months',
  annual:        '1 Year',
  student:       'Student',
};

const MEMBERSHIP_MONTHS = {
  monthly: 1, quarterly: 3, 'semi-annual': 6, annual: 12, student: 1,
};

const getEndDate = (startDate, membershipType, durationDays) => {
  const start = new Date(startDate);
  const months = MEMBERSHIP_MONTHS[membershipType];
  if (months) return addMonths(start, months).toISOString().split('T')[0];
  return addDays(start, durationDays || 30).toISOString().split('T')[0];
};

function fmtDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ReviewPayment() {
  const { token } = useParams();
  const { settings } = useGym();
  const [request, setRequest]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [notFound, setNotFound]   = useState(false);
  const [expired, setExpired]     = useState(false);
  const [processing, setProcessing] = useState(null); // 'approve' | 'reject'
  const [done, setDone]           = useState(null);   // 'approved' | 'rejected'
  const [showReject, setShowReject] = useState(false);
  const [rejectNotes, setRejectNotes] = useState('');

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('renewal_requests')
        .select('*')
        .eq('view_token', token)
        .single();
      if (error || !data) { setNotFound(true); }
      else if (data.view_token_expires_at && new Date() > new Date(data.view_token_expires_at)) {
        setExpired(true);
      }
      else { setRequest(data); }
      setLoading(false);
    };
    load();
  }, [token]);

  const handleApprove = async () => {
    setProcessing('approve');
    try {
      const today   = new Date().toISOString().split('T')[0];
      const endDate = getEndDate(today, request.membership_type, request.duration_days);

      const { error: memberErr } = await supabase
        .from('members')
        .update({
          membership_type:       request.membership_type,
          membership_start_date: today,
          membership_end_date:   endDate,
          updated_at:            new Date().toISOString(),
        })
        .eq('id', request.member_id);
      if (memberErr) throw memberErr;

      const { error: reqErr } = await supabase
        .from('renewal_requests')
        .update({ status: 'approved', updated_at: new Date().toISOString() })
        .eq('id', request.id);
      if (reqErr) throw reqErr;

      await supabase.from('activity_logs').insert([{
        gym_id:        request.gym_id,
        action:        'PAYMENT_APPROVED',
        description:   `Approved GCash payment ₱${request.amount} — renewed ${request.membership_type} for: ${request.member_name}`,
        member_name:   request.member_name,
        member_id:     request.member_id,
        performed_by:  'Admin (via Telegram)',
      }]);

      setDone('approved');
      toast.success('Membership renewed!');
    } catch (err) {
      toast.error(err.message || 'Failed to approve.');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    setProcessing('reject');
    try {
      const { error } = await supabase
        .from('renewal_requests')
        .update({ status: 'rejected', admin_notes: rejectNotes, updated_at: new Date().toISOString() })
        .eq('id', request.id);
      if (error) throw error;

      await supabase.from('activity_logs').insert([{
        gym_id:       request.gym_id,
        action:       'PAYMENT_REJECTED',
        description:  `Rejected GCash payment for: ${request.member_name}`,
        member_name:  request.member_name,
        member_id:    request.member_id,
        performed_by: 'Admin (via Telegram)',
      }]);

      setDone('rejected');
      setShowReject(false);
      toast.success('Request rejected.');
    } catch (err) {
      toast.error(err.message || 'Failed to reject.');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-4 px-4 text-center">
      <AlertTriangle size={40} className="text-orange-400" />
      <p className="text-white font-bold text-lg">Invalid link</p>
      <p className="text-slate-400 text-sm">This link is invalid or the request no longer exists.</p>
    </div>
  );

  if (expired) return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-4 px-4 text-center">
      <AlertTriangle size={40} className="text-orange-400" />
      <p className="text-white font-bold text-lg">Link expired</p>
      <p className="text-slate-400 text-sm">This review link was only valid for 5 minutes.<br />The member will need to resubmit their payment.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900">
      <Toaster position="top-center" toastOptions={{
        style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155', borderRadius: '12px' },
      }} />

      {/* Header */}
      <div className="bg-slate-900/95 border-b border-slate-800">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <span className="font-bold text-white">{settings.gymName || 'MadeForGyms'}</span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* Title */}
        <div>
          <h1 className="text-xl font-bold text-white">Payment Review</h1>
          <p className="text-slate-400 text-sm">Submitted {fmtDate(request.created_at)}</p>
        </div>

        {/* Status banner if already resolved */}
        {(request.status !== 'pending' || done) && (
          <div className={`flex items-center gap-3 rounded-2xl p-4 border ${
            (done || request.status) === 'approved'
              ? 'bg-green-500/10 border-green-500/30'
              : 'bg-red-500/10 border-red-500/30'
          }`}>
            {(done || request.status) === 'approved'
              ? <CheckCircle size={20} className="text-green-400 shrink-0" />
              : <XCircle size={20} className="text-red-400 shrink-0" />
            }
            <p className={`font-semibold text-sm ${(done || request.status) === 'approved' ? 'text-green-300' : 'text-red-300'}`}>
              This request has been {done || request.status}.
            </p>
          </div>
        )}

        {/* Payment details */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700/50 p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <InfoBox label="Member"  value={request.member_name} />
            <InfoBox label="Contact" value={request.contact_number || '—'} />
            <InfoBox label="Plan"    value={PLAN_LABELS[request.membership_type] || request.membership_type} />
            <InfoBox label="Amount"  value={`₱${Number(request.amount).toLocaleString()}`} highlight />
            {request.gcash_reference && (
              <InfoBox label="GCash Ref #" value={request.gcash_reference} mono className="col-span-2" />
            )}
            {request.admin_notes && (
              <InfoBox label="Rejection Reason" value={request.admin_notes} className="col-span-2" />
            )}
          </div>

          {/* Receipt */}
          {request.receipt_url && (
            <div>
              <p className="text-slate-500 text-xs mb-2 flex items-center gap-1.5">
                <ImageIcon size={12} /> Payment Screenshot
              </p>
              <a href={request.receipt_url} target="_blank" rel="noopener noreferrer">
                <img
                  src={request.receipt_url}
                  alt="Receipt"
                  className="w-full max-h-72 object-contain bg-slate-700 rounded-xl hover:opacity-90 transition-opacity cursor-zoom-in"
                />
                <p className="text-sky-400 text-xs mt-1 text-center">Tap to open full size</p>
              </a>
            </div>
          )}

          {!request.gcash_reference && !request.receipt_url && (
            <p className="text-slate-600 text-xs italic">No proof submitted</p>
          )}
        </div>

        {/* Student ID reminder */}
        {request.membership_type === 'student' && !done && (request.status === 'pending' || request.status === 'rejected') && (
          <div className="flex items-start gap-2.5 bg-sky-500/10 border border-sky-500/30 rounded-2xl px-4 py-3">
            <span className="text-sky-400 text-base shrink-0">🎓</span>
            <p className="text-sky-300 text-xs leading-relaxed">
              Student membership — remind member to present a valid school ID before approving.
            </p>
          </div>
        )}

        {/* Action buttons — only for pending */}
        {request.status === 'pending' && !done && (
          <div className="space-y-3">
            <button
              onClick={handleApprove}
              disabled={!!processing}
              className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-colors"
            >
              {processing === 'approve'
                ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><CheckCircle size={18} /> Approve &amp; Renew Membership</>
              }
            </button>
            <button
              onClick={() => setShowReject(true)}
              disabled={!!processing}
              className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-bold py-3.5 rounded-2xl transition-colors"
            >
              <XCircle size={18} /> Reject
            </button>
          </div>
        )}

        {/* Re-approve if rejected */}
        {(request.status === 'rejected' && !done) && (
          <button
            onClick={handleApprove}
            disabled={!!processing}
            className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-colors"
          >
            {processing === 'approve'
              ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <><CheckCircle size={18} /> Approve &amp; Renew Membership</>
            }
          </button>
        )}
      </div>

      {/* Reject modal */}
      {showReject && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-sm border border-slate-700 shadow-2xl">
            <div className="px-5 py-4 border-b border-slate-700">
              <h3 className="text-white font-bold">Reject Request</h3>
              <p className="text-slate-400 text-sm mt-0.5">For {request.member_name}</p>
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
                  onClick={() => setShowReject(false)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={processing === 'reject'}
                  className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white py-3 rounded-xl font-bold text-sm"
                >
                  {processing === 'reject' ? '...' : 'Reject'}
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
