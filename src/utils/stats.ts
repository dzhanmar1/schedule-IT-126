import { differenceInMinutes } from 'date-fns';
import { parseClassTime } from './time';
import type { ClassInfo, DaySchedule } from '../data/schedule';

export interface LessonStats {
  totalLessons: number;
  totalMinutes: number;
  totalBreakMinutes: number;
  lectureCount: number;
  practiceCount: number;
  labCount: number;
  otherCount: number;
  busiestDay: { name: string; count: number } | null;
  topSubject: { name: string; minutes: number } | null;
  topTeacher: { name: string; count: number } | null;
  perDay: { name: string; count: number; minutes: number }[];
}

function parseLessonType(subject: string, typeTag?: string): 'лек' | 'пр' | 'лаб' | 'other' {
  const src = (typeTag || subject).toLowerCase();
  if (src.includes('лек')) return 'лек';
  if (src.includes('пр') || src.includes('практ') || src.includes('семин')) return 'пр';
  if (src.includes('лаб')) return 'лаб';
  return 'other';
}

function cleanSubjectName(subject: string): string {
  return subject
    .replace(/[/(](лек|пр|лаб|практ|семин)[/)]/gi, '')
    .replace(/\s*\/\s*$/, '')
    .replace(/^\s*\/\s*/, '')
    .trim();
}

function getLessonMinutes(lesson: ClassInfo): number {
  try {
    const ref = new Date();
    const { startTime, endTime } = parseClassTime(lesson.time, ref);
    return Math.max(0, differenceInMinutes(endTime, startTime));
  } catch {
    return 0;
  }
}

function getBreakMinutes(prev: ClassInfo, next: ClassInfo): number {
  try {
    const ref = new Date();
    const { endTime: prevEnd } = parseClassTime(prev.time, ref);
    const { startTime: nextStart } = parseClassTime(next.time, ref);
    const diff = differenceInMinutes(nextStart, prevEnd);
    return diff > 0 ? diff : 0;
  } catch {
    return 0;
  }
}

export function calculateScheduleStats(
  schedule: DaySchedule[]
): LessonStats {
  // Only non-cancelled lessons
  const activeDays = schedule.map(d => ({
    name: d.day,
    classes: d.classes.filter(c => !c.isCancelled),
  }));

  const perDay = activeDays.map(d => {
    const mins = d.classes.reduce((sum, l) => sum + getLessonMinutes(l), 0);
    return { name: d.name, count: d.classes.length, minutes: mins };
  });

  const allLessons = activeDays.flatMap(d => d.classes);

  // Type counts
  let lectureCount = 0;
  let practiceCount = 0;
  let labCount = 0;
  let otherCount = 0;
  allLessons.forEach(l => {
    const t = parseLessonType(l.subject, l.type);
    if (t === 'лек') lectureCount++;
    else if (t === 'пр') practiceCount++;
    else if (t === 'лаб') labCount++;
    else otherCount++;
  });

  // Total study minutes
  const totalMinutes = allLessons.reduce((sum, l) => sum + getLessonMinutes(l), 0);

  // Total break minutes between lessons within days
  let totalBreakMinutes = 0;
  activeDays.forEach(d => {
    for (let i = 0; i < d.classes.length - 1; i++) {
      totalBreakMinutes += getBreakMinutes(d.classes[i], d.classes[i + 1]);
    }
  });

  // Busiest day
  const busiestDay = perDay.reduce(
    (best, d) => (d.count > (best?.count ?? -1) ? d : best),
    null as { name: string; count: number; minutes: number } | null
  );

  // Top subject by total minutes
  const subjectMap: Record<string, number> = {};
  allLessons.forEach(l => {
    const name = cleanSubjectName(l.subject);
    subjectMap[name] = (subjectMap[name] ?? 0) + getLessonMinutes(l);
  });
  const topSubjectEntry = Object.entries(subjectMap).sort(([, a], [, b]) => b - a)[0];
  const topSubject = topSubjectEntry
    ? { name: topSubjectEntry[0], minutes: topSubjectEntry[1] }
    : null;

  // Top teacher by count
  const teacherMap: Record<string, number> = {};
  allLessons.forEach(l => {
    if (l.teacher && l.teacher.trim()) {
      teacherMap[l.teacher] = (teacherMap[l.teacher] ?? 0) + 1;
    }
  });
  const topTeacherEntry = Object.entries(teacherMap).sort(([, a], [, b]) => b - a)[0];
  const topTeacher = topTeacherEntry
    ? { name: topTeacherEntry[0], count: topTeacherEntry[1] }
    : null;

  return {
    totalLessons: allLessons.length,
    totalMinutes,
    totalBreakMinutes,
    lectureCount,
    practiceCount,
    labCount,
    otherCount,
    busiestDay: busiestDay ? { name: busiestDay.name, count: busiestDay.count } : null,
    topSubject,
    topTeacher,
    perDay,
  };
}

export function formatMinutes(mins: number, hoursLabel = 'ч', minutesLabel = 'мин'): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m} ${minutesLabel}`;
  if (m === 0) return `${h} ${hoursLabel}`;
  return `${h} ${hoursLabel} ${m} ${minutesLabel}`;
}
