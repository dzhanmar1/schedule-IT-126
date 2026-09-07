import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Bell, BellOff, Share2 } from 'lucide-react';
import { useLanguage, DAY_KEYS_ORDERED } from '../i18n';
import { useNotifications } from '../hooks/useNotifications';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../utils/cn';

interface HeaderProps {
  onSettingsOpen: () => void;
}

function getGreetingKey(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'ui.goodMorning';
  if (hour >= 12 && hour < 17) return 'ui.goodAfternoon';
  if (hour >= 17 && hour < 22) return 'ui.goodEvening';
  return 'ui.goodNight';
}

export function Header({ onSettingsOpen }: HeaderProps) {
  const { t } = useLanguage();
  const { profile } = useAuth();
  const { permission, requestPermission } = useNotifications();
  const [scrolled, setScrolled] = useState(false);
  const [greetingKey, setGreetingKey] = useState(getGreetingKey);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update greeting every minute
  useEffect(() => {
    const timer = setInterval(() => setGreetingKey(getGreetingKey()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const today = new Date();
  const monthName = t(`months.${today.getMonth()}`);
  const jsDay = today.getDay(); // 0=Sun, 1=Mon...
  const dayKeyIndex = jsDay >= 1 && jsDay <= 5 ? jsDay - 1 : -1;
  const dayName = dayKeyIndex >= 0
    ? t(`days.${DAY_KEYS_ORDERED[dayKeyIndex]}`)
    : jsDay === 6 ? t('days.saturday') : t('days.sunday');

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${t('ui.scheduleTitle')} ${profile?.groups?.name || ''}`,
          text: t('ui.shareText'),
          url: window.location.href,
        });
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      // Could add a toast here
    }
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full transition-all duration-300',
        scrolled
          ? 'glass bg-white/70 dark:bg-bg-dark/70 shadow-sm'
          : 'bg-transparent'
      )}
    >
      {/* Gradient accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary-500 via-primary-400 to-primary-600 animate-gradient" />

      <div className="px-4 pt-5 pb-3 flex justify-between items-start">
        <div className="flex flex-col min-w-0">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark truncate"
          >
            {t(greetingKey)}
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-2 mt-1 text-sm text-text-secondary-light dark:text-text-secondary-dark flex-wrap"
          >
            <span>{today.getDate()} {monthName}, {dayName}</span>
            <span className="w-1 h-1 rounded-full bg-text-muted-light dark:bg-text-muted-dark" />
            <span className="font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-2 py-0.5 rounded-lg text-xs">
              {profile?.groups?.name || '...'}
            </span>
          </motion.div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <ActionButton onClick={handleShare}>
            <Share2 size={20} />
          </ActionButton>
          <ActionButton onClick={requestPermission}>
            {permission === 'granted'
              ? <Bell size={20} className="text-primary-500" />
              : <BellOff size={20} />
            }
          </ActionButton>
          <ActionButton onClick={onSettingsOpen}>
            <Settings size={20} />
          </ActionButton>
        </div>
      </div>
    </header>
  );
}

function ActionButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      className="p-2.5 rounded-xl text-text-secondary-light dark:text-text-secondary-dark hover:bg-card-light dark:hover:bg-card-dark transition-colors"
    >
      {children}
    </motion.button>
  );
}
