import { motion, AnimatePresence } from 'framer-motion';
import { PartyPopper, CalendarClock } from 'lucide-react';
import type { ClassInfo, DaySchedule as DayScheduleType } from '../data/schedule';
import { LessonCard } from './LessonCard';
import { FreeTimeBlock } from './FreeTimeBlock';
import { useLanguage } from '../i18n';
import { parseClassTime } from '../utils/time';
import { differenceInMinutes } from 'date-fns';

interface DayScheduleProps {
  daySchedule: DayScheduleType;
  currentTime: Date;
  isActiveDay: boolean;
  onLessonSelect: (lesson: ClassInfo) => void;
}

export function DaySchedule({ daySchedule, currentTime, isActiveDay, onLessonSelect }: DayScheduleProps) {
  const { t } = useLanguage();
  const classes = daySchedule.classes;

  if (classes.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="flex flex-col items-center justify-center py-20 text-center"
      >
        <motion.div
          animate={{
            y: [0, -10, 0],
            rotate: [0, 5, -5, 0],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="bg-primary-50 dark:bg-primary-900/20 p-6 rounded-full mb-6"
        >
          <PartyPopper size={48} className="text-primary-500" />
        </motion.div>
        <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark mb-2">
          {t('ui.noLessonsToday')}
        </h2>
        <p className="text-text-secondary-light dark:text-text-secondary-dark font-medium">
          {t('ui.freeDay')}
        </p>
      </motion.div>
    );
  }

  const startTime = classes[0].time.split('-')[0].trim();
  const endTime = classes[classes.length - 1].time.split('-')[1].trim();

  let progressPercent = 0;
  if (isActiveDay && classes.length > 0) {
    const { startTime: startObj } = parseClassTime(classes[0].time, currentTime);
    const { endTime: endObj } = parseClassTime(classes[classes.length - 1].time, currentTime);
    const total = differenceInMinutes(endObj, startObj);
    const elapsed = differenceInMinutes(currentTime, startObj);

    if (elapsed >= total) progressPercent = 100;
    else if (elapsed <= 0) progressPercent = 0;
    else progressPercent = (elapsed / total) * 100;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="pb-24"
    >
      {/* Summary Card */}
      <div className="bg-card-light dark:bg-card-dark rounded-2xl p-4 mb-6 shadow-sm border border-border-light dark:border-border-dark flex flex-col gap-3 glass">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-xl">
              <CalendarClock size={20} />
            </div>
            <div>
              <div className="font-bold text-text-primary-light dark:text-text-primary-dark">
                {classes.length} {t('ui.lessons')}
              </div>
              <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark font-medium">
                {startTime} — {endTime}
              </div>
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        {isActiveDay && progressPercent > 0 && (
          <div className="w-full mt-1">
            <div className="flex justify-between text-[10px] font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider mb-1.5">
              <span>{t('ui.dayProgress')}</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <div className="h-1.5 w-full bg-border-light dark:bg-border-dark rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full"
              />
            </div>
          </div>
        )}
      </div>

      {/* Timeline Layout */}
      <div className="relative">
        {/* Continuous Vertical Line */}
        <div className="absolute left-[27px] top-4 bottom-4 w-px bg-border-light dark:bg-border-dark" />

        <div className="flex flex-col gap-1">
          {classes.map((lesson, idx) => {
            const isLast = idx === classes.length - 1;
            const nextLesson = !isLast ? classes[idx + 1] : null;

            return (
              <div key={`${lesson.time}-${idx}`}>
                <LessonCard
                  lesson={lesson}
                  currentTime={currentTime}
                  isActiveDay={isActiveDay}
                  index={idx}
                  onClick={onLessonSelect}
                />
                
                {nextLesson && isActiveDay && (
                  <FreeTimeBlock
                    prevLessonTime={lesson.time}
                    nextLessonTime={nextLesson.time}
                    currentTime={currentTime}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
