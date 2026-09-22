export interface Homework {
  id: string;
  group_id: string | null;
  user_id: string | null;
  subject: string;
  description: string;
  due_date: string | null;
  is_group: boolean;
  created_at: string;
}

export interface HomeworkCompletion {
  id: string;
  homework_id: string;
  user_id: string;
  completed_at: string;
}

export interface HomeworkWithStatus extends Homework {
  is_completed: boolean;
}
