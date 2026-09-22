export interface ChatRoom {
  id: string;
  group_id: string | null;
  name: string;
  type: 'group' | 'direct';
  created_at: string;
}

export interface Reaction {
  user_id: string;
  emoji: string;
}

export interface ChatParticipant {
  id: string;
  room_id: string;
  user_id: string;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  created_at: string;
  reactions?: Reaction[];
  profiles?: {
    full_name: string | null;
    avatar_color: string | null;
  };
}
