import { useState, useRef } from 'react';
import { X, Upload, CheckCircle, AlertTriangle, Users, FileJson, RefreshCw } from 'lucide-react';
import { parseBackupFile } from '../utils/backup';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const BATCH_SIZE = 20;

export default function RestoreModal({ onClose, onRestored, gymId }) {
  const [step, setStep] = useState('upload'); // upload | preview | restoring | done
  const [backup, setBackup] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [mode, setMode] = useState('add'); // 'add' | 'replace'
  const fileRef = useRef();

  const handleFile = async (file) => {
    if (!file) return;
    setError(null);
    try {
      const data = await parseBackupFile(file);
      setBackup(data);
      setStep('preview');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleRestore = async () => {
    if (!backup) return;
    setStep('restoring');
    setProgress(0);

    try {
      // Replace mode: delete all existing members first
      if (mode === 'replace') {
        const { error: delErr } = await supabase
          .from('members')
          .delete()
          .eq('gym_id', gymId);
        if (delErr) throw delErr;
      }

      const members = backup.members;
      let restored = 0;

      // Insert in batches
      for (let i = 0; i < members.length; i += BATCH_SIZE) {
        const batch = members.slice(i, i + BATCH_SIZE).map((m) => ({
          gym_id: gymId,
          name: m.name,
          contact_number: m.contactNumber,
          photo_url: m.photo || null,
          membership_type: m.membershipType,
          membership_start_date: m.membershipStartDate,
          membership_end_date: m.membershipEndDate,
          notes: m.notes || '',
        }));

        const { error: insertErr } = await supabase.from('members').insert(batch);
        if (insertErr) throw insertErr;

        restored += batch.length;
        setProgress(Math.round((restored / members.length) * 100));
      }

      setStep('done');
      toast.success(`${members.length} members restored successfully!`);
      onRestored?.();
    } catch (err) {
      console.error(err);
      setError('Restore failed: ' + err.message);
      setStep('preview');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <RefreshCw size={18} className="text-sky-400" />
            <h3 className="text-white font-semibold">Restore from Backup</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X size={20} />
          </button>
        </div>

        <div className="p-5">
          {/* Step: Upload */}
          {step === 'upload' && (
            <div className="space-y-4">
              <p className="text-slate-400 text-sm">
                Upload a <span className="text-white font-mono">.json</span> backup file to restore your member records.
              </p>

              {/* Drop zone */}
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-slate-600 hover:border-sky-500 rounded-2xl p-8 text-center cursor-pointer transition-colors group"
              >
                <FileJson size={36} className="mx-auto text-slate-600 group-hover:text-sky-400 mb-3 transition-colors" />
                <p className="text-slate-300 font-medium">Drop your backup file here</p>
                <p className="text-slate-500 text-sm mt-1">or click to browse</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files[0])}
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                  <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* Step: Preview */}
          {step === 'preview' && backup && (
            <div className="space-y-4">
              {/* Backup info */}
              <div className="bg-slate-700/50 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle size={18} className="text-green-400" />
                  <p className="text-white font-semibold">Backup file loaded</p>
                </div>
                <Row label="Gym" value={backup.gym || '—'} />
                <Row label="Exported on" value={backup.exportedAt ? new Date(backup.exportedAt).toLocaleDateString() : '—'} />
                <Row label="Members in backup" value={<span className="text-orange-400 font-bold">{backup.totalMembers ?? backup.members.length}</span>} />
              </div>

              {/* Restore mode */}
              <div>
                <p className="text-slate-300 text-sm font-medium mb-2">Restore mode</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setMode('add')}
                    className={`p-3 rounded-xl border text-left transition-all ${mode === 'add' ? 'border-sky-500 bg-sky-500/10' : 'border-slate-600 bg-slate-700/30'}`}
                  >
                    <p className={`text-sm font-semibold ${mode === 'add' ? 'text-sky-400' : 'text-white'}`}>Add to existing</p>
                    <p className="text-slate-400 text-xs mt-0.5">Keeps current members, adds backup</p>
                  </button>
                  <button
                    onClick={() => setMode('replace')}
                    className={`p-3 rounded-xl border text-left transition-all ${mode === 'replace' ? 'border-red-500 bg-red-500/10' : 'border-slate-600 bg-slate-700/30'}`}
                  >
                    <p className={`text-sm font-semibold ${mode === 'replace' ? 'text-red-400' : 'text-white'}`}>Replace all</p>
                    <p className="text-slate-400 text-xs mt-0.5">Deletes existing, restores backup</p>
                  </button>
                </div>
              </div>

              {mode === 'replace' && (
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                  <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
                  <p className="text-red-400 text-sm">All existing member records will be permanently deleted before restoring.</p>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                  <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setStep('upload')} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-medium transition-colors">
                  Back
                </button>
                <button
                  onClick={handleRestore}
                  className={`flex-1 font-bold py-3 rounded-xl transition-colors ${mode === 'replace' ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-sky-500 hover:bg-sky-600 text-white'}`}
                >
                  Restore {backup.members.length} Members
                </button>
              </div>
            </div>
          )}

          {/* Step: Restoring */}
          {step === 'restoring' && (
            <div className="py-6 text-center space-y-4">
              <div className="w-14 h-14 bg-sky-500/20 rounded-2xl flex items-center justify-center mx-auto">
                <RefreshCw size={28} className="text-sky-400 animate-spin" />
              </div>
              <div>
                <p className="text-white font-semibold">Restoring members...</p>
                <p className="text-slate-400 text-sm mt-1">Please don't close this window</p>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-500 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sky-400 font-mono text-sm">{progress}%</p>
            </div>
          )}

          {/* Step: Done */}
          {step === 'done' && (
            <div className="py-6 text-center space-y-4">
              <div className="w-14 h-14 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle size={28} className="text-green-400" />
              </div>
              <div>
                <p className="text-white font-bold text-lg">Restore Complete!</p>
                <p className="text-slate-400 text-sm mt-1">
                  <span className="text-green-400 font-semibold">{backup.members.length} members</span> have been restored successfully.
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-400">{label}</span>
      <span className="text-white">{value}</span>
    </div>
  );
}
