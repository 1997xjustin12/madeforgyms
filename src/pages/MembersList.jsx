import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, UserPlus, Pencil, MessageSquare, Trash2, X, Download, RefreshCw, CheckCircle, Banknote, CreditCard, History, ChevronDown, QrCode, UserCheck, CalendarPlus, Copy } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import AdvancePaymentModal from '../components/AdvancePaymentModal';
import { useGym } from '../context/GymContext';
import Navbar from '../components/Navbar';
import Pagination from '../components/Pagination';
import StatusBadge from '../components/StatusBadge';
import SMSModal from '../components/SMSModal';
import { MEMBERSHIP_OPTIONS } from '../context/GymContext';
import { formatDate, formatPhoneDisplay } from '../utils/helpers';
import { exportMembersToExcel } from '../utils/exportExcel';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const FILTERS   = ['all', 'active', 'expiring', 'expired'];
const PAGE_SIZE = 15;
// 'active' filter includes expiring members since they are still active

export default function MembersList() {
  const { members, getMemberStatus, deleteMember, renewMember, settings, instructors, gymSlug, gymId, isStaff, submitPendingMembership, advancePayments } = useGym();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState(searchParams.get('filter') || 'all');
  const [page, setPage] = useState(1);
  const [smsTarget, setSmsTarget] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [renewTarget, setRenewTarget] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [qrTarget, setQrTarget] = useState(null);
  const [clockingIn, setClockingIn] = useState(null);
  const [advanceTarget, setAdvanceTarget] = useState(null);
  const [copied, setCopied] = useState(null);

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const filtered = useMemo(() => {
    return members.filter((m) => {
      const { status } = getMemberStatus(m);
      const matchesFilter =
        filter === 'all' ||
        (filter === 'active' && (status === 'active' || status === 'expiring')) ||
        (filter !== 'active' && status === filter);
      const q = query.toLowerCase().trim();
      const matchesQuery =
        !q || m.name.toLowerCase().includes(q) || m.contactNumber.includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [members, filter, query, getMemberStatus]);

  // Reset to page 1 whenever filter or search changes
  useEffect(() => setPage(1), [filter, query]);

  const handleClockIn = async (member) => {
    setClockingIn(member.id);
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data: existing } = await supabase
        .from('attendance')
        .select('id')
        .eq('gym_id', gymId)
        .eq('member_id', member.id)
        .gte('checked_in_at', `${today}T00:00:00`)
        .lte('checked_in_at', `${today}T23:59:59`)
        .maybeSingle();

      if (existing) {
        toast('Already checked in today', { icon: '✓' });
        return;
      }

      const { error } = await supabase.from('attendance').insert([{
        gym_id: gymId,
        member_id: member.id,
        member_name: member.name,
        checked_in_at: new Date().toISOString(),
      }]);

      if (error) throw error;
      toast.success(`${member.name} checked in!`);
    } catch (err) {
      toast.error('Check-in failed: ' + err.message);
    } finally {
      setClockingIn(null);
    }
  };

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (member) => {
    setDeleting(true);
    try {
      await deleteMember(member.id);
      toast.success(`${member.name} removed`);
      setConfirmDelete(null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to remove member. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar title="Members" />

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4 pb-24 sm:pb-8">
        {/* Header Row */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Members</h1>
            <p className="text-slate-500 text-xs mt-0.5">{filtered.length} of {members.length} members</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { exportMembersToExcel(members, settings.gymName); toast.success('Excel file downloaded!'); }}
              className="w-9 h-9 flex items-center justify-center bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl transition-colors"
              title="Export to Excel"
            >
              <Download size={16} />
            </button>
            <button
              onClick={() => navigate(`/${gymSlug}/admin/register`)}
              className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-semibold text-sm transition-colors"
            >
              <UserPlus size={15} /> Add
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or number..."
            className="w-full bg-slate-800/80 border border-slate-700/60 focus:border-orange-500/50 text-white rounded-2xl pl-10 pr-10 py-2.5 outline-none transition-colors placeholder:text-slate-600 text-sm"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
              <X size={15} />
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex bg-slate-800/60 border border-slate-700/40 rounded-2xl p-1 gap-1">
          {FILTERS.map((f) => {
            const count = members.filter((m) => {
              const s = getMemberStatus(m).status;
              if (f === 'all') return true;
              if (f === 'active') return s === 'active' || s === 'expiring';
              return s === f;
            }).length;
            const isActive = filter === f;
            const color = f === 'expiring' ? 'bg-orange-500' : f === 'expired' ? 'bg-red-500/80' : 'bg-slate-600';
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive ? `${color} text-white shadow-sm` : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
                <span className={`ml-1 ${isActive ? 'text-white/80' : 'text-slate-600'}`}>({count})</span>
              </button>
            );
          })}
        </div>

        {/* Members List */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-slate-800/40 rounded-2xl border border-slate-700/30">
            <div className="w-14 h-14 bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Search size={24} className="text-slate-500" />
            </div>
            <p className="text-slate-300 font-semibold">No members found</p>
            <p className="text-slate-500 text-sm mt-1">Try a different name, number, or filter</p>
          </div>
        ) : (
          <div className="space-y-2">
            {paginated.map((member) => {
              const statusInfo = getMemberStatus(member);
              const isExpanded = expandedId === member.id;
              const instructor = member.instructorId ? instructors.find((i) => i.id === member.instructorId) : null;

              const advCount = advancePayments.filter((p) => p.member_id === member.id && p.status === 'queued').length;
              const pendingAdv = advancePayments.filter((p) => p.member_id === member.id && p.status === 'pending').length;
              const totalAdv = advCount + pendingAdv;

              return (
                <div
                  key={member.id}
                  className={`bg-slate-800/80 rounded-2xl border overflow-hidden transition-all ${
                    statusInfo.status === 'expiring' ? 'border-orange-500/40' :
                    statusInfo.status === 'expired'  ? 'border-red-500/20'   : 'border-slate-700/40'
                  }`}
                >
                  {/* Status accent line */}
                  <div className={`h-0.5 ${
                    statusInfo.status === 'expiring' ? 'bg-orange-500' :
                    statusInfo.status === 'expired'  ? 'bg-red-500'    :
                    statusInfo.status === 'active'   ? 'bg-green-500'  : 'bg-slate-600'
                  }`} />

                  {/* Collapsed row */}
                  <button
                    className="w-full flex items-center gap-3 px-3.5 py-3 text-left"
                    onClick={() => setExpandedId(isExpanded ? null : member.id)}
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-700 shrink-0">
                      {member.photo ? (
                        <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center font-bold text-sm ${
                          statusInfo.status === 'expiring' ? 'text-orange-400 bg-orange-500/10' :
                          statusInfo.status === 'expired'  ? 'text-red-400 bg-red-500/10'       : 'text-sky-400 bg-sky-500/10'
                        }`}>
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-white font-semibold text-sm truncate">{member.name}</p>
                        <StatusBadge status={statusInfo.status} label={statusInfo.label} />
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-slate-500 text-xs truncate">{formatPhoneDisplay(member.contactNumber)}</p>
                        <span className="text-slate-700">·</span>
                        <p className="text-slate-500 text-xs capitalize shrink-0">{member.membershipType}</p>
                        <span className="text-slate-700">·</span>
                        <p className={`text-xs shrink-0 ${statusInfo.status === 'expired' ? 'text-red-400/70' : statusInfo.status === 'expiring' ? 'text-orange-400/80' : 'text-slate-500'}`}>
                          {statusInfo.status === 'expired' ? 'Expired' : 'Ends'} {formatDate(member.membershipEndDate)}
                        </p>
                      </div>
                    </div>

                    <ChevronDown size={16} className={`text-slate-600 shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Expanded section */}
                  {isExpanded && (
                    <div className="border-t border-slate-700/40">

                      {/* Expiry progress bar */}
                      {statusInfo.status === 'expiring' && (
                        <div className="px-3.5 pt-3">
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="text-slate-500">Expiring</span>
                            <span className="text-orange-400 font-semibold">
                              {statusInfo.daysLeft === 0 ? 'Today!' : `${statusInfo.daysLeft}d left`}
                            </span>
                          </div>
                          <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                              style={{ width: `${Math.max(8, ((5 - statusInfo.daysLeft) / 5) * 100)}%` }} />
                          </div>
                        </div>
                      )}

                      {/* Copy row */}
                      <div className="flex gap-2 px-3.5 pt-3">
                        <button onClick={() => copyToClipboard(member.name, `${member.id}-name`)}
                          className="flex-1 flex items-center justify-between gap-1.5 bg-slate-700/50 hover:bg-slate-700 px-3 py-2 rounded-xl transition-colors group">
                          <span className="text-slate-300 text-xs font-medium truncate">{member.name}</span>
                          {copied === `${member.id}-name`
                            ? <CheckCircle size={12} className="text-green-400 shrink-0" />
                            : <Copy size={12} className="text-slate-600 group-hover:text-slate-400 shrink-0" />}
                        </button>
                        {member.contactNumber && (
                          <button onClick={() => copyToClipboard(member.contactNumber, `${member.id}-phone`)}
                            className="flex-1 flex items-center justify-between gap-1.5 bg-slate-700/50 hover:bg-slate-700 px-3 py-2 rounded-xl transition-colors group">
                            <span className="text-slate-300 text-xs font-medium truncate">{formatPhoneDisplay(member.contactNumber)}</span>
                            {copied === `${member.id}-phone`
                              ? <CheckCircle size={12} className="text-green-400 shrink-0" />
                              : <Copy size={12} className="text-slate-600 group-hover:text-slate-400 shrink-0" />}
                          </button>
                        )}
                      </div>

                      {/* Action grid */}
                      <div className="grid grid-cols-4 gap-1.5 px-3.5 pt-2.5">
                        {!isStaff && (
                          <button onClick={() => navigate(`/${gymSlug}/admin/members/${member.id}/edit`)}
                            className="flex flex-col items-center gap-1 bg-slate-700/50 hover:bg-slate-700 py-2.5 rounded-xl transition-colors">
                            <Pencil size={14} className="text-slate-300" />
                            <span className="text-[10px] text-slate-400 font-medium">Edit</span>
                          </button>
                        )}
                        <button onClick={() => navigate(`/${gymSlug}/admin/members/${member.id}/history`)}
                          className="flex flex-col items-center gap-1 bg-slate-700/50 hover:bg-slate-700 py-2.5 rounded-xl transition-colors">
                          <History size={14} className="text-slate-300" />
                          <span className="text-[10px] text-slate-400 font-medium">History</span>
                        </button>
                        <button onClick={() => setSmsTarget({ member, daysLeft: statusInfo.daysLeft })}
                          className="flex flex-col items-center gap-1 bg-orange-500/10 hover:bg-orange-500/20 py-2.5 rounded-xl transition-colors">
                          <MessageSquare size={14} className="text-orange-400" />
                          <span className="text-[10px] text-orange-400 font-medium">SMS</span>
                        </button>
                        {!isStaff && (
                          <button onClick={() => setAdvanceTarget(member)}
                            className="relative flex flex-col items-center gap-1 bg-violet-500/10 hover:bg-violet-500/20 py-2.5 rounded-xl transition-colors">
                            <CalendarPlus size={14} className="text-violet-400" />
                            <span className="text-[10px] text-violet-400 font-medium">Advance</span>
                            {totalAdv > 0 && (
                              <span className="absolute -top-1 -right-1 w-4 h-4 bg-violet-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                                {totalAdv}
                              </span>
                            )}
                          </button>
                        )}
                      </div>

                      {/* Renew + Remove */}
                      <div className="px-3.5 pt-2 pb-3 space-y-1.5">
                        <button
                          onClick={() => { setRenewTarget(member); setExpandedId(null); }}
                          className="w-full flex items-center justify-center gap-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                        >
                          <RefreshCw size={14} /> Renew
                        </button>
                        {!isStaff && (
                          <button
                            onClick={() => { setConfirmDelete(member); setExpandedId(null); }}
                            className="w-full flex items-center justify-center gap-1.5 text-red-400/50 hover:text-red-400 py-1.5 rounded-xl text-xs font-medium transition-colors hover:bg-red-500/10"
                          >
                            <Trash2 size={11} /> Remove Member
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
          onPrev={() => setPage((p) => p - 1)}
          onNext={() => setPage((p) => p + 1)}
        />
      </div>

      {/* Quick Renew Modal */}
      {renewTarget && (
        <QuickRenewModal
          member={renewTarget}
          settings={settings}
          promos={settings.promos?.filter((p) => p.active) || []}
          renewMember={renewMember}
          submitPendingMembership={submitPendingMembership}
          isStaff={isStaff}
          onClose={() => setRenewTarget(null)}
        />
      )}

      {/* SMS Modal */}
      {smsTarget && (
        <SMSModal
          member={smsTarget.member}
          daysLeft={smsTarget.daysLeft}
          onClose={() => setSmsTarget(null)}
        />
      )}

      {/* QR Code Modal */}
      {qrTarget && (
        <QRModal member={qrTarget} gymSlug={gymSlug} onClose={() => setQrTarget(null)} />
      )}

      {/* Advance Payment Modal */}
      {advanceTarget && (
        <AdvancePaymentModal member={advanceTarget} onClose={() => setAdvanceTarget(null)} />
      )}

      {/* Delete Confirm */}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6">
          <div className="bg-slate-800 rounded-2xl w-full max-w-sm p-6 border border-slate-700">
            <h3 className="text-white font-bold text-lg mb-2">Remove Member?</h3>
            <p className="text-slate-400 text-sm mb-6">
              Are you sure you want to remove <strong className="text-white">{confirmDelete.name}</strong>?
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={deleting}
                className="flex-1 flex items-center justify-center bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white py-3 rounded-xl font-semibold transition-colors"
              >
                {deleting ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const PLAN_PRICE_KEY = {
  monthly:       'priceMonthly',
  quarterly:     'priceQuarterly',
  'semi-annual': 'priceSemiAnnual',
  annual:        'priceAnnual',
};

function QuickRenewModal({ member, settings, promos, renewMember, submitPendingMembership, isStaff, onClose }) {
  const [plan, setPlan]               = useState('monthly');
  const [paymentMethod, setPayment]   = useState('cash');
  const [saving, setSaving]           = useState(false);

  const selectedPromo = promos.find((p) => p.name === plan);
  const isStudent = plan === 'student';
  const price = isStudent
    ? settings.priceStudent
    : selectedPromo
    ? selectedPromo.price
    : (settings[PLAN_PRICE_KEY[plan]] || 0);
  const customDays = isStudent
    ? 30
    : selectedPromo?.duration_days || null;

  const handleRenew = async () => {
    setSaving(true);
    try {
      if (isStaff) {
        await submitPendingMembership('renewal', { membershipType: plan, paymentMethod, durationDays: customDays }, member.name, member.id);
        toast.success(`Renewal submitted for approval!`);
      } else {
        await renewMember(member.id, plan, paymentMethod, customDays);
        toast.success(`✅ Membership renewed for ${member.name}!`);
      }
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to submit renewal.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-sm border border-slate-700 shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-green-500/20 rounded-xl flex items-center justify-center">
              <RefreshCw size={16} className="text-green-400" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">Accept Payment &amp; Renew</h3>
              <p className="text-slate-400 text-xs">{member.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">

          {/* Plan selection */}
          <div>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">Membership Plan</p>
            <div className="space-y-2">
              {MEMBERSHIP_OPTIONS.map((opt) => {
                const optPrice = settings[PLAN_PRICE_KEY[opt.value]] || 0;
                return (
                  <label
                    key={opt.value}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      plan === opt.value
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-slate-600 bg-slate-700/40 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="plan"
                        value={opt.value}
                        checked={plan === opt.value}
                        onChange={() => setPlan(opt.value)}
                        className="accent-green-500"
                      />
                      <span className={`font-medium text-sm ${plan === opt.value ? 'text-green-400' : 'text-white'}`}>
                        {opt.label}
                      </span>
                    </div>
                    <span className={`font-bold text-sm ${plan === opt.value ? 'text-green-400' : 'text-slate-300'}`}>
                      {optPrice > 0 ? `₱${optPrice.toLocaleString()}` : '—'}
                    </span>
                  </label>
                );
              })}

              {/* Student membership */}
              {settings.priceStudent > 0 && (
                <>
                  <p className="text-sky-400 text-xs font-medium uppercase tracking-wider pt-1">Student</p>
                  <label
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      plan === 'student'
                        ? 'border-sky-500 bg-sky-500/10'
                        : 'border-slate-600 bg-slate-700/40 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="plan"
                        value="student"
                        checked={plan === 'student'}
                        onChange={() => setPlan('student')}
                        className="accent-sky-500"
                      />
                      <div>
                        <span className={`font-medium text-sm ${plan === 'student' ? 'text-sky-300' : 'text-white'}`}>
                          Student
                        </span>
                        <span className="text-slate-500 text-xs ml-2">30 days</span>
                      </div>
                    </div>
                    <span className={`font-bold text-sm ${plan === 'student' ? 'text-sky-300' : 'text-slate-300'}`}>
                      ₱{Number(settings.priceStudent).toLocaleString()}
                    </span>
                  </label>
                </>
              )}

              {/* Special promos */}
              {promos.length > 0 && (
                <>
                  <p className="text-purple-400 text-xs font-medium uppercase tracking-wider pt-1">Special Promos</p>
                  {promos.map((promo) => (
                    <label
                      key={promo.id}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                        plan === promo.name
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-slate-600 bg-slate-700/40 hover:border-slate-500'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="plan"
                          value={promo.name}
                          checked={plan === promo.name}
                          onChange={() => setPlan(promo.name)}
                          className="accent-purple-500"
                        />
                        <div>
                          <span className={`font-medium text-sm ${plan === promo.name ? 'text-purple-300' : 'text-white'}`}>
                            {promo.name}
                          </span>
                          <span className="text-slate-500 text-xs ml-2">{promo.duration_days} days</span>
                        </div>
                      </div>
                      <span className={`font-bold text-sm ${plan === promo.name ? 'text-purple-300' : 'text-slate-300'}`}>
                        ₱{Number(promo.price).toLocaleString()}
                      </span>
                    </label>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Student ID reminder */}
          {isStudent && (
            <div className="flex items-start gap-2.5 bg-sky-500/10 border border-sky-500/30 rounded-xl px-4 py-3">
              <span className="text-sky-400 text-base shrink-0">🎓</span>
              <p className="text-sky-300 text-xs leading-relaxed">
                Remind member to present a valid school ID upon visit.
              </p>
            </div>
          )}

          {/* Payment method */}
          <div>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">Payment Method</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setPayment('cash')}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border font-semibold text-sm transition-all ${
                  paymentMethod === 'cash'
                    ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                    : 'border-slate-600 bg-slate-700/40 text-slate-400 hover:border-slate-500'
                }`}
              >
                <Banknote size={16} /> Cash
              </button>
              <button
                onClick={() => setPayment('gcash')}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border font-semibold text-sm transition-all ${
                  paymentMethod === 'gcash'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                    : 'border-slate-600 bg-slate-700/40 text-slate-400 hover:border-slate-500'
                }`}
              >
                <CreditCard size={16} /> GCash
              </button>
            </div>
          </div>

          {/* Summary */}
          {price > 0 && (
            <div className="bg-slate-700/50 rounded-xl p-3 flex items-center justify-between">
              <p className="text-slate-400 text-sm">Total Amount</p>
              <p className="text-green-400 font-black text-lg">₱{price.toLocaleString()}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-medium text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleRenew}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white py-3 rounded-xl font-bold text-sm transition-colors"
            >
              {saving
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><CheckCircle size={15} /> Confirm &amp; Renew</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function QRModal({ member, gymSlug, onClose }) {
  const qrUrl = `${window.location.origin}/${gymSlug}/m/${member.qrToken}`;

  const handleDownload = () => {
    const svg = document.getElementById('member-qr-svg');
    if (!svg) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 300, 300);
      ctx.drawImage(img, 0, 0, 300, 300);
      const a = document.createElement('a');
      a.download = `${member.name.replace(/\s+/g, '-')}-QR.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    img.src = `data:image/svg+xml;base64,${btoa(svgStr)}`;
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-sm shadow-2xl border border-slate-700">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <QrCode size={18} className="text-purple-400" />
            <h3 className="text-white font-semibold">Member QR Code</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex flex-col items-center gap-4">
          <div className="bg-white p-4 rounded-2xl">
            <QRCodeSVG
              id="member-qr-svg"
              value={qrUrl}
              size={200}
              level="M"
              includeMargin={false}
            />
          </div>
          <div className="text-center">
            <p className="text-white font-bold">{member.name}</p>
            <p className="text-slate-400 text-xs mt-0.5">Scan to auto clock-in</p>
          </div>
          <button
            onClick={handleDownload}
            className="w-full flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            <QrCode size={16} /> Download QR
          </button>
        </div>
      </div>
    </div>
  );
}
