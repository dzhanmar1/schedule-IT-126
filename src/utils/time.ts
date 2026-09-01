import { set, differenceInMinutes } from 'date-fns';

export function parseClassTime(timeStr: string, referenceDate: Date = new Date()) {
  const [startStr, endStr] = timeStr.split('-').map((s) => s.trim());
  const [startHour, startMinute] = startStr.split('.').map(Number);
  const [endHour, endMinute] = endStr.split('.').map(Number);

  const startTime = set(referenceDate, { hours: startHour, minutes: startMinute, seconds: 0, milliseconds: 0 });
  const endTime = set(referenceDate, { hours: endHour, minutes: endMinute, seconds: 0, milliseconds: 0 });

  return { startTime, endTime };
}

export function getClassStatus(timeStr: string, currentTime: Date) {
  const { startTime, endTime } = parseClassTime(timeStr, currentTime);

  if (currentTime < startTime) {
    const minutesUntil = differenceInMinutes(startTime, currentTime);
    return { status: 'upcoming', minutesUntil, progress: 0 };
  } else if (currentTime > endTime) {
    return { status: 'past', progress: 100 };
  } else {
    const totalDuration = differenceInMinutes(endTime, startTime);
    const elapsed = differenceInMinutes(currentTime, startTime);
    const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
    const minutesLeft = differenceInMinutes(endTime, currentTime);
    return { status: 'current', progress, minutesLeft };
  }
}
