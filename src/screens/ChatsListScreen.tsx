import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, MessageSquare, Hash, User, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useChatsList } from '../hooks/useChatsList';
import { stringToColor } from '../utils/colors';

export function ChatsListScreen() {
  const navigate = useNavigate();
  const { chatRooms, classmates, loading, getOrCreateDirectRoom } = useChatsList();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredClassmates = classmates.filter(c => 
    c.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenGroup = (roomId: string) => {
    navigate(`/chat/${roomId}`);
  };

  const handleOpenDirect = async (targetUserId: string) => {
    try {
      const roomId = await getOrCreateDirectRoom(targetUserId);
      navigate(`/chat/${roomId}`);
    } catch (err) {
      alert('Ошибка при создании чата');
    }
  };

  return (
    <div className="flex flex-col h-full bg-bg-main-light dark:bg-bg-main-dark">
      {/* Header */}
      <div className="px-6 pt-12 pb-4 bg-card-light/80 dark:bg-card-dark/80 backdrop-blur-xl border-b border-border-light dark:border-border-dark sticky top-0 z-30">
        <h1 className="text-3xl font-black text-text-primary-light dark:text-text-primary-dark mb-4">
          Чаты
        </h1>
        
        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-text-secondary-light dark:text-text-secondary-dark opacity-50" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск одногруппников..."
            className="w-full pl-10 pr-4 py-2.5 bg-bg-main-light dark:bg-bg-main-dark border border-border-light dark:border-border-dark rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-text-primary-light dark:text-text-primary-dark"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-32">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-primary-500" size={24} />
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Active Chats Section */}
            {searchQuery === '' && chatRooms.length > 0 && (
              <div>
                <h2 className="text-xs font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider mb-3 px-2">
                  Активные чаты
                </h2>
                <div className="space-y-2">
                  {chatRooms.map(room => (
                    <motion.div
                      key={room.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => handleOpenGroup(room.id)}
                      className="flex items-center gap-4 p-3 bg-card-light dark:bg-card-dark rounded-2xl cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors border border-transparent"
                    >
                      {room.type === 'group' ? (
                        <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
                          <Hash size={24} />
                        </div>
                      ) : (
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold shadow-sm"
                          style={{ backgroundColor: room.avatarColor || stringToColor(room.targetUserId || '') }}
                        >
                          {room.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-text-primary-light dark:text-text-primary-dark truncate">
                          {room.name}
                        </h3>
                        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark truncate">
                          {room.type === 'group' ? 'Чат группы' : 'Личные сообщения'}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Classmates Section */}
            <div>
              <h2 className="text-xs font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider mb-3 px-2">
                {searchQuery ? 'Результаты поиска' : 'Одногруппники'}
              </h2>
              
              {filteredClassmates.length === 0 ? (
                <div className="text-center py-8 text-text-secondary-light dark:text-text-secondary-dark opacity-50">
                  <User size={32} className="mx-auto mb-2" />
                  <p>Никто не найден</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredClassmates.map(classmate => {
                    // Check if DM already exists
                    const existingRoom = chatRooms.find(r => r.type === 'direct' && r.targetUserId === classmate.id);
                    
                    return (
                      <motion.div
                        key={classmate.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => {
                          if (existingRoom) {
                            handleOpenGroup(existingRoom.id);
                          } else {
                            handleOpenDirect(classmate.id);
                          }
                        }}
                        className="flex items-center gap-4 p-3 bg-card-light dark:bg-card-dark rounded-2xl cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      >
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-sm"
                          style={{ backgroundColor: classmate.avatar_color || stringToColor(classmate.id) }}
                        >
                          {(classmate.full_name || 'Студент').substring(0, 2).toUpperCase()}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-text-primary-light dark:text-text-primary-dark truncate">
                            {classmate.full_name || 'Студент без имени'}
                          </h3>
                        </div>
                        
                        <div className="text-text-secondary-light dark:text-text-secondary-dark opacity-50 hover:opacity-100 transition-opacity">
                          <MessageSquare size={20} />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
}
