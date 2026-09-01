import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useLanguage, DAYS_ORDER, DAY_KEYS_ORDERED } from '../i18n';
import { cn } from '../utils/cn';
import { startOfWeek, addDays, isSameDay } from 'date-fns';

interface DayTabsProps {
  selectedDay: string;
  onSelectDay: (day: string) => void;
  currentDayIndex: number;
}

export function DayTabs({ selectedDay, onSelectDay }: DayTabsProps) {
  const { t } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });

  const weekDays = DAYS_ORDER.map((dayKey, idx) => {
    const date = addDays(weekStart, idx);
    return {
      key: dayKey,
      date,
      dayNumber: date.getDate(),
      isToday: isSameDay(date, today),
      shortName: t(`daysShort.${DAY_KEYS_ORDERED[idx]}`),
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
        className="flex px-4 gap-2.5 overflow-x-auto hide-scrollbar snap-x snap-mandatory"
      >
        {weekDays.map((day) => {
          const isSelected = selectedDay === day.key;

          return (
            <motion.button
              key={day.key}
              data-active={isSelected}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelectDay(day.key)}
              className={cn(
                'relative flex flex-col items-center justify-center min-w-[3.8rem] h-[4.2rem] rounded-[18px] snap-center transition-all duration-200 shrink-0',
                isSelected
                  ? 'bg-gradient-to-br from-primary-500 to-[#8b5cf6] text-white shadow-lg shadow-primary-500/30 border-none'
                  : 'bg-card-light dark:bg-card-dark text-text-secondary-light dark:text-text-secondary-dark hover:bg-card-hover-light dark:hover:bg-card-hover-dark border border-transparent hover:border-border-light dark:hover:border-border-dark'
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
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
