import { useState } from 'react';
import { LayoutGroup } from 'framer-motion';
import { scheduleData, type ClassInfo } from './data/schedule';
import { DaySchedule } from './components/DaySchedule';
import { Header } from './components/Header';
import { DayTabs } from './components/DayTabs';
import { SettingsSheet } from './components/SettingsSheet';
import { LessonNotesSheet } from './components/LessonNotesSheet';
import { FloatingCurrentLesson } from './components/FloatingCurrentLesson';
import { TimeMachineWidget } from './components/TimeMachineWidget';
import { useCurrentTime } from './hooks/useCurrentTime';
import { DAYS_ORDER, JS_DAY_TO_INDEX } from './i18n';
import { getClassStatus } from './utils/time';
import { useNotificationScheduler } from './hooks/useNotificationScheduler';

export default function App() {
  const currentTime = useCurrentTime();
  useNotificationScheduler(); // Initialize the scheduler

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedNotesLesson, setSelectedNotesLesson] = useState<ClassInfo | null>(null);

  // Determine current day
  const realDayIndex = currentTime.getDay(); // 0=Sun, 1=Mon...
  const daysOrderIndex = JS_DAY_TO_INDEX[realDayIndex];
  const defaultDay = daysOrderIndex !== undefined
    ? DAYS_ORDER[daysOrderIndex]
    : DAYS_ORDER[0]; // Default to Monday on weekends

  const [selectedDay, setSelectedDay] = useState(defaultDay);

  const activeDaySchedule = scheduleData.schedule.find(
    (s) => s.day === selectedDay
  ) || { day: selectedDay, classes: [] };

  const isToday = selectedDay === (daysOrderIndex !== undefined ? DAYS_ORDER[daysOrderIndex] : '');

  // Floating Current Lesson logic
  let floatingLesson = null;
  let floatingMinutesLeft = null;
  
  if (daysOrderIndex !== undefined) {
    const todaySchedule = scheduleData.schedule.find(s => s.day === DAYS_ORDER[daysOrderIndex]);
    if (todaySchedule) {
      for (const lesson of todaySchedule.classes) {
        const status = getClassStatus(lesson.time, currentTime);
        if (status.status === 'current') {
          floatingLesson = lesson;
          floatingMinutesLeft = status.minutesLeft;
          break;
        }
      }
    }
  }

  const showFloating = !isToday && floatingLesson !== null && !settingsOpen && !selectedNotesLesson;

  const handleReturnToday = () => {
    if (daysOrderIndex !== undefined) {
      setSelectedDay(DAYS_ORDER[daysOrderIndex]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark transition-colors duration-300 relative">
      <div className="max-w-lg mx-auto pb-8">
        {/* Header */}
        <Header
          onSettingsOpen={() => setSettingsOpen(true)}
          group={scheduleData.group}
        />

        {/* Day Tabs */}
        <LayoutGroup>
          <DayTabs
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
            currentDayIndex={realDayIndex}
          />
        </LayoutGroup>

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
