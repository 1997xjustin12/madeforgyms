import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Users, LayoutDashboard, UserPlus, ArrowLeft, ClipboardList, CreditCard, Settings, CalendarCheck, Dumbbell, MoreHorizontal, X } from 'lucide-react';
import { useGym } from '../context/GymContext';
import toast from 'react-hot-toast';
import GymLogo from './GymLogo';
import { useState, useEffect } from 'react';

export default function Navbar({ title, showBack }) {
  const { isAdminLoggedIn, adminLogout, getExpiringMembers, pendingRenewals, settings } = useGym();
  const navigate = useNavigate();
  const location = useLocation();
  const expiring = getExpiringMembers();
  const [moreOpen, setMoreOpen] = useState(false);
  useEffect(() => { setMoreOpen(false); }, [location.pathname]);

  const handleLogout = async () => {
    await adminLogout();
    toast.success('Logged out');
    navigate('/');
  };

  return (
    <>
      {/* Top Navbar */}
      <nav className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          {/* Left */}
          <div className="flex items-center gap-3 min-w-0">
            {showBack ? (
              <button
                onClick={() => navigate(-1)}
                className="text-slate-400 hover:text-white p-1"
              >
                <ArrowLeft size={20} />
              </button>
            ) : (
              <Link to={isAdminLoggedIn ? '/admin' : '/'} className="flex items-center gap-2 shrink-0">
                <GymLogo size={40} />
                <span className="font-bold text-white">{settings.gymName || 'Power Fitness Gym'}</span>
              </Link>
            )}
            {title && (
              <span className="text-white font-semibold truncate">{title}</span>
            )}
          </div>

          {/* Right - Admin nav (desktop) */}
          {isAdminLoggedIn && (
            <div className="flex items-center gap-1">
              {/* Desktop: show all links */}
              <div className="hidden sm:flex items-center gap-1">
                <NavLink to="/admin" icon={<LayoutDashboard size={16} />} label="Dashboard" active={location.pathname === '/admin'} />
                <NavLink to="/admin/members" icon={<Users size={16} />} label="Members" active={location.pathname.startsWith('/admin/members')} badge={expiring.length} />
                <NavLink to="/admin/register" icon={<UserPlus size={16} />} label="Add" active={location.pathname === '/admin/register'} />
                <NavLink to="/admin/attendance" icon={<CalendarCheck size={16} />} label="Attendance" active={location.pathname === '/admin/attendance'} />
                <NavLink to="/admin/logs" icon={<ClipboardList size={16} />} label="Logs" active={location.pathname === '/admin/logs'} />
                <NavLink to="/admin/renewals" icon={<CreditCard size={16} />} label="Payments" active={location.pathname === '/admin/renewals'} badge={pendingRenewals?.length} />
                <NavLink to="/admin/instructors" icon={<Dumbbell size={16} />} label="Coaches" active={location.pathname === '/admin/instructors'} />
                <NavLink to="/admin/settings" icon={<Settings size={16} />} label="Settings" active={location.pathname === '/admin/settings'} />
              </div>
              <button
                onClick={handleLogout}
                className="ml-1 p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors hidden sm:flex"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Bottom Nav */}
      {isAdminLoggedIn && (
        <>
          <div className="fixed bottom-0 inset-x-0 z-40 sm:hidden bg-slate-900/98 backdrop-blur-lg border-t border-slate-800">
            <div className="flex items-center h-16 px-1">
              {/* Left group */}
              <div className="flex-1 flex items-center justify-around">
                <MobileNavLink
                  to="/admin"
                  icon={<LayoutDashboard size={21} />}
                  label="Dashboard"
                  active={location.pathname === '/admin'}
                />
                <MobileNavLink
                  to="/admin/members"
                  icon={<Users size={21} />}
                  label="Members"
                  active={location.pathname.startsWith('/admin/members')}
                  badge={expiring.length}
                />
              </div>

              {/* Center FAB — Add Member */}
              <Link
                to="/admin/register"
                className={`flex-shrink-0 flex flex-col items-center justify-center w-14 h-14 -mt-5 rounded-2xl shadow-lg transition-all ${
                  location.pathname === '/admin/register'
                    ? 'bg-orange-600 shadow-orange-500/40'
                    : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/30'
                }`}
              >
                <UserPlus size={22} className="text-white" />
              </Link>

              {/* Right group */}
              <div className="flex-1 flex items-center justify-around">
                <MobileNavLink
                  to="/admin/renewals"
                  icon={<CreditCard size={21} />}
                  label="Payments"
                  active={location.pathname === '/admin/renewals'}
                  badge={pendingRenewals?.length}
                />
                <MobileNavLink
                  to="/admin/instructors"
                  icon={<Dumbbell size={21} />}
                  label="Coaches"
                  active={location.pathname === '/admin/instructors'}
                />
                {/* More button — opens sheet */}
                <button
                  onClick={() => setMoreOpen(true)}
                  className={`relative flex flex-col items-center gap-0.5 flex-1 py-1.5 rounded-xl transition-colors ${
                    ['/admin/settings', '/admin/logs', '/admin/attendance'].includes(location.pathname)
                      ? 'text-orange-400'
                      : 'text-slate-500'
                  }`}
                >
                  <div className={`p-1 rounded-lg transition-all ${
                    ['/admin/settings', '/admin/logs', '/admin/attendance'].includes(location.pathname)
                      ? 'bg-orange-500/15'
                      : ''
                  }`}>
                    <MoreHorizontal size={21} />
                  </div>
                  <span className="text-[10px] font-medium leading-none">More</span>
                </button>
              </div>
            </div>
            <div className="h-safe-area-inset-bottom" />
          </div>

          {/* More Sheet — backdrop */}
          {moreOpen && (
            <div
              className="fixed inset-0 z-50 sm:hidden bg-black/60 backdrop-blur-sm"
              onClick={() => setMoreOpen(false)}
            />
          )}

          {/* More Sheet — slide-up panel */}
          <div className={`fixed bottom-0 inset-x-0 z-50 sm:hidden transition-transform duration-300 ease-out ${
            moreOpen ? 'translate-y-0' : 'translate-y-full'
          }`}>
            <div className="bg-slate-900 border-t border-slate-700 rounded-t-3xl overflow-hidden">
              {/* Handle + header */}
              <div className="flex items-center justify-between px-5 pt-4 pb-2">
                <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-3" />
                <p className="text-white font-bold text-base">More</p>
                <button onClick={() => setMoreOpen(false)} className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                  <X size={18} />
                </button>
              </div>

              {/* Nav items */}
              <div className="px-4 pb-3 space-y-1">
                {[
                  { to: '/admin/attendance', icon: <CalendarCheck size={20} />, label: 'Attendance' },
                  { to: '/admin/logs',       icon: <ClipboardList size={20} />,  label: 'Activity Logs' },
                  { to: '/admin/settings',   icon: <Settings size={20} />,       label: 'Settings' },
                ].map(({ to, icon, label }) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setMoreOpen(false)}
                    className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-colors ${
                      location.pathname === to
                        ? 'bg-orange-500/15 text-orange-400'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className={location.pathname === to ? 'text-orange-400' : 'text-slate-400'}>{icon}</span>
                    <span className="font-medium">{label}</span>
                    {location.pathname === to && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-400" />
                    )}
                  </Link>
                ))}
              </div>

              {/* Divider + Logout */}
              <div className="mx-4 border-t border-slate-800 mb-3" />
              <div className="px-4 pb-6">
                <button
                  onClick={async () => {
                    setMoreOpen(false);
                    await adminLogout();
                    toast.success('Logged out');
                    navigate('/');
                  }}
                  className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut size={20} />
                  <span className="font-medium">Log Out</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function NavLink({ to, icon, label, active, badge }) {
  return (
    <Link
      to={to}
      className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-orange-500/20 text-orange-400'
          : 'text-slate-400 hover:text-white hover:bg-slate-800'
      }`}
    >
      {icon}
      <span className="hidden sm:block">{label}</span>
      {badge > 0 && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </Link>
  );
}

function MobileNavLink({ to, icon, label, active, badge }) {
  return (
    <Link
      to={to}
      className={`relative flex flex-col items-center gap-0.5 flex-1 py-1.5 rounded-xl transition-colors ${
        active ? 'text-orange-400' : 'text-slate-500'
      }`}
    >
      <div className={`p-1 rounded-lg transition-all ${active ? 'bg-orange-500/15' : ''}`}>
        {icon}
      </div>
      <span className={`text-[10px] font-medium leading-none ${active ? 'text-orange-400' : 'text-slate-500'}`}>
        {label}
      </span>
      {badge > 0 && (
        <span className="absolute top-0.5 right-3 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </Link>
  );
}
