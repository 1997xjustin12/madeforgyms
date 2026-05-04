import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, RefreshCw, Plus, Trash2, ChevronDown, ChevronUp, Upload, X, Film, Image } from 'lucide-react';
import { useGym } from '../context/GymContext';
import { supabase } from '../lib/supabase';
import { calcBMI, getBMICategory } from '../utils/helpers';
import { getTemplateForBMI } from '../utils/workoutTemplates';
import toast from 'react-hot-toast';

const MUSCLE_OPTIONS = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Core', 'Full Body', 'Cardio'];

async function uploadWorkoutMedia(file, exerciseId) {
  const ext = file.name.split('.').pop();
  const path = `exercises/${exerciseId}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('workout-media').upload(path, file, { contentType: file.type, upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from('workout-media').getPublicUrl(path);
  return data.publicUrl;
}

function MediaUploadButton({ label, icon: Icon, accept, current, onUploaded, onClear, uploading, setUploading, exerciseId }) {
  const inputRef = useRef();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadWorkoutMedia(file, exerciseId);
      onUploaded(url);
      toast.success(`${label} uploaded`);
    } catch (err) {
      toast.error(err.message || `Failed to upload ${label.toLowerCase()}`);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="col-span-2">
      <label className="text-xs text-slate-400 mb-1.5 block">{label}</label>
      {current ? (
        <div className="relative rounded-xl overflow-hidden border border-slate-600 bg-slate-900">
          {accept.startsWith('video') ? (
            <video src={current} controls className="w-full max-h-40 object-contain" />
          ) : (
            <img src={current} alt={label} className="w-full max-h-40 object-contain" />
          )}
          <button onClick={onClear}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 flex items-center justify-center text-white hover:bg-red-600 transition-colors">
            <X size={13} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-slate-600 hover:border-green-500 text-slate-400 hover:text-green-400 transition-colors text-sm disabled:opacity-50">
          <Icon size={16} />
          {uploading ? 'Uploading...' : `Upload ${label}`}
        </button>
      )}
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleFile} />
    </div>
  );
}

function ExerciseRow({ exercise, onUpdate, onRemove }) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
      <div className="flex items-center gap-3 p-3 cursor-pointer" onClick={() => setOpen((v) => !v)}>
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium text-sm truncate">{exercise.name}</p>
          <p className="text-slate-400 text-xs">{exercise.sets} sets · {exercise.reps} · {exercise.rest} rest · {exercise.muscle}</p>
        </div>
        {(exercise.video_url || exercise.image_url) && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 font-medium">media</span>
        )}
        <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="text-red-400 hover:text-red-300 p-1">
          <Trash2 size={14} />
        </button>
        {open ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
      </div>
      {open && (
        <div className="border-t border-slate-700 p-3 grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-xs text-slate-400 mb-1 block">Exercise Name</label>
            <input value={exercise.name} onChange={(e) => onUpdate({ ...exercise, name: e.target.value })}
              className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 text-sm border border-slate-600 focus:outline-none focus:border-green-500" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Sets</label>
            <input type="number" min={1} max={10} value={exercise.sets} onChange={(e) => onUpdate({ ...exercise, sets: Number(e.target.value) })}
              className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 text-sm border border-slate-600 focus:outline-none focus:border-green-500" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Reps / Duration</label>
            <input value={exercise.reps} onChange={(e) => onUpdate({ ...exercise, reps: e.target.value })}
              className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 text-sm border border-slate-600 focus:outline-none focus:border-green-500" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Rest</label>
            <input value={exercise.rest} onChange={(e) => onUpdate({ ...exercise, rest: e.target.value })}
              className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 text-sm border border-slate-600 focus:outline-none focus:border-green-500" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Muscle Group</label>
            <select value={exercise.muscle} onChange={(e) => onUpdate({ ...exercise, muscle: e.target.value })}
              className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 text-sm border border-slate-600 focus:outline-none focus:border-green-500">
              {MUSCLE_OPTIONS.map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="text-xs text-slate-400 mb-1 block">Description</label>
            <textarea value={exercise.description} onChange={(e) => onUpdate({ ...exercise, description: e.target.value })}
              rows={2} className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 text-sm border border-slate-600 focus:outline-none focus:border-green-500 resize-none" />
          </div>
          <MediaUploadButton
            label="Demo Video"
            icon={Film}
            accept="video/*"
            current={exercise.video_url || ''}
            onUploaded={(url) => onUpdate({ ...exercise, video_url: url })}
            onClear={() => onUpdate({ ...exercise, video_url: '' })}
            uploading={uploading}
            setUploading={setUploading}
            exerciseId={exercise.id}
          />
          <MediaUploadButton
            label="Demo Image"
            icon={Image}
            accept="image/*"
            current={exercise.image_url || ''}
            onUploaded={(url) => onUpdate({ ...exercise, image_url: url })}
            onClear={() => onUpdate({ ...exercise, image_url: '' })}
            uploading={uploading}
            setUploading={setUploading}
            exerciseId={exercise.id}
          />
        </div>
      )}
    </div>
  );
}

export default function WorkoutPlanEditor() {
  const { id: memberId } = useParams();
  const navigate = useNavigate();
  const { getMemberById, gymSlug, loadWorkoutPlan, saveWorkoutPlan } = useGym();

  const member = getMemberById(memberId);
  const bmi = calcBMI(member?.height, member?.weight);
  const bmiCat = getBMICategory(bmi);

  const [days, setDays]           = useState(null);
  const [bmiKey, setBmiKey]       = useState('normal');
  const [fitnessLevel, setFitnessLevel] = useState('intermediate');
  const [saving, setSaving]       = useState(false);
  const [activeDay, setActiveDay] = useState(0);

  useEffect(() => {
    if (!memberId) return;
    loadWorkoutPlan(memberId, null, null).then((plan) => {
      if (plan) {
        setDays(plan.days);
        setBmiKey(plan.bmi_key);
        setFitnessLevel(plan.fitness_level || 'intermediate');
      }
    });
  }, [memberId]); // eslint-disable-line

  const resetToTemplate = () => {
    const key = bmiCat?.key || 'normal';
    const template = getTemplateForBMI(key, fitnessLevel);
    if (template) {
      setDays(template.days);
      setBmiKey(key);
      toast.success('Reset to default template');
    }
  };

  const updateExercise = (dayIdx, exIdx, updated) => {
    setDays((prev) => prev.map((d, i) => i !== dayIdx ? d : {
      ...d, exercises: d.exercises.map((e, j) => j !== exIdx ? e : updated),
    }));
  };

  const removeExercise = (dayIdx, exIdx) => {
    setDays((prev) => prev.map((d, i) => i !== dayIdx ? d : {
      ...d, exercises: d.exercises.filter((_, j) => j !== exIdx),
    }));
  };

  const addExercise = (dayIdx) => {
    const newEx = {
      id: `custom-${dayIdx}-${Date.now()}`,
      name: 'New Exercise',
      sets: 3,
      reps: '10 reps',
      rest: '60s',
      muscle: 'Full Body',
      description: '',
    };
    setDays((prev) => prev.map((d, i) => i !== dayIdx ? d : {
      ...d, exercises: [...(d.exercises || []), newEx],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveWorkoutPlan(memberId, bmiKey, days, fitnessLevel);
      toast.success('Workout plan saved');
    } catch (err) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (!member) return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center">
      <p className="text-slate-400">Member not found.</p>
    </div>
  );

  const currentDay = days?.[activeDay];

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(`/${gymSlug}/admin/members`)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300">
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-white truncate">Workout Plan — {member.name}</h1>
            {bmi && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: bmiCat.bg, color: bmiCat.color }}>
                BMI {bmi.toFixed(1)} · {bmiCat.label}
              </span>
            )}
          </div>
          <button onClick={resetToTemplate} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm">
            <RefreshCw size={14} /> Reset
          </button>
          <button onClick={handleSave} disabled={saving || !days}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-medium disabled:opacity-50">
            <Save size={14} /> {saving ? 'Saving...' : 'Save'}
          </button>
        </div>

        {!days ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Day tabs */}
            <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-hide">
              {days.map((d, i) => (
                <button key={i} onClick={() => setActiveDay(i)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                    activeDay === i
                      ? 'bg-green-600 text-white'
                      : d.isRest
                        ? 'bg-slate-800 text-slate-500'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}>
                  {d.dayName}
                </button>
              ))}
            </div>

            {/* Day content */}
            {currentDay && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-white font-semibold">{currentDay.dayName}</h2>
                    <p className="text-slate-400 text-sm">{currentDay.isRest ? 'Rest Day' : currentDay.label}</p>
                  </div>
                  {!currentDay.isRest && (
                    <button onClick={() => addExercise(activeDay)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm">
                      <Plus size={14} /> Add
                    </button>
                  )}
                </div>

                {currentDay.isRest ? (
                  <div className="text-center py-10 text-slate-500">
                    <p>Rest day — no exercises scheduled</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(currentDay.exercises || []).map((ex, ei) => (
                      <ExerciseRow
                        key={ex.id || ei}
                        exercise={ex}
                        onUpdate={(updated) => updateExercise(activeDay, ei, updated)}
                        onRemove={() => removeExercise(activeDay, ei)}
                      />
                    ))}
                    {currentDay.exercises?.length === 0 && (
                      <p className="text-center text-slate-500 py-6 text-sm">No exercises — click Add to start</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
