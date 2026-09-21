import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useLanguage, DAYS_ORDER, DAY_KEYS_ORDERED } from '../i18n';
import { cn } from '../utils/cn';
import { startOfWeek, addDays, isSameDay } from 'date-fns';
import { useCurrentTime } from '../hooks/useCurrentTime';

interface DayTabsProps {
  selectedDay: string;
  onSelectDay: (day: string) => void;
  currentDayIndex: number;
  /** Number of lessons per day, indexed by DAYS_ORDER index (0=Mon, 4=Fri) */
  lessonsPerDay?: number[];
}

export function DayTabs({ selectedDay, onSelectDay, lessonsPerDay }: DayTabsProps) {
  const { t } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);
  const today = useCurrentTime();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });

  const weekDays = DAYS_ORDER.map((dayKey, idx) => {
    const date = addDays(weekStart, idx);
    return {
      key: dayKey,
      date,
      dayNumber: date.getDate(),
      isToday: isSameDay(date, today),
      shortName: t(`daysShort.${DAY_KEYS_ORDERED[idx]}`),
      lessonCount: lessonsPerDay?.[idx] ?? null,
    };
  });

  useEffect(() => {
    if (!scrollRef.current) return;
    const active = scrollRef.current.querySelector('[data-active="true"]');
    if (active) {
      active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [selectedDay]);

  return (
    <div className="w-full pt-1 pb-4">
      <div
        ref={scrollRef}
        className="flex px-4 pt-4 pb-8 -mt-4 -mb-8 gap-2.5 overflow-x-auto hide-scrollbar snap-x snap-mandatory"
      >
        {weekDays.map((day) => {
          const isSelected = selectedDay === day.key;
          const hasLessons = day.lessonCount !== null && day.lessonCount > 0;

          return (
            <motion.button
              key={day.key}
              data-active={isSelected}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelectDay(day.key)}
              className={cn(
                'relative flex flex-col items-center justify-center min-w-[3.8rem] h-[4.2rem] rounded-[18px] snap-center transition-all duration-300 shrink-0',
                isSelected
                  ? 'bg-gradient-to-br from-primary-500 to-blue-500 text-white shadow-lg shadow-primary-500/50 border-none scale-[1.02]'
                  : 'bg-glass-light dark:bg-glass-dark text-text-secondary-light dark:text-text-secondary-dark hover:bg-white/60 dark:hover:bg-white/10 border border-white/50 dark:border-white/5 glass'
              )}
            >
              <span
                className={cn(
                  'text-[11px] font-bold mb-0.5 uppercase tracking-wide',
                  isSelected ? 'text-white/90' : ''
                )}
              >
                {day.shortName}
              </span>

              <span
                className={cn(
                  'text-lg font-bold',
                  isSelected ? 'text-white' : 'text-text-primary-light dark:text-text-primary-dark'
                )}
              >
                {day.dayNumber}
              </span>

              {/* Today indicator dot */}
              {day.isToday && (
                <div
                  className={cn(
                    'absolute top-2 right-2 w-1.5 h-1.5 rounded-full',
                    isSelected
                      ? 'bg-white'
                      : 'bg-primary-500'
                  )}
                />
              )}

              {/* Lessons count badge */}
              {day.lessonCount !== null && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={cn(
                    'absolute -bottom-1.5 left-1/2 -translate-x-1/2 min-w-[1.2rem] h-[1.2rem] px-1 rounded-full flex items-center justify-center text-[9px] font-bold',
                    isSelected
                      ? 'bg-white text-primary-600'
                      : hasLessons
                        ? 'bg-primary-500 text-white'
                        : 'bg-border-light dark:bg-border-dark text-text-muted-light dark:text-text-muted-dark'
                  )}
                >
                  {day.lessonCount}
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
