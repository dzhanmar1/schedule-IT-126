import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
// import type { ChatRoom } from '../types/chat';

export interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_color: string | null;
}

export interface ChatListItem {
  id: string;
  name: string;
  type: 'group' | 'direct';
  targetUserId?: string; // For direct chats
  avatarColor?: string | null;
}

export function useChatsList() {
  const [chatRooms, setChatRooms] = useState<ChatListItem[]>([]);
  const [classmates, setClassmates] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { user, profile } = useAuth();

  const loadData = useCallback(async () => {
    if (!user || !profile?.group_id) return;
    
    setLoading(true);
    try {
      // 1. Load Group Chat
      const { data: groupRooms, error: groupError } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('group_id', profile.group_id)
        .eq('type', 'group');

      if (groupError) throw groupError;

      // 2. Load Direct Chats where user is a participant
      const { data: participants, error: partError } = await supabase
        .from('chat_participants')
        .select('room_id')
        .eq('user_id', user.id);

      if (partError) throw partError;

      const roomIds = participants?.map(p => p.room_id) || [];
      let directRoomsData: any[] = [];
      
      if (roomIds.length > 0) {
        const { data: directRooms, error: directError } = await supabase
          .from('chat_rooms')
          .select('*, chat_participants(user_id, profiles(full_name, avatar_color))')
          .in('id', roomIds)
          .eq('type', 'direct');
          
        if (directError) throw directError;
        directRoomsData = directRooms || [];
      }

      // 3. Load Classmates
      const { data: classmatesData, error: classError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_color')
        .eq('group_id', profile.group_id)
        .neq('id', user.id); // Exclude self
        
      if (classError) throw classError;
      
      setClassmates(classmatesData || []);

      // Format Chat Rooms
      const formattedRooms: ChatListItem[] = [];
      
      // Add group chats
      (groupRooms || []).forEach(room => {
        formattedRooms.push({
          id: room.id,
          name: room.name,
          type: 'group',
        });
      });
      
      // Add direct chats
      directRoomsData.forEach(room => {
        // Find the other participant
        const otherParticipant = room.chat_participants?.find((p: any) => p.user_id !== user.id);
        const otherProfile = otherParticipant?.profiles;
        
        formattedRooms.push({
          id: room.id,
          name: otherProfile?.full_name || 'Студент',
          type: 'direct',
          targetUserId: otherParticipant?.user_id,
          avatarColor: otherProfile?.avatar_color
        });
      });

      setChatRooms(formattedRooms);
    } catch (err: any) {
      console.error('Error loading chats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, profile?.group_id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getOrCreateDirectRoom = async (targetUserId: string) => {
    if (!user) throw new Error('Not authenticated');
    
    // Check if room already exists in our loaded state
    const existingRoom = chatRooms.find(r => r.type === 'direct' && r.targetUserId === targetUserId);
    if (existingRoom) {
      return existingRoom.id;
    }

    try {
      // 1. Create a new room
      const { data: newRoom, error: createError } = await supabase
        .from('chat_rooms')
        .insert({
          name: `DM_${user.id}_${targetUserId}`, // Internal name
          type: 'direct'
        })
        .select()
        .single();
        
      if (createError) throw createError;

      // 2. Add participants (both users)
      const { error: partError } = await supabase
        .from('chat_participants')
        .insert([
          { room_id: newRoom.id, user_id: user.id },
          { room_id: newRoom.id, user_id: targetUserId }
        ]);
        
      if (partError) throw partError;
      
      // Reload list
      await loadData();
      
      return newRoom.id;
    } catch (err) {
      console.error('Error creating DM room:', err);
      throw err;
    }
  };

  return {
    chatRooms,
    classmates,
    loading,
    error,
    getOrCreateDirectRoom,
    refresh: loadData
  };
}
