import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, Plus, Trash2, BookOpen, Calendar, AlertCircle } from 'lucide-react';
import { useHomework } from '../hooks/useHomework';
import { useAuth } from '../contexts/AuthContext';
import { format, isPast, isToday, isTomorrow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '../utils/cn';

export function HomeworkScreen() {
  const { tasks, toggleTaskStatus, deleteTask, addTask } = useHomework();
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'group' | 'personal'>('group');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // New task form state
  const [newSubject, setNewSubject] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDate, setNewDate] = useState('');
  const [isGroupTask, setIsGroupTask] = useState(false);

  const filteredTasks = tasks.filter(t => activeTab === 'group' ? t.is_group : !t.is_group);
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.is_completed !== b.is_completed) return a.is_completed ? 1 : -1;
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
  });

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newDesc.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await addTask(newSubject, newDesc, newDate || null, isGroupTask);
      setShowAddModal(false);
      setNewSubject('');
      setNewDesc('');
      setNewDate('');
      setIsGroupTask(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDueDateLabel = (dateStr: string | null) => {
    if (!dateStr) return 'Без срока';
    const date = new Date(dateStr);
    if (isToday(date)) return 'Сегодня';
    if (isTomorrow(date)) return 'Завтра';
    if (isPast(date)) return 'Просрочено';
    return format(date, 'd MMMM', { locale: ru });
  };

  const getDueDateColor = (dateStr: string | null, isCompleted: boolean) => {
    if (isCompleted || !dateStr) return 'text-text-secondary-light dark:text-text-secondary-dark';
    const date = new Date(dateStr);
    if (isPast(date) && !isToday(date)) return 'text-red-500';
    if (isToday(date)) return 'text-orange-500';
    return 'text-primary-500';
  };

  return (
    <div className="flex flex-col h-full bg-bg-main-light dark:bg-bg-main-dark">
      {/* Header */}
      <div className="px-6 pt-12 pb-4 bg-card-light/80 dark:bg-card-dark/80 backdrop-blur-xl border-b border-border-light dark:border-border-dark sticky top-0 z-30">
        <h1 className="text-3xl font-black text-text-primary-light dark:text-text-primary-dark mb-4">
          Домашка
        </h1>
        
        {/* Tabs */}
        <div className="flex bg-bg-main-light dark:bg-bg-main-dark p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('group')}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-sm font-bold transition-all",
              activeTab === 'group' 
                ? "bg-card-light dark:bg-card-dark text-primary-600 dark:text-primary-400 shadow-sm" 
                : "text-text-secondary-light dark:text-text-secondary-dark hover:bg-black/5 dark:hover:bg-white/5"
            )}
          >
            Группа
          </button>
          <button
            onClick={() => setActiveTab('personal')}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-sm font-bold transition-all",
              activeTab === 'personal' 
                ? "bg-card-light dark:bg-card-dark text-primary-600 dark:text-primary-400 shadow-sm" 
                : "text-text-secondary-light dark:text-text-secondary-dark hover:bg-black/5 dark:hover:bg-white/5"
            )}
          >
            Личные
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-4 pb-32 space-y-3">
        <AnimatePresence mode="popLayout">
          {sortedTasks.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 text-text-secondary-light dark:text-text-secondary-dark opacity-50 space-y-3"
            >
              <BookOpen size={48} />
              <p className="font-medium">Заданий пока нет!</p>
            </motion.div>
          ) : (
            sortedTasks.map(task => (
              <motion.div
                layout
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={task.id}
                className={cn(
                  "bg-card-light dark:bg-card-dark rounded-2xl p-4 shadow-sm border transition-colors",
                  task.is_completed 
                    ? "border-border-light dark:border-border-dark opacity-60" 
                    : "border-border-light dark:border-border-dark"
                )}
              >
                <div className="flex gap-4">
                  <button 
                    onClick={() => toggleTaskStatus(task.id, task.is_completed)}
                    className={cn(
                      "mt-1 flex-shrink-0 transition-colors",
                      task.is_completed ? "text-primary-500" : "text-text-secondary-light dark:text-text-secondary-dark hover:text-primary-500"
                    )}
                  >
                    {task.is_completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className={cn(
                      "font-bold mb-1 truncate transition-colors",
                      task.is_completed ? "line-through text-text-secondary-light dark:text-text-secondary-dark" : "text-text-primary-light dark:text-text-primary-dark"
                    )}>
                      {task.subject}
                    </h3>
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-3 line-clamp-3">
                      {task.description}
                    </p>
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className={cn(
                        "flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-bg-main-light dark:bg-bg-main-dark border border-border-light/50 dark:border-border-dark/50",
                        getDueDateColor(task.due_date, task.is_completed)
                      )}>
                        {task.due_date && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date)) && !task.is_completed ? (
                          <AlertCircle size={12} />
                        ) : (
                          <Calendar size={12} />
                        )}
                        {getDueDateLabel(task.due_date)}
                      </div>
                      
                      {(!task.is_group || profile?.role === 'admin') && (
                        <button
                          onClick={() => {
                            if(confirm('Удалить это задание?')) deleteTask(task.id);
                          }}
                          className="p-1.5 text-text-secondary-light dark:text-text-secondary-dark hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* FAB */}
      <div className="fixed bottom-24 right-6 z-40">
        <button
          onClick={() => setShowAddModal(true)}
          className="w-14 h-14 bg-primary-500 hover:bg-primary-600 text-white rounded-full shadow-xl flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
        >
          <Plus size={28} />
        </button>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-card-light dark:bg-card-dark rounded-3xl p-6 shadow-2xl border border-border-light/50 dark:border-white/5"
            >
              <h2 className="text-2xl font-black mb-6 text-text-primary-light dark:text-text-primary-dark">Новое задание</h2>
              
              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-text-secondary-light dark:text-text-secondary-dark mb-1">Предмет</label>
                  <input
                    required
                    value={newSubject}
                    onChange={e => setNewSubject(e.target.value)}
                    className="w-full px-4 py-3 bg-bg-main-light dark:bg-bg-main-dark border border-border-light dark:border-border-dark rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                    placeholder="Например: Высшая математика"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-text-secondary-light dark:text-text-secondary-dark mb-1">Что нужно сделать?</label>
                  <textarea
                    required
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                    className="w-full px-4 py-3 bg-bg-main-light dark:bg-bg-main-dark border border-border-light dark:border-border-dark rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 min-h-[100px] resize-none"
                    placeholder="Номера 1, 2, 3..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-text-secondary-light dark:text-text-secondary-dark mb-1">Срок (до какого числа)</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                    className="w-full px-4 py-3 bg-bg-main-light dark:bg-bg-main-dark border border-border-light dark:border-border-dark rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  />
                </div>

                {profile?.role === 'admin' && (
                  <label className="flex items-center gap-3 p-3 rounded-xl bg-bg-main-light dark:bg-bg-main-dark border border-border-light dark:border-border-dark cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isGroupTask}
                      onChange={e => setIsGroupTask(e.target.checked)}
                      className="w-5 h-5 rounded text-primary-500 focus:ring-primary-500 bg-card-light dark:bg-card-dark border-border-light dark:border-border-dark"
                    />
                    <div>
                      <div className="font-bold text-sm text-text-primary-light dark:text-text-primary-dark">Общая домашка</div>
                      <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark">Это задание увидят все студенты группы</div>
                    </div>
                  </label>
                )}

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-3 rounded-xl font-bold bg-bg-main-light dark:bg-bg-main-dark text-text-secondary-light dark:text-text-secondary-dark hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 rounded-xl font-bold bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-primary-500/30 transition-colors disabled:opacity-50 flex items-center justify-center"
                  >
                    {isSubmitting ? 'Добавление...' : 'Добавить'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
