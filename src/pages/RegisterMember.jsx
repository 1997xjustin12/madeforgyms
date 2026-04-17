import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Camera, User, Phone, Calendar, Tag, FileText, RefreshCw, Save, Trash2, AlertTriangle, History, Dumbbell } from 'lucide-react';
import { useGym } from '../context/GymContext';
import Navbar from '../components/Navbar';
import CameraCapture from '../components/CameraCapture';
import { MEMBERSHIP_OPTIONS } from '../context/GymContext';
import toast from 'react-hot-toast';

const today = () => new Date().toISOString().split('T')[0];

const addDays = (dateStr, days) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

const EMPTY_FORM = {
  name: '',
  contactNumber: '',
  membershipType: 'monthly',
  membershipStartDate: today(),
  notes: '',
  photo: null,
  instructorId: '',
  coachingPlan: '',
  coachingStartDate: today(),
  coachingEndDate: '',
};

export default function RegisterMember() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { addMember, updateMember, deleteMember, getMemberById, settings, instructors, gymSlug } = useGym();
  const activeInstructors = instructors.filter((i) => i.is_active);
  const activePromos = settings.promos?.filter((p) => p.active) || [];

  const [form, setForm] = useState(EMPTY_FORM);
  const [showCamera, setShowCamera] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isEdit && id) {
      const member = getMemberById(id);
      if (member) {
        setForm({
          name: member.name,
          contactNumber: member.contactNumber,
          membershipType: member.membershipType,
          membershipStartDate: member.membershipStartDate,
          notes: member.notes || '',
          photo: member.photo || null,
          instructorId: member.instructorId || '',
          coachingPlan: member.coachingPlan || '',
          coachingStartDate: member.coachingStartDate || today(),
          coachingEndDate: member.coachingEndDate || '',
        });
      } else {
        toast.error('Member not found');
        navigate(`/${gymSlug}/admin/members`);
      }
    }
  }, [id, isEdit]); // eslint-disable-line

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Name is required');
    if (!form.contactNumber.trim()) return toast.error('Contact number is required');

    setSaving(true);
    try {
      if (isEdit) {
        await updateMember(id, form);
        toast.success('Member updated!');
      } else {
        await addMember(form);
        toast.success('Member registered!');
      }
      navigate(`/${gymSlug}/admin/members`);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteMember(id);
      toast.success('Member deleted.');
      navigate(`/${gymSlug}/admin/members`);
    } catch (err) {
      toast.error(err.message || 'Failed to delete member.');
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleRenew = () => {
    set('membershipStartDate', today());
    toast.success('Start date updated to today!');
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar title={isEdit ? 'Edit Member' : 'Register Member'} showBack />

      <div className="max-w-lg mx-auto px-4 py-6 pb-24 sm:pb-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Photo section */}
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="relative">
              <div className="w-28 h-28 rounded-2xl overflow-hidden bg-slate-800 border-2 border-slate-700 flex items-center justify-center">
                {form.photo ? (
                  <img src={form.photo} alt="Member" className="w-full h-full object-cover" />
                ) : (
                  <User size={40} className="text-slate-600" />
                )}
              </div>
              {form.photo && (
                <button
                  type="button"
                  onClick={() => set('photo', null)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowCamera(true)}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              <Camera size={16} /> {form.photo ? 'Retake Photo' : 'Take Photo'}
            </button>
          </div>

          {/* Form fields */}
          <div className="space-y-4">
            {/* Name */}
            <FormField label="Full Name" icon={<User size={15} />}>
              <input
                type="text"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="e.g. Juan dela Cruz"
                required
                className="input-field"
              />
            </FormField>

            {/* Contact */}
            <FormField label="Contact Number" icon={<Phone size={15} />}>
              <input
                type="tel"
                value={form.contactNumber}
                onChange={(e) => set('contactNumber', e.target.value)}
                placeholder="e.g. 09171234567"
                required
                className="input-field"
              />
            </FormField>

            {/* Membership Type */}
            <FormField label="Membership Plan" icon={<Tag size={15} />}>
              <select
                value={form.membershipType}
                onChange={(e) => set('membershipType', e.target.value)}
                className="input-field"
              >
                <optgroup label="Standard Plans">
                  {MEMBERSHIP_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </optgroup>
                {settings.priceStudent > 0 && (
                  <optgroup label="Student">
                    <option value="student">Student (30 days)</option>
                  </optgroup>
                )}
                {activePromos.length > 0 && (
                  <optgroup label="Special Promos">
                    {activePromos.map((promo) => (
                      <option key={promo.id} value={promo.name}>
                        {promo.name} ({promo.duration_days} days)
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </FormField>

            {/* Student ID reminder */}
            {form.membershipType === 'student' && (
              <div className="flex items-start gap-2.5 bg-sky-500/10 border border-sky-500/30 rounded-xl px-4 py-3">
                <span className="text-sky-400 text-base shrink-0">🎓</span>
                <p className="text-sky-300 text-xs leading-relaxed">
                  Student membership requires a valid school ID. Please verify upon visit.
                </p>
              </div>
            )}

            {/* Start Date */}
            <FormField label="Membership Start Date" icon={<Calendar size={15} />}>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={form.membershipStartDate}
                  onChange={(e) => set('membershipStartDate', e.target.value)}
                  required
                  className="input-field flex-1"
                />
                {isEdit && (
                  <button
                    type="button"
                    onClick={handleRenew}
                    title="Set to today (renew)"
                    className="flex items-center gap-1.5 bg-orange-500/20 hover:bg-orange-500/40 text-orange-400 px-3 rounded-xl text-sm font-medium transition-colors shrink-0"
                  >
                    <RefreshCw size={14} /> Renew
                  </button>
                )}
              </div>
              <p className="text-slate-500 text-xs mt-1.5">
                {isEdit ? 'Click "Renew" to restart membership from today' : 'Date when membership begins'}
              </p>
            </FormField>

            {/* Notes */}
            <FormField label="Notes (optional)" icon={<FileText size={15} />}>
              <textarea
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
                placeholder="Additional notes..."
                rows={3}
                className="input-field resize-none"
              />
            </FormField>

            {/* Coach / Instructor */}
            {activeInstructors.length > 0 && (
              <FormField label="Gym Coach (optional)" icon={<Dumbbell size={15} />}>
                <select
                  value={form.instructorId}
                  onChange={(e) => {
                    set('instructorId', e.target.value);
                    if (!e.target.value) {
                      set('coachingPlan', '');
                      set('coachingEndDate', '');
                    }
                  }}
                  className="input-field"
                >
                  <option value="">— No coach assigned —</option>
                  {activeInstructors.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name}{inst.specialty ? ` · ${inst.specialty}` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-slate-500 text-xs mt-1.5">
                  Assign a personal trainer for this member
                </p>
              </FormField>
            )}

            {/* Coaching package — visible only when a coach is assigned */}
            {form.instructorId && (
              <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-4 space-y-3">
                <p className="text-yellow-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Dumbbell size={12} /> Coaching Subscription
                </p>

                {/* Plan picker */}
                {settings.coachingPlans?.length > 0 ? (
                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-1.5">Package</label>
                    <select
                      value={form.coachingPlan}
                      onChange={(e) => {
                        const planName = e.target.value;
                        set('coachingPlan', planName);
                        const plan = settings.coachingPlans.find((p) => p.name === planName);
                        if (plan && form.coachingStartDate) {
                          set('coachingEndDate', addDays(form.coachingStartDate, plan.duration_days));
                        } else {
                          set('coachingEndDate', '');
                        }
                      }}
                      className="input-field"
                    >
                      <option value="">— Select a coaching package —</option>
                      {settings.coachingPlans.map((p) => (
                        <option key={p.id} value={p.name}>
                          {p.name} — ₱{Number(p.price).toLocaleString()} ({p.duration_days} days)
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <p className="text-slate-500 text-xs">No coaching packages set up yet. Add them in Settings → Coaching Packages.</p>
                )}

                {/* Coaching dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-1.5">Start Date</label>
                    <input
                      type="date"
                      value={form.coachingStartDate}
                      onChange={(e) => {
                        set('coachingStartDate', e.target.value);
                        const plan = settings.coachingPlans?.find((p) => p.name === form.coachingPlan);
                        if (plan && e.target.value) {
                          set('coachingEndDate', addDays(e.target.value, plan.duration_days));
                        }
                      }}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-1.5">End Date</label>
                    <input
                      type="date"
                      value={form.coachingEndDate}
                      onChange={(e) => set('coachingEndDate', e.target.value)}
                      className="input-field"
                    />
                    <p className="text-slate-600 text-xs mt-1">Auto-set by package, or override manually</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-colors text-base"
          >
            {saving ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save size={18} /> {isEdit ? 'Save Changes' : 'Register Member'}
              </>
            )}
          </button>

          {/* Edit-mode actions */}
          {isEdit && (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate(`/${gymSlug}/admin/members/${id}/history`)}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold py-3.5 rounded-2xl transition-colors text-sm"
              >
                <History size={16} /> View History
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex-1 flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-bold py-3.5 rounded-2xl transition-colors text-sm"
              >
                <Trash2 size={16} /> Delete
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-sm border border-slate-700 shadow-2xl">
            <div className="px-5 py-4 border-b border-slate-700 flex items-center gap-3">
              <div className="w-9 h-9 bg-red-500/20 rounded-xl flex items-center justify-center shrink-0">
                <AlertTriangle size={18} className="text-red-400" />
              </div>
              <div>
                <h3 className="text-white font-bold">Delete Member</h3>
                <p className="text-slate-400 text-sm">{form.name}</p>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-slate-300 text-sm">
                This will permanently delete this member and their photo. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-medium text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {deleting
                    ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <><Trash2 size={14} /> Delete</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Camera Modal */}
      {showCamera && (
        <CameraCapture
          onCapture={(photo) => set('photo', photo)}
          onClose={() => setShowCamera(false)}
        />
      )}

      <style>{`
        .input-field {
          width: 100%;
          background: #1e293b;
          border: 1px solid #334155;
          color: #f1f5f9;
          border-radius: 0.75rem;
          padding: 0.75rem 1rem;
          outline: none;
          font-size: 0.875rem;
          transition: border-color 0.15s;
        }
        .input-field:focus {
          border-color: rgba(249, 115, 22, 0.6);
        }
        .input-field::placeholder {
          color: #475569;
        }
        .input-field option {
          background: #1e293b;
        }
      `}</style>
    </div>
  );
}

function FormField({ label, icon, children }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-slate-300 text-sm font-medium mb-2">
        <span className="text-slate-500">{icon}</span>
        {label}
      </label>
      {children}
    </div>
  );
}
