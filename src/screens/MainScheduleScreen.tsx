import { useState } from 'react';
import { LayoutGroup } from 'framer-motion';
import { type ClassInfo } from '../data/schedule';
import { Header } from '../components/Header';
import { DaySchedule } from '../components/DaySchedule';
import { DayTabs } from '../components/DayTabs';
import { SettingsSheet } from '../components/SettingsSheet';
import { LessonNotesSheet } from '../components/LessonNotesSheet';
import { FloatingCurrentLesson } from '../components/FloatingCurrentLesson';
import { TimeMachineWidget } from '../components/TimeMachineWidget';
import { ExceptionSheet } from '../components/ExceptionSheet';
import { useCurrentTime } from '../hooks/useCurrentTime';
import { DAYS_ORDER, JS_DAY_TO_INDEX } from '../i18n';
import { getClassStatus, getCurrentWeekParity } from '../utils/time';
import { startOfWeek, addDays, format } from 'date-fns';
import { useNotificationScheduler } from '../hooks/useNotificationScheduler';
import { useSchedule } from '../hooks/useSchedule';
import { useExceptions } from '../hooks/useExceptions';

export function MainScheduleScreen() {
  const currentTime = useCurrentTime();

  const { lessons } = useSchedule();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedNotesLesson, setSelectedNotesLesson] = useState<ClassInfo | null>(null);
  const [editingExceptionLesson, setEditingExceptionLesson] = useState<{lesson: ClassInfo, dateStr: string} | null>(null);

  // Determine current day
  const realDayIndex = currentTime.getDay(); // 0=Sun, 1=Mon...
  const daysOrderIndex = JS_DAY_TO_INDEX[realDayIndex];
  const defaultDay = daysOrderIndex !== undefined
    ? DAYS_ORDER[daysOrderIndex]
    : DAYS_ORDER[0];

  const [selectedDay, setSelectedDay] = useState<string>(defaultDay);
  const [currentParity, setCurrentParity] = useState<'even' | 'odd'>(getCurrentWeekParity(currentTime));

  const weekStart = startOfWeek(currentTime, { weekStartsOn: 1 });
  const weekDates = DAYS_ORDER.map((_, idx) => format(addDays(weekStart, idx), 'yyyy-MM-dd'));
  const { exceptions, addOrUpdateException, removeException } = useExceptions(weekDates[0], weekDates[weekDates.length - 1]);

  const parityNumber = currentParity === 'odd' ? 1 : 2;

  // Map DB lessons to UI format
  const dynamicSchedule = DAYS_ORDER.map((dayName, idx) => {
    const dbDay = idx + 1;
    const dateStr = weekDates[idx];
    const dayLessons = lessons
      .filter(l => l.day_of_week === dbDay && (l.week_parity === null || l.week_parity === parityNumber))
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
    return {
      day: dayName,
      classes: dayLessons.map(l => {
        const ex = exceptions.find(e => e.template_id === l.id && e.date === dateStr);
        if (ex) {
          return {
            id: l.id,
            time: (ex.new_start_time && ex.new_end_time) ? `${ex.new_start_time.slice(0,5)} - ${ex.new_end_time.slice(0,5)}` : `${l.start_time.slice(0,5)} - ${l.end_time.slice(0,5)}`,
            originalTime: (ex.new_start_time && ex.new_end_time) ? `${l.start_time.slice(0,5)} - ${l.end_time.slice(0,5)}` : undefined,
            subject: l.subject,
            type: l.type_tag || '',
            teacher: ex.new_teacher || l.teacher || '',
            originalTeacher: ex.new_teacher ? (l.teacher || '') : undefined,
            auditorium: ex.new_auditorium || l.auditorium || '',
            originalAuditorium: ex.new_auditorium ? (l.auditorium || '') : undefined,
            isCancelled: ex.is_cancelled
          };
        }
        return {
          id: l.id,
          time: `${l.start_time.slice(0,5)} - ${l.end_time.slice(0,5)}`,
          subject: l.subject,
          type: l.type_tag || '',
          teacher: l.teacher || '',
          auditorium: l.auditorium || ''
        };
      }) as ClassInfo[]
    };
  });

  const activeDaySchedule = dynamicSchedule.find(
    (s) => s.day === selectedDay
  ) || { day: selectedDay, classes: [] };

  const isToday = selectedDay === (daysOrderIndex !== undefined ? DAYS_ORDER[daysOrderIndex] : '');
  
  const todaySchedule = daysOrderIndex !== undefined 
    ? dynamicSchedule.find(s => s.day === DAYS_ORDER[daysOrderIndex])
    : undefined;
    
  useNotificationScheduler(todaySchedule?.classes || []);

  // Floating Current Lesson logic
  let floatingLesson = null;
  let floatingMinutesLeft: number | null = null;
  
  if (daysOrderIndex !== undefined) {
    const todaySchedule = dynamicSchedule.find(s => s.day === DAYS_ORDER[daysOrderIndex]);
    if (todaySchedule) {
      for (const lesson of todaySchedule.classes) {
        const status = getClassStatus(lesson.time, currentTime);
        if (status.status === 'current') {
          floatingLesson = lesson;
          floatingMinutesLeft = status.minutesLeft ?? null;
          break;
        }
      }
    }
  }

  const showFloating = !isToday && floatingLesson !== null && !settingsOpen && !selectedNotesLesson && !editingExceptionLesson;

  const handleReturnToday = () => {
    if (daysOrderIndex !== undefined) {
      setSelectedDay(DAYS_ORDER[daysOrderIndex]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark transition-colors duration-300 relative">
      <div className="max-w-lg mx-auto pb-8">
        {/* Header (dynamic group name from AuthContext) */}
        <Header
          onSettingsOpen={() => setSettingsOpen(true)}
        />

        {/* Day Tabs */}
        <LayoutGroup>
          <DayTabs
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
            currentDayIndex={realDayIndex}
          />
        </LayoutGroup>

        {/* Parity Toggle */}
        <div className="px-4 pb-2 flex justify-end">
          <button 
            onClick={() => setCurrentParity(p => p === 'even' ? 'odd' : 'even')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-full border transition-colors ${
              currentParity === 'even' 
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-500' 
                : 'bg-orange-500/10 border-orange-500/30 text-orange-500'
            }`}
          >
            {currentParity === 'even' ? 'Четная неделя' : 'Нечетная неделя'}
          </button>
        </div>

        {/* Schedule */}
        <div className="px-4">
          <DaySchedule
            key={selectedDay}
            daySchedule={activeDaySchedule}
            currentTime={currentTime}
            isActiveDay={isToday}
            onLessonSelect={setSelectedNotesLesson}
          />
        </div>

        {/* Notes Bottom Sheet */}
        <LessonNotesSheet
          lesson={selectedNotesLesson}
          isOpen={selectedNotesLesson !== null}
          onClose={() => setSelectedNotesLesson(null)}
          onEditException={() => {
            const dayIndex = DAYS_ORDER.indexOf(selectedDay as typeof DAYS_ORDER[number]);
            if (dayIndex !== -1 && selectedNotesLesson) {
              setEditingExceptionLesson({
                lesson: selectedNotesLesson,
                dateStr: weekDates[dayIndex]
              });
            }
            setSelectedNotesLesson(null);
          }}
        />

        {/* Exception Bottom Sheet */}
        <ExceptionSheet
          lesson={editingExceptionLesson?.lesson || null}
          date={editingExceptionLesson?.dateStr || ''}
          isOpen={editingExceptionLesson !== null}
          onClose={() => setEditingExceptionLesson(null)}
          onSave={addOrUpdateException}
          onDelete={() => {
            if (editingExceptionLesson?.lesson?.id) {
              return removeException(editingExceptionLesson.lesson.id, editingExceptionLesson.dateStr);
            }
            return Promise.resolve();
          }}
        />

        {/* Settings Bottom Sheet */}
        <SettingsSheet
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
        />

        {/* Floating Current Lesson */}
        <FloatingCurrentLesson 
          lesson={floatingLesson}
          minutesLeft={floatingMinutesLeft}
          isVisible={showFloating}
          onReturnToday={handleReturnToday}
        />

        {/* Developer Tool: Time Machine (Hidden in production) */}
        {import.meta.env.DEV && <TimeMachineWidget />}
      </div>
    </div>
  );
}
