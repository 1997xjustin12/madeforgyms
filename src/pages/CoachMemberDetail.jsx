import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { differenceInDays } from 'date-fns';
import {
  ArrowLeft, Plus, Trash2, FileText, Dumbbell,
  UtensilsCrossed, AlertTriangle, Pencil, ChevronDown,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const TABS = [
  { key: 'note',      label: 'Notes',           Icon: FileText,        color: 'text-sky-400',    bg: 'bg-sky-500/15',    border: 'border-sky-500/30',    accent: 'bg-sky-500'    },
  { key: 'workout',   label: 'Workout Program',  Icon: Dumbbell,        color: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/30', accent: 'bg-orange-500' },
  { key: 'meal_plan', label: 'Meal Plan',        Icon: UtensilsCrossed, color: 'text-green-400',  bg: 'bg-green-500/15',  border: 'border-green-500/30',  accent: 'bg-green-500'  },
];

function getStatus(endDate) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const end   = new Date(endDate); end.setHours(0, 0, 0, 0);
  const d     = differenceInDays(end, today);
  if (d < 0)  return { label: 'Expired',           color: 'text-red-400',    bg: 'bg-red-500/15'    };
  if (d <= 5) return { label: `Expires in ${d}d`,  color: 'text-orange-400', bg: 'bg-orange-500/15' };
  return               { label: `${d} days left`,  color: 'text-green-400',  bg: 'bg-green-500/15'  };
}

function fmtDate(str) {
  return new Date(str).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function CoachMemberDetail() {
  const { code, memberId } = useParams();
  const navigate = useNavigate();

  const [instructor, setInstructor] = useState(null);
  const [member, setMember]         = useState(null);
  const [entries, setEntries]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [notFound, setNotFound]     = useState(false);
  const [activeTab, setActiveTab]   = useState('note');

  // Form state
  const [showForm, setShowForm]     = useState(false);
  const [editEntry, setEditEntry]   = useState(null);
  const [formTitle, setFormTitle]   = useState('');
  const [formContent, setFormContent] = useState('');
  const [saving, setSaving]         = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);
  const [expandedId, setExpandedId]     = useState(null);

  useEffect(() => {
    const load = async () => {
      // Verify coach token
      const { data: inst, error: instErr } = await supabase
        .from('instructors')
        .select('id, name, photo_url, specialty')
        .eq('access_code', code.toUpperCase())
        .single();
      if (instErr || !inst) { setNotFound(true); setLoading(false); return; }
      setInstructor(inst);

      // Load member (must belong to this coach)
      const { data: mem, error: memErr } = await supabase
        .from('members')
        .select('*')
        .eq('id', memberId)
        .eq('instructor_id', inst.id)
        .single();
      if (memErr || !mem) { setNotFound(true); setLoading(false); return; }
      setMember(mem);

      // Load all entries for this coach + member
      const { data: ents } = await supabase
        .from('coach_entries')
        .select('*')
        .eq('instructor_id', inst.id)
        .eq('member_id', memberId)
        .order('created_at', { ascending: false });
      setEntries(ents || []);
      setLoading(false);
    };
    load();
  }, [code, memberId]);

  const openAdd = () => {
    setEditEntry(null);
    setFormTitle('');
    setFormContent('');
    setShowForm(true);
  };

  const openEdit = (entry) => {
    setEditEntry(entry);
    setFormTitle(entry.title || '');
    setFormContent(entry.content);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formContent.trim()) return toast.error('Content is required');
    setSaving(true);
    try {
      if (editEntry) {
        const { data, error } = await supabase
          .from('coach_entries')
          .update({
            title:      formTitle.trim(),
            content:    formContent.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', editEntry.id)
          .select()
          .single();
        if (error) throw error;
        setEntries((prev) => prev.map((e) => e.id === editEntry.id ? data : e));
        toast.success('Updated!');
      } else {
        const { data, error } = await supabase
          .from('coach_entries')
          .insert([{
            instructor_id: instructor.id,
            member_id:     member.id,
            type:          activeTab,
            title:         formTitle.trim(),
            content:       formContent.trim(),
          }])
          .select()
          .single();
        if (error) throw error;
        setEntries((prev) => [data, ...prev]);
        toast.success('Added!');
      }
      setShowForm(false);
    } catch (err) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase.from('coach_entries').delete().eq('id', deleteTarget.id);
      if (error) throw error;
      setEntries((prev) => prev.filter((e) => e.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success('Deleted');
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-4 px-4 text-center">
      <AlertTriangle size={40} className="text-orange-400" />
      <p className="text-white font-bold text-lg">Member not found</p>
      <p className="text-slate-400 text-sm">This member may not be assigned to you.</p>
    </div>
  );

  const statusInfo    = getStatus(member.membership_end_date);
  const tab           = TABS.find((t) => t.key === activeTab);
  const tabEntries    = entries.filter((e) => e.type === activeTab);

  return (
    <div className="min-h-screen bg-slate-900 pb-10">
      <Toaster position="top-center" toastOptions={{
        style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155', borderRadius: '12px' },
      }} />

      {/* Header */}
      <div className="bg-slate-900/95 border-b border-slate-800 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white p-1">
            <ArrowLeft size={20} />
          </button>
          <span className="font-bold text-white truncate">{member.name}</span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">

        {/* Member card */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700/50 p-4 flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-700 shrink-0">
            {member.photo_url ? (
              <img src={member.photo_url} alt={member.name} className="w-full h-full object-cover" />
            ) : (
              <div className={`w-full h-full flex items-center justify-center font-bold text-2xl ${statusInfo.color}`}>
                {member.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold">{member.name}</p>
            <p className="text-slate-400 text-sm capitalize">{member.membership_type} plan</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusInfo.bg} ${statusInfo.color}`}>
                Gym: {statusInfo.label}
              </span>
            </div>
            {member.coaching_end_date && (() => {
              const today = new Date(); today.setHours(0,0,0,0);
              const end = new Date(member.coaching_end_date); end.setHours(0,0,0,0);
              const days = Math.ceil((end - today) / 86400000);
              const isExpired  = days < 0;
              const isToday    = days === 0;
              const isExpiring = !isExpired && !isToday && days <= 5;
              const badgeClass = isExpired ? 'bg-red-500/15 text-red-400' : isToday ? 'bg-yellow-500/15 text-yellow-400' : isExpiring ? 'bg-orange-500/15 text-orange-400' : 'bg-yellow-500/15 text-yellow-400';
              const label = isExpired ? `Coaching expired ${Math.abs(days)}d ago` : isToday ? 'Coaching active · expires today' : `Coaching: ${days}d left`;
              return (
                <div className={`mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${badgeClass}`}>
                  <Dumbbell size={10} />
                  {member.coaching_plan && <span>{member.coaching_plan} · </span>}
                  {label}
                </div>
              );
            })()}
            {member.notes && (
              <p className="text-slate-500 text-xs mt-1.5 line-clamp-2 italic">{member.notes}</p>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {TABS.map(({ key, label, Icon, color, bg, border }) => {
            const count   = entries.filter((e) => e.type === key).length;
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => { setActiveTab(key); setExpandedId(null); }}
                className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-semibold transition-colors border ${
                  isActive ? `${bg} ${color} ${border}` : 'bg-slate-800 text-slate-400 border-slate-700/50'
                }`}
              >
                <Icon size={17} />
                <span className="hidden sm:block leading-tight text-center">{label}</span>
                <span className="sm:hidden">{label.split(' ')[0]}</span>
                {count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full leading-none ${isActive ? bg : 'bg-slate-700 text-slate-400'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Entries */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-slate-400 text-sm">
              {tabEntries.length} {tab.label.toLowerCase()}
            </p>
            <button
              onClick={openAdd}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold ${tab.bg} ${tab.color} transition-colors`}
            >
              <Plus size={13} /> Add
            </button>
          </div>

          {tabEntries.length === 0 ? (
            <div className="text-center py-10 bg-slate-800/40 rounded-2xl border border-slate-700/30">
              <tab.Icon size={28} className="mx-auto text-slate-600 mb-2" />
              <p className="text-slate-500 text-sm">No {tab.label.toLowerCase()} yet</p>
              <p className="text-slate-600 text-xs mt-1">Tap "Add" to create one</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tabEntries.map((entry, idx) => {
                const isExpanded = expandedId === entry.id;
                return (
                  <div key={entry.id} className={`rounded-2xl border overflow-hidden transition-all ${
                    isExpanded ? `${tab.bg} ${tab.border}` : 'bg-slate-800 border-slate-700/50'
                  }`}>
                    {/* Row header — tap to expand */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        isExpanded ? 'bg-white/10' : 'bg-slate-700'
                      }`}>
                        <tab.Icon size={14} className={isExpanded ? tab.color : 'text-slate-400'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        {entry.title ? (
                          <p className={`font-semibold text-sm truncate ${isExpanded ? 'text-white' : 'text-slate-200'}`}>
                            {entry.title}
                          </p>
                        ) : (
                          <p className={`text-sm truncate ${isExpanded ? 'text-slate-200' : 'text-slate-400'}`}>
                            {entry.content.split('\n')[0].slice(0, 55)}{entry.content.length > 55 ? '…' : ''}
                          </p>
                        )}
                        <p className="text-slate-600 text-xs mt-0.5">
                          {fmtDate(entry.created_at)}
                          {entry.updated_at && entry.updated_at !== entry.created_at ? ' · edited' : ''}
                          {idx === 0 && <span className={`ml-1.5 font-semibold ${tab.color}`}>· Latest</span>}
                        </p>
                      </div>
                      <ChevronDown
                        size={14}
                        className={`text-slate-500 shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {/* Expanded content + actions */}
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-white/10">
                        <p className="text-slate-200 text-sm whitespace-pre-wrap leading-relaxed pt-3">
                          {entry.content}
                        </p>
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => openEdit(entry)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs font-medium transition-colors"
                          >
                            <Pencil size={12} /> Edit
                          </button>
                          <button
                            onClick={() => setDeleteTarget(entry)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-medium transition-colors"
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-800 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md border border-slate-700 shadow-2xl">
            <div className="px-5 py-4 border-b border-slate-700">
              <h3 className="text-white font-bold">
                {editEntry ? `Edit ${tab.label}` : `Add ${tab.label}`}
              </h3>
            </div>
            <div className="p-5 space-y-3">
              <input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Title (optional)"
                className="w-full bg-slate-700 border border-slate-600 focus:border-yellow-500 text-white rounded-xl px-4 py-2.5 outline-none text-sm placeholder:text-slate-500 transition-colors"
              />
              <textarea
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                placeholder={`Write ${tab.label.toLowerCase()} details here...`}
                rows={6}
                className="w-full bg-slate-700 border border-slate-600 focus:border-yellow-500 text-white rounded-xl px-4 py-2.5 outline-none text-sm placeholder:text-slate-500 resize-none transition-colors"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-medium text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !formContent.trim()}
                  className={`flex-1 ${tab.accent} hover:opacity-90 disabled:opacity-50 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center transition-opacity`}
                >
                  {saving
                    ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : editEntry ? 'Save' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-sm border border-slate-700 p-6 space-y-4">
            <p className="text-white font-bold">Delete this entry?</p>
            <p className="text-slate-400 text-sm">This cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-medium text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center transition-colors"
              >
                {deleting
                  ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
