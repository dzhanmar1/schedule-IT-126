import { useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { AuthScreen } from './components/Auth/AuthScreen';
import { OnboardingScreen } from './components/Auth/OnboardingScreen';
import { MainScheduleScreen } from './screens/MainScheduleScreen';
import { WeekViewScreen } from './screens/WeekViewScreen';
import { StatsScreen } from './screens/StatsScreen';
import { ScheduleEditorScreen } from './screens/Admin/ScheduleEditorScreen';
import { AdminDashboardScreen } from './screens/Admin/AdminDashboardScreen';
import { BottomNav } from './components/BottomNav';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { PageTransition } from './components/PageTransition';
import { useOrientation } from './hooks/useOrientation';
import { LandscapeClockScreen } from './components/LandscapeClockScreen';

// Routes that show the bottom navigation
const NAV_ROUTES = ['/', '/week', '/stats'];

export default function App() {
  const { session, profile, isLoading } = useAuth();
  const location = useLocation();
  const isLandscape = useOrientation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      localStorage.setItem('invite_ref', ref);
      // Очищаем URL от параметра для красоты
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bg-light dark:bg-bg-dark overflow-hidden relative">
        {/* Background glow effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary-500/20 rounded-full blur-[80px] animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-blue-500/20 rounded-full blur-[50px] animate-pulse" style={{ animationDelay: '1s' }} />
        
        {/* Glass card container */}
        <div className="relative z-10 flex flex-col items-center justify-center p-8 rounded-3xl glass bg-white/10 dark:bg-black/10 border border-white/20 dark:border-white/5 shadow-2xl backdrop-blur-xl">
          <div className="relative w-16 h-16 flex items-center justify-center mb-6">
            <div className="absolute inset-0 rounded-2xl border-t-2 border-r-2 border-primary-500 animate-[spin_1.5s_linear_infinite]" />
            <div className="absolute inset-2 rounded-xl border-b-2 border-l-2 border-blue-400 animate-[spin_2s_linear_infinite_reverse]" />
            <div className="absolute inset-4 rounded-lg bg-gradient-to-tr from-primary-600 to-blue-500 animate-pulse-glow" />
          </div>
          
          <h2 className="text-xl font-bold bg-gradient-to-r from-primary-400 to-blue-400 bg-clip-text text-transparent mb-2">
            Schedule IT
          </h2>
          <p className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark tracking-widest uppercase animate-pulse">
            Загрузка...
          </p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  // If user is logged in but hasn't joined a group yet (and is not an admin viewing all)
  if (!profile?.group_id) {
    return <OnboardingScreen />;
  }

  const showBottomNav = NAV_ROUTES.includes(location.pathname);

  // If user has a group, show main routes
  return (
    <>
      <AnimatePresence>
        {isLandscape && <LandscapeClockScreen />}
      </AnimatePresence>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageTransition><MainScheduleScreen /></PageTransition>} />
          <Route path="/week" element={<PageTransition><WeekViewScreen /></PageTransition>} />
          <Route path="/stats" element={<PageTransition><StatsScreen /></PageTransition>} />
          <Route path="/dashboard" element={<PageTransition><AdminDashboardScreen /></PageTransition>} />
          <Route path="/schedule-editor" element={<PageTransition><ScheduleEditorScreen /></PageTransition>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
      {showBottomNav && <BottomNav />}
    </>
  );
}
