import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

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
  const { profile } = useAuth();
  const [data, setData] = useState<SubjectData>({ notes: '', tasks: [] });
  const [loading, setLoading] = useState(true);
  
  // Track the DB ID of the homework record so we can update it
  const recordIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!subjectKey || !profile?.group_id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    let channel: any;

    const fetchNotes = async () => {
      const { data: records, error } = await supabase
        .from('group_homeworks')
        .select('*')
        .eq('group_id', profile.group_id)
        .eq('subject', subjectKey)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!error && records && records.length > 0) {
        recordIdRef.current = records[0].id;
        try {
          const parsed = JSON.parse(records[0].content);
          setData(parsed);
        } catch {
          // Fallback if not JSON
          setData({ notes: records[0].content, tasks: [] });
        }
      } else {
        recordIdRef.current = null;
        setData({ notes: '', tasks: [] });
      }
      setLoading(false);
    };

    fetchNotes();

    // Set up Realtime subscription
    channel = supabase
      .channel(`homeworks:${profile.group_id}:${subjectKey}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_homeworks',
          filter: `group_id=eq.${profile.group_id}` 
        },
        (payload) => {
          if (payload.new && (payload.new as any).subject === subjectKey) {
            recordIdRef.current = (payload.new as any).id;
            try {
              setData(JSON.parse((payload.new as any).content));
            } catch {
              setData({ notes: (payload.new as any).content, tasks: [] });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [subjectKey, profile?.group_id]);

  const updateData = async (newData: SubjectData) => {
    // Only starosta or admin can edit
    if (profile?.role === 'student') return;

    // Optimistic UI update
    setData(newData);

    if (!subjectKey || !profile?.group_id) return;

    const jsonContent = JSON.stringify(newData);

    if (recordIdRef.current) {
      // Update existing
      await supabase
        .from('group_homeworks')
        .update({ content: jsonContent })
        .eq('id', recordIdRef.current);
    } else {
      // Insert new
      const { data: newRecord } = await supabase
        .from('group_homeworks')
        .insert([{
          group_id: profile.group_id,
          subject: subjectKey,
          content: jsonContent,
          due_date: new Date().toISOString().split('T')[0],
          created_by: profile.id
        }])
        .select()
        .single();
        
      if (newRecord) {
        recordIdRef.current = newRecord.id;
      }
    }
  };

  return { data, setData: updateData, loading };
}
