import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, MapPin, ArrowLeft, SearchX, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function GymNotFound({ slug }) {
  const navigate = useNavigate();
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('gyms')
      .select('id, slug, name, owner_email')
      .eq('status', 'active')
      .order('name', { ascending: true })
      .then(({ data }) => {
        setGyms(data || []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-[#030712] flex flex-col items-center px-4 py-12 relative overflow-hidden">

      {/* Background grid */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      <div className="relative w-full max-w-lg">

        {/* Back */}
        <a href="/" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-white text-sm mb-10 transition-colors">
          <ArrowLeft size={15} /> Back to MadeForGyms
        </a>

        {/* Not found header */}
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <SearchX size={30} className="text-slate-500" />
          </div>
          <h1 className="text-white font-black text-2xl mb-2">Gym not found</h1>
          <p className="text-slate-400 text-sm">
            <span className="font-mono text-slate-300">/{slug}</span> doesn't match any active gym.
          </p>
          <p className="text-slate-600 text-xs mt-1">Check the URL or pick a gym below.</p>
        </div>

        {/* Gym list */}
        <div>
          <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-3 px-1">
            Active Gyms on MadeForGyms
          </p>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl p-4 animate-pulse"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-white/5" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 bg-white/5 rounded w-1/2" />
                      <div className="h-2.5 bg-white/5 rounded w-1/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : gyms.length === 0 ? (
            <div className="text-center py-10 text-slate-600 text-sm">
              No gyms available right now.
            </div>
          ) : (
            <div className="space-y-2">
              {gyms.map((gym) => (
                <button
                  key={gym.id}
                  onClick={() => navigate(`/${gym.slug}`)}
                  className="w-full group flex items-center gap-4 rounded-2xl p-4 text-left transition-all hover:-translate-y-0.5"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(34,197,94,0.3)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}
                >
                  {/* Icon */}
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'linear-gradient(135deg, rgba(22,163,74,0.2), rgba(74,222,128,0.1))' }}>
                    <Dumbbell size={20} className="text-green-400" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{gym.name}</p>
                    <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-1">
                      <MapPin size={10} />
                      madeforgyms.com/{gym.slug}
                    </p>
                  </div>

                  <ChevronRight size={16} className="text-slate-600 group-hover:text-green-400 transition-colors shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Bottom hint */}
        <p className="text-center text-slate-700 text-xs mt-10">
          Is your gym missing?{' '}
          <a href="/#how-it-works" className="text-slate-500 hover:text-white transition-colors">
            Apply to join the platform
          </a>
        </p>
      </div>
    </div>
  );
}
