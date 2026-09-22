import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Hash, MessageSquare, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../hooks/useChat';

import { format } from 'date-fns';
import { supabase } from '../lib/supabase';
import { stringToColor } from '../utils/colors';
import { cn } from '../utils/cn';


export function GroupChatScreen({ onBack }: { onBack?: () => void }) {
  const { user, profile } = useAuth();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string>('Общий чат');
  const [newMessage, setNewMessage] = useState('');
  
  const { messages, loading, sendMessage } = useChat(roomId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch the user's group chat room
  useEffect(() => {
    if (!profile?.group_id) return;

    async function fetchRoom() {
      const { data } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('group_id', profile?.group_id)
        .eq('type', 'group')
        .single();
      
      if (data) {
        setRoomId(data.id);
        setRoomName(data.name);
      }
    }
    
    fetchRoom();
  }, [profile?.group_id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !roomId) return;

    const content = newMessage;
    setNewMessage(''); // optimistic clear
    try {
      await sendMessage(content);
    } catch (err) {
      setNewMessage(content); // revert on error
    }
  };

  if (!profile?.group_id) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <MessageSquare size={48} className="text-primary-500/20 mb-4" />
        <h2 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark mb-2">Чат недоступен</h2>
        <p className="text-text-secondary-light dark:text-text-secondary-dark">
          Вы должны состоять в группе, чтобы использовать общий чат.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative bg-bg-main-light dark:bg-bg-main-dark">
      {/* Chat Header */}
      <div className="bg-card-light dark:bg-card-dark border-b border-border-light dark:border-border-dark px-4 py-3 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        {onBack && (
          <button 
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-text-secondary-light dark:text-text-secondary-dark"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
          <Hash size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-text-primary-light dark:text-text-primary-dark truncate">
            {roomName}
          </h2>
          <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark truncate">
            Группа {profile.groups?.name || '...'}
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 pb-36 space-y-4 relative">
        {loading && messages.length === 0 ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-primary-500" size={24} />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-text-secondary-light dark:text-text-secondary-dark opacity-50 space-y-2">
            <MessageSquare size={32} />
            <p>Нет сообщений. Напишите что-нибудь!</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.user_id === user?.id;
            const showAvatar = !isMe && (idx === 0 || messages[idx - 1].user_id !== msg.user_id);
            const senderName = msg.profiles?.full_name || 'Студент';
            const avatarColor = msg.profiles?.avatar_color || stringToColor(msg.user_id);

            return (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={msg.id} 
                className={cn(
                  "flex gap-3 max-w-[85%]",
                  isMe ? "ml-auto flex-row-reverse" : ""
                )}
              >
                {!isMe && (
                  <div className="w-8 flex-shrink-0 flex flex-col justify-end">
                    {showAvatar && (
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm"
                        style={{ backgroundColor: avatarColor }}
                      >
                        {senderName.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                )}
                
                <div className={cn(
                  "flex flex-col",
                  isMe ? "items-end" : "items-start"
                )}>
                  {!isMe && showAvatar && (
                    <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark ml-1 mb-1 font-medium">
                      {senderName}
                    </span>
                  )}
                  <div 
                    className={cn(
                      "px-4 py-2.5 rounded-2xl relative shadow-sm text-[15px] leading-relaxed break-words",
                      isMe 
                        ? "bg-primary-500 text-white rounded-br-sm" 
                        : "bg-card-light dark:bg-card-dark text-text-primary-light dark:text-text-primary-dark rounded-bl-sm border border-border-light dark:border-border-dark"
                    )}
                  >
                    {msg.content}
                    <div className={cn(
                      "text-[10px] mt-1 opacity-70",
                      isMe ? "text-right text-white/80" : "text-right"
                    )}>
                      {format(new Date(msg.created_at), 'HH:mm')}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Input Area */}
      <div className="absolute bottom-20 left-0 right-0 px-4 pb-2 pointer-events-none z-20">
        <form 
          onSubmit={handleSend}
          className="pointer-events-auto flex items-center gap-2 bg-card-light/95 dark:bg-card-dark/95 backdrop-blur-md border border-border-light/50 dark:border-white/10 rounded-full p-1 pl-4 shadow-xl focus-within:ring-2 focus-within:ring-primary-500/50 focus-within:border-primary-500/50 transition-all"
        >
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Сообщение..."
            className="flex-1 bg-transparent border-none focus:outline-none text-text-primary-light dark:text-text-primary-dark placeholder:text-text-secondary-light dark:placeholder:text-text-secondary-dark"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || !roomId}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-primary-500 text-white disabled:opacity-50 disabled:bg-primary-500/50 hover:bg-primary-600 transition-colors shrink-0 shadow-md"
          >
            <Send size={18} className="ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
