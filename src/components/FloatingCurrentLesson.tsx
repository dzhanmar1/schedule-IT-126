import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Clock } from 'lucide-react';
import type { ClassInfo } from '../data/schedule';
import { useLanguage } from '../i18n';

interface FloatingCurrentLessonProps {
  lesson: ClassInfo | null;
  minutesLeft: number | null;
  isVisible: boolean;
  onReturnToday: () => void;
}

export function FloatingCurrentLesson({ lesson, minutesLeft, isVisible, onReturnToday }: FloatingCurrentLessonProps) {
  const { t } = useLanguage();

  return (
    <AnimatePresence>
      {isVisible && lesson && (
        <motion.div
          initial={{ y: 150, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 150, opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          whileTap={{ scale: 0.96 }}
          onClick={onReturnToday}
          className="fixed bottom-6 left-4 right-4 z-40 bg-card-light/90 dark:bg-card-dark/90 backdrop-blur-md p-3.5 rounded-[20px] shadow-2xl shadow-primary-500/20 border border-border-light dark:border-border-dark flex items-center gap-3 cursor-pointer"
        >
          <div className="w-10 h-10 rounded-[14px] bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white shadow-md shrink-0">
            <Clock size={20} className="animate-pulse" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider">
                {t('ui.currentLesson')}
              </span>
              {minutesLeft != null && (
                <span className="text-[9px] bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 px-1.5 py-0.5 rounded font-bold">
                  {t('ui.remainingTime')} {minutesLeft} {t('ui.minutesShort')}
                </span>
              )}
            </div>
            <p className="text-sm font-bold text-text-primary-light dark:text-text-primary-dark truncate">
              {lesson.subject.replace(/\s*\/\s*(лек|пр|лаб)\s*/i, '')}
            </p>
          </div>
          
          <div className="w-8 h-8 rounded-[12px] bg-bg-light dark:bg-bg-dark flex items-center justify-center text-text-muted-light dark:text-text-muted-dark shrink-0">
            <ArrowRight size={16} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
