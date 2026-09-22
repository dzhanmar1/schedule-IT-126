import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, MapPin, X, Maximize2, Sparkles, Calendar } from 'lucide-react';
import { useCurrentTime } from '../hooks/useCurrentTime';
import { useSchedule } from '../hooks/useSchedule';
import { useLanguage, DAY_KEYS_ORDERED, JS_DAY_TO_INDEX } from '../i18n';
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
      className="fixed inset-0 z-[100] bg-[#020817] text-white flex overflow-hidden font-sans"
    >
      {/* Dynamic Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center">
        <motion.div 
          layout
          className={cn(
            "absolute w-[120vw] h-[120vh] opacity-30 blur-[120px] rounded-[100%] mix-blend-screen transition-colors duration-1000",
            currentLesson ? "bg-primary-600/40" : "bg-blue-900/30"
          )} 
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-black/80 via-transparent to-black/20" />
      </div>

      {/* Main Clock Area */}
      <div className={cn(
        "relative z-10 flex flex-col justify-center h-full px-12 transition-all duration-700 ease-in-out",
        sidebarOpen ? "w-2/3" : "w-full items-center text-center"
      )}>
        {/* Date */}
        <motion.div layout className="flex items-center gap-3 text-primary-200/80 text-xl font-medium mb-4 tracking-widest uppercase">
          <Calendar size={20} className="opacity-70" />
          {t(`days.${DAY_KEYS_ORDERED[daysOrderIndex || 0]}`)}, {format(currentTime, 'dd.MM')}
        </motion.div>

        {/* Big Clock */}
        <motion.div layout className={cn("flex items-baseline gap-3 mb-10", !sidebarOpen && "justify-center")}>
          <span className="text-[140px] leading-[0.8] font-black tracking-tight tabular-nums drop-shadow-2xl text-white">
            {timeString}
          </span>
          <span className="text-5xl font-bold text-primary-400 opacity-90 tabular-nums pb-2">
            {secondsString}
          </span>
        </motion.div>

        {/* Current Status Widget */}
        <motion.div layout className="max-w-xl w-full">
          <AnimatePresence mode="wait">
            {currentLesson ? (
              <motion.div 
                key="current"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden group hover:bg-white/10 transition-colors"
              >
                <div className="absolute bottom-0 left-0 h-1.5 w-full bg-black/20">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary-500 to-cyan-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${currentLesson.progress}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>

                <div className="flex justify-between items-start mb-6">
                  <div className="bg-primary-500/20 text-primary-300 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-widest border border-primary-500/30 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary-400 animate-pulse" />
                    {t('ui.currentLesson')}
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-black text-white leading-none tracking-tight">
                      {currentLesson.minutesLeft} <span className="text-2xl text-white/50">{t('ui.minutesShort')}</span>
                    </div>
                  </div>
                </div>

                <h2 className="text-3xl font-bold mb-4 leading-tight text-white/95 line-clamp-2">
                  {currentLesson.subject}
                </h2>
                
                <div className="flex items-center gap-8 text-white/70">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-white/5 rounded-xl">
                      <MapPin size={20} className="text-cyan-400" />
                    </div>
                    <span className="font-semibold text-lg">{currentLesson.room}</span>
                  </div>
                  {currentLesson.teacher && (
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-sm font-bold text-white shadow-inner border border-white/10"
                        style={{ backgroundColor: stringToColor(currentLesson.teacher) }}
                      >
                        {currentLesson.teacher.substring(0, 2)}
                      </div>
                      <span className="font-semibold text-lg truncate">{currentLesson.teacher}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : nextLesson ? (
              <motion.div 
                key="next"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white/[0.03] backdrop-blur-xl border border-white/5 rounded-[2rem] p-8"
              >
                <div className="flex items-center gap-3 text-white/50 mb-4 uppercase tracking-widest text-sm font-bold">
                  <Clock size={18} />
                  <span>{t('ui.break')}</span>
                </div>
                <div className="text-4xl font-black mb-3 tracking-tight">
                  До пары <span className="text-cyan-400">{minutesToNext} {t('ui.minutesShort')}</span>
                </div>
                <div className="text-xl text-white/60 font-medium flex items-center gap-3">
                  Далее: <span className="text-white/90">{nextLesson.subject}</span>
                  <span className="bg-white/10 px-3 py-1 rounded-lg text-sm">{nextLesson.time.split('-')[0]}</span>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="none"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={cn(
                  "bg-gradient-to-br from-white/[0.05] to-transparent backdrop-blur-xl border border-white/10 rounded-[2rem] p-10 flex flex-col items-center justify-center gap-4 text-center",
                  !sidebarOpen && "mx-auto"
                )}
              >
                <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center mb-2 shadow-[0_0_30px_rgba(59,130,246,0.3)]">
                  <Sparkles size={32} className="text-primary-400" />
                </div>
                <div className="text-3xl font-bold tracking-tight">{t('ui.noLessonsToday')}</div>
                <div className="text-white/50 font-medium">Отдыхай и набирайся сил!</div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Action Buttons Container (Bottom Right) */}
      <div className="absolute bottom-8 right-8 z-50 flex gap-4">
        <button
          onClick={toggleFullscreen}
          className="w-14 h-14 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/15 border border-white/10 backdrop-blur-xl transition-all hover:scale-105 active:scale-95"
        >
          <Maximize2 size={24} className="text-white/70" />
        </button>
        {!sidebarOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => setSidebarOpen(true)}
            className="w-14 h-14 flex items-center justify-center rounded-full bg-primary-500 hover:bg-primary-400 text-white shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-all hover:scale-105 active:scale-95"
          >
            <Clock size={24} />
          </motion.button>
        )}
      </div>

      {/* Sidebar - Upcoming Lessons */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 200 }}
            className="absolute right-0 top-0 bottom-0 w-1/3 bg-black/40 backdrop-blur-3xl border-l border-white/5 flex flex-col z-40 shadow-2xl"
          >
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-8 pb-4">
              <h3 className="text-2xl font-bold text-white/90">Расписание</h3>
              <button
                onClick={() => setSidebarOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              >
                <X size={20} className="text-white/70" />
              </button>
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 overflow-y-auto hide-scrollbar px-8 pb-32 flex flex-col gap-4">
              {todayLessons.map((lesson, idx) => {
                const status = getClassStatus(lesson.time, currentTime);
                const isPast = status.status === 'past';
                const isCurrent = status.status === 'current';
                
                return (
                  <div 
                    key={idx}
                    className={cn(
                      "p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden shrink-0",
                      isCurrent 
                        ? "bg-primary-500/10 border-primary-500/30 shadow-[0_0_20px_rgba(59,130,246,0.1)]" 
                        : isPast
                          ? "bg-transparent border-white/5 opacity-40 grayscale"
                          : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04]"
                    )}
                  >
                    {isCurrent && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                    )}
                    
                    <div className="flex justify-between items-start mb-3">
                      <div className={cn("font-bold font-mono tracking-tight", isCurrent ? "text-primary-300" : "text-white/60")}>
                        {lesson.time}
                      </div>
                      {isCurrent && <div className="text-[10px] font-bold uppercase tracking-widest text-primary-400 bg-primary-500/20 px-2 py-0.5 rounded-full">Live</div>}
                    </div>
                    <div className={cn("font-bold text-lg mb-2 line-clamp-2 leading-snug", isCurrent ? "text-white" : "text-white/80")}>
                      {lesson.subject}
                    </div>
                    <div className="text-white/50 text-sm flex items-center gap-1.5 font-medium">
                      <MapPin size={14} /> {lesson.room}
                    </div>
                  </div>
                );
              })}
              
              {todayLessons.length === 0 && (
                <div className="text-center text-white/40 mt-12 flex flex-col items-center gap-3">
                  <Sparkles size={32} className="opacity-20" />
                  <span>На сегодня пар нет</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
