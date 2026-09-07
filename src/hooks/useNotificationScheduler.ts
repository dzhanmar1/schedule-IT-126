import { useEffect, useRef } from 'react';
import { useCurrentTime } from './useCurrentTime';
import { useNotifications } from './useNotifications';
import { parseClassTime } from '../utils/time';
import { differenceInMinutes } from 'date-fns';
import type { ClassInfo } from '../data/schedule';

export function useNotificationScheduler(todayClasses: ClassInfo[]) {
  const currentTime = useCurrentTime();
  const { permission, scheduleNotification } = useNotifications();
  const notifiedSet = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (permission !== 'granted' || !todayClasses.length) return;

    todayClasses.forEach((lesson) => {
      if (lesson.isCancelled) return;

      const { startTime } = parseClassTime(lesson.time, currentTime);
      const diff = differenceInMinutes(startTime, currentTime);

      const notifyKey = `${lesson.id || lesson.subject}-${lesson.time}-${currentTime.toDateString()}`;

      // Уведомляем ровно за 15 минут до начала пары
      if (diff === 15 && !notifiedSet.current.has(notifyKey)) {
        scheduleNotification(`Скоро пара: ${lesson.subject.replace(/\s*\/\s*(лек|пр|лаб)\s*/i, '')}`, {
          body: `Начало через 15 минут в ауд. ${lesson.auditorium}`,
        });
        notifiedSet.current.add(notifyKey);
      }
    });
  }, [currentTime, permission, scheduleNotification, todayClasses]);
}
