import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, MapPin, X, Maximize2, PartyPopper } from 'lucide-react';
import { useCurrentTime } from '../hooks/useCurrentTime';
import { useSchedule } from '../hooks/useSchedule';
import { useLanguage, DAYS_ORDER, JS_DAY_TO_INDEX } from '../i18n';
import { getClassStatus, getCurrentWeekParity } from '../utils/time';
import { format } from 'date-fns';
import { stringToColor } from '../utils/colors';
import { cn } from '../utils/cn';

export function LandscapeClockScreen() {
  const currentTime = useCurrentTime();
  const { lessons } = useSchedule();
  const { t } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Time formatting
  const timeString = format(currentTime, 'HH:mm');
  const secondsString = format(currentTime, 'ss');
  
  // Calculate today's schedule
  const realDayIndex = currentTime.getDay();
  const daysOrderIndex = JS_DAY_TO_INDEX[realDayIndex];
  const parity = getCurrentWeekParity(currentTime);
  const parityNumber = parity === 'odd' ? 1 : 2;
  
  const todayLessons = useMemo(() => {
    if (daysOrderIndex === undefined) return [];
    return lessons
      .filter(l => {
        if (l.day_of_week !== daysOrderIndex + 1) return false;
        if (l.week_parity !== null && l.week_parity !== parityNumber) return false;
        return true;
      })
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
      .map(l => ({
        id: l.id,
        time: `${l.start_time.slice(0,5)} - ${l.end_time.slice(0,5)}`,
        subject: l.subject,
        type: l.type_tag || '',
        teacher: l.teacher || '',
        room: l.auditorium || '',
        originalTime: undefined,
        isCancelled: false
      }));
  }, [lessons, daysOrderIndex, parityNumber]);

  // Find current and next lessons
  let currentLesson = null;
  let nextLesson = null;
  let minutesToNext = -1;

  for (let i = 0; i < todayLessons.length; i++) {
    const lesson = todayLessons[i];
    const status = getClassStatus(lesson.time, currentTime);
    
    if (status.status === 'current') {
      currentLesson = { ...lesson, progress: status.progress, minutesLeft: status.minutesLeft || 0 };
      if (i + 1 < todayLessons.length) {
        nextLesson = todayLessons[i + 1];
      }
      break;
    } else if (status.status === 'upcoming') {
      if (!nextLesson) {
        nextLesson = lesson;
        minutesToNext = status.minutesUntil || 0;
      }
    }
  }

  // Handle Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[100] bg-black text-white flex overflow-hidden font-sans"
    >
      {/* Background glow based on current state */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={cn(
          "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vh] opacity-20 blur-[100px] rounded-full transition-colors duration-1000",
          currentLesson ? "bg-primary-500" : "bg-blue-900"
        )} />
      </div>

      {/* Main Clock Area */}
      <div className={cn(
        "relative z-10 flex flex-col justify-center h-full p-8 transition-all duration-500",
        sidebarOpen ? "w-2/3" : "w-full items-center"
      )}>
        {/* Date */}
        <motion.div layout className="text-white/60 text-xl font-medium mb-2 tracking-wide uppercase">
          {t(`days.${DAYS_ORDER[daysOrderIndex || 0]}`)}, {format(currentTime, 'dd.MM')}
        </motion.div>

        {/* Big Clock */}
        <motion.div layout className="flex items-baseline gap-2 mb-8">
          <span className="text-[120px] leading-none font-black tracking-tighter tabular-nums drop-shadow-2xl">
            {timeString}
          </span>
          <span className="text-4xl font-bold text-primary-400 opacity-80 tabular-nums">
            {secondsString}
          </span>
        </motion.div>

        {/* Current Status */}
        <motion.div layout className="max-w-xl">
          {currentLesson ? (
            <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute bottom-0 left-0 h-1.5 w-full bg-white/5">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary-400 to-blue-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${currentLesson.progress}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>

              <div className="flex justify-between items-start mb-4">
                <div className="bg-primary-500/20 text-primary-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-primary-500/30">
                  {t('ui.lessonNow')}
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-white">{currentLesson.minutesLeft} {t('ui.statsMinutes')}</div>
                  <div className="text-white/50 text-xs font-medium uppercase">{t('ui.statsMinutes')} {t('ui.statsLeft').toLowerCase()}</div>
                </div>
              </div>

              <h2 className="text-3xl font-bold mb-3 leading-tight text-white">{currentLesson.subject}</h2>
              
              <div className="flex items-center gap-6 text-white/70">
                <div className="flex items-center gap-2">
                  <MapPin size={18} className="text-primary-400" />
                  <span className="font-medium text-lg">{currentLesson.room}</span>
                </div>
                {currentLesson.teacher && (
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-inner"
                      style={{ backgroundColor: stringToColor(currentLesson.teacher) }}
                    >
                      {currentLesson.teacher.substring(0, 2)}
                    </div>
                    <span className="font-medium text-lg">{currentLesson.teacher}</span>
                  </div>
                )}
              </div>
            </div>
          ) : nextLesson ? (
            <div className="bg-white/5 backdrop-blur-md border border-white/5 rounded-3xl p-6">
              <div className="flex items-center gap-3 text-white/60 mb-2">
                <Clock size={20} />
                <span className="text-lg font-medium">{t('ui.break')}</span>
              </div>
              <div className="text-4xl font-bold mb-2">
                До пары {minutesToNext} {t('ui.statsMinutes')}
              </div>
              <div className="text-xl text-primary-300 font-medium">
                Далее: {nextLesson.subject} в {nextLesson.time.split('-')[0]}
              </div>
            </div>
          ) : (
            <div className="bg-white/5 backdrop-blur-md border border-white/5 rounded-3xl p-6 text-center">
              <PartyPopper size={40} className="text-primary-400 mx-auto mb-4" />
              <div className="text-2xl font-bold">{t('ui.noLessonsToday')}</div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Sidebar Toggle Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute top-6 right-6 z-50 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-colors"
      >
        {sidebarOpen ? <X size={24} /> : <Clock size={24} />}
      </button>

      {/* Fullscreen Toggle Button */}
      <button
        onClick={toggleFullscreen}
        className="absolute bottom-6 right-6 z-50 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-colors"
      >
        <Maximize2 size={20} />
      </button>

      {/* Sidebar - Upcoming Lessons */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute right-0 top-0 bottom-0 w-1/3 bg-black/40 backdrop-blur-2xl border-l border-white/10 p-6 flex flex-col z-20"
          >
            <h3 className="text-xl font-bold mb-6 text-white/90 pt-4">Расписание на сегодня</h3>
            <div className="flex-1 overflow-y-auto hide-scrollbar flex flex-col gap-3 pb-20">
              {todayLessons.map((lesson, idx) => {
                const status = getClassStatus(lesson.time, currentTime);
                const isPast = status.status === 'past';
                const isCurrent = status.status === 'current';
                
                return (
                  <div 
                    key={idx}
                    className={cn(
                      "p-4 rounded-2xl border transition-all",
                      isCurrent 
                        ? "bg-primary-500/20 border-primary-500/50" 
                        : isPast
                          ? "bg-white/5 border-white/5 opacity-50"
                          : "bg-white/10 border-white/10"
                    )}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-primary-300 font-bold font-mono">{lesson.time}</div>
                      {isCurrent && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                    </div>
                    <div className="font-bold text-white mb-1 line-clamp-2">{lesson.subject}</div>
                    <div className="text-white/60 text-sm flex items-center gap-1">
                      <MapPin size={12} /> {lesson.room}
                    </div>
                  </div>
                );
              })}
              {todayLessons.length === 0 && (
                <div className="text-center text-white/50 mt-10">
                  Пар нет
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
