import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Hash, MessageSquare, Loader2, ArrowLeft, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../hooks/useChat';

import { format } from 'date-fns';
import { supabase } from '../lib/supabase';
import { stringToColor } from '../utils/colors';
import { cn } from '../utils/cn';

const EMOJIS = ['👍', '❤️', '😂', '😢', '🔥'];

export function GroupChatScreen({ onBack }: { onBack?: () => void }) {
  const { user, profile } = useAuth();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string>('Общий чат');
  const [newMessage, setNewMessage] = useState('');
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  
  const { messages, loading, sendMessage, deleteMessage, toggleReaction } = useChat(roomId);
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
        setRoomName(`Общий чат ${profile?.groups?.name || ''}`);
      }
    }

    fetchRoom();
  }, [profile?.group_id, profile?.groups?.name]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !roomId) return;

    const content = newMessage;
    setNewMessage('');
    try {
      await sendMessage(content);
    } catch (err) {
      setNewMessage(content); // Restore on error
      alert('Ошибка при отправке сообщения');
    }
  };

  const handleDelete = async (msgId: string) => {
    if (confirm('Вы уверены, что хотите удалить сообщение?')) {
      await deleteMessage(msgId);
      setActiveMessageId(null);
    }
  };

  const handleReact = async (msgId: string, emoji: string) => {
    await toggleReaction(msgId, emoji);
    setActiveMessageId(null);
  };

  return (
    <div className="flex flex-col min-h-[100dvh] relative bg-bg-main-light dark:bg-bg-main-dark pb-[80px]">
      {/* Cool animated background gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/10 rounded-full blur-[80px]"></div>
        <div className="absolute top-1/2 -left-20 w-60 h-60 bg-blue-500/10 rounded-full blur-[60px]"></div>
      </div>
      
      {/* Chat Header */}
      <div className="bg-card-light/80 dark:bg-card-dark/80 backdrop-blur-xl border-b border-border-light dark:border-border-dark px-4 py-3 flex items-center gap-3 sticky top-0 z-30 shadow-sm">
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
            Группа {profile?.groups?.name || '...'}
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        className="flex-1 overflow-y-auto p-4 pb-36 space-y-4 relative z-10"
        onClick={() => setActiveMessageId(null)} // Close menus on click outside
      >
        {loading && messages.length === 0 ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-primary-500" size={24} />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[50vh] text-center text-text-secondary-light dark:text-text-secondary-dark opacity-50 space-y-2">
            <MessageSquare size={32} />
            <p>Нет сообщений. Напишите что-нибудь!</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.user_id === user?.id;
            const showAvatar = !isMe && (idx === 0 || messages[idx - 1].user_id !== msg.user_id);
            const senderName = msg.profiles?.full_name || 'Студент';
            const avatarColor = msg.profiles?.avatar_color || stringToColor(msg.user_id);

            // Group reactions by emoji
            const reactionsMap = (msg.reactions || []).reduce((acc: any, r: any) => {
              if (!acc[r.emoji]) acc[r.emoji] = [];
              acc[r.emoji].push(r.user_id);
              return acc;
            }, {});

            const isActive = activeMessageId === msg.id;

            return (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                key={msg.id} 
                className={cn(
                  "flex gap-3 max-w-[90%] relative",
                  isMe ? "ml-auto flex-row-reverse" : ""
                )}
              >
                {!isMe && (
                  <div className="w-8 flex-shrink-0 flex flex-col justify-end pb-4">
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
                  
                  <div className="relative group">
                    {/* The Message Bubble */}
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMessageId(isActive ? null : msg.id);
                      }}
                      className={cn(
                        "px-4 py-2.5 rounded-2xl shadow-md text-[15px] leading-relaxed break-words cursor-pointer transition-transform active:scale-95",
                        isMe 
                          ? "bg-gradient-to-br from-primary-500 to-blue-600 text-white rounded-br-sm" 
                          : "bg-card-light dark:bg-card-dark text-text-primary-light dark:text-text-primary-dark rounded-bl-sm border border-border-light/50 dark:border-white/5",
                        isActive && "ring-2 ring-primary-500/50 scale-[0.98]"
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

                    {/* Reactions Display */}
                    {Object.keys(reactionsMap).length > 0 && (
                      <div className={cn(
                        "flex flex-wrap gap-1 mt-1",
                        isMe ? "justify-end" : "justify-start"
                      )}>
                        {Object.entries(reactionsMap).map(([emoji, users]: [string, any]) => {
                          const hasReacted = users.includes(user?.id);
                          return (
                            <button
                              key={emoji}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReact(msg.id, emoji);
                              }}
                              className={cn(
                                "flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border transition-all active:scale-90",
                                hasReacted 
                                  ? "bg-primary-50 dark:bg-primary-900/30 border-primary-200 dark:border-primary-500/30" 
                                  : "bg-card-light dark:bg-card-dark border-border-light dark:border-border-dark"
                              )}
                            >
                              <span>{emoji}</span>
                              <span className="font-medium opacity-70">{users.length}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Action Menu (Context) */}
                    <AnimatePresence>
                      {isActive && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          onClick={(e) => e.stopPropagation()}
                          className={cn(
                            "absolute top-full mt-2 z-40 bg-card-light dark:bg-card-dark shadow-xl border border-border-light dark:border-border-dark rounded-2xl p-2 flex items-center gap-1",
                            isMe ? "right-0" : "left-0"
                          )}
                        >
                          <div className="flex bg-bg-main-light dark:bg-bg-main-dark rounded-xl p-1 gap-1">
                            {EMOJIS.map(emoji => (
                              <button
                                key={emoji}
                                onClick={() => handleReact(msg.id, emoji)}
                                className="w-8 h-8 flex items-center justify-center text-xl hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-transform active:scale-75"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                          
                          {isMe && (
                            <>
                              <div className="w-px h-6 bg-border-light dark:bg-border-dark mx-1" />
                              <button 
                                onClick={() => handleDelete(msg.id)}
                                className="w-8 h-8 flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Input Area */}
      <div className="fixed bottom-[80px] left-0 right-0 px-4 pb-2 pointer-events-none z-20 flex justify-center">
        <form 
          onSubmit={handleSend}
          className="w-full max-w-lg pointer-events-auto flex items-center gap-2 bg-card-light/95 dark:bg-card-dark/95 backdrop-blur-md border border-border-light/50 dark:border-white/10 rounded-full p-1 pl-4 shadow-xl focus-within:ring-2 focus-within:ring-primary-500/50 focus-within:border-primary-500/50 transition-all"
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
