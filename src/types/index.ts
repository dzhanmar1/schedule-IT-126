export interface LessonTemplate {
  id: string;
  group_id: string;
  day_of_week: number; // 1-7 (Mon-Sun)
  week_parity: number | null; // 1 = odd, 2 = even, null = all
  start_time: string; // 'HH:MM:SS'
  end_time: string; // 'HH:MM:SS'
  subject: string;
  teacher: string | null;
  auditorium: string | null;
  type_tag: string | null;
  subgroup: number | null; // 1, 2, null
}

export interface GroupHomework {
  id: string;
  group_id: string;
  subject: string;
  due_date: string; // YYYY-MM-DD
  content: string;
  created_by: string;
}

export interface LessonException {
  id: string;
  group_id: string;
  template_id: string;
  date: string; // YYYY-MM-DD
  is_cancelled: boolean;
  new_start_time: string | null;
  new_end_time: string | null;
  new_auditorium: string | null;
  new_teacher: string | null;
}
