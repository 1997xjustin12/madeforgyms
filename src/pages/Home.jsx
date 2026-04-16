import { useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { ShieldCheck, User, ChevronRight, CalendarCheck, Dumbbell } from 'lucide-react';
import { useGym } from '../context/GymContext';
import GymLogo from '../components/GymLogo';

export default function Home() {
  const navigate = useNavigate();
  const { isAdminLoggedIn, settings } = useGym();

  useEffect(() => { sessionStorage.removeItem('memberPortal_id'); }, []);

  if (isAdminLoggedIn) return <Navigate to="/admin" replace />;

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col overflow-hidden">

      {/* Animated background blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-3xl animate-blob" />
        <div className="absolute top-[30%] right-[-10%] w-[400px] h-[400px] bg-sky-500/10 rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-10%] left-[20%] w-[450px] h-[450px] bg-red-500/8 rounded-full blur-3xl animate-blob animation-delay-4000" />
      </div>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">

        {/* Logo */}
        <div className="mb-6 relative animate-fade-in-down">
          <div className="absolute -inset-6 bg-orange-500/10 rounded-full blur-3xl animate-pulse-slow" />
          <GymLogo size={150} className="relative drop-shadow-2xl" />
        </div>

        {/* Title */}
        <div className="animate-fade-in-up animation-delay-200">
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-2 tracking-tight">
            POWER <span className="text-orange-500">FITNESS</span> GYM
          </h1>
          <div className="w-12 h-1 bg-orange-500 rounded-full mx-auto mb-3" />
          <p className="text-slate-400 text-sm sm:text-base mb-10 tracking-wide">
            Train Hard. <span className="text-slate-300 font-medium">Stay Strong.</span> Manage Smart.
          </p>
        </div>

        {/* Portal Cards */}
        <div className="w-full max-w-sm space-y-3">

          {/* Admin Portal */}
          <div className="animate-fade-in-up animation-delay-400">
            <button
              onClick={() => navigate('/admin/login')}
              className="w-full group relative overflow-hidden bg-slate-800/80 backdrop-blur border border-slate-700 hover:border-orange-500/60 rounded-2xl p-5 text-left transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/10 hover:-translate-y-0.5"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              {/* Top accent */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500/0 via-orange-500/60 to-orange-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center group-hover:bg-orange-500/30 transition-all duration-300 group-hover:scale-110">
                  <ShieldCheck size={24} className="text-orange-400" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-base leading-tight">Admin Portal</h2>
                  <p className="text-slate-400 text-xs mt-0.5">Manage members &amp; memberships</p>
                </div>
                <ChevronRight size={18} className="ml-auto text-slate-600 group-hover:text-orange-400 group-hover:translate-x-1 transition-all duration-300" />
              </div>
            </button>
          </div>

          {/* Member Portal */}
          <div className="animate-fade-in-up animation-delay-600">
            <button
              onClick={() => navigate('/member')}
              className="w-full group relative overflow-hidden bg-slate-800/80 backdrop-blur border border-slate-700 hover:border-sky-500/60 rounded-2xl p-5 text-left transition-all duration-300 hover:shadow-xl hover:shadow-sky-500/10 hover:-translate-y-0.5"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-sky-500/0 via-sky-500/60 to-sky-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-center gap-4">
                <div className="w-12 h-12 bg-sky-500/20 rounded-xl flex items-center justify-center group-hover:bg-sky-500/30 transition-all duration-300 group-hover:scale-110">
                  <User size={24} className="text-sky-400" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-base leading-tight">Member Portal</h2>
                  <p className="text-slate-400 text-xs mt-0.5">Check status &amp; request renewal</p>
                </div>
                <ChevronRight size={18} className="ml-auto text-slate-600 group-hover:text-sky-400 group-hover:translate-x-1 transition-all duration-300" />
              </div>
            </button>
          </div>

          {/* Check-In */}
          <div className="animate-fade-in-up animation-delay-800">
            <button
              onClick={() => navigate('/checkin')}
              className="w-full group relative overflow-hidden bg-slate-800/80 backdrop-blur border border-slate-700 hover:border-green-500/60 rounded-2xl p-5 text-left transition-all duration-300 hover:shadow-xl hover:shadow-green-500/10 hover:-translate-y-0.5"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500/0 via-green-500/60 to-green-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-center gap-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center group-hover:bg-green-500/30 transition-all duration-300 group-hover:scale-110">
                  <CalendarCheck size={24} className="text-green-400" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-base leading-tight">Gym Check-In</h2>
                  <p className="text-slate-400 text-xs mt-0.5">Log your visit for today</p>
                </div>
                <ChevronRight size={18} className="ml-auto text-slate-600 group-hover:text-green-400 group-hover:translate-x-1 transition-all duration-300" />
              </div>
            </button>
          </div>
        </div>

        {/* Powered-by tag */}
        <div className="mt-10 animate-fade-in-up animation-delay-2000 flex items-center gap-2 text-slate-700">
          <Dumbbell size={13} />
          <span className="text-xs">Powered by GymHub</span>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pb-6 px-4 space-y-1 animate-fade-in-up animation-delay-2000 border-t border-slate-800/60 pt-4">
        <p className="text-slate-600 text-xs">
          © {new Date().getFullYear()} {settings.gymName || 'MadeForGyms'} · All rights reserved
        </p>
        <p className="text-slate-700 text-xs">
          2nd Floor Fernandez Bldg, Saavedra St, Toril, Davao City
        </p>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%       { transform: translate(20px, -30px) scale(1.05); }
          66%       { transform: translate(-15px, 15px) scale(0.97); }
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseSlow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50%      { opacity: 0.7; transform: scale(1.08); }
        }
        .animate-blob                { animation: blob 7s ease-in-out infinite; }
        .animate-fade-in-down        { animation: fadeInDown 0.7s ease both; }
        .animate-fade-in-up          { animation: fadeInUp 0.7s ease both; }
        .animate-pulse-slow          { animation: pulseSlow 3s ease-in-out infinite; }
        .animation-delay-200         { animation-delay: 0.2s; }
        .animation-delay-400         { animation-delay: 0.4s; }
        .animation-delay-600         { animation-delay: 0.6s; }
        .animation-delay-800         { animation-delay: 0.8s; }
        .animation-delay-2000        { animation-delay: 2s; }
        .animation-delay-4000        { animation-delay: 4s; }
      `}</style>
    </div>
  );
}
