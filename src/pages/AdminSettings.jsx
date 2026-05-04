import { useState, useEffect, useRef } from 'react';
import { Save, Upload, X, Settings, Send, Plus, Trash2, Tag, ToggleLeft, ToggleRight, Dumbbell, ChevronRight, ImageIcon, Phone, MapPin, Download, QrCode, Users, ShieldCheck, UserCog, Eye, EyeOff, MessageSquare, Bell } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { Link } from 'react-router-dom';
import { useGym } from '../context/GymContext';
import { supabase } from '../lib/supabase';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';

// ── Login & Security ──────────────────────────────────────────────────────────
function LoginSecurity({ gymId }) {
  const [sec, setSec] = useState({ username: '', email: '', newPassword: '', confirmPassword: '' });
  const [currentEmail, setCurrentEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const setF = (k, v) => setSec((s) => ({ ...s, [k]: v }));

  useEffect(() => {
    if (!gymId) return;
    supabase.auth.getUser().then(({ data: authData }) => {
      const authEmail = authData?.user?.email;
      const userId = authData?.user?.id;
      if (authEmail && userId) {
        setCurrentEmail(authEmail);
        setSec((s) => ({ ...s, email: authEmail }));
        supabase.from('gym_admins').update({ email: authEmail }).eq('gym_id', gymId).eq('user_id', userId).then(() => {});
        supabase.from('gym_admins').select('username').eq('gym_id', gymId).eq('user_id', userId).maybeSingle()
          .then(({ data }) => { if (data?.username) setSec((s) => ({ ...s, username: data.username || '' })); });
      }
    });
  }, [gymId]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (sec.newPassword && sec.newPassword !== sec.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (sec.newPassword && sec.newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setSaving(true);
    try {
      if (gymId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { error } = await supabase.from('gym_admins').update({ username: sec.username.trim().toLowerCase() || null }).eq('gym_id', gymId).eq('user_id', user.id);
          if (error) throw error;
        }
      }
      const newEmail = sec.email.trim().toLowerCase();
      if (newEmail && newEmail !== currentEmail) {
        const redirectTo = `${import.meta.env.VITE_SITE_URL || window.location.origin}/auth/callback`;
        const { error } = await supabase.auth.updateUser({ email: newEmail }, { emailRedirectTo: redirectTo });
        if (error) throw error;
        setEmailSent(true);
      }
      if (sec.newPassword) {
        const { error } = await supabase.auth.updateUser({ password: sec.newPassword });
        if (error) throw error;
      }
      toast.success('Login details updated');
      setSec((s) => ({ ...s, newPassword: '', confirmPassword: '' }));
    } catch (err) {
      toast.error(err.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-slate-800/60 rounded-2xl border border-slate-700/50 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
          <Settings size={15} className="text-blue-400" />
        </div>
        <div>
          <h3 className="text-white font-semibold text-sm">Login &amp; Security</h3>
          <p className="text-slate-500 text-xs">Update your username, email and password</p>
        </div>
      </div>
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-slate-300 text-xs font-medium mb-1.5">Username <span className="text-slate-500 font-normal">(optional)</span></label>
          <input type="text" value={sec.username} onChange={(e) => setF('username', e.target.value.replace(/\s/g, '').toLowerCase())} placeholder="e.g. powerfitness"
            className="w-full bg-slate-700 border border-slate-600 focus:border-blue-500 text-white rounded-xl px-4 py-2.5 outline-none text-sm transition-colors placeholder:text-slate-500" />
          <p className="text-slate-500 text-xs mt-1">Lowercase letters and numbers only. Can be used instead of email to log in.</p>
        </div>
        <div className="border-t border-slate-700/50 pt-4">
          <label className="block text-slate-300 text-xs font-medium mb-1.5">Email Address</label>
          <input type="email" value={sec.email} onChange={(e) => { setF('email', e.target.value); setEmailSent(false); }}
            className="w-full bg-slate-700 border border-slate-600 focus:border-blue-500 text-white rounded-xl px-4 py-2.5 outline-none text-sm transition-colors" />
          {emailSent && (
            <div className="mt-2 flex items-start gap-2 bg-blue-500/10 border border-blue-500/20 rounded-xl px-3 py-2.5">
              <Send size={13} className="text-blue-400 shrink-0 mt-0.5" />
              <p className="text-blue-300 text-xs">Confirmation sent to <strong>{sec.email}</strong>. Click the link to complete the change.</p>
            </div>
          )}
        </div>
        <div className="border-t border-slate-700/50 pt-4 space-y-3">
          <p className="text-slate-400 text-xs font-medium">Change Password</p>
          <input type="password" value={sec.newPassword} onChange={(e) => setF('newPassword', e.target.value)} placeholder="New password (min. 8 characters)" autoComplete="new-password"
            className="w-full bg-slate-700 border border-slate-600 focus:border-blue-500 text-white rounded-xl px-4 py-2.5 outline-none text-sm transition-colors placeholder:text-slate-500" />
          <input type="password" value={sec.confirmPassword} onChange={(e) => setF('confirmPassword', e.target.value)} placeholder="Confirm new password" autoComplete="new-password"
            className={`w-full bg-slate-700 border text-white rounded-xl px-4 py-2.5 outline-none text-sm transition-colors placeholder:text-slate-500 ${sec.confirmPassword && sec.newPassword !== sec.confirmPassword ? 'border-red-500' : 'border-slate-600 focus:border-blue-500'}`} />
          {sec.confirmPassword && sec.newPassword !== sec.confirmPassword && <p className="text-red-400 text-xs">Passwords do not match</p>}
        </div>
        <button type="submit" disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition-colors text-sm">
          {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={14} /> Save Login Details</>}
        </button>
      </form>
    </div>
  );
}

// ── Staff Management ──────────────────────────────────────────────────────────
const PRICE_FIELDS = [
  { key: 'priceMonthly',    label: '1 Month' },
  { key: 'priceQuarterly',  label: '3 Months' },
  { key: 'priceSemiAnnual', label: '6 Months' },
  { key: 'priceAnnual',     label: '1 Year' },
];

function StaffManagement({ gymId }) {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', username: '', email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadStaff = async () => {
    if (!gymId) return;
    setLoading(true);
    const { data } = await supabase.from('gym_admins').select('id, username, email, role, user_id').eq('gym_id', gymId).order('role');
    setStaffList(data || []);
    setLoading(false);
  };

  useEffect(() => { loadStaff(); }, [gymId]); // eslint-disable-line

  const handleChangeRole = async (adminId, newRole) => {
    await supabase.from('gym_admins').update({ role: newRole }).eq('id', adminId);
    setStaffList((prev) => prev.map((s) => s.id === adminId ? { ...s, role: newRole } : s));
    toast.success(`Role updated to ${newRole}.`);
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (!newStaff.email || !newStaff.password) return toast.error('Email and password are required.');
    if (newStaff.password.length < 8) return toast.error('Password must be at least 8 characters.');
    setSaving(true);
    try {
      const { data: { session: adminSession } } = await supabase.auth.getSession();
      if (!adminSession) throw new Error('Admin session lost. Please log in again.');
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({ email: newStaff.email.trim().toLowerCase(), password: newStaff.password });
      if (signUpErr) throw signUpErr;
      if (!signUpData.user) throw new Error('Account creation failed.');
      await supabase.auth.setSession({ access_token: adminSession.access_token, refresh_token: adminSession.refresh_token });
      const { error: gaErr } = await supabase.from('gym_admins').insert([{ gym_id: gymId, user_id: signUpData.user.id, email: newStaff.email.trim().toLowerCase(), username: newStaff.username.trim().toLowerCase() || null, role: 'staff' }]);
      if (gaErr) throw gaErr;
      toast.success('Staff account created!');
      setNewStaff({ name: '', username: '', email: '', password: '' });
      setShowAdd(false);
      await loadStaff();
    } catch (err) {
      toast.error(err.message || 'Failed to create staff account.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-slate-800/60 rounded-2xl border border-slate-700/50 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
            <Users size={15} className="text-purple-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">Staff Accounts</h3>
            <p className="text-slate-500 text-xs">Add and manage staff logins</p>
          </div>
        </div>
        <button onClick={() => setShowAdd((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white transition-all"
          style={{ background: 'linear-gradient(135deg,#7c3aed,#a78bfa)' }}>
          <Plus size={13} /> Add Staff
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAddStaff} className="mb-4 rounded-2xl border border-purple-500/20 p-4 space-y-3" style={{ background: 'rgba(124,58,237,0.05)' }}>
          <p className="text-purple-300 text-xs font-semibold uppercase tracking-wider">New Staff Account</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 text-xs mb-1">Username (optional)</label>
              <input type="text" value={newStaff.username} onChange={(e) => setNewStaff((s) => ({ ...s, username: e.target.value.replace(/[^a-z0-9_]/g, '').toLowerCase() }))} placeholder="staffusername"
                className="w-full bg-slate-800 border border-slate-700 focus:border-purple-500 text-white rounded-xl px-3 py-2.5 outline-none text-sm placeholder:text-slate-600" />
            </div>
            <div>
              <label className="block text-slate-400 text-xs mb-1">Email</label>
              <input type="email" value={newStaff.email} onChange={(e) => setNewStaff((s) => ({ ...s, email: e.target.value }))} placeholder="staff@yourgym.com" required
                className="w-full bg-slate-800 border border-slate-700 focus:border-purple-500 text-white rounded-xl px-3 py-2.5 outline-none text-sm placeholder:text-slate-600" />
            </div>
          </div>
          <div className="relative">
            <label className="block text-slate-400 text-xs mb-1">Password</label>
            <input type={showPw ? 'text' : 'password'} value={newStaff.password} onChange={(e) => setNewStaff((s) => ({ ...s, password: e.target.value }))} placeholder="Min. 8 characters" required
              className="w-full bg-slate-800 border border-slate-700 focus:border-purple-500 text-white rounded-xl px-3 py-2.5 pr-10 outline-none text-sm placeholder:text-slate-600" />
            <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 bottom-2.5 text-slate-500 hover:text-slate-300">
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50" style={{ background: 'linear-gradient(135deg,#7c3aed,#a78bfa)' }}>
              {saving ? 'Creating…' : 'Create Staff Account'}
            </button>
            <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2.5 rounded-xl text-sm text-slate-400 border border-slate-700 hover:text-white">Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-slate-500 text-sm">Loading...</p>
      ) : staffList.length === 0 ? (
        <p className="text-slate-500 text-sm">No accounts yet.</p>
      ) : (
        <div className="space-y-2">
          {staffList.map((s) => (
            <div key={s.id} className="flex items-center gap-3 bg-slate-800 rounded-xl px-4 py-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${s.role === 'admin' ? 'bg-orange-500/15' : 'bg-purple-500/15'}`}>
                {s.role === 'admin' ? <ShieldCheck size={15} className="text-orange-400" /> : <UserCog size={15} className="text-purple-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium">{s.username ? `@${s.username}` : s.email}</p>
                {s.username && <p className="text-slate-500 text-xs truncate">{s.email}</p>}
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-lg ${s.role === 'admin' ? 'bg-orange-500/15 text-orange-400' : 'bg-purple-500/15 text-purple-400'}`}>{s.role}</span>
              {s.role !== 'admin' && (
                <button onClick={() => handleChangeRole(s.id, 'admin')} className="text-xs text-slate-400 hover:text-white border border-slate-600 hover:border-slate-400 px-2.5 py-1 rounded-lg transition-colors">→ admin</button>
              )}
              {s.role === 'admin' && staffList.filter(x => x.role === 'admin').length > 1 && (
                <button onClick={() => handleChangeRole(s.id, 'staff')} className="text-xs text-slate-400 hover:text-white border border-slate-600 hover:border-slate-400 px-2.5 py-1 rounded-lg transition-colors">→ staff</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Test Auto SMS ─────────────────────────────────────────────────────────────
const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;

function TestAutoSMS({ gymId }) {
  const [running, setRunning] = useState(false);
  const handleTest = async () => {
    setRunning(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || SUPABASE_ANON;
      const res = await fetch(`${SUPABASE_URL}/functions/v1/check-expiring`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON, 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Function error');
      toast.success(`Auto SMS check done — ${data.sent} message${data.sent !== 1 ? 's' : ''} sent`);
    } catch (err) {
      toast.error(err.message || 'Failed to run check');
    } finally {
      setRunning(false);
    }
  };
  return (
    <button type="button" onClick={handleTest} disabled={running}
      className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-medium py-2.5 rounded-xl transition-colors disabled:opacity-50">
      {running
        ? <><span className="w-4 h-4 border-2 border-slate-400/30 border-t-slate-300 rounded-full animate-spin" /> Running check...</>
        : <><MessageSquare size={14} /> Test Auto SMS Now</>}
    </button>
  );
}

// ── Tabs config ───────────────────────────────────────────────────────────────
const TABS = [
  { id: 'general',       label: 'General',  icon: Settings },
  { id: 'pricing',       label: 'Pricing',  icon: Tag },
  { id: 'notifications', label: 'Alerts',   icon: Bell },
  { id: 'account',       label: 'Account',  icon: ShieldCheck },
];

// ── Main Component ────────────────────────────────────────────────────────────
export default function AdminSettings() {
  const { settings, saveSettings, instructors, gymSlug, gymId } = useGym();
  const [activeTab, setActiveTab] = useState('general');
  const [form, setForm] = useState({
    gymName: '', gymLogoUrl: null, gymLogoFile: null, gymLogoPreview: null,
    gymAddress: '', gymContactNumber: '',
    gcashNumber: '', gcashName: '', coachingPlans: [], gcashQrUrl: null, gcashQrFile: null, gcashQrPreview: null,
    priceMonthly: '', priceQuarterly: '', priceSemiAnnual: '', priceAnnual: '', priceStudent: '',
    telegramChatId: '', telegramBotToken: '', siteUrl: '',
    promos: [], semaphoreApiKey: '', semaphoreSenderName: '',
  });
  const [saving, setSaving] = useState(false);
  const [newPromo, setNewPromo] = useState({ name: '', price: '', duration_days: '' });
  const [addingPromo, setAddingPromo] = useState(false);
  const [newCoachPlan, setNewCoachPlan] = useState({ name: '', price: '', duration_days: '' });
  const [addingCoachPlan, setAddingCoachPlan] = useState(false);
  const fileRef = useRef();
  const logoRef = useRef();

  useEffect(() => {
    setForm((f) => ({
      ...f,
      gymName:          settings.gymName          || '',
      gymLogoUrl:       settings.gymLogoUrl        || null,
      gymAddress:       settings.gymAddress        || '',
      gymContactNumber: settings.gymContactNumber  || '',
      gcashNumber:      settings.gcashNumber,
      gcashName:        settings.gcashName,
      coachingPlans:    settings.coachingPlans     || [],
      gcashQrUrl:       settings.gcashQrUrl,
      priceMonthly:     settings.priceMonthly      || '',
      priceQuarterly:   settings.priceQuarterly    || '',
      priceSemiAnnual:  settings.priceSemiAnnual   || '',
      priceAnnual:      settings.priceAnnual       || '',
      priceStudent:     settings.priceStudent      || '',
      priceCoaching:    settings.priceCoaching     || '',
      telegramChatId:   settings.telegramChatId    || '',
      telegramBotToken: settings.telegramBotToken  || '',
      siteUrl:          settings.siteUrl           || '',
      promos:           settings.promos            || [],
      semaphoreApiKey:     settings.semaphoreApiKey     || '',
      semaphoreSenderName: settings.semaphoreSenderName || '',
    }));
  }, [settings]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const addPromo = () => {
    const name = newPromo.name.trim();
    const price = Number(newPromo.price);
    const duration_days = Number(newPromo.duration_days);
    if (!name || !price || !duration_days) return;
    setForm((f) => ({ ...f, promos: [...f.promos, { id: crypto.randomUUID(), name, price, duration_days, active: true }] }));
    setNewPromo({ name: '', price: '', duration_days: '' });
    setAddingPromo(false);
  };

  const handleQrFile  = (file) => { if (!file) return; set('gcashQrFile', file); set('gcashQrPreview', URL.createObjectURL(file)); };
  const removeQr      = () => { set('gcashQrFile', null); set('gcashQrPreview', null); set('gcashQrUrl', null); };
  const handleLogoFile = (file) => { if (!file) return; set('gymLogoFile', file); set('gymLogoPreview', URL.createObjectURL(file)); };
  const removeLogo    = () => { set('gymLogoFile', null); set('gymLogoPreview', null); set('gymLogoUrl', null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveSettings(form);
      toast.success('Settings saved!');
    } catch (err) {
      toast.error('Failed to save: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const qrDisplay   = form.gcashQrPreview  || form.gcashQrUrl;
  const logoDisplay = form.gymLogoPreview  || form.gymLogoUrl;

  // ── QR download ─────────────────────────────────────────────────────────────
  const downloadQR = async () => {
    const qrCanvas = document.getElementById('gym-qr-canvas');
    if (!qrCanvas) return;
    const portalUrl = `${window.location.origin}/${gymSlug}/member`;
    const gymName   = settings.gymName || 'Your Gym';
    const logoUrl   = settings.gymLogoUrl || null;
    const SCALE = 3, W = 480, H = 760;
    const c = document.createElement('canvas');
    c.width = W * SCALE; c.height = H * SCALE;
    const ctx = c.getContext('2d');
    ctx.scale(SCALE, SCALE);
    const CX = W / 2;
    const rr = (x, y, w, h, r) => {
      ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
    };
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);
    const topH = 300, topGrad = ctx.createLinearGradient(0, 0, W, topH);
    topGrad.addColorStop(0, '#14532d'); topGrad.addColorStop(1, '#16a34a');
    ctx.fillStyle = topGrad; ctx.fillRect(0, 0, W, topH);
    ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.beginPath(); ctx.arc(W - 40, 20, 160, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.04)'; ctx.beginPath(); ctx.arc(W - 40, 20, 220, 0, Math.PI * 2); ctx.fill();
    let logoImg = null;
    if (logoUrl) { const img = new Image(); img.crossOrigin = 'anonymous'; await new Promise((res) => { img.onload = res; img.onerror = res; img.src = logoUrl; }); logoImg = img; }
    const logoSize = 52;
    if (logoImg) { ctx.save(); rr(36, 32, logoSize, logoSize, 12); ctx.clip(); ctx.drawImage(logoImg, 36, 32, logoSize, logoSize); ctx.restore(); }
    ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.font = `bold 14px -apple-system, sans-serif`; ctx.fillText(gymName, logoImg ? 100 : 36, 52);
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = `11px -apple-system, sans-serif`; ctx.fillText('Member Portal', logoImg ? 100 : 36, 70);
    ctx.textAlign = 'center'; ctx.fillStyle = '#ffffff'; ctx.font = `bold 42px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    ctx.fillText("WE'RE", CX, 150); ctx.fillText('NOW ONLINE', CX, 198);
    ctx.fillStyle = 'rgba(255,255,255,0.65)'; ctx.font = `14px -apple-system, sans-serif`; ctx.fillText('Check status · Renew · Check-in — all on your phone.', CX, 232);
    const qrSize = 210, qrPad = 20, qrCardW = qrSize + qrPad * 2, qrCardX = CX - qrCardW / 2, qrCardY = topH - 30;
    ctx.fillStyle = '#ffffff'; ctx.shadowColor = 'rgba(0,0,0,0.12)'; ctx.shadowBlur = 28; ctx.shadowOffsetY = 6; rr(qrCardX, qrCardY, qrCardW, qrCardW, 24); ctx.fill(); ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    ctx.strokeStyle = '#16a34a'; ctx.lineWidth = 2.5; rr(qrCardX, qrCardY, qrCardW, qrCardW, 24); ctx.stroke();
    ctx.drawImage(qrCanvas, qrCardX + qrPad, qrCardY + qrPad, qrSize, qrSize);
    const scanY = qrCardY + qrCardW + 28;
    ctx.textAlign = 'center'; ctx.fillStyle = '#16a34a'; ctx.font = `bold 16px -apple-system, sans-serif`; ctx.fillText('↑  SCAN ME  ↑', CX, scanY);
    ctx.fillStyle = '#6b7280'; ctx.font = `12px -apple-system, sans-serif`; ctx.fillText('Point your phone camera at the QR code', CX, scanY + 22);
    ctx.fillStyle = '#d1d5db'; ctx.font = `9.5px "Courier New", monospace`; ctx.fillText(portalUrl, CX, scanY + 42);
    const features = ['✓ Check Status', '✓ Renew Online', '✓ Gym Check-In'];
    const pillRowY = scanY + 68, colW = (W - 80) / 3;
    features.forEach((f, i) => { const px = 40 + colW * i; ctx.fillStyle = '#f0fdf4'; rr(px, pillRowY, colW - 8, 30, 15); ctx.fill(); ctx.fillStyle = '#16a34a'; ctx.font = `bold 10px -apple-system, sans-serif`; ctx.textAlign = 'center'; ctx.fillText(f, px + (colW - 8) / 2, pillRowY + 19); });
    ctx.fillStyle = '#16a34a'; ctx.fillRect(0, H - 36, W, 36);
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = `10px -apple-system, sans-serif`; ctx.textAlign = 'center'; ctx.fillText('Powered by MadeForGyms', CX, H - 15);
    const link = document.createElement('a'); link.download = `${gymSlug}-promo-qr.png`; link.href = c.toDataURL('image/png'); link.click();
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 sm:pb-10">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center">
            <Settings size={20} className="text-orange-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Settings</h1>
            <p className="text-slate-400 text-sm">Manage your gym configuration</p>
          </div>
        </div>

        {/* Tab Nav */}
        <div className="flex gap-1 bg-slate-800 rounded-2xl p-1 mb-6">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 rounded-xl transition-all ${
                activeTab === id ? 'bg-orange-500 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon size={16} />
              <span className="text-[10px] font-semibold leading-none">{label}</span>
            </button>
          ))}
        </div>

        {/* ── GENERAL TAB ──────────────────────────────────────────────────── */}
        {activeTab === 'general' && (
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Gym Identity */}
            <div className="bg-slate-800 rounded-2xl border border-slate-700/50 p-5 space-y-4">
              <h2 className="text-white font-semibold text-sm">Gym Identity</h2>

              <div>
                <label className="block text-slate-300 text-xs font-medium mb-1.5">Gym Logo</label>
                <div className="flex items-start gap-4">
                  {logoDisplay && (
                    <div className="relative shrink-0">
                      <img src={logoDisplay} alt="Gym Logo" className="w-20 h-20 object-contain bg-slate-700 rounded-xl p-1.5" />
                      <button type="button" onClick={removeLogo} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors">
                        <X size={12} className="text-white" />
                      </button>
                    </div>
                  )}
                  <div onClick={() => logoRef.current?.click()} className="flex-1 border-2 border-dashed border-slate-600 hover:border-orange-500 rounded-xl p-4 text-center cursor-pointer transition-colors group">
                    <ImageIcon size={18} className="mx-auto text-slate-500 group-hover:text-orange-400 mb-1.5 transition-colors" />
                    <p className="text-slate-400 text-sm">{logoDisplay ? 'Click to replace logo' : 'Upload gym logo'}</p>
                    <p className="text-slate-600 text-xs mt-0.5">PNG, JPG</p>
                    <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoFile(e.target.files[0])} />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-medium mb-1.5">Gym Name</label>
                <input type="text" value={form.gymName} onChange={(e) => set('gymName', e.target.value)} placeholder="e.g. Power Fitness Gym"
                  className="w-full bg-slate-700 border border-slate-600 focus:border-orange-500 text-white rounded-xl px-4 py-2.5 outline-none transition-colors placeholder:text-slate-500 text-sm" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 text-xs font-medium mb-1.5 flex items-center gap-1"><MapPin size={11} className="text-slate-400" /> Address</label>
                  <input type="text" value={form.gymAddress} onChange={(e) => set('gymAddress', e.target.value)} placeholder="123 Fitness St., Makati City"
                    className="w-full bg-slate-700 border border-slate-600 focus:border-orange-500 text-white rounded-xl px-4 py-2.5 outline-none transition-colors placeholder:text-slate-500 text-sm" />
                </div>
                <div>
                  <label className="block text-slate-300 text-xs font-medium mb-1.5 flex items-center gap-1"><Phone size={11} className="text-slate-400" /> Contact Number</label>
                  <input type="text" value={form.gymContactNumber} onChange={(e) => set('gymContactNumber', e.target.value)} placeholder="09XX XXX XXXX"
                    className="w-full bg-slate-700 border border-slate-600 focus:border-orange-500 text-white rounded-xl px-4 py-2.5 outline-none transition-colors placeholder:text-slate-500 text-sm" />
                </div>
              </div>
            </div>

            {/* GCash */}
            <div className="bg-slate-800 rounded-2xl border border-slate-700/50 p-5 space-y-4">
              <h2 className="text-white font-semibold text-sm">GCash Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 text-xs font-medium mb-1.5">GCash Number</label>
                  <input type="text" value={form.gcashNumber} onChange={(e) => set('gcashNumber', e.target.value)} placeholder="09XX XXX XXXX"
                    className="w-full bg-slate-700 border border-slate-600 focus:border-green-500 text-white rounded-xl px-4 py-2.5 outline-none transition-colors placeholder:text-slate-500 text-sm" />
                </div>
                <div>
                  <label className="block text-slate-300 text-xs font-medium mb-1.5">Account Name</label>
                  <input type="text" value={form.gcashName} onChange={(e) => set('gcashName', e.target.value)} placeholder="Full name on GCash"
                    className="w-full bg-slate-700 border border-slate-600 focus:border-green-500 text-white rounded-xl px-4 py-2.5 outline-none transition-colors placeholder:text-slate-500 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-slate-300 text-xs font-medium mb-1.5">GCash QR Code</label>
                <div className="flex items-start gap-4">
                  {qrDisplay && (
                    <div className="relative shrink-0">
                      <img src={qrDisplay} alt="GCash QR" className="w-24 h-24 object-contain bg-white rounded-xl p-1.5" />
                      <button type="button" onClick={removeQr} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors">
                        <X size={12} className="text-white" />
                      </button>
                    </div>
                  )}
                  <div onClick={() => fileRef.current?.click()} className="flex-1 border-2 border-dashed border-slate-600 hover:border-green-500 rounded-xl p-4 text-center cursor-pointer transition-colors group">
                    <Upload size={18} className="mx-auto text-slate-500 group-hover:text-green-400 mb-1.5 transition-colors" />
                    <p className="text-slate-400 text-sm">{qrDisplay ? 'Click to replace QR' : 'Upload GCash QR code'}</p>
                    <p className="text-slate-600 text-xs mt-0.5">PNG, JPG supported</p>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleQrFile(e.target.files[0])} />
                  </div>
                </div>
              </div>
            </div>

            {/* Portal QR */}
            {gymSlug && (() => {
              const memberUrl = `${window.location.origin}/${gymSlug}/member`;
              return (
                <div className="bg-slate-800 rounded-2xl border border-slate-700/50 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <QrCode size={16} className="text-orange-400" />
                    <h2 className="text-white font-semibold text-sm">Member Portal QR</h2>
                  </div>
                  <div className="hidden"><QRCodeCanvas id="gym-qr-canvas" value={memberUrl} size={200} bgColor="#f1f5f9" fgColor="#0f172a" level="H" marginSize={0} /></div>
                  <div className="flex flex-col sm:flex-row items-center gap-5">
                    <div className="bg-white p-3 rounded-2xl shrink-0">
                      <QRCodeCanvas value={memberUrl} size={140} bgColor="#ffffff" fgColor="#000000" level="H" marginSize={0} />
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <p className="text-white font-semibold mb-1">{settings.gymName || 'Your Gym'}</p>
                      <p className="text-slate-400 text-sm mb-1">Members scan this to check their membership.</p>
                      <p className="text-slate-500 text-xs font-mono mb-4">{memberUrl}</p>
                      <button type="button" onClick={downloadQR} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5" style={{ background: 'linear-gradient(135deg, #ea580c, #f97316)' }}>
                        <Download size={14} /> Download QR Poster
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Instructors link */}
            <Link to={`/${gymSlug}/admin/instructors`} className="flex items-center gap-4 bg-slate-800 rounded-2xl border border-yellow-500/20 hover:border-yellow-500/40 p-4 transition-colors group">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center shrink-0">
                <Dumbbell size={18} className="text-yellow-400" />
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold text-sm">Gym Instructors</p>
                <p className="text-slate-400 text-xs">{instructors.length === 0 ? 'No coaches yet — add your first' : `${instructors.length} coach${instructors.length !== 1 ? 'es' : ''} registered`}</p>
              </div>
              <ChevronRight size={16} className="text-slate-500 group-hover:text-slate-300 transition-colors" />
            </Link>

            <SaveButton saving={saving} />
          </form>
        )}

        {/* ── PRICING TAB ──────────────────────────────────────────────────── */}
        {activeTab === 'pricing' && (
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Standard Plans */}
            <div className="bg-slate-800 rounded-2xl border border-slate-700/50 p-5 space-y-4">
              <div>
                <h2 className="text-white font-semibold text-sm">Standard Plans</h2>
                <p className="text-slate-500 text-xs mt-0.5">Set membership prices per duration</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {PRICE_FIELDS.map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-slate-300 text-xs font-medium mb-1.5">{label}</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">₱</span>
                      <input type="number" min="0" value={form[key]} onChange={(e) => set(key, e.target.value)} placeholder="0"
                        className="w-full bg-slate-700 border border-slate-600 focus:border-orange-500 text-white rounded-xl pl-7 pr-4 py-2.5 outline-none transition-colors text-sm" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Student */}
            <div className="bg-slate-800 rounded-2xl border border-slate-700/50 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-sky-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-sky-400 text-xs font-black">S</span>
                </div>
                <div>
                  <h2 className="text-white font-semibold text-sm">Student Membership</h2>
                  <p className="text-slate-500 text-xs">Monthly (30 days) · Valid student ID required</p>
                </div>
              </div>
              <div className="relative max-w-xs">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">₱</span>
                <input type="number" min="0" value={form.priceStudent} onChange={(e) => set('priceStudent', e.target.value)} placeholder="0"
                  className="w-full bg-slate-700 border border-slate-600 focus:border-sky-500 text-white rounded-xl pl-7 pr-4 py-2.5 outline-none transition-colors text-sm" />
              </div>
            </div>

            {/* Coaching Packages */}
            <div className="bg-slate-800 rounded-2xl border border-slate-700/50 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Dumbbell size={15} className="text-yellow-400" />
                  <div>
                    <h2 className="text-white font-semibold text-sm">Coaching Packages</h2>
                    <p className="text-slate-500 text-xs">Custom packages members can subscribe to</p>
                  </div>
                </div>
                {!addingCoachPlan && (
                  <button type="button" onClick={() => setAddingCoachPlan(true)} className="flex items-center gap-1 text-xs font-semibold text-yellow-400 hover:text-yellow-300 transition-colors">
                    <Plus size={12} /> Add
                  </button>
                )}
              </div>
              {form.coachingPlans.map((plan) => (
                <div key={plan.id} className="flex items-center gap-3 bg-slate-700/40 rounded-xl px-4 py-2.5">
                  <Dumbbell size={12} className="text-yellow-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{plan.name}</p>
                    <p className="text-slate-400 text-xs">₱{Number(plan.price).toLocaleString()} · {plan.duration_days} days</p>
                  </div>
                  <button type="button" onClick={() => set('coachingPlans', form.coachingPlans.filter((p) => p.id !== plan.id))} className="text-slate-500 hover:text-red-400 transition-colors p-1">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
              {addingCoachPlan && (
                <div className="bg-slate-700/40 rounded-xl p-3 space-y-2">
                  <input placeholder="Package name (e.g. 1 Month, 5 Sessions)" value={newCoachPlan.name} onChange={(e) => setNewCoachPlan((p) => ({ ...p, name: e.target.value }))}
                    className="w-full bg-slate-700 border border-slate-600 focus:border-yellow-500 text-white rounded-lg px-3 py-2 text-sm outline-none" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input type="number" min="0" placeholder="Price (₱)" value={newCoachPlan.price} onChange={(e) => setNewCoachPlan((p) => ({ ...p, price: e.target.value }))}
                      className="w-full bg-slate-700 border border-slate-600 focus:border-yellow-500 text-white rounded-lg px-3 py-2 text-sm outline-none" />
                    <input type="number" min="1" placeholder="Duration (days)" value={newCoachPlan.duration_days} onChange={(e) => setNewCoachPlan((p) => ({ ...p, duration_days: e.target.value }))}
                      className="w-full bg-slate-700 border border-slate-600 focus:border-yellow-500 text-white rounded-lg px-3 py-2 text-sm outline-none" />
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { const name = newCoachPlan.name.trim(); const price = Number(newCoachPlan.price); const duration_days = Number(newCoachPlan.duration_days); if (!name || !price || !duration_days) return; set('coachingPlans', [...form.coachingPlans, { id: crypto.randomUUID(), name, price, duration_days }]); setNewCoachPlan({ name: '', price: '', duration_days: '' }); setAddingCoachPlan(false); }}
                      className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-semibold text-sm py-2 rounded-lg transition-colors">Add</button>
                    <button type="button" onClick={() => setAddingCoachPlan(false)} className="flex-1 bg-slate-600 hover:bg-slate-500 text-white font-semibold text-sm py-2 rounded-lg transition-colors">Cancel</button>
                  </div>
                </div>
              )}
              {form.coachingPlans.length === 0 && !addingCoachPlan && <p className="text-slate-600 text-xs">No coaching packages yet.</p>}
            </div>

            {/* Special Promos */}
            <div className="bg-slate-800 rounded-2xl border border-slate-700/50 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag size={15} className="text-purple-400" />
                  <div>
                    <h2 className="text-white font-semibold text-sm">Special Promos</h2>
                    <p className="text-slate-500 text-xs">Student discounts, anniversary promos, etc.</p>
                  </div>
                </div>
                <button type="button" onClick={() => setAddingPromo((v) => !v)} className="flex items-center gap-1 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors">
                  <Plus size={12} /> Add
                </button>
              </div>
              {addingPromo && (
                <div className="bg-slate-700/50 rounded-xl p-4 space-y-3 border border-slate-600">
                  <input type="text" value={newPromo.name} onChange={(e) => setNewPromo((p) => ({ ...p, name: e.target.value }))} placeholder="Promo name (e.g. Student Promo)"
                    className="w-full bg-slate-700 border border-slate-600 focus:border-purple-500 text-white rounded-xl px-4 py-2.5 outline-none transition-colors placeholder:text-slate-500 text-sm" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₱</span>
                      <input type="number" min="0" value={newPromo.price} onChange={(e) => setNewPromo((p) => ({ ...p, price: e.target.value }))} placeholder="Price"
                        className="w-full bg-slate-700 border border-slate-600 focus:border-purple-500 text-white rounded-xl pl-7 pr-4 py-2.5 outline-none transition-colors text-sm" />
                    </div>
                    <input type="number" min="1" value={newPromo.duration_days} onChange={(e) => setNewPromo((p) => ({ ...p, duration_days: e.target.value }))} placeholder="Duration (days)"
                      className="w-full bg-slate-700 border border-slate-600 focus:border-purple-500 text-white rounded-xl px-4 py-2.5 outline-none transition-colors text-sm" />
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { setAddingPromo(false); setNewPromo({ name: '', price: '', duration_days: '' }); }} className="flex-1 bg-slate-600 hover:bg-slate-500 text-white py-2 rounded-xl text-sm font-medium transition-colors">Cancel</button>
                    <button type="button" onClick={addPromo} disabled={!newPromo.name.trim() || !newPromo.price || !newPromo.duration_days} className="flex-1 bg-purple-500 hover:bg-purple-600 disabled:opacity-40 text-white py-2 rounded-xl text-sm font-bold transition-colors">Add</button>
                  </div>
                </div>
              )}
              {form.promos.length === 0 ? (
                <p className="text-slate-600 text-xs">No promos yet.</p>
              ) : (
                <div className="space-y-2">
                  {form.promos.map((promo) => (
                    <div key={promo.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${promo.active ? 'border-purple-500/30 bg-purple-500/5' : 'border-slate-600 bg-slate-700/30 opacity-60'}`}>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold">{promo.name}</p>
                        <p className="text-slate-400 text-xs">₱{Number(promo.price).toLocaleString()} · {promo.duration_days} days</p>
                      </div>
                      <button type="button" onClick={() => setForm((f) => ({ ...f, promos: f.promos.map((p) => p.id === promo.id ? { ...p, active: !p.active } : p) }))} title={promo.active ? 'Disable' : 'Enable'}>
                        {promo.active ? <ToggleRight size={22} className="text-purple-400" /> : <ToggleLeft size={22} className="text-slate-500" />}
                      </button>
                      <button type="button" onClick={() => setForm((f) => ({ ...f, promos: f.promos.filter((p) => p.id !== promo.id) }))} className="text-slate-500 hover:text-red-400 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <SaveButton saving={saving} />
          </form>
        )}

        {/* ── NOTIFICATIONS TAB ────────────────────────────────────────────── */}
        {activeTab === 'notifications' && (
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Telegram */}
            <div className="bg-slate-800 rounded-2xl border border-slate-700/50 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Send size={15} className="text-sky-400" />
                <div>
                  <h2 className="text-white font-semibold text-sm">Telegram Notifications</h2>
                  <p className="text-slate-500 text-xs">Get notified when members submit payment requests</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-slate-300 text-xs font-medium mb-1.5">Bot Token</label>
                  <input type="text" value={form.telegramBotToken} onChange={(e) => set('telegramBotToken', e.target.value)} placeholder="7123456789:AAFxyz..."
                    className="w-full bg-slate-700 border border-slate-600 focus:border-sky-500 text-white rounded-xl px-4 py-2.5 outline-none transition-colors placeholder:text-slate-500 text-sm font-mono" />
                  <p className="text-slate-500 text-xs mt-1">Get this from @BotFather on Telegram</p>
                </div>
                <div>
                  <label className="block text-slate-300 text-xs font-medium mb-1.5">Chat ID</label>
                  <input type="text" value={form.telegramChatId} onChange={(e) => set('telegramChatId', e.target.value)} placeholder="123456789"
                    className="w-full bg-slate-700 border border-slate-600 focus:border-sky-500 text-white rounded-xl px-4 py-2.5 outline-none transition-colors placeholder:text-slate-500 text-sm font-mono" />
                  <p className="text-slate-500 text-xs mt-1">Message your bot, then check <span className="text-sky-400 font-mono">api.telegram.org/bot&#123;TOKEN&#125;/getUpdates</span></p>
                </div>
                <div>
                  <label className="block text-slate-300 text-xs font-medium mb-1.5">Admin Panel URL</label>
                  <input type="text" value={form.siteUrl} onChange={(e) => set('siteUrl', e.target.value)} placeholder="https://your-site.vercel.app"
                    className="w-full bg-slate-700 border border-slate-600 focus:border-sky-500 text-white rounded-xl px-4 py-2.5 outline-none transition-colors placeholder:text-slate-500 text-sm" />
                  <p className="text-slate-500 text-xs mt-1">Used in Telegram notification links</p>
                </div>
                {form.telegramBotToken && form.telegramChatId && (
                  <div className="flex items-center gap-2 bg-sky-500/10 border border-sky-500/30 rounded-xl px-3 py-2">
                    <div className="w-2 h-2 bg-sky-400 rounded-full animate-pulse" />
                    <p className="text-sky-300 text-xs">Active · Chat ID: <span className="font-mono font-bold">{form.telegramChatId}</span></p>
                  </div>
                )}
              </div>
            </div>

            {/* Semaphore SMS */}
            <div className="bg-slate-800 rounded-2xl border border-slate-700/50 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <MessageSquare size={15} className="text-green-400" />
                <div>
                  <h2 className="text-white font-semibold text-sm">Semaphore SMS</h2>
                  <p className="text-slate-500 text-xs">Send SMS to members · Auto reminders on expiry</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-slate-300 text-xs font-medium mb-1.5">API Key</label>
                  <input type="text" value={form.semaphoreApiKey} onChange={(e) => set('semaphoreApiKey', e.target.value)} placeholder="Your Semaphore API key"
                    className="w-full bg-slate-700 border border-slate-600 focus:border-green-500 text-white rounded-xl px-4 py-2.5 outline-none transition-colors placeholder:text-slate-500 text-sm font-mono" />
                  <p className="text-slate-500 text-xs mt-1">Found in semaphore.co → Account → API</p>
                </div>
                <div>
                  <label className="block text-slate-300 text-xs font-medium mb-1.5">
                    Sender Name <span className="text-slate-500 font-normal">(optional)</span>
                  </label>
                  <input type="text" value={form.semaphoreSenderName} onChange={(e) => set('semaphoreSenderName', e.target.value)} placeholder="SEMAPHORE" maxLength={11}
                    className="w-full bg-slate-700 border border-slate-600 focus:border-green-500 text-white rounded-xl px-4 py-2.5 outline-none transition-colors placeholder:text-slate-500 text-sm" />
                  <p className="text-slate-500 text-xs mt-1">Max 11 characters. Leave blank to use "SEMAPHORE". Register your sender name at semaphore.co for branding.</p>
                </div>
                {form.semaphoreApiKey && (
                  <>
                    <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-xl px-3 py-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <p className="text-green-300 text-xs">Active · Auto reminders enabled — daily at 9 AM PH time</p>
                    </div>
                    <TestAutoSMS gymId={gymId} />
                  </>
                )}
              </div>
            </div>

            <SaveButton saving={saving} />
          </form>
        )}

        {/* ── ACCOUNT TAB ──────────────────────────────────────────────────── */}
        {activeTab === 'account' && (
          <div className="space-y-5">
            <LoginSecurity gymId={gymId} />
            <StaffManagement gymId={gymId} />
          </div>
        )}

      </div>
    </div>
  );
}

function SaveButton({ saving }) {
  return (
    <button type="submit" disabled={saving}
      className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors">
      {saving ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={16} /> Save Settings</>}
    </button>
  );
}
