import { useState, useEffect, useRef } from 'react';
import { Save, Upload, X, Settings, Send, Plus, Trash2, Tag, ToggleLeft, ToggleRight, Dumbbell, ChevronRight, ImageIcon, Phone, MapPin, Download, QrCode } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { Link } from 'react-router-dom';
import { useGym } from '../context/GymContext';
import { supabase } from '../lib/supabase';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';

function LoginSecurity({ gymId }) {
  const [sec, setSec] = useState({ username: '', email: '', newPassword: '', confirmPassword: '' });
  const [currentEmail, setCurrentEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const setF = (k, v) => setSec((s) => ({ ...s, [k]: v }));

  // Load current username and email, sync gym_admins.email with auth email
  useEffect(() => {
    if (!gymId) return;
    supabase.auth.getUser().then(({ data }) => {
      const authEmail = data?.user?.email;
      if (authEmail) {
        setCurrentEmail(authEmail);
        setSec((s) => ({ ...s, email: authEmail }));
        // Keep gym_admins.email in sync with actual auth email
        supabase.from('gym_admins')
          .update({ email: authEmail })
          .eq('gym_id', gymId)
          .then(() => {});
      }
    });
    supabase.auth.getUser().then(({ data: authData }) => {
      if (!authData?.user) return;
      supabase.from('gym_admins').select('username')
        .eq('gym_id', gymId)
        .eq('user_id', authData.user.id)
        .maybeSingle()
        .then(({ data }) => { if (data?.username) setSec((s) => ({ ...s, username: data.username || '' })); });
    });
  }, [gymId]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (sec.newPassword && sec.newPassword !== sec.confirmPassword) {
      toast.error('Passwords do not match'); return;
    }
    if (sec.newPassword && sec.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters'); return;
    }
    setSaving(true);
    try {
      // Update username in gym_admins for the current logged-in user
      if (gymId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { error } = await supabase.from('gym_admins')
            .update({ username: sec.username.trim().toLowerCase() || null })
            .eq('gym_id', gymId)
            .eq('user_id', user.id);
          if (error) throw error;
        }
      }
      // Update email — Supabase sends confirmation to new address
      const newEmail = sec.email.trim().toLowerCase();
      if (newEmail && newEmail !== currentEmail) {
        const redirectTo = `${import.meta.env.VITE_SITE_URL || window.location.origin}/auth/callback`;
        const { error } = await supabase.auth.updateUser({ email: newEmail }, { emailRedirectTo: redirectTo });
        if (error) throw error;
        setEmailSent(true);
      }
      // Update password
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
    <div className="bg-slate-800 rounded-2xl border border-slate-700/50 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
          <Settings size={16} className="text-blue-400" />
        </div>
        <h2 className="text-white font-semibold text-base">Login &amp; Security</h2>
      </div>
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-slate-300 text-sm font-medium mb-1.5">Username <span className="text-slate-500 font-normal">(optional — can be used instead of email)</span></label>
          <input
            type="text"
            value={sec.username}
            onChange={(e) => setF('username', e.target.value.replace(/\s/g, '').toLowerCase())}
            placeholder="e.g. powerfitness"
            className="w-full bg-slate-700 border border-slate-600 focus:border-blue-500 text-white rounded-xl px-4 py-2.5 outline-none text-sm transition-colors placeholder:text-slate-500"
          />
          <p className="text-slate-500 text-xs mt-1">Lowercase letters and numbers only. No spaces.</p>
        </div>

        <div className="border-t border-slate-700 pt-4">
          <label className="block text-slate-300 text-sm font-medium mb-1.5">Email Address</label>
          <input
            type="email"
            value={sec.email}
            onChange={(e) => { setF('email', e.target.value); setEmailSent(false); }}
            className="w-full bg-slate-700 border border-slate-600 focus:border-blue-500 text-white rounded-xl px-4 py-2.5 outline-none text-sm transition-colors placeholder:text-slate-500"
          />
          {emailSent && (
            <div className="mt-2 flex items-start gap-2 bg-blue-500/10 border border-blue-500/20 rounded-xl px-3 py-2.5">
              <Send size={14} className="text-blue-400 shrink-0 mt-0.5" />
              <p className="text-blue-300 text-xs">Confirmation sent to <strong>{sec.email}</strong>. Click the link in that email to complete the change. Your current email still works until then.</p>
            </div>
          )}
          {!emailSent && sec.email.trim().toLowerCase() !== currentEmail && sec.email.includes('@') && (
            <p className="text-slate-500 text-xs mt-1">A confirmation link will be sent to the new email.</p>
          )}
        </div>

        <div className="border-t border-slate-700 pt-4">
          <p className="text-slate-400 text-sm font-medium mb-3">Change Password</p>
          <div className="space-y-3">
            <input
              type="password"
              value={sec.newPassword}
              onChange={(e) => setF('newPassword', e.target.value)}
              placeholder="New password (min. 8 characters)"
              autoComplete="new-password"
              className="w-full bg-slate-700 border border-slate-600 focus:border-blue-500 text-white rounded-xl px-4 py-2.5 outline-none text-sm transition-colors placeholder:text-slate-500"
            />
            <input
              type="password"
              value={sec.confirmPassword}
              onChange={(e) => setF('confirmPassword', e.target.value)}
              placeholder="Confirm new password"
              autoComplete="new-password"
              className={`w-full bg-slate-700 border text-white rounded-xl px-4 py-2.5 outline-none text-sm transition-colors placeholder:text-slate-500 ${
                sec.confirmPassword && sec.newPassword !== sec.confirmPassword
                  ? 'border-red-500' : 'border-slate-600 focus:border-blue-500'
              }`}
            />
            {sec.confirmPassword && sec.newPassword !== sec.confirmPassword && (
              <p className="text-red-400 text-xs">Passwords do not match</p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors text-sm"
        >
          {saving
            ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <><Save size={15} /> Save Login Details</>
          }
        </button>
      </form>
    </div>
  );
}

const PRICE_FIELDS = [
  { key: 'priceMonthly',    label: '1 Month' },
  { key: 'priceQuarterly',  label: '3 Months' },
  { key: 'priceSemiAnnual', label: '6 Months' },
  { key: 'priceAnnual',     label: '1 Year' },
];

export default function AdminSettings() {
  const { settings, saveSettings, instructors, gymSlug, gymId } = useGym();
  const [form, setForm] = useState({
    gymName: '',
    gymLogoUrl: null,
    gymLogoFile: null,
    gymLogoPreview: null,
    gymAddress: '',
    gymContactNumber: '',
    gcashNumber: '',
    gcashName: '',
    coachingPlans: [],
    gcashQrUrl: null,
    gcashQrFile: null,
    gcashQrPreview: null,
    priceMonthly: '',
    priceQuarterly: '',
    priceSemiAnnual: '',
    priceAnnual: '',
    priceStudent: '',
    telegramChatId: '',
    telegramBotToken: '',
    siteUrl: '',
    promos: [],
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
    }));
  }, [settings]);

  const addPromo = () => {
    const name = newPromo.name.trim();
    const price = Number(newPromo.price);
    const duration_days = Number(newPromo.duration_days);
    if (!name || !price || !duration_days) return;
    const promo = { id: crypto.randomUUID(), name, price, duration_days, active: true };
    setForm((f) => ({ ...f, promos: [...f.promos, promo] }));
    setNewPromo({ name: '', price: '', duration_days: '' });
    setAddingPromo(false);
  };

  const togglePromo = (id) => {
    setForm((f) => ({
      ...f,
      promos: f.promos.map((p) => p.id === id ? { ...p, active: !p.active } : p),
    }));
  };

  const deletePromo = (id) => {
    setForm((f) => ({ ...f, promos: f.promos.filter((p) => p.id !== id) }));
  };

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleQrFile = (file) => {
    if (!file) return;
    set('gcashQrFile', file);
    set('gcashQrPreview', URL.createObjectURL(file));
  };

  const removeQr = () => {
    set('gcashQrFile', null);
    set('gcashQrPreview', null);
    set('gcashQrUrl', null);
  };

  const handleLogoFile = (file) => {
    if (!file) return;
    set('gymLogoFile', file);
    set('gymLogoPreview', URL.createObjectURL(file));
  };

  const removeLogo = () => {
    set('gymLogoFile', null);
    set('gymLogoPreview', null);
    set('gymLogoUrl', null);
  };

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

  const qrDisplay   = form.gcashQrPreview   || form.gcashQrUrl;
  const logoDisplay = form.gymLogoPreview   || form.gymLogoUrl;

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-24 sm:pb-8">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center">
            <Settings size={20} className="text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            <p className="text-slate-400 text-sm">GCash payment details &amp; membership prices</p>
          </div>
        </div>

        {/* QR Code card */}
        {gymSlug && (() => {
          const portalUrl = `${window.location.origin}/${gymSlug}`;
          const downloadQR = () => {
            const canvas = document.getElementById('gym-qr-canvas');
            if (!canvas) return;
            const link = document.createElement('a');
            link.download = `${gymSlug}-qr.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
          };
          return (
            <div className="bg-slate-800 rounded-2xl border border-slate-700/50 p-5">
              <div className="flex items-center gap-2 mb-4">
                <QrCode size={18} className="text-orange-400" />
                <h2 className="text-white font-semibold text-base">Gym Portal QR Code</h2>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="bg-white p-3 rounded-2xl shrink-0">
                  <QRCodeCanvas
                    id="gym-qr-canvas"
                    value={portalUrl}
                    size={160}
                    bgColor="#ffffff"
                    fgColor="#000000"
                    level="H"
                    marginSize={0}
                  />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <p className="text-white font-semibold mb-1">{settings.gymName || 'Your Gym'}</p>
                  <p className="text-slate-400 text-sm mb-1">Members can scan this to access your portal.</p>
                  <p className="text-slate-500 text-xs font-mono mb-4">{portalUrl}</p>
                  <button
                    type="button"
                    onClick={downloadQR}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
                    style={{ background: 'linear-gradient(135deg, #ea580c, #f97316)' }}
                  >
                    <Download size={15} /> Download QR Code
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Gym Identity */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700/50 p-5 space-y-4">
            <h2 className="text-white font-semibold text-base">Gym Identity</h2>

            {/* Logo */}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1.5">Gym Logo</label>
              <div className="flex items-start gap-4">
                {logoDisplay ? (
                  <div className="relative shrink-0">
                    <img
                      src={logoDisplay}
                      alt="Gym Logo"
                      className="w-20 h-20 object-contain bg-slate-700 rounded-xl p-1.5"
                    />
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors"
                    >
                      <X size={12} className="text-white" />
                    </button>
                  </div>
                ) : null}
                <div
                  onClick={() => logoRef.current?.click()}
                  className="flex-1 border-2 border-dashed border-slate-600 hover:border-orange-500 rounded-xl p-4 text-center cursor-pointer transition-colors group"
                >
                  <ImageIcon size={20} className="mx-auto text-slate-500 group-hover:text-orange-400 mb-1.5 transition-colors" />
                  <p className="text-slate-400 text-sm">
                    {logoDisplay ? 'Click to replace logo' : 'Upload gym logo'}
                  </p>
                  <p className="text-slate-600 text-xs mt-0.5">PNG, JPG — shown on all portal pages</p>
                  <input
                    ref={logoRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleLogoFile(e.target.files[0])}
                  />
                </div>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1.5">Gym Name</label>
              <input
                type="text"
                value={form.gymName}
                onChange={(e) => set('gymName', e.target.value)}
                placeholder="e.g. Power Fitness Gym"
                className="w-full bg-slate-700 border border-slate-600 focus:border-orange-500 text-white rounded-xl px-4 py-3 outline-none transition-colors placeholder:text-slate-500 text-sm"
              />
              <p className="text-slate-500 text-xs mt-1.5">Shown in the navbar and throughout the app.</p>
            </div>

            {/* Address */}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1.5">
                <span className="inline-flex items-center gap-1.5"><MapPin size={13} className="text-slate-400" />Address</span>
              </label>
              <input
                type="text"
                value={form.gymAddress}
                onChange={(e) => set('gymAddress', e.target.value)}
                placeholder="e.g. 123 Fitness St., Makati City"
                className="w-full bg-slate-700 border border-slate-600 focus:border-orange-500 text-white rounded-xl px-4 py-3 outline-none transition-colors placeholder:text-slate-500 text-sm"
              />
            </div>

            {/* Contact Number */}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1.5">
                <span className="inline-flex items-center gap-1.5"><Phone size={13} className="text-slate-400" />Contact Number</span>
              </label>
              <input
                type="text"
                value={form.gymContactNumber}
                onChange={(e) => set('gymContactNumber', e.target.value)}
                placeholder="e.g. 09XX XXX XXXX"
                className="w-full bg-slate-700 border border-slate-600 focus:border-orange-500 text-white rounded-xl px-4 py-3 outline-none transition-colors placeholder:text-slate-500 text-sm"
              />
            </div>
          </div>

          {/* GCash details */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700/50 p-5 space-y-4">
            <h2 className="text-white font-semibold text-base">GCash Details</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-1.5">GCash Number</label>
                <input
                  type="text"
                  value={form.gcashNumber}
                  onChange={(e) => set('gcashNumber', e.target.value)}
                  placeholder="09XX XXX XXXX"
                  className="w-full bg-slate-700 border border-slate-600 focus:border-green-500 text-white rounded-xl px-4 py-3 outline-none transition-colors placeholder:text-slate-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-1.5">Account Name</label>
                <input
                  type="text"
                  value={form.gcashName}
                  onChange={(e) => set('gcashName', e.target.value)}
                  placeholder="Full name on GCash"
                  className="w-full bg-slate-700 border border-slate-600 focus:border-green-500 text-white rounded-xl px-4 py-3 outline-none transition-colors placeholder:text-slate-500 text-sm"
                />
              </div>
            </div>

            {/* QR Upload */}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1.5">GCash QR Code</label>
              <div className="flex items-start gap-4">
                {qrDisplay ? (
                  <div className="relative shrink-0">
                    <img
                      src={qrDisplay}
                      alt="GCash QR"
                      className="w-28 h-28 object-contain bg-white rounded-xl p-1.5"
                    />
                    <button
                      type="button"
                      onClick={removeQr}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors"
                    >
                      <X size={12} className="text-white" />
                    </button>
                  </div>
                ) : null}

                <div
                  onClick={() => fileRef.current?.click()}
                  className="flex-1 border-2 border-dashed border-slate-600 hover:border-green-500 rounded-xl p-5 text-center cursor-pointer transition-colors group"
                >
                  <Upload size={22} className="mx-auto text-slate-500 group-hover:text-green-400 mb-2 transition-colors" />
                  <p className="text-slate-400 text-sm">
                    {qrDisplay ? 'Click to replace QR' : 'Upload your GCash QR code'}
                  </p>
                  <p className="text-slate-600 text-xs mt-0.5">PNG, JPG supported</p>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleQrFile(e.target.files[0])}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Membership Prices */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700/50 p-5 space-y-4">
            <div>
              <h2 className="text-white font-semibold text-base">Membership Prices</h2>
              <p className="text-slate-500 text-xs mt-0.5">Set the amount members need to pay per plan</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {PRICE_FIELDS.map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-slate-300 text-sm font-medium mb-1.5">{label}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">₱</span>
                    <input
                      type="number"
                      min="0"
                      value={form[key]}
                      onChange={(e) => set(key, e.target.value)}
                      placeholder="0"
                      className="w-full bg-slate-700 border border-slate-600 focus:border-orange-500 text-white rounded-xl pl-7 pr-4 py-3 outline-none transition-colors text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Student Membership */}
            <div className="border-t border-slate-700 pt-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-sky-500/20 rounded flex items-center justify-center">
                  <span className="text-sky-400 text-xs font-black">S</span>
                </div>
                <p className="text-slate-300 text-sm font-semibold">Student Membership</p>
                <span className="text-slate-500 text-xs">— always available</span>
              </div>
              <div className="relative max-w-xs">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">₱</span>
                <input
                  type="number"
                  min="0"
                  value={form.priceStudent}
                  onChange={(e) => set('priceStudent', e.target.value)}
                  placeholder="0"
                  className="w-full bg-slate-700 border border-slate-600 focus:border-sky-500 text-white rounded-xl pl-7 pr-4 py-3 outline-none transition-colors text-sm"
                />
              </div>
              <p className="text-slate-600 text-xs">
                Monthly (30 days). Members must present a valid student ID.
              </p>
            </div>

            {/* Coaching Plans */}
            <div className="border-t border-slate-700 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Dumbbell size={15} className="text-yellow-400" />
                  <p className="text-slate-300 text-sm font-semibold">Coaching Packages</p>
                </div>
                {!addingCoachPlan && (
                  <button type="button" onClick={() => setAddingCoachPlan(true)}
                    className="flex items-center gap-1 text-xs font-semibold text-yellow-400 hover:text-yellow-300 transition-colors">
                    <Plus size={13} /> Add Package
                  </button>
                )}
              </div>
              <p className="text-slate-600 text-xs -mt-1">
                Define coaching packages (e.g. "1 Session", "5 Sessions", "1 Month"). Members pick one when subscribing.
              </p>

              {/* Existing plans */}
              {form.coachingPlans.map((plan) => (
                <div key={plan.id} className="flex items-center gap-3 bg-slate-700/40 rounded-xl px-4 py-2.5">
                  <Dumbbell size={13} className="text-yellow-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{plan.name}</p>
                    <p className="text-slate-400 text-xs">₱{Number(plan.price).toLocaleString()} · {plan.duration_days} day{plan.duration_days !== 1 ? 's' : ''}</p>
                  </div>
                  <button type="button"
                    onClick={() => set('coachingPlans', form.coachingPlans.filter((p) => p.id !== plan.id))}
                    className="text-slate-500 hover:text-red-400 transition-colors p-1">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}

              {/* Add new plan form */}
              {addingCoachPlan && (
                <div className="bg-slate-700/40 rounded-xl p-3 space-y-2">
                  <input
                    placeholder="Package name (e.g. 1 Month, 5 Sessions)"
                    value={newCoachPlan.name}
                    onChange={(e) => setNewCoachPlan((p) => ({ ...p, name: e.target.value }))}
                    className="w-full bg-slate-700 border border-slate-600 focus:border-yellow-500 text-white rounded-lg px-3 py-2 text-sm outline-none"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number" min="0" placeholder="Price (₱)"
                      value={newCoachPlan.price}
                      onChange={(e) => setNewCoachPlan((p) => ({ ...p, price: e.target.value }))}
                      className="bg-slate-700 border border-slate-600 focus:border-yellow-500 text-white rounded-lg px-3 py-2 text-sm outline-none"
                    />
                    <input
                      type="number" min="1" placeholder="Duration (days)"
                      value={newCoachPlan.duration_days}
                      onChange={(e) => setNewCoachPlan((p) => ({ ...p, duration_days: e.target.value }))}
                      className="bg-slate-700 border border-slate-600 focus:border-yellow-500 text-white rounded-lg px-3 py-2 text-sm outline-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="button"
                      onClick={() => {
                        const name = newCoachPlan.name.trim();
                        const price = Number(newCoachPlan.price);
                        const duration_days = Number(newCoachPlan.duration_days);
                        if (!name || !price || !duration_days) return;
                        set('coachingPlans', [...form.coachingPlans, { id: crypto.randomUUID(), name, price, duration_days }]);
                        setNewCoachPlan({ name: '', price: '', duration_days: '' });
                        setAddingCoachPlan(false);
                      }}
                      className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-semibold text-sm py-2 rounded-lg transition-colors">
                      Add
                    </button>
                    <button type="button" onClick={() => setAddingCoachPlan(false)}
                      className="flex-1 bg-slate-600 hover:bg-slate-500 text-white font-semibold text-sm py-2 rounded-lg transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Telegram Notifications */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700/50 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Send size={16} className="text-sky-400" />
              <h2 className="text-white font-semibold text-base">Telegram Notifications</h2>
            </div>
            <p className="text-slate-500 text-xs -mt-2">
              Get notified via Telegram when a member submits a payment request.
            </p>
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1.5">Bot Token</label>
              <input
                type="text"
                value={form.telegramBotToken}
                onChange={(e) => set('telegramBotToken', e.target.value)}
                placeholder="e.g. 7123456789:AAFxyz..."
                className="w-full bg-slate-700 border border-slate-600 focus:border-sky-500 text-white rounded-xl px-4 py-3 outline-none transition-colors placeholder:text-slate-500 text-sm font-mono"
              />
              <p className="text-slate-500 text-xs mt-1.5">Get this from @BotFather on Telegram</p>
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1.5">Chat ID</label>
              <input
                type="text"
                value={form.telegramChatId}
                onChange={(e) => set('telegramChatId', e.target.value)}
                placeholder="e.g. 123456789"
                className="w-full bg-slate-700 border border-slate-600 focus:border-sky-500 text-white rounded-xl px-4 py-3 outline-none transition-colors placeholder:text-slate-500 text-sm font-mono"
              />
              <p className="text-slate-500 text-xs mt-1.5">
                Message your bot, then open{' '}
                <span className="text-sky-400 font-mono">api.telegram.org/bot&#123;TOKEN&#125;/getUpdates</span>
              </p>
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1.5">Admin Panel URL</label>
              <input
                type="text"
                value={form.siteUrl}
                onChange={(e) => set('siteUrl', e.target.value)}
                placeholder="e.g. https://your-site.vercel.app"
                className="w-full bg-slate-700 border border-slate-600 focus:border-sky-500 text-white rounded-xl px-4 py-3 outline-none transition-colors placeholder:text-slate-500 text-sm"
              />
              <p className="text-slate-500 text-xs mt-1.5">Used to generate the link in Telegram notifications</p>
            </div>
            {form.telegramBotToken && form.telegramChatId && (
              <div className="flex items-center gap-2 bg-sky-500/10 border border-sky-500/30 rounded-xl px-3 py-2">
                <div className="w-2 h-2 bg-sky-400 rounded-full animate-pulse" />
                <p className="text-sky-300 text-xs">Notifications active → Chat ID: <span className="font-mono font-bold">{form.telegramChatId}</span></p>
              </div>
            )}
          </div>

          {/* Special Promos */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700/50 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag size={16} className="text-purple-400" />
                <h2 className="text-white font-semibold text-base">Special Promos</h2>
              </div>
              <button
                type="button"
                onClick={() => setAddingPromo((v) => !v)}
                className="flex items-center gap-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors"
              >
                <Plus size={13} /> Add Promo
              </button>
            </div>
            <p className="text-slate-500 text-xs -mt-2">
              Student discounts, anniversary promos, etc. Appear alongside standard plans.
            </p>

            {/* Add promo form */}
            {addingPromo && (
              <div className="bg-slate-700/50 rounded-xl p-4 space-y-3 border border-slate-600">
                <p className="text-slate-300 text-sm font-medium">New Promo</p>
                <input
                  type="text"
                  value={newPromo.name}
                  onChange={(e) => setNewPromo((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Promo name (e.g. Student Promo)"
                  className="w-full bg-slate-700 border border-slate-600 focus:border-purple-500 text-white rounded-xl px-4 py-2.5 outline-none transition-colors placeholder:text-slate-500 text-sm"
                />
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₱</span>
                    <input
                      type="number"
                      min="0"
                      value={newPromo.price}
                      onChange={(e) => setNewPromo((p) => ({ ...p, price: e.target.value }))}
                      placeholder="Price"
                      className="w-full bg-slate-700 border border-slate-600 focus:border-purple-500 text-white rounded-xl pl-7 pr-4 py-2.5 outline-none transition-colors text-sm"
                    />
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      value={newPromo.duration_days}
                      onChange={(e) => setNewPromo((p) => ({ ...p, duration_days: e.target.value }))}
                      placeholder="Duration (days)"
                      className="w-full bg-slate-700 border border-slate-600 focus:border-purple-500 text-white rounded-xl px-4 py-2.5 outline-none transition-colors text-sm"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setAddingPromo(false); setNewPromo({ name: '', price: '', duration_days: '' }); }}
                    className="flex-1 bg-slate-600 hover:bg-slate-500 text-white py-2 rounded-xl text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={addPromo}
                    disabled={!newPromo.name.trim() || !newPromo.price || !newPromo.duration_days}
                    className="flex-1 bg-purple-500 hover:bg-purple-600 disabled:opacity-40 text-white py-2 rounded-xl text-sm font-bold transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}

            {/* Promo list */}
            {form.promos.length === 0 ? (
              <p className="text-slate-600 text-sm text-center py-2">No promos yet</p>
            ) : (
              <div className="space-y-2">
                {form.promos.map((promo) => (
                  <div key={promo.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${promo.active ? 'border-purple-500/30 bg-purple-500/5' : 'border-slate-600 bg-slate-700/30 opacity-60'}`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold">{promo.name}</p>
                      <p className="text-slate-400 text-xs">₱{Number(promo.price).toLocaleString()} · {promo.duration_days} days</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => togglePromo(promo.id)}
                      className="text-slate-400 hover:text-purple-300 transition-colors"
                      title={promo.active ? 'Disable promo' : 'Enable promo'}
                    >
                      {promo.active
                        ? <ToggleRight size={22} className="text-purple-400" />
                        : <ToggleLeft size={22} />
                      }
                    </button>
                    <button
                      type="button"
                      onClick={() => deletePromo(promo.id)}
                      className="text-slate-500 hover:text-red-400 transition-colors"
                      title="Delete promo"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Instructors — link to dedicated page */}
          <Link
            to={`/${gymSlug}/admin/instructors`}
            className="flex items-center gap-4 bg-slate-800 hover:bg-slate-750 rounded-2xl border border-yellow-500/20 p-4 transition-colors group"
          >
            <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center shrink-0">
              <Dumbbell size={20} className="text-yellow-400" />
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold">Gym Instructors</p>
              <p className="text-slate-400 text-sm">
                {instructors.length === 0
                  ? 'No coaches yet — add your first'
                  : `${instructors.length} coach${instructors.length !== 1 ? 'es' : ''} registered`}
              </p>
            </div>
            <ChevronRight size={18} className="text-slate-500 group-hover:text-slate-300 transition-colors" />
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-colors"
          >
            {saving
              ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <><Save size={18} /> Save Settings</>
            }
          </button>
        </form>

        {/* Login & Security */}
        <LoginSecurity gymId={gymId} />

      </div>
    </div>
  );
}
