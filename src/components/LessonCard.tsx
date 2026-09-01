import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, CheckCircle2 } from 'lucide-react';
import type { ClassInfo } from '../data/schedule';
import { getClassStatus } from '../utils/time';
import { cn } from '../utils/cn';
import { useLanguage } from '../i18n';

interface LessonCardProps {
  lesson: ClassInfo;
  currentTime: Date;
  isActiveDay: boolean;
  index: number;
  onClick: (lesson: ClassInfo) => void;
}

function parseSubjectType(subject: string) {
  let type: 'лек' | 'пр' | 'лаб' | null = null;
  let cleanSubject = subject;

  const match = subject.match(/[//(](лек|пр|лаб)[//)]/i);
  if (match) {
    type = match[1].toLowerCase() as 'лек' | 'пр' | 'лаб';
    cleanSubject = subject.replace(/[//(](лек|пр|лаб)[//)]/i, '').trim();
    cleanSubject = cleanSubject.replace(/\s*\/\s*$/, '').replace(/^\s*\/\s*/, '').trim();
  }

  return { type, cleanSubject };
}

const TYPE_CONFIG = {
  'лек': {
    label: 'ЛЕКЦИЯ',
    className: 'bg-info/10 text-info dark:bg-info/20 dark:text-blue-400',
    currentClassName: 'bg-white/20 text-white',
  },
  'пр': {
    label: 'ПРАКТИКА',
    className: 'bg-success/10 text-success dark:bg-success/20 dark:text-emerald-400',
    currentClassName: 'bg-white/20 text-white',
  },
  'лаб': {
    label: 'ЛАБОРАТОРНАЯ',
    className: 'bg-warning/10 text-warning dark:bg-warning/20 dark:text-amber-400',
    currentClassName: 'bg-white/20 text-white',
  },
} as const;

export function LessonCard({ lesson, currentTime, isActiveDay, index, onClick }: LessonCardProps) {
  const { t } = useLanguage();
  const statusInfo = isActiveDay
    ? getClassStatus(lesson.time, currentTime)
    : { status: 'upcoming' as const, progress: 0 };
  const cardRef = useRef<HTMLDivElement>(null);

  const isCurrent = statusInfo.status === 'current';
  const isPast = statusInfo.status === 'past';
  const isUpcoming = statusInfo.status === 'upcoming';

  const { type, cleanSubject } = parseSubjectType(lesson.subject);
  const typeConfig = type ? TYPE_CONFIG[type] : null;

  useEffect(() => {
    if (isCurrent && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isCurrent]);

  return (
    <div className="relative py-2 flex w-full">
      {/* Timeline Dot */}
      <motion.div 
        layout
        className="absolute left-[27px] top-6 -translate-x-1/2 z-10"
        style={{ originY: 0 }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: index * 0.1, type: 'spring' }}
          className={cn(
            'flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ring-4 ring-bg-light dark:ring-bg-dark transition-colors',
            isCurrent
              ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/40'
              : isPast
                ? 'bg-border-light dark:bg-border-dark text-text-muted-light dark:text-text-muted-dark scale-90'
                : 'bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400'
          )}
        >
          {index + 1}
        </motion.div>
      </motion.div>

      {/* Card Content */}
      <motion.div
        ref={cardRef}
        layout
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{
          layout: { type: 'spring', bounce: 0.2, duration: 0.6 },
          opacity: { duration: 0.4, delay: index * 0.08 },
          x: { duration: 0.4, delay: index * 0.08 }
        }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onClick(lesson)}
        className={cn(
          'relative ml-[56px] mr-2 flex-1 overflow-hidden rounded-[20px] transition-colors duration-300 cursor-pointer',
          isCurrent ? 'p-4 bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-xl shadow-primary-500/30 animate-pulse-glow border-none' : '',
          isPast ? 'p-3 bg-card-light/40 dark:bg-card-dark/40 border border-transparent opacity-60 hover:opacity-80' : '',
          isUpcoming ? 'p-4 bg-card-light dark:bg-card-dark shadow-sm border border-border-light dark:border-border-dark hover:shadow-md' : ''
        )}
      >
        {isCurrent && (
          <div className="absolute bottom-0 left-0 h-1 w-full bg-black/10">
            <motion.div
              className="h-full bg-gradient-to-r from-white/40 to-white/90 rounded-r"
              initial={{ width: 0 }}
              animate={{ width: `${statusInfo.progress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        )}

        <motion.div layout className="relative z-10 flex flex-col">
          {/* Header row: Time & Badges */}
          <motion.div layout className="flex justify-between items-start mb-2.5">
            <div className={cn('font-bold tracking-tight', isCurrent ? 'text-primary-100 text-sm' : isPast ? 'text-text-muted-light dark:text-text-muted-dark text-xs' : 'text-text-secondary-light dark:text-text-secondary-dark text-sm')}>
              {lesson.time}
            </div>

            {isCurrent && statusInfo.minutesLeft != null && (
              <span className="text-[10px] font-bold bg-white/25 px-2 py-0.5 rounded-full animate-pulse backdrop-blur-sm">
                {t('ui.remainingTime')} {statusInfo.minutesLeft} {t('ui.minutesShort')}
              </span>
            )}
            {isUpcoming && statusInfo.minutesUntil != null && statusInfo.minutesUntil < 60 && (
              <span className="text-[10px] font-bold text-primary-600 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/40 px-2 py-0.5 rounded-full">
                {t('ui.upcomingIn', { time: statusInfo.minutesUntil })}
              </span>
            )}
            {isPast && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-success uppercase">
                <CheckCircle2 size={12} />
                {t('ui.completed')}
              </span>
            )}
          </motion.div>

          {/* Subject & Type Badge */}
          <motion.div layout className={isPast ? 'mb-1' : 'mb-3'}>
            <motion.h3
              layout
              className={cn(
                'font-bold leading-tight',
                isCurrent ? 'text-white text-[17px]' : isPast ? 'text-text-secondary-light dark:text-text-secondary-dark text-sm' : 'text-text-primary-light dark:text-text-primary-dark text-[17px]'
              )}
            >
              {cleanSubject}
            </motion.h3>
            {typeConfig && !isPast && (
              <span
                className={cn(
                  'inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider',
                  isCurrent ? typeConfig.currentClassName : typeConfig.className
                )}
              >
                {typeConfig.label}
              </span>
            )}
          </motion.div>

          {/* Teacher & Room (Hidden when past) */}
          <AnimatePresence>
            {!isPast && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={cn(
                  'flex flex-col gap-1.5 text-xs border-t overflow-hidden',
                  isCurrent ? 'pt-3 border-white/15' : 'pt-3 border-border-light dark:border-border-dark'
                )}
              >
                <div className="flex items-center gap-2">
                  <div className={cn(
                    'w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold',
                    isCurrent 
                      ? 'bg-white/20 text-white' 
                      : 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'
                  )}>
                    {lesson.teacher.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </div>
                  <span className={cn('font-medium', isCurrent ? 'text-white/90' : 'text-text-secondary-light dark:text-text-secondary-dark')}>
                    {lesson.teacher}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={15} className={isCurrent ? 'text-white/70 ml-0.5' : 'text-text-muted-light dark:text-text-muted-dark ml-0.5'} />
                  <span className={cn('font-medium ml-0.5', isCurrent ? 'text-white/90' : 'text-text-secondary-light dark:text-text-secondary-dark')}>
                    {t('ui.auditoriumPrefix')} {lesson.auditorium}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
}
