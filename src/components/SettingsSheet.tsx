import { motion, AnimatePresence } from 'framer-motion';
import { X, Globe, Palette, Sun, Moon, Monitor, Bell, Info } from 'lucide-react';
import { useLanguage, LANGUAGES } from '../i18n';
import { useTheme } from '../contexts/ThemeContext';
import { useNotifications } from '../hooks/useNotifications';
import { ToggleSwitch } from './ToggleSwitch';
import { cn } from '../utils/cn';
import { scheduleData } from '../data/schedule';

interface SettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const themeOptions = [
  { value: 'light' as const, labelKey: 'ui.light', Icon: Sun },
  { value: 'dark' as const, labelKey: 'ui.dark', Icon: Moon },
  { value: 'system' as const, labelKey: 'ui.system', Icon: Monitor },
];

export function SettingsSheet({ isOpen, onClose }: SettingsSheetProps) {
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { permission, requestPermission } = useNotifications();

  const notificationsEnabled = permission === 'granted';

  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled) {
      await requestPermission();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with strong blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-md"
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.15}
            onDragEnd={(_, info) => {
              if (info.offset.y > 80 || info.velocity.y > 400) {
                onClose();
              }
            }}
            className="fixed bottom-0 left-0 right-0 z-50 flex max-h-[85vh] flex-col rounded-t-[24px] bg-card-light dark:bg-card-dark shadow-2xl glass"
          >
            {/* Drag Handle */}
            <div className="flex w-full cursor-grab justify-center pt-4 pb-2 active:cursor-grabbing">
              <div className="h-1.5 w-10 rounded-full bg-border-light dark:bg-border-dark" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pb-5 pt-2">
              <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark tracking-tight">
                {t('ui.settings')}
              </h2>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="rounded-full p-2.5 bg-bg-light dark:bg-bg-dark transition-colors hover:bg-card-hover-light dark:hover:bg-card-hover-dark text-text-secondary-light dark:text-text-secondary-dark"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </motion.button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-12">
              <div className="space-y-8">
                {/* Language Section */}
                <section className="space-y-3">
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-text-muted-light dark:text-text-muted-dark">
                    <Globe className="h-3.5 w-3.5" />
                    <span>{t('ui.language')} / ТІЛ / LANGUAGE</span>
                  </div>
                  <div className="flex gap-2">
                    {LANGUAGES.map((lang) => (
                      <motion.button
                        key={lang.code}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setLanguage(lang.code)}
                        className={cn(
                          'flex-1 rounded-[14px] px-3 py-3 text-sm font-semibold transition-all duration-200 border',
                          language === lang.code
                            ? 'bg-primary-500 border-primary-500 text-white shadow-md shadow-primary-500/25'
                            : 'bg-transparent border-border-light dark:border-border-dark text-text-secondary-light dark:text-text-secondary-dark'
                        )}
                      >
                        {lang.label}
                      </motion.button>
                    ))}
                  </div>
                </section>

                {/* Theme Section */}
                <section className="space-y-3">
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-text-muted-light dark:text-text-muted-dark">
                    <Palette className="h-3.5 w-3.5" />
                    <span>{t('ui.theme')} / THEME</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {themeOptions.map(({ value, labelKey, Icon }) => (
                      <motion.button
                        key={value}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setTheme(value)}
                        className={cn(
                          'flex flex-col items-center gap-2 rounded-[16px] p-4 text-sm font-semibold transition-all duration-200 border',
                          theme === value
                            ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 text-primary-600 dark:text-primary-300 shadow-sm shadow-primary-500/10'
                            : 'bg-transparent border-border-light dark:border-border-dark text-text-secondary-light dark:text-text-secondary-dark'
                        )}
                      >
                        <Icon className={cn('h-5 w-5', theme === value ? 'text-primary-500' : '')} />
                        <span>{t(labelKey)}</span>
                      </motion.button>
                    ))}
                  </div>
                </section>

                {/* Notifications Section */}
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-text-muted-light dark:text-text-muted-dark">
                      <Bell className="h-3.5 w-3.5" />
                      <span>{t('ui.notifications')} / NOTIFICATIONS</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-bg-light dark:bg-bg-dark rounded-[16px] p-4 border border-border-light dark:border-border-dark">
                    <div>
                      <p className="font-bold text-sm text-text-primary-light dark:text-text-primary-dark">Push-уведомления</p>
                      <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-0.5">
                        {notificationsEnabled ? t('ui.enabled') : t('ui.disabled')}
                      </p>
                    </div>
                    <ToggleSwitch
                      checked={notificationsEnabled}
                      onChange={handleNotificationToggle}
                    />
                  </div>
                </section>

                {/* About Section */}
                <section className="space-y-4 pt-4">
                  <div className="flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-widest text-text-muted-light dark:text-text-muted-dark">
                    <Info className="h-3.5 w-3.5" />
                    <span>{t('ui.about')} / ABOUT</span>
                  </div>
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-[18px] flex items-center justify-center mb-3 shadow-lg shadow-primary-500/25 text-white text-2xl">
                      📅
                    </div>
                    <p className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">
                      {t('ui.scheduleTitle')}
                    </p>
                    <p className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mt-1">
                      {t('ui.groupLabel')}: {scheduleData.group}
                    </p>
                    <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-2">
                      {t('ui.version')} 1.0.0 · Made with ❤️
                    </p>
                  </div>
                </section>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
