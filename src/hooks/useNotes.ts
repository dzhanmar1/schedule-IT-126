import { useState, useEffect } from 'react';

export interface Task {
  id: string;
  text: string;
  done: boolean;
}

export interface SubjectData {
  notes: string;
  tasks: Task[];
}

export function useNotes(subjectKey: string | null) {
  const storageKey = 'schedule_notes';
  
  const [data, setData] = useState<SubjectData>(() => {
    if (!subjectKey) return { notes: '', tasks: [] };
    const all = JSON.parse(localStorage.getItem(storageKey) || '{}');
    return all[subjectKey] || { notes: '', tasks: [] };
  });

  useEffect(() => {
    if (!subjectKey) return;
    const all = JSON.parse(localStorage.getItem(storageKey) || '{}');
    setData(all[subjectKey] || { notes: '', tasks: [] });
  }, [subjectKey]);

  useEffect(() => {
    if (!subjectKey) return;
    const all = JSON.parse(localStorage.getItem(storageKey) || '{}');
    all[subjectKey] = data;
    localStorage.setItem(storageKey, JSON.stringify(all));
  }, [data, subjectKey]);

  return { data, setData };
}
