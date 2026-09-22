import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { ChatMessage } from '../types/chat';
import { useAuth } from '../contexts/AuthContext';

export function useChat(roomId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Load initial messages
  const loadMessages = useCallback(async () => {
    if (!roomId) return;
    
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('chat_messages')
        .select(`
          *,
          profiles (
            full_name,
            avatar_color
          )
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (fetchError) throw fetchError;
      setMessages(data as ChatMessage[] || []);
    } catch (err: any) {
      console.error('Error loading messages:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  // Subscribe to new messages
  useEffect(() => {
    if (!roomId) return;
    
    loadMessages();

    const channel = supabase.channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`
        },
        async (payload) => {
          const newMessage = payload.new as ChatMessage;
          // Fetch the profile for the new message to get name and avatar
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, avatar_color')
            .eq('id', newMessage.user_id)
            .single();

          const messageWithProfile = {
            ...newMessage,
            profiles: profileData || undefined
          };

          setMessages(prev => {
            // Avoid duplicates if we sent it ourselves
            if (prev.some(m => m.id === messageWithProfile.id)) return prev;
            return [...prev, messageWithProfile];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, loadMessages]);

  const sendMessage = async (content: string) => {
    if (!roomId || !user || !content.trim()) return;

    try {
      // Optimistic update can be added here, but for simplicity we rely on the DB insert
      const { error: sendError } = await supabase
        .from('chat_messages')
        .insert({
          room_id: roomId,
          user_id: user.id,
          content: content.trim()
        });

      if (sendError) throw sendError;
    } catch (err: any) {
      console.error('Error sending message:', err);
      throw err;
    }
  };

  return {
    messages,
    loading,
    error,
    sendMessage,
    loadMessages
  };
}
