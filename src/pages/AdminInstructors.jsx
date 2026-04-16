import { useState } from 'react';
import {
  Dumbbell, Plus, Pencil, Trash2, Camera, User, Phone, Mail,
  FileText, Copy, ToggleLeft, ToggleRight, Users, AlertTriangle, KeyRound,
} from 'lucide-react';
import { useGym } from '../context/GymContext';
import Navbar from '../components/Navbar';
import CameraCapture from '../components/CameraCapture';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const EMPTY_FORM = { name: '', specialty: '', contactNumber: '', email: '', bio: '', photo: null, accessCode: '' };

export default function AdminInstructors() {
  const { instructors, members, addInstructor, updateInstructor, deleteInstructor, toggleInstructor, settings } = useGym();

  const [showModal, setShowModal]       = useState(false);
  const [editTarget, setEditTarget]     = useState(null);
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [showCamera, setShowCamera]     = useState(false);
  const [saving, setSaving]             = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);
  const [savingCode, setSavingCode]     = useState(null);  // instructor id being saved
  const [codeInputs, setCodeInputs]     = useState({});    // { [instId]: string }

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const openAdd = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (inst) => {
    setEditTarget(inst);
    setForm({
      name:          inst.name,
      specialty:     inst.specialty || '',
      contactNumber: inst.contact_number || '',
      email:         inst.email || '',
      bio:           inst.bio || '',
      photo:         inst.photo_url || null,
      accessCode:    inst.access_code || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Name is required');
    setSaving(true);
    try {
      if (editTarget) {
        await updateInstructor(editTarget.id, form);
        toast.success('Instructor updated!');
      } else {
        await addInstructor(form);
        toast.success('Instructor added!');
      }
      setShowModal(false);
    } catch (err) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteInstructor(deleteTarget.id);
      toast.success(`${deleteTarget.name} removed`);
      setDeleteTarget(null);
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  // Inline access code save
  const handleSaveCode = async (inst) => {
    const newCode = (codeInputs[inst.id] ?? inst.access_code ?? '').trim().toUpperCase();
    if (!newCode) return toast.error('Access code cannot be empty');
    setSavingCode(inst.id);
    try {
      const { error } = await supabase
        .from('instructors')
        .update({ access_code: newCode })
        .eq('id', inst.id);
      if (error) throw error;
      // Optimistically update local state via toggleInstructor trick — just reload
      toast.success(`Code set to "${newCode}"`);
      // Clear the input so it shows the saved value
      setCodeInputs((prev) => { const n = { ...prev }; delete n[inst.id]; return n; });
    } catch (err) {
      toast.error(err.message.includes('unique') ? 'This code is already used by another coach' : 'Failed to save code');
    } finally {
      setSavingCode(null);
    }
  };

  const handleCopyCode = (inst) => {
    if (!inst.access_code) return toast.error('Set an access code first');
    navigator.clipboard.writeText(inst.access_code);
    toast.success(`Code "${inst.access_code}" copied!`);
  };

  const assignedCount = (instId) => members.filter((m) => m.instructorId === instId).length;
  const portalUrl = (settings.siteUrl || window.location.origin).replace(/\/$/, '') + '/coach';

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar title="Instructors" showBack />

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4 pb-24 sm:pb-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Gym Instructors</h1>
            <p className="text-slate-400 text-sm">{instructors.length} coach{instructors.length !== 1 ? 'es' : ''} registered</p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors"
          >
            <Plus size={16} /> Add Coach
          </button>
        </div>

        {/* Coach portal URL hint */}
        <div className="flex items-center gap-3 bg-slate-800 rounded-xl border border-slate-700/50 px-4 py-3">
          <KeyRound size={16} className="text-yellow-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-slate-300 text-sm">Coach login page:</p>
            <p className="text-yellow-400 text-xs font-mono truncate">{portalUrl}</p>
          </div>
          <button
            onClick={() => { navigator.clipboard.writeText(portalUrl); toast.success('URL copied!'); }}
            className="text-slate-400 hover:text-white transition-colors shrink-0"
          >
            <Copy size={14} />
          </button>
        </div>

        {/* List */}
        {instructors.length === 0 ? (
          <div className="text-center py-16 bg-slate-800/40 rounded-2xl border border-slate-700/30">
            <div className="w-16 h-16 bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Dumbbell size={28} className="text-slate-500" />
            </div>
            <p className="text-slate-300 font-semibold">No instructors yet</p>
            <p className="text-slate-500 text-sm mt-1">Add your first gym coach to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {instructors.map((inst) => {
              const currentCode = codeInputs[inst.id] ?? inst.access_code ?? '';
              const codeChanged = (codeInputs[inst.id] !== undefined) && (codeInputs[inst.id].toUpperCase() !== (inst.access_code || ''));
              return (
                <div
                  key={inst.id}
                  className={`bg-slate-800 rounded-2xl border p-4 transition-opacity ${
                    inst.is_active ? 'border-slate-700/50' : 'border-slate-700/30 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-700 shrink-0">
                      {inst.photo_url ? (
                        <img src={inst.photo_url} alt={inst.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-yellow-400 font-bold text-xl">
                          {inst.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-white font-bold">{inst.name}</p>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          inst.is_active ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'
                        }`}>
                          {inst.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      {inst.specialty && <p className="text-yellow-400 text-sm mt-0.5">{inst.specialty}</p>}
                      {inst.email && (
                        <p className="text-slate-400 text-xs mt-0.5 flex items-center gap-1">
                          <Mail size={11} /> {inst.email}
                        </p>
                      )}
                      {inst.contact_number && (
                        <p className="text-slate-400 text-xs flex items-center gap-1">
                          <Phone size={11} /> {inst.contact_number}
                        </p>
                      )}
                      {inst.bio && <p className="text-slate-500 text-xs mt-1 line-clamp-2">{inst.bio}</p>}

                      <div className="flex items-center gap-1.5 mt-2">
                        <Users size={12} className="text-slate-500" />
                        <span className="text-slate-400 text-xs">
                          {assignedCount(inst.id)} assigned member{assignedCount(inst.id) !== 1 ? 's' : ''}
                        </span>
                      </div>

                      {/* Access code row */}
                      <div className="mt-3 flex items-center gap-2">
                        <KeyRound size={13} className="text-slate-500 shrink-0" />
                        <input
                          value={currentCode}
                          onChange={(e) => setCodeInputs((prev) => ({ ...prev, [inst.id]: e.target.value.toUpperCase() }))}
                          placeholder="Set access code"
                          maxLength={12}
                          className="flex-1 bg-slate-700 border border-slate-600 focus:border-yellow-500 text-white rounded-lg px-3 py-1.5 outline-none text-sm font-mono tracking-widest placeholder:text-slate-500 placeholder:font-sans placeholder:tracking-normal transition-colors"
                        />
                        {codeChanged && (
                          <button
                            onClick={() => handleSaveCode(inst)}
                            disabled={savingCode === inst.id}
                            className="bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shrink-0"
                          >
                            {savingCode === inst.id ? '...' : 'Save'}
                          </button>
                        )}
                        {inst.access_code && !codeChanged && (
                          <button
                            onClick={() => handleCopyCode(inst)}
                            title="Copy access code"
                            className="text-slate-400 hover:text-white transition-colors p-1.5 shrink-0"
                          >
                            <Copy size={13} />
                          </button>
                        )}
                      </div>
                      {inst.access_code && !codeChanged && (
                        <p className="text-slate-600 text-xs mt-1 ml-5">
                          Coach logs in at <span className="text-slate-500">/coach</span> using this code
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 shrink-0">
                      <button
                        onClick={() => toggleInstructor(inst.id, inst.is_active)}
                        title={inst.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {inst.is_active
                          ? <ToggleRight size={24} className="text-yellow-400" />
                          : <ToggleLeft size={24} className="text-slate-500" />}
                      </button>
                      <button
                        onClick={() => openEdit(inst)}
                        className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(inst)}
                        className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-800 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md border border-slate-700 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between sticky top-0 bg-slate-800 z-10">
              <h3 className="text-white font-bold text-lg">{editTarget ? 'Edit Instructor' : 'Add Instructor'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white text-xl leading-none">✕</button>
            </div>

            <div className="p-5 space-y-4">
              {/* Photo */}
              <div className="flex flex-col items-center gap-3 py-2">
                <div className="relative">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-700 flex items-center justify-center">
                    {form.photo
                      ? <img src={form.photo} alt="Coach" className="w-full h-full object-cover" />
                      : <User size={32} className="text-slate-500" />}
                  </div>
                  {form.photo && (
                    <button
                      onClick={() => set('photo', null)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setShowCamera(true)}
                  className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-300 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                >
                  <Camera size={15} /> {form.photo ? 'Retake Photo' : 'Add Photo'}
                </button>
              </div>

              <Field label="Full Name *" icon={<User size={14} />}>
                <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. John Santos" className="modal-input" />
              </Field>
              <Field label="Specialty" icon={<Dumbbell size={14} />}>
                <input value={form.specialty} onChange={(e) => set('specialty', e.target.value)} placeholder="e.g. Strength & Conditioning" className="modal-input" />
              </Field>
              <Field label="Contact Number" icon={<Phone size={14} />}>
                <input type="tel" value={form.contactNumber} onChange={(e) => set('contactNumber', e.target.value)} placeholder="09XXXXXXXXX" className="modal-input" />
              </Field>
              <Field label="Email" icon={<Mail size={14} />}>
                <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="coach@email.com" className="modal-input" />
              </Field>
              <Field label="Bio" icon={<FileText size={14} />}>
                <textarea value={form.bio} onChange={(e) => set('bio', e.target.value)} placeholder="Brief introduction..." rows={3} className="modal-input resize-none" />
              </Field>
              <Field label="Access Code" icon={<KeyRound size={14} />}>
                <input
                  value={form.accessCode}
                  onChange={(e) => set('accessCode', e.target.value.toUpperCase())}
                  placeholder="e.g. JOHN01 or 1234"
                  maxLength={12}
                  className="modal-input font-mono tracking-widest"
                />
                <p className="text-slate-500 text-xs mt-1">Coach uses this code to log in at /coach</p>
              </Field>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !form.name.trim()}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center"
                >
                  {saving
                    ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : editTarget ? 'Save Changes' : 'Add Coach'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-sm border border-slate-700 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center shrink-0">
                <AlertTriangle size={20} className="text-red-400" />
              </div>
              <div>
                <h3 className="text-white font-bold">Remove Instructor?</h3>
                <p className="text-slate-400 text-sm">{deleteTarget.name}</p>
              </div>
            </div>
            <p className="text-slate-400 text-sm">
              Members assigned to this coach will be unassigned but their records stay intact.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} disabled={deleting} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-medium transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center">
                {deleting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCamera && (
        <CameraCapture onCapture={(photo) => set('photo', photo)} onClose={() => setShowCamera(false)} />
      )}

      <style>{`
        .modal-input {
          width: 100%; background: #1e293b; border: 1px solid #334155;
          color: #f1f5f9; border-radius: 0.75rem; padding: 0.625rem 0.875rem;
          outline: none; font-size: 0.875rem; transition: border-color 0.15s;
        }
        .modal-input:focus { border-color: rgba(234,179,8,0.6); }
        .modal-input::placeholder { color: #475569; }
      `}</style>
    </div>
  );
}

function Field({ label, icon, children }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-slate-300 text-sm font-medium mb-1.5">
        <span className="text-slate-500">{icon}</span> {label}
      </label>
      {children}
    </div>
  );
}
