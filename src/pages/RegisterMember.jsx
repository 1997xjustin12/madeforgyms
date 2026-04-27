import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Camera, User, Phone, Calendar, Tag, FileText, RefreshCw, Save, Trash2, AlertTriangle, History, Dumbbell, ChevronRight } from 'lucide-react';
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

const PLAN_PRICE_KEY = {
  monthly: 'priceMonthly', quarterly: 'priceQuarterly',
  'semi-annual': 'priceSemiAnnual', annual: 'priceAnnual', student: 'priceStudent',
};

export default function RegisterMember() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { addMember, updateMember, deleteMember, getMemberById, settings, instructors, gymSlug, isStaff, isAdmin, submitPendingMembership } = useGym();
  const activeInstructors = instructors.filter((i) => i.is_active);
  const activePromos = settings.promos?.filter((p) => p.active) || [];

  const availablePlans = [
    ...MEMBERSHIP_OPTIONS.filter((opt) => (settings[PLAN_PRICE_KEY[opt.value]] || 0) > 0),
    ...(settings.priceStudent > 0 ? [{ value: 'student', label: 'Student' }] : []),
    ...activePromos.map((p) => ({ value: p.name, label: p.name, promo: true, days: p.duration_days })),
  ];

  const [form, setForm] = useState(EMPTY_FORM);
  const [showCamera, setShowCamera] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isEdit && isStaff) {
      toast.error('Staff cannot edit member records.');
      navigate(`/${gymSlug}/admin/members`);
      return;
    }
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
        navigate(`/${gymSlug}/admin/members`);
      } else if (isStaff) {
        await submitPendingMembership('new_member', form, form.name.trim());
        toast.success('Submitted for admin approval!');
        navigate(`/${gymSlug}/admin`);
      } else {
        await addMember(form);
        toast.success('Member registered!');
        navigate(`/${gymSlug}/admin/members`);
      }
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

  const selectedPrice = settings[PLAN_PRICE_KEY[form.membershipType]] || 0;

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar title={isEdit ? 'Edit Member' : 'Register Member'} showBack />

      <div className="max-w-lg mx-auto px-4 py-5 pb-28 sm:pb-8">
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Photo */}
          <div className="flex justify-center py-2">
            <button type="button" onClick={() => setShowCamera(true)} className="relative group">
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-800 border-2 border-slate-700 group-hover:border-orange-500/60 transition-colors flex items-center justify-center">
                {form.photo
                  ? <img src={form.photo} alt="Member" className="w-full h-full object-cover" />
                  : <User size={36} className="text-slate-600" />}
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                <Camera size={15} className="text-white" />
              </div>
            </button>
          </div>

          {/* Member Info */}
          <div className="bg-slate-800/60 rounded-2xl border border-slate-700/50 divide-y divide-slate-700/50">
            <div className="px-4 py-3.5">
              <label className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="e.g. Juan dela Cruz"
                required
                className="w-full bg-transparent text-white text-sm font-medium mt-1 outline-none placeholder:text-slate-600"
              />
            </div>
            <div className="px-4 py-3.5">
              <label className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">Contact Number</label>
              <input
                type="tel"
                value={form.contactNumber}
                onChange={(e) => set('contactNumber', e.target.value)}
                placeholder="e.g. 09171234567"
                required
                className="w-full bg-transparent text-white text-sm font-medium mt-1 outline-none placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* Membership Plan */}
          <div className="bg-slate-800/60 rounded-2xl border border-slate-700/50 p-4 space-y-3">
            <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">Membership Plan</p>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
              {availablePlans.map((opt) => {
                const price = settings[PLAN_PRICE_KEY[opt.value]] || 0;
                const selected = form.membershipType === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => set('membershipType', opt.value)}
                    className={`shrink-0 flex flex-col items-center px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      selected
                        ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                        : 'bg-slate-700/60 text-slate-400 border border-slate-600/50'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {price > 0 && (
                      <span className={`text-[10px] font-medium mt-0.5 ${selected ? 'text-orange-100' : 'text-slate-500'}`}>
                        ₱{price.toLocaleString()}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {form.membershipType === 'student' && (
              <div className="flex items-center gap-2 bg-sky-500/10 border border-sky-500/20 rounded-xl px-3 py-2">
                <span className="text-base">🎓</span>
                <p className="text-sky-300 text-xs">Requires a valid school ID upon visit.</p>
              </div>
            )}
          </div>

          {/* Start Date */}
          <div className="bg-slate-800/60 rounded-2xl border border-slate-700/50 divide-y divide-slate-700/50">
            <div className="px-4 py-3.5">
              <label className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">Membership Start Date</label>
              <input
                type="date"
                value={form.membershipStartDate}
                onChange={(e) => set('membershipStartDate', e.target.value)}
                required
                className="w-full bg-transparent text-white text-sm font-medium mt-1 outline-none"
              />
            </div>
            {isEdit && (
              <button
                type="button"
                onClick={handleRenew}
                className="w-full flex items-center justify-center gap-2 text-orange-400 hover:bg-orange-500/10 py-3 rounded-b-2xl text-sm font-semibold transition-colors"
              >
                <RefreshCw size={13} /> Set to Today
              </button>
            )}
          </div>

          {/* Notes */}
          <div className="bg-slate-800/60 rounded-2xl border border-slate-700/50 px-4 py-3.5">
            <label className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Optional notes..."
              rows={2}
              className="w-full bg-transparent text-white text-sm mt-1 outline-none resize-none placeholder:text-slate-600"
            />
          </div>

          {/* Coach */}
          {activeInstructors.length > 0 && (
            <div className="bg-slate-800/60 rounded-2xl border border-slate-700/50 px-4 py-3.5">
              <label className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">Gym Coach</label>
              <select
                value={form.instructorId}
                onChange={(e) => {
                  set('instructorId', e.target.value);
                  if (!e.target.value) { set('coachingPlan', ''); set('coachingEndDate', ''); }
                }}
                className="w-full bg-transparent text-white text-sm font-medium mt-1 outline-none"
              >
                <option value="" className="bg-slate-800">— No coach assigned —</option>
                {activeInstructors.map((inst) => (
                  <option key={inst.id} value={inst.id} className="bg-slate-800">
                    {inst.name}{inst.specialty ? ` · ${inst.specialty}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Coaching package */}
          {form.instructorId && (
            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-4 space-y-3">
              <p className="text-yellow-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Dumbbell size={11} /> Coaching Subscription
              </p>
              {settings.coachingPlans?.length > 0 ? (
                <div>
                  <label className="text-slate-400 text-xs font-medium mb-1.5 block">Package</label>
                  <select
                    value={form.coachingPlan}
                    onChange={(e) => {
                      const planName = e.target.value;
                      set('coachingPlan', planName);
                      const plan = settings.coachingPlans.find((p) => p.name === planName);
                      if (plan && form.coachingStartDate) set('coachingEndDate', addDays(form.coachingStartDate, plan.duration_days));
                      else set('coachingEndDate', '');
                    }}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm outline-none"
                  >
                    <option value="">— Select package —</option>
                    {settings.coachingPlans.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name} — ₱{Number(p.price).toLocaleString()} ({p.duration_days} days)
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <p className="text-slate-500 text-xs">No coaching packages set up yet.</p>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 text-xs font-medium mb-1.5 block">Start Date</label>
                  <input type="date" value={form.coachingStartDate}
                    onChange={(e) => {
                      set('coachingStartDate', e.target.value);
                      const plan = settings.coachingPlans?.find((p) => p.name === form.coachingPlan);
                      if (plan && e.target.value) set('coachingEndDate', addDays(e.target.value, plan.duration_days));
                    }}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm outline-none" />
                </div>
                <div>
                  <label className="text-slate-400 text-xs font-medium mb-1.5 block">End Date</label>
                  <input type="date" value={form.coachingEndDate}
                    onChange={(e) => set('coachingEndDate', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm outline-none" />
                </div>
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-colors text-base shadow-lg shadow-orange-500/20"
          >
            {saving
              ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <><Save size={18} /> {isEdit ? 'Save Changes' : isStaff ? 'Submit for Approval' : 'Register Member'}</>}
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
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-medium text-sm"
                >Cancel</button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                >
                  {deleting
                    ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <><Trash2 size={14} /> Delete</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCamera && (
        <CameraCapture
          onCapture={(photo) => set('photo', photo)}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
}
