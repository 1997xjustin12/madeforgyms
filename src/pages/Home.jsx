import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, ArrowRight, ArrowLeft, Search, User, CalendarCheck, ShieldCheck, ChevronRight, MapPin, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

const PORTALS = [
  { icon: User,        color: 'text-green-400', bg: 'rgba(34,197,94,0.12)',   title: 'Member Portal',  desc: 'Check status & request renewal'  },
  { icon: CalendarCheck, color: 'text-sky-400', bg: 'rgba(56,189,248,0.12)', title: 'Gym Check-In',   desc: 'Log your visit for today'         },
  { icon: ShieldCheck, color: 'text-slate-400', bg: 'rgba(255,255,255,0.06)', title: 'Admin Portal',   desc: 'Staff & management access'        },
];

export default function Home() {
  const navigate = useNavigate();
  const [query, setQuery]       = useState('');
  const [gyms, setGyms]         = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showList, setShowList] = useState(false);
  const wrapperRef = useRef(null);

  /* Load all active gyms once */
  useEffect(() => {
    supabase
      .from('gyms')
      .select('id, name, slug')
      .eq('status', 'active')
      .order('name', { ascending: true })
      .then(({ data }) => {
        setGyms(data || []);
        setLoading(false);
      });
  }, []);

  /* Filter as user types */
  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      setFiltered(gyms);
    } else {
      setFiltered(
        gyms.filter(
          (g) =>
            g.name.toLowerCase().includes(q) ||
            g.slug.toLowerCase().includes(q)
        )
      );
    }
  }, [query, gyms]);

  /* Close dropdown when clicking outside */
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowList(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (slug) => {
    setShowList(false);
    navigate(`/${slug}`);
  };

  return (
    <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">

      {/* Background grid */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      {/* Glow orb */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.07) 0%, transparent 70%)' }} />

      <div className="relative w-full max-w-sm">

        {/* Back */}
        <a href="/" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-white text-sm mb-10 transition-colors">
          <ArrowLeft size={15} /> Back to MadeForGyms
        </a>

        {/* Icon + heading */}
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
          style={{ background: 'linear-gradient(135deg, #16a34a, #4ade80)', boxShadow: '0 0 30px rgba(34,197,94,0.25)' }}>
          <Dumbbell size={28} className="text-white" />
        </div>

        <h1 className="text-white font-black text-2xl mb-1">Find your gym</h1>
        <p className="text-slate-400 text-sm mb-8">
          Search by gym name to access the member portal.
        </p>

        {/* Search input with dropdown */}
        <div ref={wrapperRef} className="relative mb-8">
          <div
            className="flex items-center rounded-xl border transition-colors"
            style={{
              background: 'rgba(255,255,255,0.04)',
              borderColor: showList ? 'rgba(34,197,94,0.5)' : 'rgba(255,255,255,0.1)',
            }}
          >
            <span className="pl-4 text-slate-500 shrink-0">
              <Search size={16} />
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setShowList(!!e.target.value.trim()); }}
              onFocus={() => { if (query.trim()) setShowList(true); }}
              placeholder="Search gym name…"
              className="flex-1 bg-transparent text-white py-3.5 px-3 outline-none placeholder:text-slate-600 text-sm"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(''); setShowList(false); }}
                className="pr-3 text-slate-600 hover:text-slate-400 transition-colors"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Dropdown */}
          {showList && (
            <div
              className="absolute top-full left-0 right-0 mt-2 rounded-2xl border overflow-hidden z-50 shadow-2xl"
              style={{ background: '#0f172a', borderColor: 'rgba(255,255,255,0.08)', maxHeight: '280px', overflowY: 'auto' }}
            >
              {loading ? (
                <div className="px-4 py-5 text-center text-slate-500 text-sm">Loading gyms…</div>
              ) : filtered.length === 0 ? (
                <div className="px-4 py-5 text-center">
                  <p className="text-slate-400 text-sm font-medium">No gyms found</p>
                  <p className="text-slate-600 text-xs mt-1">Try a different name</p>
                </div>
              ) : (
                filtered.map((gym) => (
                  <button
                    key={gym.id}
                    onMouseDown={() => handleSelect(gym.slug)}
                    className="w-full flex items-center gap-3.5 px-4 py-3.5 text-left transition-colors hover:bg-white/5 group"
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.2)' }}>
                      <Dumbbell size={16} className="text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold truncate">{gym.name}</p>
                      <p className="text-slate-600 text-xs flex items-center gap-1 mt-0.5">
                        <MapPin size={10} /> madeforgyms.com/{gym.slug}
                      </p>
                    </div>
                    <ChevronRight size={15} className="text-slate-700 group-hover:text-green-400 transition-colors shrink-0" />
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-slate-800" />
          <span className="text-slate-600 text-xs">Your gym portal includes</span>
          <div className="flex-1 h-px bg-slate-800" />
        </div>

        {/* Portal preview cards */}
        <div className="space-y-2.5">
          {PORTALS.map(({ icon: Icon, color, bg, title, desc }) => (
            <div
              key={title}
              className="flex items-center gap-3.5 rounded-2xl px-4 py-3"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: bg }}>
                <Icon size={17} className={color} />
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-semibold leading-tight">{title}</p>
                <p className="text-slate-500 text-xs mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <p className="text-slate-600 text-xs text-center mt-8">
          New gym?{' '}
          <a href="/register" className="text-slate-400 hover:text-white transition-colors">
            Register here
          </a>
        </p>
      </div>
    </div>
  );
}
