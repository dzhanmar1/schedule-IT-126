import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { LessonException } from '../types';

export function useExceptions(startDate: string, endDate: string) {
  const { profile } = useAuth();
  const [exceptions, setExceptions] = useState<LessonException[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.group_id || !startDate || !endDate) return;

    setLoading(true);
    let channel: any;

    const fetchExceptions = async () => {
      const { data, error } = await supabase
        .from('lesson_exceptions')
        .select('*')
        .eq('group_id', profile.group_id)
        .gte('date', startDate)
        .lte('date', endDate);

      if (!error && data) {
        setExceptions(data);
      }
      setLoading(false);
    };

    fetchExceptions();

    channel = supabase
      .channel(`exceptions:${profile.group_id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lesson_exceptions',
          filter: `group_id=eq.${profile.group_id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setExceptions(prev => [...prev, payload.new as LessonException]);
          } else if (payload.eventType === 'UPDATE') {
            setExceptions(prev => prev.map(e => e.id === payload.new.id ? payload.new as LessonException : e));
          } else if (payload.eventType === 'DELETE') {
            setExceptions(prev => prev.filter(e => e.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.group_id, startDate, endDate]);

  const addOrUpdateException = async (exceptionData: Omit<LessonException, 'id' | 'group_id'>) => {
    if (!profile?.group_id || profile.role === 'student') return;
    
    // Check if an exception already exists for this template_id and date
    const existing = exceptions.find(e => e.template_id === exceptionData.template_id && e.date === exceptionData.date);

    if (existing) {
      const { error } = await supabase
        .from('lesson_exceptions')
        .update(exceptionData)
        .eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('lesson_exceptions')
        .insert([{ ...exceptionData, group_id: profile.group_id }]);
      if (error) throw error;
    }
  };

  const removeException = async (template_id: string, date: string) => {
    if (!profile?.group_id || profile.role === 'student') return;
    
    const existing = exceptions.find(e => e.template_id === template_id && e.date === date);
    if (!existing) return;

    const { error } = await supabase
      .from('lesson_exceptions')
      .delete()
      .eq('id', existing.id);
    
    if (error) throw error;
  };

  return { exceptions, loading, addOrUpdateException, removeException };
}
