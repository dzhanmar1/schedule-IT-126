import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Hash, MessageSquare, Loader2, ArrowLeft, Trash2, Paperclip, X, FileText, Download } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../hooks/useChat';
import { useParams, useNavigate } from 'react-router-dom';

import { format } from 'date-fns';
import { supabase } from '../lib/supabase';
import { stringToColor } from '../utils/colors';
import { cn } from '../utils/cn';

const EMOJIS = ['👍', '❤️', '😂', '😢', '🔥'];

export function ChatRoomScreen() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [roomName, setRoomName] = useState<string>('Чат');
  const [roomType, setRoomType] = useState<'group' | 'direct'>('group');
  const [targetAvatarColor, setTargetAvatarColor] = useState<string | null>(null);
  
  const [newMessage, setNewMessage] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { messages, loading, hasMore, sendMessage, deleteMessage, toggleReaction, loadMore, markAsRead } = useChat(roomId || null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch room details
  useEffect(() => {
    if (!roomId) return;

    async function fetchRoom() {
      const { data: room, error } = await supabase
        .from('chat_rooms')
        .select('*, chat_participants(user_id, profiles(full_name, avatar_color))')
        .eq('id', roomId)
        .single();

      if (room && !error) {
        setRoomType(room.type);
        if (room.type === 'group') {
          setRoomName(room.name);
        } else {
          // It's a direct room, find the other participant
          const otherParticipant = room.chat_participants?.find((p: any) => p.user_id !== user?.id);
          const otherProfile = otherParticipant?.profiles;
          if (otherProfile) {
            setRoomName(otherProfile.full_name || 'Студент');
            setTargetAvatarColor(otherProfile.avatar_color);
          } else {
            setRoomName('Чат с удаленным пользователем');
          }
        }
      }
    }

    fetchRoom();
  }, [roomId, user?.id]);

  const prevLastMessageIdRef = useRef<string | null>(null);

  // Scroll to bottom on new messages (but not on pagination)
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.id !== prevLastMessageIdRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevLastMessageIdRef.current = lastMessage?.id || null;
  }, [messages]);

  // Mark as read whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      markAsRead();
    }
  }, [messages, markAsRead]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop === 0 && hasMore && !loading) {
      loadMore();
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !attachment) || !roomId || isSending) return;

    const content = newMessage;
    const file = attachment;
    
    setNewMessage('');
    setAttachment(null);
    setIsSending(true);
    
    try {
      await sendMessage(content, file);
    } catch (err) {
      setNewMessage(content); // Restore on error
      setAttachment(file);
      alert('Ошибка при отправке сообщения');
    } finally {
      setIsSending(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      // Limit file size to 10MB
      if (file.size > 10 * 1024 * 1024) {
        alert('Файл слишком большой. Максимум 10 МБ.');
        return;
      }
      setAttachment(file);
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
    <div className="flex flex-col h-[100dvh] relative bg-bg-main-light dark:bg-bg-main-dark">
      {/* Cool animated background gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/10 rounded-full blur-[80px]"></div>
        <div className="absolute top-1/2 -left-20 w-60 h-60 bg-blue-500/10 rounded-full blur-[60px]"></div>
      </div>
      
      {/* Chat Header */}
      <div className="bg-card-light/80 dark:bg-card-dark/80 backdrop-blur-xl border-b border-border-light dark:border-border-dark px-4 py-3 flex items-center gap-3 sticky top-0 z-30 shadow-sm">
        <button 
          onClick={() => navigate('/chat')}
          className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-text-secondary-light dark:text-text-secondary-dark"
        >
          <ArrowLeft size={20} />
        </button>
        
        {roomType === 'group' ? (
          <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
            <Hash size={20} />
          </div>
        ) : (
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm"
            style={{ backgroundColor: targetAvatarColor || stringToColor(roomName) }}
          >
            {roomName.substring(0, 2).toUpperCase()}
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-text-primary-light dark:text-text-primary-dark truncate">
            {roomName}
          </h2>
          <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark truncate">
            {roomType === 'group' ? 'Общий чат' : 'Личные сообщения'}
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4 relative z-10"
        onClick={() => setActiveMessageId(null)}
      >
        {loading && hasMore && (
          <div className="flex justify-center py-4">
            <Loader2 className="animate-spin text-primary-500" size={24} />
          </div>
        )}
        
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
            const showAvatar = !isMe && (idx === 0 || messages[idx - 1].user_id !== msg.user_id) && roomType === 'group';
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
                {!isMe && roomType === 'group' && (
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
                  {!isMe && showAvatar && roomType === 'group' && (
                    <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark ml-1 mb-1 font-medium">
                      {senderName}
                    </span>
                  )}
                  
                  <div className="relative group">
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
                        isActive && "ring-2 ring-primary-500/50 scale-[0.98]",
                        msg.attachment_type === 'image' && !msg.content ? "p-1" : "" // smaller padding if only image
                      )}
                    >
                      {msg.attachment_url && msg.attachment_type === 'image' && (
                        <div 
                          className={cn("relative rounded-xl overflow-hidden mb-1", msg.content ? "mt-1" : "")}
                          onClick={(e) => {
                            e.stopPropagation();
                            setLightboxImage(msg.attachment_url || null);
                          }}
                        >
                          <img 
                            src={msg.attachment_url} 
                            alt="Attachment" 
                            className="max-w-[240px] max-h-[300px] object-cover hover:opacity-90 transition-opacity"
                            loading="lazy"
                          />
                        </div>
                      )}
                      
                      {msg.attachment_url && msg.attachment_type === 'file' && (
                        <a 
                          href={msg.attachment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-xl mb-1 transition-colors",
                            isMe ? "bg-black/10 hover:bg-black/20" : "bg-bg-main-light dark:bg-bg-main-dark hover:bg-black/5 dark:hover:bg-white/5 border border-border-light/50 dark:border-white/5"
                          )}
                        >
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                            isMe ? "bg-white/20 text-white" : "bg-primary-50 dark:bg-primary-900/30 text-primary-500"
                          )}>
                            <FileText size={20} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn("text-sm font-medium truncate", isMe ? "text-white" : "text-text-primary-light dark:text-text-primary-dark")}>
                              {msg.attachment_name || 'Файл'}
                            </p>
                          </div>
                          <Download size={18} className={isMe ? "text-white/70" : "text-text-secondary-light dark:text-text-secondary-dark"} />
                        </a>
                      )}

                      {msg.content && <div>{msg.content}</div>}
                      
                      <div className={cn(
                        "text-[10px] mt-1 opacity-70",
                        isMe ? "text-right text-white/80" : "text-right"
                      )}>
                        {format(new Date(msg.created_at), 'HH:mm')}
                      </div>
                    </div>

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

      {/* Input Area */}
      <div className="flex-shrink-0 px-4 py-3 pb-safe relative z-20 flex flex-col items-center bg-bg-main-light/50 dark:bg-bg-main-dark/50 backdrop-blur-md border-t border-border-light/50 dark:border-white/5">
        
        {/* Attachment Preview */}
        <AnimatePresence>
          {attachment && (
            <motion.div 
              initial={{ opacity: 0, y: 10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: 10, height: 0 }}
              className="w-full max-w-lg mb-3"
            >
              <div className="relative inline-flex items-center gap-3 bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark p-2 pr-4 rounded-xl shadow-sm">
                <button 
                  onClick={() => setAttachment(null)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                >
                  <X size={14} />
                </button>
                
                {attachment.type.startsWith('image/') ? (
                  <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                    <img src={URL.createObjectURL(attachment)} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-500 flex items-center justify-center flex-shrink-0">
                    <FileText size={24} />
                  </div>
                )}
                
                <div className="flex-1 min-w-0 max-w-[200px]">
                  <p className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark truncate">
                    {attachment.name}
                  </p>
                  <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                    {(attachment.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form 
          onSubmit={handleSend}
          className="w-full max-w-lg pointer-events-auto flex items-center gap-2 bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-full p-1 pl-2 shadow-sm focus-within:ring-2 focus-within:ring-primary-500/50 focus-within:border-primary-500/50 transition-all"
        >
          <input 
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-9 h-9 rounded-full flex items-center justify-center text-text-secondary-light dark:text-text-secondary-dark hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0"
          >
            <Paperclip size={20} />
          </button>
          
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Сообщение..."
            className="flex-1 bg-transparent border-none focus:outline-none text-text-primary-light dark:text-text-primary-dark placeholder:text-text-secondary-light dark:placeholder:text-text-secondary-dark"
          />
          
          <button
            type="submit"
            disabled={(!newMessage.trim() && !attachment) || !roomId || isSending}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-primary-500 text-white disabled:opacity-50 disabled:bg-primary-500/50 hover:bg-primary-600 transition-colors shrink-0 shadow-md relative overflow-hidden"
          >
            {isSending ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} className="ml-0.5" />
            )}
          </button>
        </form>
      </div>

      {/* Lightbox Overlay */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxImage(null)}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
          >
            <button 
              className="absolute top-6 right-6 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
              onClick={() => setLightboxImage(null)}
            >
              <X size={24} />
            </button>
            <motion.img 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={lightboxImage} 
              alt="Fullscreen Preview" 
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
