import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, UserPlus, Pencil, MessageSquare, Trash2, X, Download, RefreshCw, CheckCircle, Banknote, CreditCard, History, ChevronDown } from 'lucide-react';
import { useGym } from '../context/GymContext';
import Navbar from '../components/Navbar';
import Pagination from '../components/Pagination';
import StatusBadge from '../components/StatusBadge';
import SMSModal from '../components/SMSModal';
import { MEMBERSHIP_OPTIONS } from '../context/GymContext';
import { formatDate, formatPhoneDisplay } from '../utils/helpers';
import { exportMembersToExcel } from '../utils/exportExcel';
import toast from 'react-hot-toast';

const FILTERS   = ['all', 'active', 'expiring', 'expired'];
const PAGE_SIZE = 15;
// 'active' filter includes expiring members since they are still active

export default function MembersList() {
  const { members, getMemberStatus, deleteMember, renewMember, settings, instructors, gymSlug } = useGym();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState(searchParams.get('filter') || 'all');
  const [page, setPage] = useState(1);
  const [smsTarget, setSmsTarget] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [renewTarget, setRenewTarget] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

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
            <h1 className="text-xl font-bold text-white">All Members</h1>
            <p className="text-slate-400 text-sm">{filtered.length} of {members.length}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                exportMembersToExcel(members, settings.gymName);
                toast.success('Excel file downloaded!');
              }}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2.5 rounded-xl font-semibold text-sm transition-colors"
              title="Export to Excel"
            >
              <Download size={16} />
              <span className="hidden sm:block">Export</span>
            </button>
            <button
              onClick={() => navigate(`/${gymSlug}/admin/register`)}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors"
            >
              <UserPlus size={16} /> Add
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or number..."
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
          {FILTERS.map((f) => {
            const count = members.filter((m) => {
              const s = getMemberStatus(m).status;
              if (f === 'all') return true;
              if (f === 'active') return s === 'active' || s === 'expiring';
              return s === f;
            }).length;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`shrink-0 px-3.5 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                  filter === f
                    ? f === 'expiring'
                      ? 'bg-orange-500 text-white'
                      : 'bg-slate-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)} ({count})
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

              return (
                <div
                  key={member.id}
                  className={`bg-slate-800 rounded-2xl border transition-all ${
                    statusInfo.status === 'expiring'
                      ? 'border-orange-500/40 shadow-sm shadow-orange-500/10'
                      : 'border-slate-700/50'
                  }`}
                >
                  {/* ── Always-visible row ── */}
                  <button
                    className="w-full flex items-center gap-3 p-3.5 text-left"
                    onClick={() => setExpandedId(isExpanded ? null : member.id)}
                  >
                    {/* Avatar */}
                    <div className="w-11 h-11 rounded-xl overflow-hidden bg-slate-700 shrink-0">
                      {member.photo ? (
                        <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center font-bold text-base ${
                          statusInfo.status === 'expiring' ? 'text-orange-400' :
                          statusInfo.status === 'expired'  ? 'text-red-400'    : 'text-sky-400'
                        }`}>
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Name + status + phone */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-white font-semibold text-sm">{member.name}</p>
                        <StatusBadge status={statusInfo.status} label={statusInfo.label} />
                      </div>
                      <p className="text-slate-400 text-xs mt-0.5">{formatPhoneDisplay(member.contactNumber)}</p>
                    </div>

                    {/* Chevron */}
                    <ChevronDown
                      size={18}
                      className={`text-slate-500 shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {/* ── Expanded details + actions (mobile collapsible) ── */}
                  {isExpanded && (
                    <div className="px-3.5 pb-4 space-y-3 border-t border-slate-700/50 pt-3">

                      {/* Detail chips */}
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs font-medium bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg capitalize">
                          {member.membershipType}
                        </span>
                        {instructor && (
                          <span className="text-xs font-medium bg-yellow-500/15 text-yellow-400 px-2.5 py-1 rounded-lg">
                            🏋️ {instructor.name}
                          </span>
                        )}
                        <span className="text-xs font-medium bg-slate-700/60 text-slate-400 px-2.5 py-1 rounded-lg">
                          Ends {formatDate(member.membershipEndDate)}
                        </span>
                      </div>

                      {/* Expiry progress bar */}
                      {statusInfo.status === 'expiring' && (
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="text-orange-400/70">Expiring</span>
                            <span className="text-orange-400 font-semibold">
                              {statusInfo.daysLeft === 0 ? 'Today!' : `${statusInfo.daysLeft} day${statusInfo.daysLeft !== 1 ? 's' : ''} left`}
                            </span>
                          </div>
                          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                              style={{ width: `${Math.max(8, ((5 - statusInfo.daysLeft) / 5) * 100)}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Action buttons grid */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => navigate(`/${gymSlug}/admin/members/${member.id}/edit`)}
                          className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200 py-2.5 rounded-xl text-sm font-medium transition-colors"
                        >
                          <Pencil size={14} /> Edit
                        </button>
                        <button
                          onClick={() => navigate(`/${gymSlug}/admin/members/${member.id}/history`)}
                          className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200 py-2.5 rounded-xl text-sm font-medium transition-colors"
                        >
                          <History size={14} /> History
                        </button>
                        <button
                          onClick={() => { setRenewTarget(member); setExpandedId(null); }}
                          className="flex items-center justify-center gap-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 py-2.5 rounded-xl text-sm font-medium transition-colors"
                        >
                          <RefreshCw size={14} /> Renew
                        </button>
                        <button
                          onClick={() => setSmsTarget({ member, daysLeft: statusInfo.daysLeft })}
                          className="flex items-center justify-center gap-2 bg-orange-500/15 hover:bg-orange-500/25 text-orange-400 py-2.5 rounded-xl text-sm font-medium transition-colors"
                        >
                          <MessageSquare size={14} /> SMS
                        </button>
                        <button
                          onClick={() => { setConfirmDelete(member); setExpandedId(null); }}
                          className="col-span-2 flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2.5 rounded-xl text-sm font-medium transition-colors"
                        >
                          <Trash2 size={14} /> Remove Member
                        </button>
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

function QuickRenewModal({ member, settings, promos, renewMember, onClose }) {
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
      await renewMember(member.id, plan, paymentMethod, customDays);
      toast.success(`✅ Membership renewed for ${member.name}!`);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to renew membership.');
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
