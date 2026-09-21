import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronLeft, ChevronRight, CalendarDays, BookOpen, Zap, Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSchedule } from '../hooks/useSchedule';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage, DAYS_ORDER, DAY_KEYS_ORDERED } from '../i18n';
import { useCurrentTime } from '../hooks/useCurrentTime';
import { getCurrentWeekParity } from '../utils/time';
import { useExceptions } from '../hooks/useExceptions';
import { startOfWeek, addDays, addWeeks, format, isSameDay } from 'date-fns';
import { cn } from '../utils/cn';
import type { ClassInfo } from '../data/schedule';

const TYPE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  лек: { bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-700 dark:text-blue-300', dot: 'bg-blue-500' },
  пр:  { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
  лаб: { bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-700 dark:text-purple-300', dot: 'bg-purple-500' },
};

function getLessonTypeKey(subject: string, typeTag?: string): keyof typeof TYPE_COLORS | null {
  const src = (typeTag || subject).toLowerCase();
  if (src.includes('лек')) return 'лек';
  if (src.includes('пр') || src.includes('практ') || src.includes('семин')) return 'пр';
  if (src.includes('лаб')) return 'лаб';
  return null;
}

function cleanSubjectName(subject: string): string {
  return subject
    .replace(/[/(](лек|пр|лаб|практ|семин)[/)]/gi, '')
    .replace(/\s*\/\s*$/, '')
    .replace(/^\s*\/\s*/, '')
    .trim();
}

function TypeIcon({ typeKey }: { typeKey: keyof typeof TYPE_COLORS | null }) {
  if (typeKey === 'лек') return <BookOpen size={10} />;
  if (typeKey === 'пр') return <Zap size={10} />;
  if (typeKey === 'лаб') return <Flame size={10} />;
  return null;
}

interface LessonBlockProps {
  lesson: ClassInfo;
  onClick: (lesson: ClassInfo) => void;
}

function LessonBlock({ lesson, onClick }: LessonBlockProps) {
  const typeKey = getLessonTypeKey(lesson.subject, lesson.type);
  const colors = typeKey ? TYPE_COLORS[typeKey] : null;
  const cleanName = cleanSubjectName(lesson.subject);

  if (lesson.isCancelled) {
    return (
      <div className="rounded-xl p-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/30 opacity-60">
        <div className="text-[10px] font-bold text-red-500 line-through truncate">{cleanName}</div>
        <div className="text-[9px] text-red-400 mt-0.5">Отменено</div>
      </div>
    );
  }

  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={() => onClick(lesson)}
      className={cn(
        'w-full text-left rounded-xl p-2 border transition-all',
        colors
          ? `${colors.bg} border-current/10`
          : 'bg-primary-50 dark:bg-primary-950/30 border-primary-100 dark:border-primary-900/30'
      )}
    >
      <div className={cn('flex items-center gap-1 mb-1', colors?.text ?? 'text-primary-700 dark:text-primary-300')}>
        <TypeIcon typeKey={typeKey} />
        <span className="text-[9px] font-bold uppercase tracking-wider truncate">
          {lesson.time.split('-')[0].trim()}
        </span>
      </div>
      <div className={cn(
        'text-[11px] font-bold leading-tight line-clamp-2',
        colors?.text ?? 'text-primary-700 dark:text-primary-300'
      )}>
        {cleanName}
      </div>
      {lesson.auditorium && (
        <div className="text-[9px] mt-1 opacity-60 truncate font-medium">
          Ауд. {lesson.auditorium}
        </div>
      )}
    </motion.button>
  );
}

export function WeekViewScreen() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { profile } = useAuth();
  const { lessons } = useSchedule();
  const currentTime = useCurrentTime();
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedLesson, setSelectedLesson] = useState<ClassInfo | null>(null);

  const referenceWeekStart = startOfWeek(currentTime, { weekStartsOn: 1 });
  const weekStart = addWeeks(referenceWeekStart, weekOffset);
  const weekDates = DAYS_ORDER.map((_, idx) => addDays(weekStart, idx));
  const weekDateStrs = weekDates.map(d => format(d, 'yyyy-MM-dd'));

  // Determine week parity for this offset week — flip parity for each week offset
  const baseParity = getCurrentWeekParity(currentTime);
  const weekParity: 'odd' | 'even' =
    Math.abs(weekOffset) % 2 === 0
      ? baseParity
      : baseParity === 'odd' ? 'even' : 'odd';
  const parityNumber = weekParity === 'odd' ? 1 : 2;

  const { exceptions } = useExceptions(weekDateStrs[0], weekDateStrs[weekDateStrs.length - 1]);

  const weekSchedule = useMemo(() => {
    return DAYS_ORDER.map((dayName, idx) => {
      const dbDay = idx + 1;
      const dateStr = weekDateStrs[idx];
      const date = weekDates[idx];
      const isToday = isSameDay(date, currentTime);

      const dayLessons = lessons
        .filter(l => {
          if (l.day_of_week !== dbDay) return false;
          if (l.week_parity !== null && l.week_parity !== parityNumber) return false;
          if (l.subgroup !== null && profile?.subgroup !== null && l.subgroup !== profile?.subgroup) return false;
          return true;
        })
        .sort((a, b) => a.start_time.localeCompare(b.start_time));

      const classes = dayLessons.map(l => {
        const ex = exceptions.find(e => e.template_id === l.id && e.date === dateStr);
        if (ex) {
          return {
            id: l.id,
            time: (ex.new_start_time && ex.new_end_time)
              ? `${ex.new_start_time.slice(0, 5)} - ${ex.new_end_time.slice(0, 5)}`
              : `${l.start_time.slice(0, 5)} - ${l.end_time.slice(0, 5)}`,
            subject: l.subject,
            type: l.type_tag || '',
            teacher: ex.new_teacher || l.teacher || '',
            auditorium: ex.new_auditorium || l.auditorium || '',
            isCancelled: ex.is_cancelled,
          } as ClassInfo;
        }
        return {
          id: l.id,
          time: `${l.start_time.slice(0, 5)} - ${l.end_time.slice(0, 5)}`,
          subject: l.subject,
          type: l.type_tag || '',
          teacher: l.teacher || '',
          auditorium: l.auditorium || '',
        } as ClassInfo;
      });

      return { dayName, date, dateStr, isToday, classes };
    });
  }, [lessons, exceptions, parityNumber, weekDateStrs, weekDates, currentTime, profile?.subgroup]);

  const totalLessons = weekSchedule.reduce((sum, d) => sum + d.classes.filter(c => !c.isCancelled).length, 0);
  const weekLabel = weekOffset === 0
    ? t('ui.currentWeek')
    : weekOffset < 0
      ? `${Math.abs(weekOffset)} нед. назад`
      : `Через ${weekOffset} нед.`;

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark transition-colors duration-300">
      <div className="max-w-lg mx-auto pb-28">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-bg-light/80 dark:bg-bg-dark/80 backdrop-blur-lg border-b border-border-light dark:border-border-dark">
          <div className="flex items-center gap-3 px-4 pt-safe py-4">
            <button
              onClick={() => navigate('/')}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark hover:bg-card-hover-light dark:hover:bg-card-hover-dark transition-colors"
            >
              <ArrowLeft size={18} className="text-text-primary-light dark:text-text-primary-dark" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-lg text-text-primary-light dark:text-text-primary-dark">
                {t('ui.weekView')}
              </h1>
              <p className="text-xs text-text-muted-light dark:text-text-muted-dark font-medium truncate">
                {format(weekStart, 'd MMM')} — {format(addDays(weekStart, 4), 'd MMM')} · {weekParity === 'odd' ? t('ui.oddWeek') : t('ui.evenWeek')}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setWeekOffset(o => o - 1)}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark hover:bg-card-hover-light dark:hover:bg-card-hover-dark transition-colors"
              >
                <ChevronLeft size={16} className="text-text-primary-light dark:text-text-primary-dark" />
              </button>
              {weekOffset !== 0 && (
                <button
                  onClick={() => setWeekOffset(0)}
                  className="px-2 h-8 text-xs font-bold rounded-xl bg-primary-500 text-white"
                >
                  Сейчас
                </button>
              )}
              <button
                onClick={() => setWeekOffset(o => o + 1)}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark hover:bg-card-hover-light dark:hover:bg-card-hover-dark transition-colors"
              >
                <ChevronRight size={16} className="text-text-primary-light dark:text-text-primary-dark" />
              </button>
            </div>
          </div>
          {/* Week summary pill */}
          <div className="px-4 pb-3 flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs font-bold">
              <CalendarDays size={12} />
              {weekLabel}
            </span>
            <span className="text-xs text-text-muted-light dark:text-text-muted-dark font-medium">
              {totalLessons} занятий
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="px-4 pt-3 pb-1 flex items-center gap-3">
          {Object.entries(TYPE_COLORS).map(([key, colors]) => (
            <div key={key} className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
              <span className="text-[10px] font-bold text-text-muted-light dark:text-text-muted-dark uppercase">
                {key === 'лек' ? 'Лекция' : key === 'пр' ? 'Практика' : 'Лаб'}
              </span>
            </div>
          ))}
        </div>

        {/* Days list */}
        <div className="px-4 pt-2 flex flex-col gap-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={weekOffset}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-3"
            >
              {weekSchedule.map((day, dayIdx) => (
                <motion.div
                  key={day.dayName}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: dayIdx * 0.05 }}
                  className={cn(
                    'rounded-2xl border overflow-hidden',
                    day.isToday
                      ? 'border-primary-300 dark:border-primary-700 shadow-md shadow-primary-500/10'
                      : 'border-border-light dark:border-border-dark'
                  )}
                >
                  {/* Day header */}
                  <div className={cn(
                    'flex items-center justify-between px-3 py-2.5',
                    day.isToday
                      ? 'bg-gradient-to-r from-primary-500 to-[#8b5cf6] text-white'
                      : 'bg-card-light dark:bg-card-dark'
                  )}>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'font-bold text-sm',
                        day.isToday ? 'text-white' : 'text-text-primary-light dark:text-text-primary-dark'
                      )}>
                        {t(`days.${DAY_KEYS_ORDERED[dayIdx]}`)}
                      </span>
                      {day.isToday && (
                        <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full">
                          Сегодня
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'text-xs font-medium',
                        day.isToday ? 'text-white/70' : 'text-text-muted-light dark:text-text-muted-dark'
                      )}>
                        {format(day.date, 'd MMM')}
                      </span>
                      <span className={cn(
                        'text-xs font-bold px-2 py-0.5 rounded-full',
                        day.isToday
                          ? 'bg-white/20 text-white'
                          : day.classes.length > 0
                            ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400'
                            : 'bg-border-light dark:bg-border-dark text-text-muted-light dark:text-text-muted-dark'
                      )}>
                        {day.classes.length > 0 ? `${day.classes.length} пар` : 'Свободно'}
                      </span>
                    </div>
                  </div>

                  {/* Lessons */}
                  <div className="bg-bg-light dark:bg-bg-dark p-3">
                    {day.classes.length === 0 ? (
                      <div className="py-4 text-center">
                        <p className="text-sm text-text-muted-light dark:text-text-muted-dark font-medium">
                          {t('ui.noLessons')} 🎉
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {day.classes.map((lesson, i) => (
                          <LessonBlock
                            key={lesson.id || `${lesson.time}-${i}`}
                            lesson={lesson}
                            onClick={setSelectedLesson}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Lesson detail modal */}
      <AnimatePresence>
        {selectedLesson && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedLesson(null)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', bounce: 0.15 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm bg-card-light dark:bg-card-dark rounded-3xl p-5 border border-border-light dark:border-border-dark shadow-2xl"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="text-xs font-bold text-text-muted-light dark:text-text-muted-dark mb-1">
                    {selectedLesson.time}
                  </div>
                  <h3 className="font-bold text-lg text-text-primary-light dark:text-text-primary-dark leading-tight">
                    {cleanSubjectName(selectedLesson.subject)}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedLesson(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-border-light dark:bg-border-dark text-text-muted-light dark:text-text-muted-dark ml-3"
                >
                  ✕
                </button>
              </div>
              <div className="flex flex-col gap-2 text-sm">
                {selectedLesson.teacher && (
                  <div className="flex items-center gap-2 text-text-secondary-light dark:text-text-secondary-dark">
                    <span className="font-bold">Преподаватель:</span>
                    <span>{selectedLesson.teacher}</span>
                  </div>
                )}
                {selectedLesson.auditorium && (
                  <div className="flex items-center gap-2 text-text-secondary-light dark:text-text-secondary-dark">
                    <span className="font-bold">Аудитория:</span>
                    <span>Ауд. {selectedLesson.auditorium}</span>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
