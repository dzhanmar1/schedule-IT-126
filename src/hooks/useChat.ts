import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { ChatMessage, Reaction } from '../types/chat';
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

  // Subscribe to new messages, updates, and deletes
  useEffect(() => {
    if (!roomId) return;
    
    loadMessages();

    const channel = supabase.channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMessage = payload.new as ChatMessage;
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
              if (prev.some(m => m.id === messageWithProfile.id)) return prev;
              return [...prev, messageWithProfile];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedMessage = payload.new as ChatMessage;
            setMessages(prev => prev.map(m => 
              m.id === updatedMessage.id ? { ...m, ...updatedMessage, profiles: m.profiles } : m
            ));
          } else if (payload.eventType === 'DELETE') {
            setMessages(prev => prev.filter(m => m.id !== payload.old.id));
          }
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
      const { error: sendError } = await supabase
        .from('chat_messages')
        .insert({
          room_id: roomId,
          user_id: user.id,
          content: content.trim(),
          reactions: []
        });

      if (sendError) throw sendError;
    } catch (err: any) {
      console.error('Error sending message:', err);
      throw err;
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!user) return;
    try {
      const { error: delError } = await supabase
        .from('chat_messages')
        .delete()
        .eq('id', messageId)
        .eq('user_id', user.id); // Ensure only owner can delete
        
      if (delError) throw delError;
    } catch (err: any) {
      console.error('Error deleting message:', err);
      throw err;
    }
  };

  const toggleReaction = async (messageId: string, emoji: string) => {
    if (!user) return;
    try {
      const msg = messages.find(m => m.id === messageId);
      if (!msg) return;

      const currentReactions: Reaction[] = msg.reactions || [];
      const existingReactionIndex = currentReactions.findIndex(r => r.user_id === user.id && r.emoji === emoji);
      
      let newReactions = [...currentReactions];
      
      if (existingReactionIndex >= 0) {
        newReactions.splice(existingReactionIndex, 1);
      } else {
        newReactions.push({ user_id: user.id, emoji });
      }

      // Optimistically update
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, reactions: newReactions } : m));

      const { error: updateError } = await supabase
        .from('chat_messages')
        .update({ reactions: newReactions })
        .eq('id', messageId);

      if (updateError) throw updateError;
    } catch (err: any) {
      console.error('Error toggling reaction:', err);
      throw err;
    }
  };

  return {
    messages,
    loading,
    error,
    sendMessage,
    deleteMessage,
    toggleReaction,
    loadMessages
  };
}
