import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CheckCircle, XCircle, Clock, Dumbbell, LogOut, Eye, EyeOff, Shield, RefreshCw, Phone, Mail, User, Pencil, X, Trash2, PauseCircle, PlayCircle } from 'lucide-react';
import { sendApprovalEmail } from '../lib/email';
import toast from 'react-hot-toast';

/* ── Platform-level password (set as VITE_PLATFORM_PASSWORD in .env) ── */
const PLATFORM_PASSWORD = import.meta.env.VITE_PLATFORM_PASSWORD || 'mfg-admin-2025';

function fmtDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
}

const STATUS_STYLES = {
  pending:   { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20', label: 'Pending'   },
  active:    { bg: 'bg-green-500/10',  text: 'text-green-400',  border: 'border-green-500/20',  label: 'Active'    },
  rejected:  { bg: 'bg-red-500/10',    text: 'text-red-400',    border: 'border-red-500/20',    label: 'Rejected'  },
  suspended: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20', label: 'Suspended' },
};

export default function PlatformAdmin() {
  const [authed, setAuthed]     = useState(() => sessionStorage.getItem('mfg_platform') === '1');
  const [pw, setPw]             = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [pwErr, setPwErr]       = useState('');

  const [loading, setLoading]     = useState(false);
  const [filter, setFilter]       = useState('pending');
  const [acting, setActing]       = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm]   = useState({});
  const [saving, setSaving]       = useState(false);
  const [tab, setTab]             = useState('gyms'); // 'gyms' | 'emails'
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deleting, setDeleting]   = useState(null);
  const [emailLogs, setEmailLogs] = useState([]);
  const [emailsLoading, setEmailsLoading] = useState(false);

  const login = (e) => {
    e.preventDefault();
    if (pw === PLATFORM_PASSWORD) {
      sessionStorage.setItem('mfg_platform', '1');
      setAuthed(true);
    } else {
      setPwErr('Incorrect password.');
    }
  };

  const logout = () => {
    sessionStorage.removeItem('mfg_platform');
    setAuthed(false);
  };

  const [allGyms, setAllGyms] = useState([]);

  const loadGyms = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('gyms')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) toast.error('Failed to load gyms');
    else setAllGyms(data || []);
    setLoading(false);
  };

  // Filter client-side
  const gyms = filter === 'all' ? allGyms : allGyms.filter((g) => g.status === filter);

  useEffect(() => { if (authed) loadGyms(); }, [authed]);

  const loadEmailLogs = async () => {
    setEmailsLoading(true);
    const { data } = await supabase
      .from('email_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    setEmailLogs(data || []);
    setEmailsLoading(false);
  };

  useEffect(() => { if (authed && tab === 'emails') loadEmailLogs(); }, [authed, tab]);

  const setStatus = async (gym, status) => {
    setActing(gym.id);
    const { error } = await supabase.from('gyms').update({ status }).eq('id', gym.id);
    if (error) {
      toast.error('Failed to update status');
    } else {
      toast.success(`${gym.name} ${status === 'active' ? 'approved' : 'rejected'}`);
      if (status === 'active') await sendApprovalEmail({ ownerName: gym.owner_name, ownerEmail: gym.owner_email, gymName: gym.name, slug: gym.slug });
      setAllGyms((prev) => prev.map((g) => g.id === gym.id ? { ...g, status } : g));
    }
    setActing(null);
  };

  const openEdit = (gym) => {
    setEditingId(gym.id);
    setEditForm({
      owner_name:    gym.owner_name    || '',
      owner_email:   gym.owner_email   || '',
      owner_contact: gym.owner_contact || '',
      name:          gym.name          || '',
    });
  };

  const saveEdit = async (gymId) => {
    setSaving(true);
    const { error } = await supabase
      .from('gyms')
      .update({
        name:          editForm.name.trim(),
        owner_name:    editForm.owner_name.trim(),
        owner_email:   editForm.owner_email.trim().toLowerCase(),
        owner_contact: editForm.owner_contact.trim(),
      })
      .eq('id', gymId);
    if (error) {
      toast.error('Failed to save');
    } else {
      toast.success('Saved');
      setAllGyms((prev) => prev.map((g) => g.id === gymId
        ? { ...g, ...editForm, name: editForm.name.trim() }
        : g
      ));
      setEditingId(null);
    }
    setSaving(false);
  };

  const deleteGym = async (gym) => {
    setDeleting(gym.id);
    try {
      const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL;
      const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const res = await fetch(`${SUPABASE_URL}/functions/v1/delete-gym`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON,
          'Authorization': `Bearer ${SUPABASE_ANON}`,
        },
        body: JSON.stringify({ gym_id: gym.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      toast.success(`${gym.name} deleted`);
      setAllGyms((prev) => prev.filter((g) => g.id !== gym.id));
      setConfirmDeleteId(null);
    } catch (err) {
      toast.error(err.message || 'Failed to delete gym');
    } finally {
      setDeleting(null);
    }
  };

  /* ── Login screen ───────────────────────────────────────────── */
  if (!authed) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center px-4">
        <div className="w-full max-w-xs">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #16a34a, #4ade80)' }}>
              <Shield size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-white font-black text-lg">Platform Admin</h1>
              <p className="text-slate-500 text-xs">MadeForGyms</p>
            </div>
          </div>

          <form onSubmit={login} className="space-y-4">
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={pw}
                onChange={(e) => { setPw(e.target.value); setPwErr(''); }}
                placeholder="Platform password"
                className="w-full bg-slate-800 border border-slate-700 focus:border-green-500 text-white rounded-xl px-4 py-3 pr-11 outline-none text-sm placeholder:text-slate-600 transition-colors"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {pwErr && <p className="text-red-400 text-xs">{pwErr}</p>}
            <button
              type="submit"
              className="w-full py-3 rounded-xl text-white font-bold text-sm transition-all hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #16a34a, #4ade80)' }}
            >
              Sign In
            </button>
          </form>

          <p className="text-slate-700 text-xs text-center mt-6">
            Set <code className="text-slate-600">VITE_PLATFORM_PASSWORD</code> in your .env to change the password.
          </p>
        </div>
      </div>
    );
  }

  /* ── Dashboard ──────────────────────────────────────────────── */
  const pending   = allGyms.filter((g) => g.status === 'pending').length;
  const active    = allGyms.filter((g) => g.status === 'active').length;
  const rejected  = allGyms.filter((g) => g.status === 'rejected').length;
  const suspended = allGyms.filter((g) => g.status === 'suspended').length;

  return (
    <div className="min-h-screen bg-[#030712]">
      <div className="fixed inset-0 -z-10 pointer-events-none opacity-40"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/5"
        style={{ background: 'rgba(3,7,18,0.95)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #16a34a, #4ade80)' }}>
            <Dumbbell size={16} className="text-white" />
          </div>
          <p className="text-white font-bold text-sm">MadeForGyms — Platform Admin</p>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={loadGyms} className="p-2 text-slate-500 hover:text-white transition-colors rounded-lg hover:bg-white/5">
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
            <button onClick={logout} className="flex items-center gap-1.5 text-slate-500 hover:text-red-400 text-xs transition-colors px-2 py-1.5 rounded-lg hover:bg-red-500/10">
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

        {/* Main tabs */}
        <div className="flex gap-2">
          {['gyms', 'emails'].map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-colors capitalize ${
                tab === t
                  ? 'bg-green-500/15 text-green-400 border border-green-500/30'
                  : 'text-slate-400 border border-white/8 hover:text-white hover:bg-white/5'
              }`}>
              {t === 'emails' ? 'Email Logs' : 'Gyms'}
            </button>
          ))}
        </div>

        {/* ── Email Logs tab ── */}
        {tab === 'emails' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-slate-400 text-sm">Last 50 emails sent</p>
              <button onClick={loadEmailLogs} className="p-1.5 text-slate-500 hover:text-white transition-colors rounded-lg hover:bg-white/5">
                <RefreshCw size={14} className={emailsLoading ? 'animate-spin' : ''} />
              </button>
            </div>
            {emailsLoading ? (
              <div className="space-y-2">
                {[1,2,3].map((i) => <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }} />)}
              </div>
            ) : emailLogs.length === 0 ? (
              <div className="text-center py-12 text-slate-600 text-sm">No emails sent yet</div>
            ) : (
              emailLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 rounded-2xl px-4 py-3 border"
                  style={{ background: 'rgba(255,255,255,0.02)', borderColor: log.status === 'failed' ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)' }}>
                  <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${log.status === 'failed' ? 'bg-red-400' : 'bg-green-400'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                        log.type === 'approval'     ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                        log.type === 'registration' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' :
                        'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                      }`}>{log.type}</span>
                      <p className="text-white text-sm font-medium truncate">{log.to_email}</p>
                    </div>
                    <p className="text-slate-500 text-xs mt-0.5 truncate">{log.subject}</p>
                    {log.error && <p className="text-red-400 text-xs mt-0.5">Error: {log.error}</p>}
                  </div>
                  <p className="text-slate-600 text-xs shrink-0">{fmtDate(log.created_at)}</p>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'gyms' && <>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Pending',   count: pending,   color: 'text-yellow-400', bg: 'rgba(250,204,21,0.08)',  border: 'rgba(250,204,21,0.15)' },
            { label: 'Active',    count: active,    color: 'text-green-400',  bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.15)'  },
            { label: 'Suspended', count: suspended, color: 'text-orange-400', bg: 'rgba(251,146,60,0.08)',  border: 'rgba(251,146,60,0.15)' },
            { label: 'Rejected',  count: rejected,  color: 'text-red-400',    bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.15)'  },
          ].map(({ label, count, color, bg, border }) => (
            <div key={label} className="rounded-2xl px-4 py-3 text-center"
              style={{ background: bg, border: `1px solid ${border}` }}>
              <p className={`text-2xl font-black ${color}`}>{count}</p>
              <p className="text-slate-400 text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {['pending', 'active', 'suspended', 'rejected', 'all'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-colors capitalize ${
                filter === f
                  ? 'bg-green-500/15 text-green-400 border border-green-500/30'
                  : 'text-slate-400 border border-white/8 hover:text-white hover:bg-white/5'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Gym list */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map((i) => (
              <div key={i} className="rounded-2xl p-4 animate-pulse h-24"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }} />
            ))}
          </div>
        ) : gyms.length === 0 ? (
          <div className="text-center py-16 text-slate-600">
            <Clock size={32} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">No {filter === 'all' ? '' : filter} gyms</p>
          </div>
        ) : (
          <div className="space-y-3">
            {gyms.map((gym) => {
              const s = STATUS_STYLES[gym.status] || STATUS_STYLES.pending;
              const isActing  = acting === gym.id;
              const isEditing = editingId === gym.id;
              return (
                <div key={gym.id}
                  className="rounded-2xl border overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.02)', borderColor: isEditing ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.07)' }}
                >
                  <div className="flex items-start gap-4 p-4">
                    {/* Icon */}
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.15)' }}>
                      <Dumbbell size={20} className="text-green-400" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-white font-bold">{gym.name}</p>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${s.bg} ${s.text} ${s.border}`}>
                          {s.label}
                        </span>
                      </div>
                      <p className="text-slate-500 text-xs mt-0.5 font-mono">madeforgyms.com/{gym.slug}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1.5">
                        {gym.owner_name && (
                          <span className="inline-flex items-center gap-1 text-slate-400 text-xs">
                            <User size={10} /> {gym.owner_name}
                          </span>
                        )}
                        {gym.owner_email && (
                          <span className="inline-flex items-center gap-1 text-slate-400 text-xs">
                            <Mail size={10} /> {gym.owner_email}
                          </span>
                        )}
                        {gym.owner_contact && (
                          <span className="inline-flex items-center gap-1 text-slate-400 text-xs">
                            <Phone size={10} /> {gym.owner_contact}
                          </span>
                        )}
                        {!gym.owner_name && !gym.owner_email && !gym.owner_contact && (
                          <span className="text-slate-600 text-xs italic">No owner info — click Edit</span>
                        )}
                      </div>
                      <p className="text-slate-600 text-xs mt-1">Registered {fmtDate(gym.created_at)}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                      <button
                        onClick={() => isEditing ? setEditingId(null) : openEdit(gym)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors border ${
                          isEditing
                            ? 'text-slate-400 border-slate-700 hover:bg-white/5'
                            : 'text-slate-300 border-white/10 hover:bg-white/5'
                        }`}
                      >
                        {isEditing ? <X size={13} /> : <Pencil size={13} />}
                        {isEditing ? 'Cancel' : 'Edit'}
                      </button>
                      {gym.status !== 'active' && gym.status !== 'suspended' && (
                        <button
                          onClick={() => setStatus(gym, 'active')}
                          disabled={isActing}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-green-400 border border-green-500/30 bg-green-500/10 hover:bg-green-500/20 transition-colors disabled:opacity-50"
                        >
                          {isActing ? <RefreshCw size={12} className="animate-spin" /> : <CheckCircle size={13} />}
                          Approve
                        </button>
                      )}
                      {gym.status === 'suspended' && (
                        <button
                          onClick={() => setStatus(gym, 'active')}
                          disabled={isActing}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-green-400 border border-green-500/30 bg-green-500/10 hover:bg-green-500/20 transition-colors disabled:opacity-50"
                        >
                          {isActing ? <RefreshCw size={12} className="animate-spin" /> : <PlayCircle size={13} />}
                          Unsuspend
                        </button>
                      )}
                      {gym.status === 'active' && (
                        <button
                          onClick={() => setStatus(gym, 'suspended')}
                          disabled={isActing}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-orange-400 border border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20 transition-colors disabled:opacity-50"
                        >
                          {isActing ? <RefreshCw size={12} className="animate-spin" /> : <PauseCircle size={13} />}
                          Suspend
                        </button>
                      )}
                      {gym.status !== 'rejected' && gym.status !== 'suspended' && gym.status !== 'active' && (
                        <button
                          onClick={() => setStatus(gym, 'rejected')}
                          disabled={isActing}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-red-400 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                        >
                          {isActing ? <RefreshCw size={12} className="animate-spin" /> : <XCircle size={13} />}
                          Reject
                        </button>
                      )}
                      {confirmDeleteId === gym.id ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-red-400 text-xs font-medium">Delete?</span>
                          <button
                            onClick={() => deleteGym(gym)}
                            disabled={deleting === gym.id}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50"
                          >
                            {deleting === gym.id ? <RefreshCw size={11} className="animate-spin" /> : 'Yes, delete'}
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-400 border border-white/10 hover:bg-white/5 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(gym.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ── Inline edit form ── */}
                  {isEditing && (
                    <div className="border-t border-white/5 px-4 py-4 space-y-3"
                      style={{ background: 'rgba(0,0,0,0.2)' }}>
                      <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Edit Info</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-500 text-xs mb-1">Gym Name</label>
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                            className="w-full bg-slate-800 border border-slate-700 focus:border-green-500 text-white rounded-xl px-3 py-2 outline-none text-sm transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 text-xs mb-1">Owner Name</label>
                          <input
                            type="text"
                            value={editForm.owner_name}
                            onChange={(e) => setEditForm((f) => ({ ...f, owner_name: e.target.value }))}
                            className="w-full bg-slate-800 border border-slate-700 focus:border-green-500 text-white rounded-xl px-3 py-2 outline-none text-sm transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 text-xs mb-1">Owner Email</label>
                          <input
                            type="email"
                            value={editForm.owner_email}
                            onChange={(e) => setEditForm((f) => ({ ...f, owner_email: e.target.value }))}
                            className="w-full bg-slate-800 border border-slate-700 focus:border-green-500 text-white rounded-xl px-3 py-2 outline-none text-sm transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 text-xs mb-1">Contact Number</label>
                          <input
                            type="text"
                            value={editForm.owner_contact}
                            onChange={(e) => setEditForm((f) => ({ ...f, owner_contact: e.target.value }))}
                            className="w-full bg-slate-800 border border-slate-700 focus:border-green-500 text-white rounded-xl px-3 py-2 outline-none text-sm transition-colors"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 border border-white/10 hover:bg-white/5 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => saveEdit(gym.id)}
                          disabled={saving}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-colors disabled:opacity-50"
                          style={{ background: 'linear-gradient(135deg, #16a34a, #4ade80)' }}
                        >
                          {saving ? <RefreshCw size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                          Save changes
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        </> }
      </div>
    </div>
  );
}
