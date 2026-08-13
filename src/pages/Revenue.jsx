import { useState, useMemo, useRef } from 'react';
import { TrendingUp, TrendingDown, Banknote, CreditCard, Building2, MoreHorizontal, Calendar, Download, Plus, Trash2, X, AlertCircle } from 'lucide-react';
import { useGym } from '../context/GymContext';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';

const METHOD_CFG = {
  cash:  { label: 'Cash',          color: 'text-orange-400',  dot: 'bg-orange-400',  hex: '#fb923c', icon: <Banknote size={13} /> },
  gcash: { label: 'GCash',         color: 'text-blue-400',    dot: 'bg-blue-400',    hex: '#60a5fa', icon: <CreditCard size={13} /> },
  bank:  { label: 'Bank Transfer', color: 'text-emerald-400', dot: 'bg-emerald-400', hex: '#34d399', icon: <Building2 size={13} /> },
  other: { label: 'Other',         color: 'text-slate-300',   dot: 'bg-slate-400',   hex: '#94a3b8', icon: <MoreHorizontal size={13} /> },
};

const EXPENSE_CATEGORIES = ['rent', 'utilities', 'equipment', 'salaries', 'supplies', 'other'];

function fmt(n) {
  return Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtK(n) {
  if (n >= 1000000) return `₱${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `₱${(n / 1000).toFixed(1)}k`;
  return `₱${Math.round(n)}`;
}

function startOf(period) {
  const d = new Date();
  if (period === 'week')  { d.setDate(d.getDate() - d.getDay()); d.setHours(0,0,0,0); return d; }
  if (period === 'month') { d.setDate(1); d.setHours(0,0,0,0); return d; }
  if (period === 'year')  { d.setMonth(0,1); d.setHours(0,0,0,0); return d; }
  return null;
}

// ── Revenue Trend Bar Chart ───────────────────────────────────────
function RevenueChart({ payments, expenses, period }) {
  const [tooltip, setTooltip] = useState(null);
  const svgRef = useRef(null);

  const buckets = useMemo(() => {
    const now = new Date();
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    let keys = [];

    if (period === 'week') {
      const start = new Date(now); start.setDate(now.getDate() - now.getDay()); start.setHours(0,0,0,0);
      keys = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(start); d.setDate(start.getDate() + i);
        return {
          key: d.toISOString().split('T')[0],
          label: DAYS[d.getDay()],
          fullDate: d.toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' }),
        };
      });
    } else if (period === 'month') {
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      keys = Array.from({ length: daysInMonth }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth(), i + 1);
        return {
          key: d.toISOString().split('T')[0],
          label: String(i + 1),
          fullDate: d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }),
        };
      });
    } else if (period === 'year') {
      keys = Array.from({ length: 12 }, (_, i) => ({
        key: `${now.getFullYear()}-${String(i + 1).padStart(2, '0')}`,
        label: MONTHS[i],
        fullDate: `${MONTHS[i]} ${now.getFullYear()}`,
      }));
    } else {
      keys = Array.from({ length: 12 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
        return {
          key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
          label: MONTHS[d.getMonth()],
          fullDate: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
        };
      });
    }

    const revMap = Object.fromEntries(keys.map(k => [k.key, 0]));
    const expMap = Object.fromEntries(keys.map(k => [k.key, 0]));

    const getKey = (dateStr) => {
      const d = new Date(dateStr);
      return (period === 'week' || period === 'month')
        ? d.toISOString().split('T')[0]
        : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    };

    payments.forEach(p => { const k = getKey(p.created_at); if (k in revMap) revMap[k] += Number(p.amount || 0); });
    expenses.forEach(e => { const k = getKey(e.created_at); if (k in expMap) expMap[k] += Number(e.amount || 0); });

    return keys.map(k => ({ ...k, revenue: revMap[k.key], expense: expMap[k.key] }));
  }, [payments, expenses, period]);

  const W = 600, H = 180;
  const PAD = { t: 10, r: 10, b: 30, l: 50 };
  const cW = W - PAD.l - PAD.r;
  const cH = H - PAD.t - PAD.b;
  const n = buckets.length;
  const maxVal = Math.max(...buckets.map(b => Math.max(b.revenue, b.expense)), 1);
  const slotW = cW / n;
  const barW = Math.max(3, Math.min(14, slotW * 0.38));
  const gap = 2;
  const yScale = v => cH - (v / maxVal) * cH;
  const barH = v => (v / maxVal) * cH;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => ({
    y: cH - f * cH, label: f === 0 ? '' : fmtK(maxVal * f),
  }));

  const skipX = (i) => {
    if (n <= 12) return false;
    return i % Math.ceil(n / 10) !== 0 && i !== n - 1;
  };

  const hasData = buckets.some(b => b.revenue > 0 || b.expense > 0);

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-40 text-slate-700 text-sm">
        No data for this period yet
      </div>
    );
  }

  return (
    <div className="relative">
      {tooltip && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs shadow-xl z-10 pointer-events-none whitespace-nowrap">
          <p className="text-white font-bold mb-1">{tooltip.label}</p>
          {tooltip.revenue > 0 && <p className="text-green-400">Revenue: ₱{fmt(tooltip.revenue)}</p>}
          {tooltip.expense > 0 && <p className="text-red-400">Expense: ₱{fmt(tooltip.expense)}</p>}
          {tooltip.revenue === 0 && tooltip.expense === 0 && <p className="text-slate-500">No activity</p>}
        </div>
      )}
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full overflow-visible" style={{ height: 180 }}>
        {/* Y grid + labels */}
        {yTicks.map((t, i) => (
          <g key={i}>
            {i > 0 && (
              <line x1={PAD.l} y1={PAD.t + t.y} x2={PAD.l + cW} y2={PAD.t + t.y}
                stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            )}
            {t.label && (
              <text x={PAD.l - 6} y={PAD.t + t.y + 4} textAnchor="end"
                fill="#475569" fontSize="10" fontFamily="system-ui,sans-serif">{t.label}</text>
            )}
          </g>
        ))}

        {/* Baseline */}
        <line x1={PAD.l} y1={PAD.t + cH} x2={PAD.l + cW} y2={PAD.t + cH}
          stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

        {/* Bars */}
        {buckets.map((b, i) => {
          const cx = PAD.l + i * slotW + slotW / 2;
          const isHov = tooltip?.i === i;
          return (
            <g key={b.key}
              style={{ cursor: 'default' }}
              onMouseEnter={() => setTooltip({ i, label: b.fullDate || b.label, revenue: b.revenue, expense: b.expense })}
              onMouseLeave={() => setTooltip(null)}>
              {/* Hover hit area */}
              <rect x={cx - slotW / 2} y={PAD.t} width={slotW} height={cH}
                fill="transparent" />
              {/* Revenue bar */}
              <rect x={cx - barW - gap / 2} y={PAD.t + yScale(b.revenue)}
                width={barW} height={Math.max(b.revenue > 0 ? 2 : 0, barH(b.revenue))}
                fill="#4ade80" opacity={isHov ? 1 : 0.7} rx="2" />
              {/* Expense bar */}
              <rect x={cx + gap / 2} y={PAD.t + yScale(b.expense)}
                width={barW} height={Math.max(b.expense > 0 ? 2 : 0, barH(b.expense))}
                fill="#f87171" opacity={isHov ? 1 : 0.7} rx="2" />
              {/* X label */}
              {!skipX(i) && (
                <text x={cx} y={H - 4} textAnchor="middle"
                  fill={isHov ? '#94a3b8' : '#475569'} fontSize="9" fontFamily="system-ui,sans-serif">
                  {b.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex items-center justify-center gap-5 mt-1">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-green-400 opacity-70" />
          <span className="text-slate-500 text-xs">Revenue</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-red-400 opacity-70" />
          <span className="text-slate-500 text-xs">Expenses</span>
        </div>
      </div>
    </div>
  );
}

// ── Method Breakdown Bars ─────────────────────────────────────────
function MethodChart({ byMethod, total }) {
  const methods = ['cash', 'gcash', 'bank', 'other'];
  if (total === 0) {
    return <p className="text-slate-700 text-sm text-center py-4">No income recorded yet</p>;
  }
  return (
    <div className="space-y-3.5">
      {methods.map(m => {
        const amt = byMethod[m] || 0;
        const pct = total > 0 ? (amt / total) * 100 : 0;
        const cfg = METHOD_CFG[m];
        return (
          <div key={m}>
            <div className="flex items-center justify-between mb-1.5">
              <div className={`flex items-center gap-1.5 text-xs font-semibold ${cfg.color}`}>
                {cfg.icon} {cfg.label}
              </div>
              <div className="flex items-center gap-3 tabular-nums">
                <span className="text-slate-500 text-xs">{pct.toFixed(1)}%</span>
                <span className={`font-bold text-xs ${amt > 0 ? cfg.color : 'text-slate-700'}`}>₱{fmt(amt)}</span>
              </div>
            </div>
            <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, backgroundColor: cfg.hex }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Record Income Modal ───────────────────────────────────────────
function RecordIncomeModal({ onSave, onClose }) {
  const [form, setForm] = useState({ description: '', amount: '', paymentMethod: 'cash', referenceNumber: '', transactionType: 'walkin' });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const needsRef = form.paymentMethod === 'gcash' || form.paymentMethod === 'bank';

  const handleSave = async () => {
    if (!form.amount || Number(form.amount) <= 0) { toast.error('Enter a valid amount.'); return; }
    setSaving(true);
    try {
      await onSave({
        memberName: form.description || 'Walk-in',
        amount: Number(form.amount),
        paymentMethod: form.paymentMethod,
        referenceNumber: form.referenceNumber.trim() || null,
        notes: form.description,
        transactionType: form.transactionType,
        balanceRemaining: 0,
      });
      toast.success('Income recorded!');
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to record.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-sm border border-slate-700 shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-green-500/20 rounded-xl flex items-center justify-center">
              <Plus size={16} className="text-green-400" />
            </div>
            <h3 className="text-white font-bold text-sm">Record Income</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Type</p>
            <div className="grid grid-cols-2 gap-2">
              {[{ v: 'walkin', label: 'Walk-in Fee' }, { v: 'manual', label: 'Other Income' }].map(({ v, label }) => (
                <button key={v} onClick={() => set('transactionType', v)}
                  className={`py-2.5 rounded-xl border text-sm font-semibold transition-all ${form.transactionType === v ? 'border-green-500 bg-green-500/10 text-green-400' : 'border-slate-600 bg-slate-700/40 text-slate-400 hover:border-slate-500'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Description</p>
            <input type="text" value={form.description} onChange={(e) => set('description', e.target.value)}
              placeholder={form.transactionType === 'walkin' ? 'e.g. Walk-in — Juan dela Cruz' : 'e.g. Locker rental'}
              className="w-full bg-slate-700/60 border border-slate-600 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-slate-500" />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Amount (₱)</p>
            <input type="number" min="1" value={form.amount} onChange={(e) => set('amount', e.target.value)}
              placeholder="0.00"
              className="w-full bg-slate-700/60 border border-slate-600 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-slate-500" />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Payment Method</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(METHOD_CFG).map(([key, cfg]) => (
                <button key={key} onClick={() => set('paymentMethod', key)}
                  className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-sm font-semibold transition-all ${form.paymentMethod === key ? `border-[${cfg.hex}] text-white` : 'border-slate-600 bg-slate-700/40 text-slate-400 hover:border-slate-500'}`}
                  style={form.paymentMethod === key ? { borderColor: cfg.hex, backgroundColor: `${cfg.hex}18`, color: cfg.hex } : {}}>
                  {cfg.icon} {cfg.label}
                </button>
              ))}
            </div>
          </div>
          {needsRef && (
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Reference Number <span className="text-slate-600 normal-case">(optional)</span></p>
              <input type="text" value={form.referenceNumber} onChange={(e) => set('referenceNumber', e.target.value)}
                placeholder="e.g. 091234567890"
                className="w-full bg-slate-700/60 border border-slate-600 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-medium text-sm transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white py-3 rounded-xl font-bold text-sm transition-colors">
              {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Plus size={15} /> Save</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Add Expense Modal ─────────────────────────────────────────────
function AddExpenseModal({ onSave, onClose }) {
  const [form, setForm] = useState({ description: '', amount: '', category: 'rent', paymentMethod: 'cash' });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.amount || Number(form.amount) <= 0) { toast.error('Enter a valid amount.'); return; }
    setSaving(true);
    try {
      await onSave({ amount: Number(form.amount), category: form.category, description: form.description, paymentMethod: form.paymentMethod });
      toast.success('Expense recorded!');
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to record.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-sm border border-slate-700 shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-500/20 rounded-xl flex items-center justify-center">
              <TrendingDown size={16} className="text-red-400" />
            </div>
            <h3 className="text-white font-bold text-sm">Add Expense</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Category</p>
            <div className="grid grid-cols-3 gap-2">
              {EXPENSE_CATEGORIES.map((cat) => (
                <button key={cat} onClick={() => set('category', cat)}
                  className={`py-2 rounded-xl border text-xs font-semibold capitalize transition-all ${form.category === cat ? 'border-red-500 bg-red-500/10 text-red-400' : 'border-slate-600 bg-slate-700/40 text-slate-400 hover:border-slate-500'}`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Description</p>
            <input type="text" value={form.description} onChange={(e) => set('description', e.target.value)}
              placeholder="e.g. Meralco bill July"
              className="w-full bg-slate-700/60 border border-slate-600 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-slate-500" />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Amount (₱)</p>
            <input type="number" min="1" value={form.amount} onChange={(e) => set('amount', e.target.value)}
              placeholder="0.00"
              className="w-full bg-slate-700/60 border border-slate-600 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-slate-500" />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Paid via</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(METHOD_CFG).map(([key, cfg]) => (
                <button key={key} onClick={() => set('paymentMethod', key)}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-semibold transition-all ${form.paymentMethod === key ? 'border-red-500 bg-red-500/10 text-red-400' : 'border-slate-600 bg-slate-700/40 text-slate-400 hover:border-slate-500'}`}>
                  {cfg.icon} {cfg.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-medium text-sm transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white py-3 rounded-xl font-bold text-sm transition-colors">
              {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Plus size={15} /> Save</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Revenue Page ─────────────────────────────────────────────
export default function Revenue() {
  const { payments, recordPayment, expenses, addExpense, deleteExpense } = useGym();
  const [period, setPeriod]       = useState('month');
  const [tab, setTab]             = useState('income');
  const [methodFilter, setMethod] = useState('all');
  const [search, setSearch]       = useState('');
  const [showIncome, setShowIncome]   = useState(false);
  const [showExpense, setShowExpense] = useState(false);

  const PERIOD_LABELS = { week: 'This Week', month: 'This Month', year: 'This Year', all: 'All Time' };

  // Period-only (for charts — unaffected by search/method filters)
  const periodPayments = useMemo(() => {
    const start = startOf(period);
    return payments.filter(p => !start || new Date(p.created_at) >= start);
  }, [payments, period]);

  const periodExpenses = useMemo(() => {
    const start = startOf(period);
    return expenses.filter(e => !start || new Date(e.created_at) >= start);
  }, [expenses, period]);

  // Filtered (for transaction list)
  const filteredPayments = useMemo(() => {
    const start = startOf(period);
    return payments.filter((p) => {
      if (start && new Date(p.created_at) < start) return false;
      if (methodFilter !== 'all' && p.payment_method !== methodFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!(p.member_name?.toLowerCase().includes(q) || p.reference_number?.toLowerCase().includes(q) || p.plan?.toLowerCase().includes(q) || p.notes?.toLowerCase().includes(q))) return false;
      }
      return true;
    });
  }, [payments, period, methodFilter, search]);

  const filteredExpenses = useMemo(() => {
    const start = startOf(period);
    return expenses.filter((e) => {
      if (start && new Date(e.created_at) < start) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!(e.description?.toLowerCase().includes(q) || e.category?.toLowerCase().includes(q))) return false;
      }
      return true;
    });
  }, [expenses, period, search]);

  const totalRevenue  = useMemo(() => periodPayments.reduce((s, p) => s + Number(p.amount || 0), 0), [periodPayments]);
  const totalExpenses = useMemo(() => periodExpenses.reduce((s, e) => s + Number(e.amount || 0), 0), [periodExpenses]);
  const netProfit = totalRevenue - totalExpenses;

  const byMethod = useMemo(() => {
    const map = {};
    periodPayments.forEach((p) => {
      const m = p.payment_method || 'other';
      map[m] = (map[m] || 0) + Number(p.amount || 0);
    });
    return map;
  }, [periodPayments]);

  const handleDeleteExpense = async (id) => {
    try { await deleteExpense(id); toast.success('Expense removed.'); }
    catch { toast.error('Failed to delete expense.'); }
  };

  const exportCsv = () => {
    const incomeRows = filteredPayments.map((p) => [
      new Date(p.created_at).toLocaleString('en-PH'), 'Income',
      p.transaction_type || 'membership', p.member_name || '',
      p.plan || p.notes || '', p.amount || 0,
      METHOD_CFG[p.payment_method]?.label || p.payment_method || '',
      p.reference_number || '',
      p.balance_remaining > 0 ? `Partial — ₱${p.balance_remaining} remaining` : '',
      p.performed_by || '',
    ]);
    const expenseRows = filteredExpenses.map((e) => [
      new Date(e.created_at).toLocaleString('en-PH'), 'Expense',
      e.category, '', e.description || '', `-${e.amount || 0}`,
      METHOD_CFG[e.payment_method]?.label || e.payment_method || '',
      '', '', e.recorded_by || '',
    ]);
    const headers = ['Date', 'Type', 'Category', 'Member', 'Description', 'Amount', 'Method', 'Reference', 'Notes', 'Processed By'];
    const rows = [headers, ...incomeRows, ...expenseRows];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `cashflow-${period}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const TXTYPE_LABEL = { membership: 'Membership', walkin: 'Walk-in', manual: 'Other Income' };

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar title="Revenue" />

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
              <TrendingUp size={20} className="text-green-400" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">Cash Flow</h1>
              <p className="text-slate-500 text-xs">{PERIOD_LABELS[period]}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowExpense(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-semibold transition-colors border border-red-500/20">
              <TrendingDown size={13} /> Expense
            </button>
            <button onClick={() => setShowIncome(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-xl text-xs font-semibold transition-colors border border-green-500/20">
              <Plus size={13} /> Income
            </button>
            <button onClick={exportCsv}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-xs font-semibold transition-colors">
              <Download size={13} /> CSV
            </button>
          </div>
        </div>

        {/* Period filter */}
        <div className="flex gap-2 flex-wrap">
          {Object.entries(PERIOD_LABELS).map(([key, label]) => (
            <button key={key} onClick={() => setPeriod(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${period === key ? 'bg-green-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
            <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider mb-1">Revenue</p>
            <p className="text-green-400 font-black text-xl tabular-nums">₱{fmt(totalRevenue)}</p>
            <p className="text-slate-600 text-xs mt-1">{periodPayments.length} transaction{periodPayments.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
            <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider mb-1">Expenses</p>
            <p className="text-red-400 font-black text-xl tabular-nums">₱{fmt(totalExpenses)}</p>
            <p className="text-slate-600 text-xs mt-1">{periodExpenses.length} item{periodExpenses.length !== 1 ? 's' : ''}</p>
          </div>
          <div className={`border rounded-2xl p-4 ${netProfit >= 0 ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
            <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider mb-1">Net Profit</p>
            <p className={`font-black text-xl tabular-nums ${netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {netProfit < 0 ? '-' : ''}₱{fmt(Math.abs(netProfit))}
            </p>
            <p className="text-slate-600 text-xs mt-1">{PERIOD_LABELS[period]}</p>
          </div>
        </div>

        {/* ── Charts ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Revenue Trend — wider */}
          <div className="lg:col-span-3 bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5">
            <p className="text-white font-semibold text-sm mb-4">Revenue vs Expenses</p>
            <RevenueChart payments={periodPayments} expenses={periodExpenses} period={period} />
          </div>

          {/* Method breakdown — narrower */}
          <div className="lg:col-span-2 bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5">
            <p className="text-white font-semibold text-sm mb-4">By Payment Method</p>
            <MethodChart byMethod={byMethod} total={totalRevenue} />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-800/60 p-1 rounded-xl">
          <button onClick={() => setTab('income')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === 'income' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white'}`}>
            Income ({filteredPayments.length})
          </button>
          <button onClick={() => setTab('expenses')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === 'expenses' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white'}`}>
            Expenses ({filteredExpenses.length})
          </button>
        </div>

        {/* Search + filter */}
        {tab === 'income' && (
          <div className="flex flex-col sm:flex-row gap-2">
            <input type="text" placeholder="Search by member, plan, reference..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-slate-800/60 border border-slate-700/50 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-slate-500" />
            <div className="flex gap-1.5 flex-wrap">
              {['all', 'cash', 'gcash', 'bank', 'other'].map((m) => (
                <button key={m} onClick={() => setMethod(m)}
                  className={`px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors ${methodFilter === m ? 'bg-slate-600 text-white' : 'bg-slate-800 text-slate-500 hover:text-white'}`}>
                  {m === 'all' ? 'All' : METHOD_CFG[m]?.label || m}
                </button>
              ))}
            </div>
          </div>
        )}
        {tab === 'expenses' && (
          <input type="text" placeholder="Search by description or category..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800/60 border border-slate-700/50 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-slate-500" />
        )}

        {/* Income list */}
        {tab === 'income' && (
          <div className="space-y-2">
            {filteredPayments.length === 0 ? (
              <div className="text-center py-16 text-slate-600">
                <TrendingUp size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No income recorded</p>
                <p className="text-xs mt-1">Payments are logged when you renew a member or record income manually</p>
              </div>
            ) : filteredPayments.map((p) => {
              const m = p.payment_method || 'other';
              const cfg = METHOD_CFG[m] || METHOD_CFG.other;
              const isPartial = Number(p.balance_remaining) > 0;
              const txLabel = TXTYPE_LABEL[p.transaction_type] || p.transaction_type || 'Membership';
              return (
                <div key={p.id} className={`bg-slate-800/60 border rounded-xl px-4 py-3 flex items-center gap-3 ${isPartial ? 'border-yellow-500/30' : 'border-slate-700/50'}`}>
                  <div className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white font-semibold text-sm truncate">{p.member_name || 'Unknown'}</p>
                      <span className="text-slate-500 text-xs bg-slate-700/60 px-1.5 py-0.5 rounded shrink-0">{txLabel}</span>
                      {p.plan && p.plan !== p.member_name && (
                        <span className="text-slate-500 text-xs bg-slate-700/60 px-1.5 py-0.5 rounded shrink-0">{p.plan}</span>
                      )}
                      {isPartial && (
                        <span className="flex items-center gap-1 text-yellow-400 text-xs bg-yellow-500/10 border border-yellow-500/30 px-1.5 py-0.5 rounded shrink-0">
                          <AlertCircle size={10} /> Partial · ₱{Number(p.balance_remaining).toLocaleString()} owed
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className={`flex items-center gap-1 text-xs font-medium ${cfg.color}`}>{cfg.icon} {cfg.label}</span>
                      {p.reference_number && <span className="text-slate-500 text-xs font-mono">Ref: {p.reference_number}</span>}
                      <span className="text-slate-600 text-xs flex items-center gap-1">
                        <Calendar size={10} />
                        {new Date(p.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <p className="text-green-400 font-bold text-sm tabular-nums shrink-0">₱{fmt(p.amount)}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Expense list */}
        {tab === 'expenses' && (
          <div className="space-y-2">
            {filteredExpenses.length === 0 ? (
              <div className="text-center py-16 text-slate-600">
                <TrendingDown size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No expenses recorded</p>
                <p className="text-xs mt-1">Track rent, utilities, salaries, and other costs</p>
              </div>
            ) : filteredExpenses.map((e) => {
              const cfg = METHOD_CFG[e.payment_method] || METHOD_CFG.other;
              return (
                <div key={e.id} className="bg-slate-800/60 border border-red-500/10 rounded-xl px-4 py-3 flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-semibold text-sm truncate">{e.description || e.category}</p>
                      <span className="text-slate-500 text-xs bg-slate-700/60 px-1.5 py-0.5 rounded capitalize shrink-0">{e.category}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className={`flex items-center gap-1 text-xs font-medium ${cfg.color}`}>{cfg.icon} {cfg.label}</span>
                      <span className="text-slate-600 text-xs flex items-center gap-1">
                        <Calendar size={10} />
                        {new Date(e.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <p className="text-red-400 font-bold text-sm tabular-nums">-₱{fmt(e.amount)}</p>
                    <button onClick={() => handleDeleteExpense(e.id)} className="text-slate-600 hover:text-red-400 transition-colors p-1">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showIncome  && <RecordIncomeModal onSave={recordPayment} onClose={() => setShowIncome(false)} />}
      {showExpense && <AddExpenseModal   onSave={addExpense}    onClose={() => setShowExpense(false)} />}
    </div>
  );
}
