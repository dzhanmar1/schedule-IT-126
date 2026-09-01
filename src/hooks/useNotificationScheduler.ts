import { useEffect, useRef } from 'react';
import { scheduleData } from '../data/schedule';
import { useCurrentTime } from './useCurrentTime';
import { useNotifications } from './useNotifications';
import { parseClassTime } from '../utils/time';
import { differenceInMinutes } from 'date-fns';
import { DAYS_ORDER, JS_DAY_TO_INDEX } from '../i18n';

export function useNotificationScheduler() {
  const currentTime = useCurrentTime();
  const { permission, scheduleNotification } = useNotifications();
  const notifiedSet = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (permission !== 'granted') return;

    const realDayIndex = currentTime.getDay();
    const daysOrderIndex = JS_DAY_TO_INDEX[realDayIndex];
    if (daysOrderIndex === undefined) return;

    const todaySchedule = scheduleData.schedule.find(s => s.day === DAYS_ORDER[daysOrderIndex]);
    if (!todaySchedule) return;

    todaySchedule.classes.forEach((lesson) => {
      const { startTime } = parseClassTime(lesson.time, currentTime);
      const diff = differenceInMinutes(startTime, currentTime);

      const notifyKey = `${lesson.subject}-${lesson.time}-${currentTime.toDateString()}`;

      // Уведомляем ровно за 15 минут до начала пары
      if (diff === 15 && !notifiedSet.current.has(notifyKey)) {
        scheduleNotification(`Скоро пара: ${lesson.subject.replace(/\s*\/\s*(лек|пр|лаб)\s*/i, '')}`, {
          body: `Начало через 15 минут в ауд. ${lesson.auditorium}`,
        });
        notifiedSet.current.add(notifyKey);
      }
    });
  }, [currentTime, permission, scheduleNotification]);
}
