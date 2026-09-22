import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { ChatMessage, Reaction } from '../types/chat';
import { useAuth } from '../contexts/AuthContext';

export function useChat(roomId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
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
        .order('created_at', { ascending: false }) // Fetch newest first to paginate backwards
        .limit(30);

      if (fetchError) throw fetchError;
      
      const fetchedMessages = (data as ChatMessage[] || []).reverse();
      setMessages(fetchedMessages);
      setHasMore(fetchedMessages.length === 30);
    } catch (err: any) {
      console.error('Error loading messages:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  const loadMore = async () => {
    if (!roomId || loading || !hasMore || messages.length === 0) return;
    
    setLoading(true);
    try {
      const oldestMessage = messages[0];
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
        .lt('created_at', oldestMessage.created_at)
        .order('created_at', { ascending: false })
        .limit(30);

      if (fetchError) throw fetchError;
      
      const olderMessages = (data as ChatMessage[] || []).reverse();
      setMessages(prev => [...olderMessages, ...prev]);
      setHasMore(olderMessages.length === 30);
    } catch (err: any) {
      console.error('Error loading more messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = useCallback(async () => {
    if (!roomId || !user) return;
    try {
      await supabase
        .from('room_read_status')
        .upsert(
          { 
            room_id: roomId, 
            user_id: user.id, 
            last_read_at: new Date().toISOString() 
          },
          { onConflict: 'room_id,user_id' }
        );
    } catch (err) {
      console.error('Error marking room as read:', err);
    }
  }, [roomId, user]);

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
    hasMore,
    sendMessage,
    deleteMessage,
    toggleReaction,
    loadMore,
    markAsRead,
    loadMessages
  };
}
