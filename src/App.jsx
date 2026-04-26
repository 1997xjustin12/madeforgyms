import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Dumbbell } from 'lucide-react';
import { useEffect } from 'react';
import { useGym } from './context/GymContext';
import Home from './pages/Home';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import MembersList from './pages/MembersList';
import RegisterMember from './pages/RegisterMember';
import MemberPortal from './pages/MemberPortal';
import AdminLogs from './pages/AdminLogs';
import AdminSettings from './pages/AdminSettings';
import RenewalRequests from './pages/RenewalRequests';
import ReviewPayment from './pages/ReviewPayment';
import MemberHistory from './pages/MemberHistory';
import CheckIn from './pages/CheckIn';
import AdminAttendance from './pages/AdminAttendance';
import AdminInstructors from './pages/AdminInstructors';
import StaffApprovals from './pages/StaffApprovals';
import CoachLogin from './pages/CoachLogin';
import CoachPortal from './pages/CoachPortal';
import CoachMemberDetail from './pages/CoachMemberDetail';
import MemberScan from './pages/MemberScan';
import Landing from './pages/Landing';
import MadeForGyms from './pages/MadeForGyms';
import GymPortal from './pages/GymPortal';
import GymNotFound from './pages/GymNotFound';
import GymRegister from './pages/GymRegister';
import PlatformAdmin from './pages/PlatformAdmin';
import AuthCallback from './pages/AuthCallback';

function PrivateRoute({ children }) {
  const { isAdminLoggedIn, gymSlug } = useGym();
  return isAdminLoggedIn ? children : <Navigate to={`/${gymSlug}/admin/login`} replace />;
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center gap-4">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
        style={{ background: 'linear-gradient(135deg, #16a34a, #4ade80)', boxShadow: '0 0 30px rgba(34,197,94,0.3)' }}>
        <Dumbbell size={32} className="text-white" />
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Loading...</p>
      </div>
    </div>
  );
}


function GymRoutes() {
  const { slug } = useParams();
  const { loadGymBySlug, gymLoading, gymNotFound, settings } = useGym();

  useEffect(() => {
    loadGymBySlug(slug);
  }, [slug, loadGymBySlug]);

  useEffect(() => {
    if (settings.gymName && settings.gymName !== 'MadeForGyms') {
      document.title = settings.gymName;
    }
  }, [settings.gymName]);

  if (gymLoading) return <LoadingScreen />;
  if (gymNotFound) return <GymNotFound slug={slug} />;

  return (
    <Routes>
      <Route index element={<GymPortal />} />
      <Route path="admin/login" element={<AdminLogin />} />
      <Route path="admin" element={<PrivateRoute><AdminDashboard /></PrivateRoute>} />
      <Route path="admin/members" element={<PrivateRoute><MembersList /></PrivateRoute>} />
      <Route path="admin/register" element={<PrivateRoute><RegisterMember /></PrivateRoute>} />
      <Route path="admin/members/:id/edit" element={<PrivateRoute><RegisterMember /></PrivateRoute>} />
      <Route path="admin/members/:id/history" element={<PrivateRoute><MemberHistory /></PrivateRoute>} />
      <Route path="admin/logs" element={<PrivateRoute><AdminLogs /></PrivateRoute>} />
      <Route path="admin/settings" element={<PrivateRoute><AdminSettings /></PrivateRoute>} />
      <Route path="admin/renewals" element={<PrivateRoute><RenewalRequests /></PrivateRoute>} />
      <Route path="admin/attendance" element={<PrivateRoute><AdminAttendance /></PrivateRoute>} />
      <Route path="admin/instructors" element={<PrivateRoute><AdminInstructors /></PrivateRoute>} />
      <Route path="admin/approvals" element={<PrivateRoute><StaffApprovals /></PrivateRoute>} />
      <Route path="member" element={<MemberPortal />} />
      <Route path="m/:token" element={<MemberScan />} />
      <Route path="coach" element={<CoachLogin />} />
      <Route path="coach/:code" element={<CoachPortal />} />
      <Route path="coach/:code/member/:memberId" element={<CoachMemberDetail />} />
      <Route path="checkin" element={<CheckIn />} />
      <Route path="review/:token" element={<ReviewPayment />} />
      <Route path="*" element={<Navigate to={`/${slug}`} replace />} />
    </Routes>
  );
}

export default function App() {
  const { authLoading } = useGym();

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1e293b',
            color: '#f1f5f9',
            border: '1px solid #334155',
            borderRadius: '12px',
          },
          success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />

      {authLoading ? (
        <LoadingScreen />
      ) : (
        <Routes>
          {/* Platform-level routes */}
          <Route path="/" element={<MadeForGyms />} />
          <Route path="/portal" element={<Home />} />
          <Route path="/register" element={<GymRegister />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/mfg" element={<Navigate to="/" replace />} />
          <Route path="/mfg/admin" element={<PlatformAdmin />} />
          <Route path="/landing" element={<Landing />} />

          {/* Gym-scoped routes — /:slug/* */}
          <Route path="/:slug/*" element={<GymRoutes />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
    </>
  );
}
