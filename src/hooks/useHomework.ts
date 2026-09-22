import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
// import type { Homework, HomeworkWithStatus } from '../types/homework';
import type { HomeworkWithStatus } from '../types/homework';
import { useAuth } from '../contexts/AuthContext';

export function useHomework() {
  const [tasks, setTasks] = useState<HomeworkWithStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, profile } = useAuth();

  const loadTasks = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    try {
      // Load all relevant tasks: 
      // 1. Group tasks for user's group
      // 2. Personal tasks for user
      const { data: homeworkData, error: hwError } = await supabase
        .from('homework')
        .select('*')
        .or(`group_id.eq.${profile?.group_id},user_id.eq.${user.id}`)
        .order('due_date', { ascending: true, nullsFirst: false });

      if (hwError) throw hwError;

      // Load completions for this user
      const { data: completionsData, error: compError } = await supabase
        .from('homework_completions')
        .select('*')
        .eq('user_id', user.id);

      if (compError) throw compError;

      const completedHwIds = new Set(completionsData?.map(c => c.homework_id));

      const tasksWithStatus = (homeworkData || []).map(hw => ({
        ...hw,
        is_completed: completedHwIds.has(hw.id)
      }));

      setTasks(tasksWithStatus as HomeworkWithStatus[]);
    } catch (err: any) {
      console.error('Error loading homework:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, profile?.group_id]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const addTask = async (subject: string, description: string, dueDate: string | null, isGroup: boolean) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('homework')
        .insert({
          group_id: isGroup ? profile?.group_id : null,
          user_id: isGroup ? null : user.id,
          subject,
          description,
          due_date: dueDate,
          is_group: isGroup
        });
      
      if (error) throw error;
      await loadTasks();
    } catch (err: any) {
      console.error('Error adding task:', err);
      throw err;
    }
  };

  const toggleTaskStatus = async (taskId: string, isCurrentlyCompleted: boolean) => {
    if (!user) return;
    try {
      // Optimistic update
      setTasks(prev => prev.map(t => 
        t.id === taskId ? { ...t, is_completed: !isCurrentlyCompleted } : t
      ));

      if (isCurrentlyCompleted) {
        // Remove completion
        const { error } = await supabase
          .from('homework_completions')
          .delete()
          .eq('homework_id', taskId)
          .eq('user_id', user.id);
          
        if (error) throw error;
      } else {
        // Add completion
        const { error } = await supabase
          .from('homework_completions')
          .insert({
            homework_id: taskId,
            user_id: user.id
          });
          
        if (error) throw error;
      }
    } catch (err: any) {
      console.error('Error toggling task:', err);
      // Revert optimistic update
      setTasks(prev => prev.map(t => 
        t.id === taskId ? { ...t, is_completed: isCurrentlyCompleted } : t
      ));
      throw err;
    }
  };
  
  const deleteTask = async (taskId: string) => {
    if (!user) return;
    try {
       const { error } = await supabase
        .from('homework')
        .delete()
        .eq('id', taskId);
        
      if (error) throw error;
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (err) {
      console.error('Error deleting task:', err);
      throw err;
    }
  };

  return {
    tasks,
    loading,
    error,
    addTask,
    deleteTask,
    toggleTaskStatus,
    refreshTasks: loadTasks
  };
}
