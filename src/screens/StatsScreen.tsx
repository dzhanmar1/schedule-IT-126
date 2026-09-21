import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import {
  ArrowLeft,
  Clock,
  BookOpen,
  Coffee,
  TrendingUp,
  User,
  Award,
  BarChart3,
  Flame,
  Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSchedule } from '../hooks/useSchedule';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage, DAYS_ORDER, DAY_KEYS_ORDERED } from '../i18n';
import { useCurrentTime } from '../hooks/useCurrentTime';
import { getCurrentWeekParity } from '../utils/time';
import { useExceptions } from '../hooks/useExceptions';
import { calculateScheduleStats, formatMinutes } from '../utils/stats';
import { startOfWeek, addDays, format } from 'date-fns';
import type { ClassInfo } from '../data/schedule';

type Period = 'week' | 'all';

export function StatsScreen() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { profile } = useAuth();
  const { lessons } = useSchedule();
  const currentTime = useCurrentTime();
  const [period, setPeriod] = useState<Period>('week');

  const weekStart = startOfWeek(currentTime, { weekStartsOn: 1 });
  const weekDates = DAYS_ORDER.map((_, idx) => format(addDays(weekStart, idx), 'yyyy-MM-dd'));
  const { exceptions } = useExceptions(weekDates[0], weekDates[weekDates.length - 1]);

  const currentParity = getCurrentWeekParity(currentTime);
  const parityNumber = currentParity === 'odd' ? 1 : 2;

  // Build dynamic schedule (same logic as MainScheduleScreen)
  const dynamicSchedule = useMemo(() => {
    return DAYS_ORDER.map((dayName, idx) => {
      const dbDay = idx + 1;
      const dateStr = weekDates[idx];
      const dayLessons = lessons
        .filter(l => {
          if (l.day_of_week !== dbDay) return false;
          if (period === 'week' && l.week_parity !== null && l.week_parity !== parityNumber) return false;
          if (l.subgroup !== null && profile?.subgroup !== null && l.subgroup !== profile?.subgroup) return false;
          return true;
        })
        .sort((a, b) => a.start_time.localeCompare(b.start_time));

      const classes = dayLessons.map(l => {
        const ex = period === 'week'
          ? exceptions.find(e => e.template_id === l.id && e.date === dateStr)
          : undefined;
        if (ex) {
          return {
            id: l.id,
            time: (ex.new_start_time && ex.new_end_time)
              ? `${ex.new_start_time.slice(0, 5)} - ${ex.new_end_time.slice(0, 5)}`
              : `${l.start_time.slice(0, 5)} - ${l.end_time.slice(0, 5)}`,
            subject: l.subject,
            type: l.type_tag || '',
            teacher: ex.new_teacher || l.teacher || '',
            teacherId: ex.new_teacher_id || l.teacher_id || undefined,
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
          teacherId: l.teacher_id || undefined,
          auditorium: l.auditorium || '',
        } as ClassInfo;
      });

      return { day: dayName, classes };
    });
  }, [lessons, exceptions, period, parityNumber, weekDates, profile?.subgroup]);

  const stats = useMemo(
    () => calculateScheduleStats(dynamicSchedule),
    [dynamicSchedule]
  );

  const totalHoursDecimal = stats.totalMinutes / 60;
  const typeTotal = stats.lectureCount + stats.practiceCount + stats.labCount + stats.otherCount;

  const typeItems = [
    { label: t('ui.statsLecturesCount'), count: stats.lectureCount, color: 'bg-blue-500', textColor: 'text-blue-500', icon: BookOpen },
    { label: t('ui.statsPracticeCount'), count: stats.practiceCount, color: 'bg-emerald-500', textColor: 'text-emerald-500', icon: Zap },
    { label: t('ui.statsLabCount'), count: stats.labCount, color: 'bg-purple-500', textColor: 'text-purple-500', icon: Flame },
  ].filter(item => item.count > 0);

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.07, duration: 0.4, ease: 'easeOut' as const },
    }),
  };

  const busiestDayName = stats.busiestDay
    ? (() => {
        const idx = DAYS_ORDER.indexOf(stats.busiestDay.name as typeof DAYS_ORDER[number]);
        return idx !== -1 ? t(`days.${DAY_KEYS_ORDERED[idx]}`) : stats.busiestDay.name;
      })()
    : null;

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
            <div>
              <h1 className="font-bold text-lg text-text-primary-light dark:text-text-primary-dark">
                {t('ui.statsTitle')}
              </h1>
              <p className="text-xs text-text-muted-light dark:text-text-muted-dark font-medium">
                {period === 'week'
                  ? `${currentParity === 'odd' ? t('ui.oddWeek') : t('ui.evenWeek')}`
                  : t('ui.statsTotal')}
              </p>
            </div>
            {/* Period toggle */}
            <div className="ml-auto flex rounded-xl overflow-hidden border border-border-light dark:border-border-dark">
              {(['week', 'all'] as Period[]).map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 text-xs font-bold transition-colors ${
                    period === p
                      ? 'bg-primary-500 text-white'
                      : 'bg-card-light dark:bg-card-dark text-text-secondary-light dark:text-text-secondary-dark'
                  }`}
                >
                  {p === 'week' ? t('ui.statsWeekly') : t('ui.statsTotal')}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-4 pt-4 flex flex-col gap-4">
          {/* Main stats row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Total hours */}
            <motion.div
              custom={0}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              className="bg-gradient-to-br from-primary-500 to-[#8b5cf6] rounded-2xl p-4 text-white shadow-lg shadow-primary-500/20"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                  <Clock size={16} />
                </div>
                <span className="text-xs font-bold text-white/80 uppercase tracking-wider">
                  {t('ui.statsTotalHours')}
                </span>
              </div>
              <div className="text-3xl font-black mb-0.5">
                {totalHoursDecimal.toFixed(1)}
                <span className="text-lg font-bold ml-1 text-white/70">{t('ui.statsHours')}</span>
              </div>
              <div className="text-xs text-white/60 font-medium">
                {stats.totalLessons} {t('ui.statsLessonsCount')}
              </div>
            </motion.div>

            {/* Break time */}
            <motion.div
              custom={1}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              className="bg-card-light dark:bg-card-dark rounded-2xl p-4 border border-border-light dark:border-border-dark shadow-sm"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-amber-50 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                  <Coffee size={16} className="text-amber-500" />
                </div>
                <span className="text-xs font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider">
                  {t('ui.statsBreakTime')}
                </span>
              </div>
              <div className="text-3xl font-black text-text-primary-light dark:text-text-primary-dark mb-0.5">
                {Math.floor(stats.totalBreakMinutes / 60).toFixed(0)}
                <span className="text-lg font-bold ml-1 text-text-muted-light dark:text-text-muted-dark">{t('ui.statsHours')}</span>
              </div>
              <div className="text-xs text-text-muted-light dark:text-text-muted-dark font-medium">
                {stats.totalBreakMinutes % 60 > 0 ? `${stats.totalBreakMinutes % 60} ${t('ui.statsMinutes')}` : t('ui.statsBreaks')}
              </div>
            </motion.div>
          </div>

          {/* Type breakdown */}
          {typeItems.length > 0 && (
            <motion.div
              custom={2}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              className="bg-card-light dark:bg-card-dark rounded-2xl p-4 border border-border-light dark:border-border-dark shadow-sm"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-primary-50 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                  <BarChart3 size={16} className="text-primary-500" />
                </div>
                <span className="text-sm font-bold text-text-primary-light dark:text-text-primary-dark">
                  {t('ui.statsTypeBreakdown')}
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {typeItems.map((item, i) => {
                  const pct = typeTotal > 0 ? Math.round((item.count / typeTotal) * 100) : 0;
                  const Icon = item.icon;
                  return (
                    <div key={i} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon size={13} className={item.textColor} />
                          <span className="text-xs font-bold text-text-secondary-light dark:text-text-secondary-dark">
                            {item.label}
                          </span>
                        </div>
                        <span className="text-xs font-black text-text-primary-light dark:text-text-primary-dark">
                          {item.count} <span className="font-medium text-text-muted-light dark:text-text-muted-dark">({pct}%)</span>
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-border-light dark:bg-border-dark rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, delay: 0.3 + i * 0.1, ease: 'easeOut' }}
                          className={`h-full ${item.color} rounded-full`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Per-day distribution */}
          <motion.div
            custom={3}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="bg-card-light dark:bg-card-dark rounded-2xl p-4 border border-border-light dark:border-border-dark shadow-sm"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                <TrendingUp size={16} className="text-emerald-500" />
              </div>
              <span className="text-sm font-bold text-text-primary-light dark:text-text-primary-dark">
                Нагрузка по дням
              </span>
            </div>
            <div className="flex items-end justify-between gap-1.5 h-20">
              {stats.perDay.map((d, i) => {
                const maxCount = Math.max(...stats.perDay.map(x => x.count), 1);
                const heightPct = maxCount > 0 ? (d.count / maxCount) * 100 : 0;
                const isBusiest = stats.busiestDay?.name === d.name && d.count > 0;
                return (
                  <div key={i} className="flex flex-col items-center gap-1 flex-1">
                    <span className="text-[9px] font-bold text-text-muted-light dark:text-text-muted-dark">
                      {d.count > 0 ? d.count : '—'}
                    </span>
                    <div className="w-full flex items-end justify-center" style={{ height: '52px' }}>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(heightPct, d.count > 0 ? 10 : 0)}%` }}
                        transition={{ duration: 0.6, delay: 0.4 + i * 0.05, ease: 'easeOut' }}
                        style={{ minHeight: d.count > 0 ? '6px' : '0' }}
                        className={`w-full rounded-t-lg ${
                          isBusiest
                            ? 'bg-gradient-to-t from-primary-600 to-primary-400'
                            : d.count > 0
                              ? 'bg-primary-200 dark:bg-primary-800/60'
                              : 'bg-border-light dark:bg-border-dark'
                        }`}
                      />
                    </div>
                    <span className="text-[9px] font-bold text-text-muted-light dark:text-text-muted-dark uppercase">
                      {t(`daysShort.${DAY_KEYS_ORDERED[i]}`)}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Fun facts */}
          <motion.div
            custom={4}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="bg-card-light dark:bg-card-dark rounded-2xl border border-border-light dark:border-border-dark shadow-sm overflow-hidden"
          >
            <div className="flex items-center gap-2 p-4 pb-3">
              <div className="w-8 h-8 bg-orange-50 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                <Award size={16} className="text-orange-500" />
              </div>
              <span className="text-sm font-bold text-text-primary-light dark:text-text-primary-dark">
                {t('ui.statsFunFacts')}
              </span>
            </div>
            <div className="divide-y divide-border-light dark:divide-border-dark">
              {/* Busiest day */}
              {busiestDayName && stats.busiestDay && stats.busiestDay.count > 0 && (
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="w-9 h-9 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center shrink-0">
                    <Flame size={16} className="text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-text-muted-light dark:text-text-muted-dark font-medium mb-0.5">
                      {t('ui.statsMostBusy')}
                    </div>
                    <div className="font-bold text-sm text-text-primary-light dark:text-text-primary-dark truncate">
                      {busiestDayName} — {stats.busiestDay.count} занятий
                    </div>
                  </div>
                </div>
              )}

              {/* Top subject */}
              {stats.topSubject && (
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="w-9 h-9 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center shrink-0">
                    <BookOpen size={16} className="text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-text-muted-light dark:text-text-muted-dark font-medium mb-0.5">
                      {t('ui.statsTopSubject')}
                    </div>
                    <div className="font-bold text-sm text-text-primary-light dark:text-text-primary-dark truncate">
                      {stats.topSubject.name}
                    </div>
                    <div className="text-xs text-text-muted-light dark:text-text-muted-dark">
                      {formatMinutes(stats.topSubject.minutes, t('ui.statsHours'), t('ui.statsMinutes'))} {t('ui.statsPerWeek')}
                    </div>
                  </div>
                </div>
              )}

              {/* Top teacher */}
              {stats.topTeacher && (
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="w-9 h-9 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center shrink-0">
                    <User size={16} className="text-purple-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-text-muted-light dark:text-text-muted-dark font-medium mb-0.5">
                      {t('ui.statsTopTeacher')}
                    </div>
                    <div className="font-bold text-sm text-text-primary-light dark:text-text-primary-dark truncate">
                      {stats.topTeacher.name}
                    </div>
                    <div className="text-xs text-text-muted-light dark:text-text-muted-dark">
                      {stats.topTeacher.count} занятий {t('ui.statsPerWeek')}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Empty state */}
          {stats.totalLessons === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/20 rounded-full flex items-center justify-center mb-4">
                <BarChart3 size={32} className="text-primary-400" />
              </div>
              <p className="text-text-muted-light dark:text-text-muted-dark font-medium">
                Нет данных для отображения
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
