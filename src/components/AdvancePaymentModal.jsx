import { useState } from 'react';
import { X, Plus, CheckCircle, XCircle, PlayCircle, CreditCard } from 'lucide-react';
import { useGym } from '../context/GymContext';
import { MEMBERSHIP_OPTIONS } from '../context/GymContext';
import toast from 'react-hot-toast';

const STATUS_CFG = {
  pending:   { label: 'Pending Approval', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  queued:    { label: 'Queued',           color: 'text-sky-400',    bg: 'bg-sky-500/10',    border: 'border-sky-500/30'    },
  applied:   { label: 'Applied',          color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/30'  },
  cancelled: { label: 'Cancelled',        color: 'text-slate-500',  bg: 'bg-slate-700/40',  border: 'border-slate-600/40'  },
};

const PLAN_PRICE_KEY = {
  monthly: 'priceMonthly', quarterly: 'priceQuarterly',
  'semi-annual': 'priceSemiAnnual', annual: 'priceAnnual', student: 'priceStudent',
};

export default function AdvancePaymentModal({ member, onClose }) {
  const { advancePayments, addAdvancePayment, approveAdvancePayment, cancelAdvancePayment, applyAdvancePayment, settings } = useGym();
  const [adding, setAdding]           = useState(false);
  const [amount, setAmount]           = useState('');
  const [notes, setNotes]             = useState('');
  const [saving, setSaving]           = useState(false);
  const [busy, setBusy]               = useState(null);
  const [applyId, setApplyId]         = useState(null);
  const [applyPlan, setApplyPlan]     = useState('monthly');
  const [showHistory, setShowHistory] = useState(false);

  const payments    = advancePayments.filter((p) => p.member_id === member.id);
  const active      = payments.filter((p) => p.status === 'queued' || p.status === 'pending');
  const history     = payments.filter((p) => p.status === 'applied' || p.status === 'cancelled');
  const activeCount = payments.filter((p) => p.status === 'queued').length;
  const totalQueued = payments.filter((p) => p.status === 'queued').reduce((s, p) => s + Number(p.amount || 0), 0);
  const monthlyPrice = settings?.priceMonthly || 0;
  const isPartial = activeCount > 0 && monthlyPrice > 0 && totalQueued < monthlyPrice;

  const handleAdd = async () => {
    if (!amount || Number(amount) <= 0) { toast.error('Enter an amount'); return; }
    setSaving(true);
    try {
      await addAdvancePayment(member.id, member.name, { amount, notes });
      toast.success('Advance payment added');
      setAdding(false);
      setAmount('');
      setNotes('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const act = async (fn, id, label) => {
    setBusy(id + label);
    try {
      await fn(id);
      toast.success(label);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(null);
    }
  };

  const handleApply = async () => {
    setBusy(applyId + 'apply');
    try {
      await applyAdvancePayment(applyId, applyPlan);
      toast.success('Payment applied — membership extended');
      setApplyId(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(null);
    }
  };

  // Plan picker helpers
  const getPlanInfo = (optValue) => {
    const price = settings?.[PLAN_PRICE_KEY[optValue]] || 0;
    if (price === 0) return { price: 0, affordable: true, periods: 1, excess: 0 };
    const affordable = totalQueued >= price;
    const periods = affordable ? Math.floor(totalQueued / price) : 0;
    const excess = affordable ? totalQueued - periods * price : 0;
    return { price, affordable, periods, excess };
  };

  const selectedPlanAffordable = getPlanInfo(applyPlan).affordable;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl border border-slate-700 flex flex-col max-h-[85vh] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700 shrink-0">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <CreditCard size={16} className="text-sky-400" />
              <h3 className="text-white font-semibold">Advance Payments</h3>
              {activeCount > 0 && (
                <span className="text-xs bg-sky-500/20 text-sky-400 px-2 py-0.5 rounded-full font-semibold">
                  {activeCount} queued · ₱{totalQueued.toLocaleString()}
                </span>
              )}
              {isPartial && (
                <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full font-semibold">
                  Partial
                </span>
              )}
            </div>
            <p className="text-slate-400 text-xs mt-0.5">{member.name}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1"><X size={20} /></button>
        </div>

        {/* Apply plan picker overlay */}
        {applyId && (
          <div className="absolute inset-0 bg-slate-900/95 z-10 flex flex-col p-6 rounded-2xl">
            <h4 className="text-white font-bold text-base mb-0.5">Apply Advance Payment</h4>
            <p className="text-slate-400 text-sm mb-4">
              Total balance: <span className="text-white font-bold">₱{totalQueued.toLocaleString()}</span>
            </p>
            <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
              {MEMBERSHIP_OPTIONS.filter((opt) => (settings?.[PLAN_PRICE_KEY[opt.value]] || 0) > 0).map((opt) => {
                const { price, affordable, periods, excess } = getPlanInfo(opt.value);
                const selected = applyPlan === opt.value;
                return (
                  <label key={opt.value} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    !affordable
                      ? 'opacity-50 cursor-not-allowed border-slate-700 bg-slate-800/60'
                      : selected
                        ? 'border-sky-500 bg-sky-500/10 cursor-pointer'
                        : 'border-slate-600 bg-slate-700/40 cursor-pointer hover:border-slate-500'
                  }`}>
                    <div className="flex items-center gap-3">
                      <input type="radio" name="apply-plan" value={opt.value}
                        checked={selected} onChange={() => setApplyPlan(opt.value)}
                        disabled={!affordable} className="accent-sky-500" />
                      <div>
                        <span className={`font-medium text-sm ${selected ? 'text-sky-400' : affordable ? 'text-white' : 'text-slate-500'}`}>
                          {opt.label}
                        </span>
                        {affordable && price > 0 && (
                          <p className="text-slate-500 text-[10px] mt-0.5">
                            {periods > 1 ? `${periods} periods` : '1 period'}{excess > 0 ? ` · ₱${excess.toLocaleString()} carry forward` : ' · exact'}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`font-bold text-sm ${selected ? 'text-sky-400' : affordable ? 'text-slate-300' : 'text-slate-600'}`}>
                        {price > 0 ? `₱${price.toLocaleString()}` : '—'}
                      </span>
                      {!affordable && price > 0 && (
                        <p className="text-red-400 text-[10px] mt-0.5">
                          need ₱{(price - totalQueued).toLocaleString()} more
                        </p>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setApplyId(null)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl text-sm font-medium">
                Cancel
              </button>
              <button onClick={handleApply} disabled={!!busy || !selectedPlanAffordable}
                className="flex-1 flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 disabled:opacity-60 text-white py-3 rounded-xl text-sm font-semibold">
                {busy ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Apply & Extend'}
              </button>
            </div>
          </div>
        )}

        {/* List */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-2">
          {active.length === 0 && !adding && (
            <p className="text-center py-6 text-slate-500 text-sm">No active advance payments</p>
          )}

          {active.map((p) => {
            const cfg = STATUS_CFG[p.status] || STATUS_CFG.queued;
            return (
              <div key={p.id} className={`rounded-2xl border p-4 ${cfg.bg} ${cfg.border}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {p.amount > 0
                        ? <span className="text-white font-bold text-base">₱{Number(p.amount).toLocaleString()}</span>
                        : <span className="text-slate-400 text-sm">No amount</span>}
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-black/20 ${cfg.color}`}>{cfg.label}</span>
                    </div>
                    {p.notes && <p className="text-slate-400 text-xs mt-1">{p.notes}</p>}
                    {p.gcash_reference && <p className="text-slate-500 text-xs mt-0.5">Ref: {p.gcash_reference}</p>}
                    <p className="text-slate-600 text-[10px] mt-1">
                      {new Date(p.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {p.applied_at && ` → Applied ${new Date(p.applied_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}`}
                    </p>
                    {p.receipt_url && (
                      <a href={p.receipt_url} target="_blank" rel="noopener noreferrer" className="text-sky-400 text-xs underline mt-1 block">View Receipt</a>
                    )}
                  </div>
                  <div className="shrink-0 flex gap-1.5">
                    {p.status === 'pending' && (
                      <>
                        <button onClick={() => act(approveAdvancePayment, p.id, 'Approved')} disabled={!!busy}
                          title="Approve" className="w-8 h-8 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-xl flex items-center justify-center disabled:opacity-50">
                          {busy === p.id + 'Approved' ? <span className="w-3 h-3 border border-green-400/40 border-t-green-400 rounded-full animate-spin" /> : <CheckCircle size={15} />}
                        </button>
                        <button onClick={() => act(cancelAdvancePayment, p.id, 'Rejected')} disabled={!!busy}
                          title="Reject" className="w-8 h-8 bg-red-500/15 hover:bg-red-500/25 text-red-400 rounded-xl flex items-center justify-center disabled:opacity-50">
                          <XCircle size={15} />
                        </button>
                      </>
                    )}
                    {p.status === 'queued' && (
                      <>
                        <button onClick={() => { setApplyId(p.id); setApplyPlan('monthly'); }} disabled={!!busy}
                          title="Apply — extend membership" className="w-8 h-8 bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 rounded-xl flex items-center justify-center disabled:opacity-50">
                          <PlayCircle size={15} />
                        </button>
                        <button onClick={() => act(cancelAdvancePayment, p.id, 'Cancelled')} disabled={!!busy}
                          title="Cancel" className="w-8 h-8 bg-red-500/15 hover:bg-red-500/25 text-red-400 rounded-xl flex items-center justify-center disabled:opacity-50">
                          <XCircle size={15} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* History toggle */}
          {history.length > 0 && (
            <div>
              <button onClick={() => setShowHistory((v) => !v)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-300 hover:bg-slate-700/40 transition-colors">
                <span>{showHistory ? 'Hide' : 'Show'} history ({history.length})</span>
                <span>{showHistory ? '▲' : '▼'}</span>
              </button>
              {showHistory && (
                <div className="space-y-2 mt-2">
                  {history.map((p) => {
                    const cfg = STATUS_CFG[p.status] || STATUS_CFG.applied;
                    return (
                      <div key={p.id} className={`rounded-2xl border p-3 ${cfg.bg} ${cfg.border} opacity-70`}>
                        <div className="flex items-center gap-2 flex-wrap">
                          {p.amount > 0
                            ? <span className="text-white font-semibold text-sm">₱{Number(p.amount).toLocaleString()}</span>
                            : <span className="text-slate-400 text-xs">No amount</span>}
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-black/20 ${cfg.color}`}>{cfg.label}</span>
                        </div>
                        {p.notes && <p className="text-slate-500 text-xs mt-1">{p.notes}</p>}
                        <p className="text-slate-600 text-[10px] mt-1">
                          {new Date(p.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                          {p.applied_at && ` → Applied ${new Date(p.applied_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}`}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Add form */}
          {adding && (
            <div className="rounded-2xl border border-slate-600 bg-slate-700/40 p-4 space-y-3">
              <p className="text-white font-semibold text-sm">Add Advance Payment</p>
              <div>
                <label className="text-slate-400 text-xs mb-1 block">Amount (₱)</label>
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 400" autoFocus
                  className="w-full bg-slate-700 border border-slate-600 focus:border-sky-500 text-white rounded-xl px-3 py-2.5 text-sm outline-none placeholder:text-slate-500" />
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1 block">Notes (optional)</label>
                <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Half payment, will follow up remaining"
                  className="w-full bg-slate-700 border border-slate-600 focus:border-sky-500 text-white rounded-xl px-3 py-2.5 text-sm outline-none placeholder:text-slate-500" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setAdding(false); setAmount(''); setNotes(''); }}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-xl text-sm font-medium transition-colors">Cancel</button>
                <button onClick={handleAdd} disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 disabled:opacity-60 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors">
                  {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Save'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!adding && (
          <div className="px-5 pb-5 pt-3 border-t border-slate-700/50 shrink-0">
            <div className="bg-slate-700/30 rounded-xl px-4 py-3 mb-3 text-xs text-slate-400 space-y-1">
              <p>• Member is excluded from expiry SMS reminders while payments are queued</p>
              <p>• Use <span className="text-sky-400">▶</span> to apply all queued payments and extend membership</p>
            </div>
            <button onClick={() => setAdding(true)}
              className="w-full flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 text-white font-semibold py-3 rounded-xl transition-colors">
              <Plus size={16} /> Add Advance Payment
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
