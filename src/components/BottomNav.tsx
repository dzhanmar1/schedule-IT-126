import { motion } from 'framer-motion';
import { CalendarDays, LayoutGrid, MessageSquare, User, BookOpen } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../i18n';
import { cn } from '../utils/cn';

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  const tabs = [
    { path: '/', icon: CalendarDays, label: t('ui.navSchedule') },
    { path: '/homework', icon: BookOpen, label: 'Домашка' },
    { path: '/week', icon: LayoutGrid, label: t('ui.navWeek') },
    { path: '/chat', icon: MessageSquare, label: 'Чат' },
    { path: '/profile', icon: User, label: 'Профиль' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none">
      <div className="w-full max-w-lg pointer-events-auto">
        {/* Gradient fade */}
        <div className="h-6 bg-gradient-to-t from-bg-light dark:from-bg-dark to-transparent" />
        {/* Nav bar */}
        <div className="bg-bg-light/90 dark:bg-bg-dark/90 backdrop-blur-xl border-t border-border-light dark:border-border-dark px-6 pb-safe pt-2">
          <div className="flex items-center justify-around">
            {tabs.map(tab => {
              const isActive = location.pathname === tab.path;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.path}
                  onClick={() => navigate(tab.path)}
                  className="flex flex-col items-center gap-1 py-1.5 px-4 rounded-2xl transition-colors relative"
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute inset-0 bg-primary-50 dark:bg-primary-950/50 rounded-2xl"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                  <div className="relative z-10">
                    <Icon
                      size={22}
                      className={cn(
                        'transition-colors',
                        isActive
                          ? 'text-primary-600 dark:text-primary-400'
                          : 'text-text-muted-light dark:text-text-muted-dark'
                      )}
                      strokeWidth={isActive ? 2.5 : 1.8}
                    />
                  </div>
                  <span
                    className={cn(
                      'relative z-10 text-[10px] font-bold transition-colors',
                      isActive
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-text-muted-light dark:text-text-muted-dark'
                    )}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
