import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { LessonTemplate } from '../types';

export function useSchedule() {
  const { profile } = useAuth();
  const [lessons, setLessons] = useState<LessonTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedule = useCallback(async () => {
    if (!profile?.group_id) return;
    
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('lesson_templates')
        .select('*')
        .eq('group_id', profile.group_id)
        .order('start_time', { ascending: true });

      if (fetchError) throw fetchError;
      setLessons(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [profile?.group_id]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  const addLesson = async (lessonData: Omit<LessonTemplate, 'id' | 'group_id'>) => {
    if (!profile?.group_id) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error: insertError } = await supabase
        .from('lesson_templates')
        .insert([{ ...lessonData, group_id: profile.group_id, valid_from: today }])
        .select()
        .single();

      if (insertError) throw insertError;
      setLessons(prev => [...prev, data].sort((a, b) => a.start_time.localeCompare(b.start_time)));
      return data;
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  const updateLesson = async (id: string, updates: Partial<Omit<LessonTemplate, 'id' | 'group_id'>>) => {
    try {
      const { data, error: updateError } = await supabase
        .from('lesson_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      setLessons(prev => prev.map(l => l.id === id ? data : l).sort((a, b) => a.start_time.localeCompare(b.start_time)));
      return data;
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  const deleteLesson = async (id: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { error: deleteError } = await supabase
        .from('lesson_templates')
        .update({ valid_until: today })
        .eq('id', id);

      if (deleteError) throw deleteError;
      
      // Update local state instead of deleting
      setLessons(prev => prev.map(l => l.id === id ? { ...l, valid_until: today } : l));
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  const replaceSchedule = async (newLessons: Omit<LessonTemplate, 'id' | 'group_id'>[]) => {
    if (!profile?.group_id) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // 1. Soft-delete all currently active lessons for this group
      const { error: deleteError } = await supabase
        .from('lesson_templates')
        .update({ valid_until: today })
        .eq('group_id', profile.group_id)
        .is('valid_until', null);

      if (deleteError) throw deleteError;

      // 2. Insert new lessons with valid_from = today
      if (newLessons.length > 0) {
        const toInsert = newLessons.map(l => ({ 
          ...l, 
          group_id: profile.group_id,
          valid_from: today,
          valid_until: null
        }));
        const { error: insertError } = await supabase
          .from('lesson_templates')
          .insert(toInsert);

        if (insertError) throw insertError;
      }

      // 3. Refresh local state
      await fetchSchedule();
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  return {
    lessons,
    loading,
    error,
    refresh: fetchSchedule,
    addLesson,
    updateLesson,
    deleteLesson,
    replaceSchedule
  };
}
