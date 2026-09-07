import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Save, Ban } from 'lucide-react';
import type { ClassInfo } from '../data/schedule';
import { cn } from '../utils/cn';

interface ExceptionSheetProps {
  lesson: ClassInfo | null;
  date: string; // YYYY-MM-DD
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  onDelete: () => Promise<void>;
}

export function ExceptionSheet({ lesson, date, isOpen, onClose, onSave, onDelete }: ExceptionSheetProps) {
  const [isCancelled, setIsCancelled] = useState(false);
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');
  const [newRoom, setNewRoom] = useState('');
  const [newTeacher, setNewTeacher] = useState('');
  const [loading, setLoading] = useState(false);

  // Initialize state when opening
  useEffect(() => {
    if (isOpen && lesson) {
      setIsCancelled(!!lesson.isCancelled);
      const timeToUse = lesson.originalTime ? lesson.time : '';
      if (timeToUse && timeToUse.includes('-')) {
        const parts = timeToUse.split('-');
        setNewStartTime(parts[0].trim());
        setNewEndTime(parts[1].trim());
      } else {
        setNewStartTime('');
        setNewEndTime('');
      }
      setNewRoom(lesson.originalAuditorium ? lesson.auditorium : '');
      setNewTeacher(lesson.originalTeacher ? lesson.teacher : '');
    }
  }, [isOpen, lesson]);

  if (!lesson) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let start_time = null;
      let end_time = null;
      if (newStartTime && newEndTime) {
        start_time = `${newStartTime}:00`;
        end_time = `${newEndTime}:00`;
      }

      await onSave({
        template_id: lesson.id,
        date: date,
        is_cancelled: isCancelled,
        new_start_time: start_time,
        new_end_time: end_time,
        new_auditorium: newRoom || null,
        new_teacher: newTeacher || null,
      });
      onClose();
    } catch (err) {
      console.error(err);
      alert('Ошибка при сохранении исключения');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Отменить изменения и вернуть пару в норму?')) return;
    setLoading(true);
    try {
      await onDelete();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Ошибка при удалении исключения');
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = lesson.isCancelled || lesson.originalTime || lesson.originalAuditorium || lesson.originalTeacher;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[60] flex flex-col max-h-[90vh] rounded-t-[24px] bg-card-light dark:bg-card-dark shadow-2xl glass"
          >
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border-light dark:border-border-dark">
              <div>
                <h2 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">
                  Изменить на {date}
                </h2>
                <p className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark line-clamp-1">
                  {lesson.subject}
                </p>
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="rounded-full p-2.5 bg-bg-light dark:bg-bg-dark text-text-secondary-light dark:text-text-secondary-dark transition-colors hover:bg-card-hover-light"
              >
                <X className="h-5 w-5" />
              </motion.button>
            </div>

            <form onSubmit={handleSave} className="p-6 overflow-y-auto">
              <div className="space-y-6 mb-8">
                {/* Cancel toggle */}
                <label className="flex items-center justify-between p-4 rounded-xl border border-red-500/30 bg-red-500/10 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-red-500/20 text-red-500">
                      <Ban size={20} />
                    </div>
                    <div>
                      <div className="font-bold text-red-500">Отменить пару</div>
                      <div className="text-xs text-red-500/70 font-medium">Студенты увидят плашку ОТМЕНЕНО</div>
                    </div>
                  </div>
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={isCancelled}
                      onChange={(e) => setIsCancelled(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-border-light dark:bg-border-dark peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                  </div>
                </label>

                {!isCancelled && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-text-muted-light dark:text-text-muted-dark mb-1">Новое время</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={newStartTime}
                          onChange={(e) => setNewStartTime(e.target.value)}
                          className="w-full bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-xl px-4 py-3 text-sm font-medium focus:border-primary-500 transition-colors"
                        />
                        <span className="text-text-muted-light dark:text-text-muted-dark font-bold">-</span>
                        <input
                          type="time"
                          value={newEndTime}
                          onChange={(e) => setNewEndTime(e.target.value)}
                          className="w-full bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-xl px-4 py-3 text-sm font-medium focus:border-primary-500 transition-colors"
                        />
                      </div>
                      <div className="text-[10px] text-text-muted-light dark:text-text-muted-dark mt-1">Оригинал: {lesson.originalTime || lesson.time}</div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-text-muted-light dark:text-text-muted-dark mb-1">Новый кабинет</label>
                      <input
                        type="text"
                        value={newRoom}
                        onChange={(e) => setNewRoom(e.target.value)}
                        placeholder={`Оригинал: ${lesson.originalAuditorium || lesson.auditorium}`}
                        className="w-full bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-xl px-4 py-3 text-sm font-medium focus:border-primary-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-text-muted-light dark:text-text-muted-dark mb-1">Замена преподавателя</label>
                      <input
                        type="text"
                        value={newTeacher}
                        onChange={(e) => setNewTeacher(e.target.value)}
                        placeholder={`Оригинал: ${lesson.originalTeacher || lesson.teacher}`}
                        className="w-full bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-xl px-4 py-3 text-sm font-medium focus:border-primary-500 transition-colors"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                {hasChanges && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-red-500/10 text-red-500 rounded-xl font-bold transition-all hover:bg-red-500/20 disabled:opacity-70"
                  >
                    <Trash2 size={18} />
                    Сбросить
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className={cn(
                    "flexitems-center justify-center gap-2 py-3.5 bg-primary-500 text-white rounded-xl font-bold shadow-lg shadow-primary-500/25 transition-all disabled:opacity-70",
                    hasChanges ? "flex-1" : "w-full"
                  )}
                >
                  <Save size={18} className="inline mr-2" />
                  Сохранить
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
