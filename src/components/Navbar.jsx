import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Users, LayoutDashboard, UserPlus, ArrowLeft, ClipboardList, CreditCard, Settings, CalendarCheck, Dumbbell, MoreHorizontal, X, ClipboardCheck, ChevronDown } from 'lucide-react';
import { useGym } from '../context/GymContext';
import toast from 'react-hot-toast';
import GymLogo from './GymLogo';
import { useState, useEffect, useRef } from 'react';

export default function Navbar({ title, showBack }) {
  const { isAdminLoggedIn, adminLogout, getExpiringMembers, pendingRenewals, pendingMemberships, settings, gymSlug, isAdmin, isStaff } = useGym();
  const navigate = useNavigate();
  const location = useLocation();
  const expiring = getExpiringMembers();
  const [moreOpen, setMoreOpen] = useState(false);
  const [desktopMoreOpen, setDesktopMoreOpen] = useState(false);
  const desktopMoreRef = useRef(null);

  useEffect(() => { setMoreOpen(false); setDesktopMoreOpen(false); }, [location.pathname]);

  // Close desktop dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => { if (desktopMoreRef.current && !desktopMoreRef.current.contains(e.target)) setDesktopMoreOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const p = (path) => `/${gymSlug}/${path}`;

  const handleLogout = async () => {
    await adminLogout();
    toast.success('Logged out');
    navigate(`/${gymSlug}`);
  };

  const pendingCount = pendingMemberships?.filter(x => x.status === 'pending').length;

  // Desktop "More" dropdown items
  const moreItems = isAdmin ? [
    { to: p('admin/attendance'), icon: <CalendarCheck size={16} />, label: 'Attendance' },
    { to: p('admin/logs'),       icon: <ClipboardList size={16} />,  label: 'Activity Logs' },
    { to: p('admin/instructors'),icon: <Dumbbell size={16} />,       label: 'Coaches' },
    { to: p('admin/settings'),   icon: <Settings size={16} />,       label: 'Settings' },
  ] : [];

  const moreActive = moreItems.some(item => location.pathname === item.to);

  return (
    <>
      {/* Top Navbar */}
      <nav className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-2">

          {/* Left — Logo */}
          <div className="flex items-center gap-2 min-w-0 shrink-0">
            {showBack ? (
              <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white p-1">
                <ArrowLeft size={20} />
              </button>
            ) : (
              <Link to={isAdminLoggedIn ? p('admin') : '/'} className="flex items-center gap-2">
                <GymLogo size={36} />
                <span className="font-bold text-white text-sm truncate max-w-[120px] hidden sm:block">
                  {settings.gymName || 'MadeForGyms'}
                </span>
              </Link>
            )}
            {title && <span className="text-white font-semibold truncate">{title}</span>}
          </div>

          {/* Right — Admin nav (desktop) */}
          {isAdminLoggedIn && (
            <div className="hidden sm:flex items-center gap-0.5">

              {/* Primary links */}
              <NavLink to={p('admin')} icon={<LayoutDashboard size={16} />} label="Dashboard"
                active={location.pathname === `/${gymSlug}/admin`} />
              <NavLink to={p('admin/members')} icon={<Users size={16} />} label="Members"
                active={location.pathname.startsWith(`/${gymSlug}/admin/members`)} badge={expiring.length} />
              <NavLink to={p('admin/register')} icon={<UserPlus size={16} />} label="Add"
                active={location.pathname === `/${gymSlug}/admin/register`} />
              {isAdmin && (
                <NavLink to={p('admin/renewals')} icon={<CreditCard size={16} />} label="Payments"
                  active={location.pathname === `/${gymSlug}/admin/renewals`} badge={pendingRenewals?.length} />
              )}
              {isAdmin && (
                <NavLink to={p('admin/approvals')} icon={<ClipboardCheck size={16} />} label="Approvals"
                  active={location.pathname === `/${gymSlug}/admin/approvals`} badge={pendingCount} badgeColor="bg-blue-500" />
              )}
              {isStaff && (
                <NavLink to={p('admin/approvals')} icon={<ClipboardCheck size={16} />} label="My Requests"
                  active={location.pathname === `/${gymSlug}/admin/approvals`} badge={pendingCount} badgeColor="bg-blue-500" />
              )}

              {/* More dropdown (admin only) */}
              {isAdmin && (
                <div ref={desktopMoreRef} className="relative">
                  <button
                    onClick={() => setDesktopMoreOpen((v) => !v)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      moreActive || desktopMoreOpen
                        ? 'bg-orange-500/20 text-orange-400'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <MoreHorizontal size={16} />
                    <span>More</span>
                    <ChevronDown size={12} className={`transition-transform ${desktopMoreOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {desktopMoreOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-slate-700 rounded-2xl shadow-xl overflow-hidden py-1">
                      {moreItems.map(({ to, icon, label }) => (
                        <Link key={to} to={to}
                          className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${
                            location.pathname === to
                              ? 'bg-orange-500/15 text-orange-400'
                              : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                          }`}
                        >
                          <span className={location.pathname === to ? 'text-orange-400' : 'text-slate-400'}>{icon}</span>
                          {label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Logout */}
              <button onClick={handleLogout}
                className="ml-1 p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                title="Logout">
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
              <div className="flex-1 flex items-center justify-around">
                <MobileNavLink to={p('admin')} icon={<LayoutDashboard size={21} />} label="Dashboard"
                  active={location.pathname === `/${gymSlug}/admin`} />
                <MobileNavLink to={p('admin/members')} icon={<Users size={21} />} label="Members"
                  active={location.pathname.startsWith(`/${gymSlug}/admin/members`)} badge={expiring.length} />
              </div>

              {/* Center FAB */}
              <Link to={p('admin/register')}
                className={`flex-shrink-0 flex flex-col items-center justify-center w-14 h-14 -mt-5 rounded-2xl shadow-lg transition-all ${
                  location.pathname === `/${gymSlug}/admin/register`
                    ? 'bg-orange-600 shadow-orange-500/40'
                    : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/30'
                }`}>
                <UserPlus size={22} className="text-white" />
              </Link>

              <div className="flex-1 flex items-center justify-around">
                <MobileNavLink to={p('admin/renewals')} icon={<CreditCard size={21} />} label="Payments"
                  active={location.pathname === `/${gymSlug}/admin/renewals`} badge={pendingRenewals?.length} />
                <MobileNavLink to={p('admin/instructors')} icon={<Dumbbell size={21} />} label="Coaches"
                  active={location.pathname === `/${gymSlug}/admin/instructors`} />
                <button
                  onClick={() => setMoreOpen(true)}
                  className={`relative flex flex-col items-center gap-0.5 flex-1 py-1.5 rounded-xl transition-colors ${
                    [`/${gymSlug}/admin/settings`, `/${gymSlug}/admin/logs`, `/${gymSlug}/admin/attendance`, `/${gymSlug}/admin/approvals`].includes(location.pathname)
                      ? 'text-orange-400' : 'text-slate-500'
                  }`}
                >
                  <div className={`p-1 rounded-lg transition-all ${
                    [`/${gymSlug}/admin/settings`, `/${gymSlug}/admin/logs`, `/${gymSlug}/admin/attendance`, `/${gymSlug}/admin/approvals`].includes(location.pathname)
                      ? 'bg-orange-500/15' : ''
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
            <div className="fixed inset-0 z-50 sm:hidden bg-black/60 backdrop-blur-sm" onClick={() => setMoreOpen(false)} />
          )}

          {/* More Sheet */}
          <div className={`fixed bottom-0 inset-x-0 z-50 sm:hidden transition-transform duration-300 ease-out ${moreOpen ? 'translate-y-0' : 'translate-y-full'}`}>
            <div className="bg-slate-900 border-t border-slate-700 rounded-t-3xl overflow-hidden">
              <div className="flex items-center justify-between px-5 pt-4 pb-2">
                <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-3" />
                <p className="text-white font-bold text-base">More</p>
                <button onClick={() => setMoreOpen(false)} className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="px-4 pb-3 space-y-1">
                {[
                  ...(isAdmin ? [
                    { to: p('admin/attendance'), icon: <CalendarCheck size={20} />, label: 'Attendance' },
                    { to: p('admin/logs'),       icon: <ClipboardList size={20} />,  label: 'Activity Logs' },
                    { to: p('admin/approvals'),  icon: <ClipboardCheck size={20} />, label: 'Approvals', badge: pendingCount },
                    { to: p('admin/settings'),   icon: <Settings size={20} />,       label: 'Settings' },
                  ] : []),
                  ...(isStaff ? [
                    { to: p('admin/approvals'),  icon: <ClipboardCheck size={20} />, label: 'My Requests', badge: pendingCount },
                  ] : []),
                ].map(({ to, icon, label, badge }) => (
                  <Link key={to} to={to} onClick={() => setMoreOpen(false)}
                    className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-colors ${
                      location.pathname === to ? 'bg-orange-500/15 text-orange-400' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className={location.pathname === to ? 'text-orange-400' : 'text-slate-400'}>{icon}</span>
                    <span className="font-medium">{label}</span>
                    {badge > 0 && (
                      <span className="ml-auto bg-blue-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">{badge > 9 ? '9+' : badge}</span>
                    )}
                    {location.pathname === to && !badge && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-400" />}
                  </Link>
                ))}
              </div>

              <div className="mx-4 border-t border-slate-800 mb-3" />
              <div className="px-4 pb-6">
                <button
                  onClick={async () => { setMoreOpen(false); await adminLogout(); toast.success('Logged out'); navigate('/'); }}
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

function NavLink({ to, icon, label, active, badge, badgeColor = 'bg-orange-500' }) {
  return (
    <Link to={to}
      className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        active ? 'bg-orange-500/20 text-orange-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'
      }`}
    >
      {icon}
      <span>{label}</span>
      {badge > 0 && (
        <span className={`absolute -top-1 -right-1 w-4 h-4 ${badgeColor} text-white text-[10px] font-bold rounded-full flex items-center justify-center`}>
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </Link>
  );
}

function MobileNavLink({ to, icon, label, active, badge }) {
  return (
    <Link to={to}
      className={`relative flex flex-col items-center gap-0.5 flex-1 py-1.5 rounded-xl transition-colors ${active ? 'text-orange-400' : 'text-slate-500'}`}
    >
      <div className={`p-1 rounded-lg transition-all ${active ? 'bg-orange-500/15' : ''}`}>{icon}</div>
      <span className={`text-[10px] font-medium leading-none ${active ? 'text-orange-400' : 'text-slate-500'}`}>{label}</span>
      {badge > 0 && (
        <span className="absolute top-0.5 right-3 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </Link>
  );
}
