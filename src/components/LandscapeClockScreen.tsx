import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, MapPin, X, Maximize2, Sparkles, Calendar } from 'lucide-react';
import { useCurrentTime } from '../hooks/useCurrentTime';
import { useSchedule } from '../hooks/useSchedule';
import { useLanguage, DAY_KEYS_ORDERED, JS_DAY_TO_INDEX } from '../i18n';
import { getClassStatus, getCurrentWeekParity } from '../utils/time';
import { format } from 'date-fns';
import { cn } from '../utils/cn';

export function LandscapeClockScreen() {
  const currentTime = useCurrentTime();
  const { lessons } = useSchedule();
  const { t } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const timeString = format(currentTime, 'HH:mm');
  const secondsString = format(currentTime, 'ss');
  
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
      className="fixed inset-0 z-[100] bg-black text-white flex overflow-hidden font-sans select-none"
    >
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-center min-w-0 p-8 md:p-12 relative z-10">
        
        {/* Date */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-white/40 text-sm md:text-base font-bold tracking-[0.2em] uppercase mb-4"
        >
          <Calendar size={16} />
          {t(`days.${DAY_KEYS_ORDERED[daysOrderIndex || 0]}`)}, {format(currentTime, 'dd.MM')}
        </motion.div>

        {/* Big Clock */}
        <div className="flex items-baseline gap-2 mb-6 md:mb-10">
          <span className="text-8xl md:text-[120px] lg:text-[160px] leading-none font-bold tracking-tighter tabular-nums text-white/90">
            {timeString}
          </span>
          <span className="text-3xl md:text-5xl font-medium text-white/30 tabular-nums">
            {secondsString}
          </span>
        </div>

        {/* Status Area */}
        <div className="max-w-2xl min-h-[100px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {currentLesson ? (
              <motion.div 
                key="current"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex flex-col gap-2 pr-6"
              >
                <div className="flex items-center gap-4 mb-1">
                  <div className="flex items-center gap-2 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-red-400 font-bold tracking-widest uppercase text-xs">Live</span>
                  </div>
                  <span className="text-white/50 text-sm font-medium">
                    Осталось {currentLesson.minutesLeft} {t('ui.minutesShort')}
                  </span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-white/90 truncate leading-tight">
                  {currentLesson.subject}
                </h2>
                <div className="flex flex-wrap items-center gap-4 text-white/50 text-sm md:text-base font-medium mt-1">
                  <span className="flex items-center gap-1.5 shrink-0">
                    <MapPin size={16} className="opacity-70" /> {currentLesson.room}
                  </span>
                  {currentLesson.teacher && (
                    <span className="flex items-center gap-1.5 truncate">
                      <span className="w-1.5 h-1.5 rounded-full bg-white/20 shrink-0 hidden md:block" />
                      <span className="truncate">{currentLesson.teacher}</span>
                    </span>
                  )}
                </div>
              </motion.div>
            ) : nextLesson ? (
              <motion.div 
                key="next"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex flex-col gap-2"
              >
                <div className="flex items-center gap-3 text-white/40 mb-1 font-bold tracking-widest uppercase text-sm">
                  <Clock size={16} />
                  <span>Перемена</span>
                </div>
                <div className="text-xl md:text-3xl font-bold text-white/90">
                  До пары <span className="text-white">{minutesToNext}</span> {t('ui.minutesShort')}
                </div>
                <div className="text-sm md:text-base text-white/50 font-medium flex items-center gap-3 mt-1">
                  Далее: <span className="text-white/80">{nextLesson.subject}</span>
                  <span className="bg-white/10 px-2.5 py-0.5 rounded text-xs">{nextLesson.time.split('-')[0]}</span>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="none"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-4 text-white/40"
              >
                <Sparkles size={24} className="opacity-50" />
                <div className="text-lg md:text-xl font-medium tracking-wide">Сабақ жоқ. Демалуға болады!</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Action Buttons (Bottom Right) */}
      <div className="absolute bottom-6 right-6 md:bottom-8 md:right-8 z-50 flex gap-4">
        <button
          onClick={toggleFullscreen}
          className="w-12 h-12 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/90 transition-colors"
        >
          <Maximize2 size={20} />
        </button>
        {!sidebarOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => setSidebarOpen(true)}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <Clock size={20} />
          </motion.button>
        )}
      </div>

      {/* Minimalist Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 200 }}
            className="w-1/3 min-w-[280px] max-w-[400px] bg-black border-l border-white/10 flex flex-col z-40"
          >
            <div className="flex items-center justify-between p-6 md:p-8 pb-4">
              <h3 className="text-sm font-bold tracking-[0.2em] uppercase text-white/40">Расписание</h3>
              <button
                onClick={() => setSidebarOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
              >
                <X size={18} className="text-white/40" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto hide-scrollbar px-6 md:px-8 pb-24 flex flex-col">
              {todayLessons.map((lesson, idx) => {
                const status = getClassStatus(lesson.time, currentTime);
                const isPast = status.status === 'past';
                const isCurrent = status.status === 'current';
                
                return (
                  <div 
                    key={idx}
                    className={cn(
                      "py-4 border-b border-white/5 transition-opacity duration-300 flex flex-col gap-1.5 shrink-0 last:border-0",
                      isCurrent ? "opacity-100" : isPast ? "opacity-30" : "opacity-70 hover:opacity-100"
                    )}
                  >
                    <div className="flex justify-between items-center">
                      <div className={cn("font-bold font-mono tracking-tight text-sm", isCurrent ? "text-white" : "text-white/70")}>
                        {lesson.time}
                      </div>
                      {isCurrent && <div className="text-[9px] font-bold uppercase tracking-widest text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">Live</div>}
                    </div>
                    <div className={cn("font-bold text-base leading-snug line-clamp-2", isCurrent ? "text-white" : "text-white/90")}>
                      {lesson.subject}
                    </div>
                  </div>
                );
              })}
              
              {todayLessons.length === 0 && (
                <div className="text-white/20 mt-8 text-sm font-medium tracking-wide">
                  На сегодня пар нет
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
