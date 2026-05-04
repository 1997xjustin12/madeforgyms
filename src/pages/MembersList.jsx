import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, UserPlus, Pencil, MessageSquare, Trash2, X, Download, RefreshCw, CheckCircle, Banknote, CreditCard, History, ChevronDown, QrCode, UserCheck, CalendarPlus, Copy, Dumbbell } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import AdvancePaymentModal from '../components/AdvancePaymentModal';
import { useGym } from '../context/GymContext';
import Navbar from '../components/Navbar';
import Pagination from '../components/Pagination';
import StatusBadge from '../components/StatusBadge';
import SMSModal from '../components/SMSModal';
import { MEMBERSHIP_OPTIONS } from '../context/GymContext';
import { formatDate, formatPhoneDisplay, calcBMI, getBMICategory, calcAge } from '../utils/helpers';
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
    <div className="h-screen bg-[#030712] flex flex-col overflow-hidden">
      <Navbar title="Members" />

      <div className="max-w-4xl mx-auto w-full px-4 pt-4 pb-3 space-y-3 shrink-0">
        {/* Header Row */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Members</h1>
            <p className="text-slate-500 text-xs mt-0.5">{filtered.length} of {members.length} members</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { exportMembersToExcel(members, settings.gymName); toast.success('Excel file downloaded!'); }}
              className="w-9 h-9 flex items-center justify-center bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-400 rounded-xl transition-colors"
              title="Export to Excel"
            >
              <Download size={16} />
            </button>
            <button
              onClick={() => navigate(`/${gymSlug}/admin/register`)}
              className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-400 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-orange-500/20 active:scale-[0.98]"
            >
              <UserPlus size={15} /> Add
            </button>
          </div>
        </div>

        {/* Quick stats strip */}
        {(() => {
          const activeCount   = members.filter((m) => { const s = getMemberStatus(m).status; return s === 'active' || s === 'expiring'; }).length;
          const expiringCount = members.filter((m) => getMemberStatus(m).status === 'expiring').length;
          const expiredCount  = members.filter((m) => getMemberStatus(m).status === 'expired').length;
          return (
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-2xl px-3.5 py-3 border border-green-500/20" style={{ background: 'rgba(34,197,94,0.05)' }}>
                <p className="text-xl font-black text-green-400 leading-none tabular-nums">{activeCount}</p>
                <p className="text-[10px] font-bold mt-1 uppercase tracking-wider text-green-700">Active</p>
              </div>
              <div className="rounded-2xl px-3.5 py-3 border border-orange-500/20" style={{ background: 'rgba(249,115,22,0.05)' }}>
                <p className="text-xl font-black text-orange-400 leading-none tabular-nums">{expiringCount}</p>
                <p className="text-[10px] font-bold mt-1 uppercase tracking-wider text-orange-700">Expiring</p>
              </div>
              <div className="rounded-2xl px-3.5 py-3 border border-red-500/20" style={{ background: 'rgba(239,68,68,0.05)' }}>
                <p className="text-xl font-black text-red-400 leading-none tabular-nums">{expiredCount}</p>
                <p className="text-[10px] font-bold mt-1 uppercase tracking-wider text-red-700">Expired</p>
              </div>
            </div>
          );
        })()}

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or number..."
            className="w-full border focus:border-orange-500/40 text-white rounded-2xl pl-10 pr-10 py-3 outline-none transition-all placeholder:text-slate-700 text-sm"
            style={{ background: 'rgba(30,41,59,0.6)', borderColor: 'rgba(255,255,255,0.07)' }}
            onFocus={(e) => { e.target.style.borderColor = 'rgba(249,115,22,0.4)'; }}
            onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.07)'; }}
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
          {FILTERS.map((f) => {
            const count = members.filter((m) => {
              const s = getMemberStatus(m).status;
              if (f === 'all') return true;
              if (f === 'active') return s === 'active' || s === 'expiring';
              return s === f;
            }).length;
            const isActive = filter === f;
            const cfgMap = {
              all:      { on: 'bg-slate-700 text-white border-slate-500',              dot: 'bg-slate-400'   },
              active:   { on: 'bg-green-500/15 text-green-400 border-green-500/40',    dot: 'bg-green-400'   },
              expiring: { on: 'bg-orange-500/15 text-orange-400 border-orange-500/40', dot: 'bg-orange-400'  },
              expired:  { on: 'bg-red-500/15 text-red-400 border-red-500/40',          dot: 'bg-red-400'     },
            };
            const cfg = cfgMap[f] || cfgMap.all;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border shrink-0 ${
                  isActive ? cfg.on : 'bg-slate-800/50 border-slate-700/50 text-slate-500 hover:text-slate-300'
                }`}
              >
                {isActive && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />}
                {f.charAt(0).toUpperCase() + f.slice(1)}
                <span className={`font-black tabular-nums ${isActive ? 'opacity-80' : 'text-slate-600'}`}>{count}</span>
              </button>
            );
          })}
        </div>

      </div>

      {/* Scrollable member list */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="max-w-4xl mx-auto px-4 pt-1 pb-24 sm:pb-8">

        {/* Members List */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-slate-700/30" style={{ background: 'rgba(30,41,59,0.4)' }}>
            <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-700/50">
              <Search size={22} className="text-slate-600" />
            </div>
            <p className="text-slate-300 font-bold">No members found</p>
            <p className="text-slate-600 text-sm mt-1">Try a different name, number, or filter</p>
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
                  className={`relative rounded-2xl border overflow-hidden transition-all ${
                    statusInfo.status === 'expiring' ? 'border-orange-500/30' :
                    statusInfo.status === 'expired'  ? 'border-red-500/20'    :
                    isExpanded ? 'border-slate-600/50' : 'border-slate-700/30'
                  }`}
                  style={{ background: 'rgba(30,41,59,0.7)' }}
                >
                  {/* Left accent bar */}
                  <div className={`absolute left-0 inset-y-0 w-[3px] ${
                    statusInfo.status === 'expiring' ? 'bg-orange-500' :
                    statusInfo.status === 'expired'  ? 'bg-red-500'    :
                    statusInfo.status === 'active'   ? 'bg-green-500'  : 'bg-slate-600'
                  }`} />

                  {/* Collapsed row */}
                  <button
                    className="w-full flex items-center gap-3 pl-4 pr-3 py-3.5 text-left"
                    onClick={() => setExpandedId(isExpanded ? null : member.id)}
                  >
                    {/* Avatar */}
                    <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0" style={{ background: 'rgba(51,65,85,0.9)' }}>
                      {member.photo ? (
                        <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center font-black text-base ${
                          statusInfo.status === 'expiring' ? 'text-orange-400 bg-orange-500/10' :
                          statusInfo.status === 'expired'  ? 'text-red-400 bg-red-500/10'       : 'text-sky-400 bg-sky-500/10'
                        }`}>
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <p className="text-white font-bold text-sm truncate leading-tight">{member.name}</p>
                        <StatusBadge status={statusInfo.status} label={statusInfo.label} />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-slate-500 text-xs truncate">{formatPhoneDisplay(member.contactNumber)}</p>
                        <span className="text-slate-700 text-xs">·</span>
                        <p className="text-slate-500 text-xs capitalize shrink-0">{member.membershipType}</p>
                        <span className="text-slate-700 text-xs">·</span>
                        <p className={`text-xs font-medium shrink-0 ${statusInfo.status === 'expired' ? 'text-red-400/70' : statusInfo.status === 'expiring' ? 'text-orange-400' : 'text-slate-600'}`}>
                          {statusInfo.status === 'expired' ? 'Expired' : 'Ends'} {formatDate(member.membershipEndDate)}
                        </p>
                      </div>
                    </div>

                    {/* Days remaining + chevron */}
                    <div className="shrink-0 flex flex-col items-center gap-0.5 ml-1">
                      {statusInfo.status !== 'expired' ? (
                        <span className={`text-sm font-black tabular-nums leading-none ${statusInfo.status === 'expiring' ? 'text-orange-400' : 'text-slate-300'}`}>
                          {statusInfo.daysLeft}<span className="text-[9px] font-semibold opacity-40">d</span>
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold text-red-400/50 leading-none uppercase tracking-wide">End</span>
                      )}
                      <ChevronDown size={13} className={`text-slate-600 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {/* Expanded section */}
                  {isExpanded && (
                    <div className="border-t border-slate-700/30">

                      {/* Expiry progress bar */}
                      {statusInfo.status === 'expiring' && (
                        <div className="pl-4 pr-3.5 pt-3">
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
                      <div className="flex gap-2 pl-4 pr-3.5 pt-3">
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

                      {/* BMI row */}
                      {(() => {
                        const bmi = calcBMI(member.height, member.weight);
                        const cat = getBMICategory(bmi);
                        const age = calcAge(member.birthdate);
                        if (!bmi || !cat) return null;
                        return (
                          <div className={`ml-4 mr-3.5 mt-2 flex items-center justify-between px-3 py-2 rounded-xl ${cat.bg} border ${cat.border}`}>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-bold ${cat.color}`}>BMI {bmi.toFixed(1)}</span>
                              <span className={`text-xs ${cat.color} opacity-70`}>·</span>
                              <span className={`text-xs font-semibold ${cat.color}`}>{cat.label}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-500 text-xs">
                              {age !== null && <span>{age} yrs</span>}
                              {member.height && <span>{member.height}cm</span>}
                              {member.weight && <span>{member.weight}kg</span>}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Action grid */}
                      <div className="grid grid-cols-4 gap-1.5 pl-4 pr-3.5 pt-2.5">
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
                        {member.height && member.weight && (
                          <button onClick={() => navigate(`/${gymSlug}/admin/members/${member.id}/workout`)}
                            className="flex flex-col items-center gap-1 bg-green-500/10 hover:bg-green-500/20 py-2.5 rounded-xl transition-colors">
                            <Dumbbell size={14} className="text-green-400" />
                            <span className="text-[10px] text-green-400 font-medium">Workout</span>
                          </button>
                        )}
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
                      <div className="pl-4 pr-3.5 pt-2 pb-3 space-y-1.5">
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
  const firstAvailable = MEMBERSHIP_OPTIONS.find((opt) => (settings[PLAN_PRICE_KEY[opt.value]] || 0) > 0)?.value || 'monthly';
  const [plan, setPlan]               = useState(firstAvailable);
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
            <div className="max-h-[260px] overflow-y-auto space-y-2 pr-0.5">
              {MEMBERSHIP_OPTIONS.filter((opt) => (settings[PLAN_PRICE_KEY[opt.value]] || 0) > 0).map((opt) => {
                const optPrice = settings[PLAN_PRICE_KEY[opt.value]];
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
                      ₱{optPrice.toLocaleString()}
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
