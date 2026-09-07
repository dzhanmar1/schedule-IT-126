import { useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { AuthScreen } from './components/Auth/AuthScreen';
import { OnboardingScreen } from './components/Auth/OnboardingScreen';
import { MainScheduleScreen } from './screens/MainScheduleScreen';
import { ScheduleEditorScreen } from './screens/Admin/ScheduleEditorScreen';
import { AdminDashboardScreen } from './screens/Admin/AdminDashboardScreen';
import { Loader2 } from 'lucide-react';

import { Routes, Route, Navigate } from 'react-router-dom';

export default function App() {
  const { session, profile, isLoading } = useAuth();

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
      <div className="min-h-screen flex flex-col items-center justify-center bg-bg-light dark:bg-bg-dark text-text-primary-light dark:text-text-primary-dark">
        <Loader2 className="animate-spin mb-4 text-primary-500" size={32} />
        <p className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark animate-pulse">
          Загрузка расписания...
        </p>
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

  // If user has a group, show main routes
  return (
    <Routes>
      <Route path="/" element={<MainScheduleScreen />} />
      <Route path="/dashboard" element={<AdminDashboardScreen />} />
      <Route path="/schedule-editor" element={<ScheduleEditorScreen />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
