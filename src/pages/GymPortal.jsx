import { useNavigate } from 'react-router-dom';
import { ShieldCheck, User, CalendarCheck, Dumbbell, ChevronRight, MapPin, Phone, ArrowLeft } from 'lucide-react';
import { useGym } from '../context/GymContext';

export default function GymPortal() {
  const navigate = useNavigate();
  const { settings, gymSlug, currentGym } = useGym();

  const gymName    = settings.gymName          || currentGym?.name || 'Gym Portal';
  const gymLogo    = settings.gymLogoUrl        || null;
  const gymAddress = settings.gymAddress        || '';
  const gymPhone   = settings.gymContactNumber  || '';

  const p = (path) => `/${gymSlug}/${path}`;

  return (
    <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center px-4 relative overflow-hidden">

      {/* Background grid */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      {/* Glow orbs */}
      <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.07) 0%, transparent 70%)' }} />
      <div className="absolute bottom-[-10%] right-[-5%] w-[350px] h-[350px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.04) 0%, transparent 70%)' }} />

      <div className="relative w-full max-w-sm">

        {/* Back to gym finder */}
        <a href="/portal" className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-400 text-xs mb-8 transition-colors">
          <ArrowLeft size={13} /> Wrong gym? Find yours
        </a>

        {/* Gym branding */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-5">
            {gymLogo ? (
              <img
                src={gymLogo}
                alt={gymName}
                className="w-20 h-20 object-contain rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.06)', padding: '6px' }}
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)' }}>
                <Dumbbell size={36} className="text-green-400" />
              </div>
            )}
          </div>
          <h1 className="text-white font-black text-2xl tracking-tight">{gymName}</h1>
          <p className="text-slate-500 text-sm mt-1">Member &amp; Staff Portal</p>
          {(gymAddress || gymPhone) && (
            <div className="mt-2 flex flex-col items-center gap-1">
              {gymAddress && (
                <span className="inline-flex items-center gap-1 text-slate-600 text-xs">
                  <MapPin size={11} /> {gymAddress}
                </span>
              )}
              {gymPhone && (
                <span className="inline-flex items-center gap-1 text-slate-600 text-xs">
                  <Phone size={11} /> {gymPhone}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Portal cards */}
        <div className="space-y-3">

          {/* Member Portal */}
          <button
            onClick={() => navigate(p('member'))}
            className="w-full group flex items-center gap-4 rounded-2xl p-4 text-left transition-all hover:-translate-y-0.5"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(34,197,94,0.35)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(34,197,94,0.15)' }}>
              <User size={22} className="text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm">Member Portal</p>
              <p className="text-slate-500 text-xs mt-0.5">Check status &amp; request renewal</p>
            </div>
            <ChevronRight size={16} className="text-slate-600 group-hover:text-green-400 transition-colors" />
          </button>

          {/* Check-In */}
          <button
            onClick={() => navigate(p('checkin'))}
            className="w-full group flex items-center gap-4 rounded-2xl p-4 text-left transition-all hover:-translate-y-0.5"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(34,197,94,0.35)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(34,197,94,0.15)' }}>
              <CalendarCheck size={22} className="text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm">Gym Check-In</p>
              <p className="text-slate-500 text-xs mt-0.5">Log your visit for today</p>
            </div>
            <ChevronRight size={16} className="text-slate-600 group-hover:text-green-400 transition-colors" />
          </button>

          {/* Admin Login */}
          <button
            onClick={() => navigate(p('admin/login'))}
            className="w-full group flex items-center gap-4 rounded-2xl p-4 text-left transition-all hover:-translate-y-0.5"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(255,255,255,0.06)' }}>
              <ShieldCheck size={22} className="text-slate-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm">Admin Portal</p>
              <p className="text-slate-500 text-xs mt-0.5">Staff &amp; management access</p>
            </div>
            <ChevronRight size={16} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
          </button>

        </div>

        {/* Footer */}
        <div className="mt-10 flex items-center justify-center gap-1.5 text-slate-700">
          <Dumbbell size={12} />
          <a href="/" className="text-xs hover:text-slate-500 transition-colors">Powered by MadeForGyms</a>
        </div>
      </div>
    </div>
  );
}
