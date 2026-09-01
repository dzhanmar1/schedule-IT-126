import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, Circle, Plus, Trash2, StickyNote, CheckSquare } from 'lucide-react';
import type { ClassInfo } from '../data/schedule';
import { useLanguage } from '../i18n';
import { useNotes } from '../hooks/useNotes';
import { cn } from '../utils/cn';

interface LessonNotesSheetProps {
  lesson: ClassInfo | null;
  isOpen: boolean;
  onClose: () => void;
}

export function LessonNotesSheet({ lesson, isOpen, onClose }: LessonNotesSheetProps) {
  const { t } = useLanguage();
  const cleanSubject = lesson?.subject.replace(/\s*\/\s*(лек|пр|лаб)\s*/i, '').trim() || '';
  const { data, setData } = useNotes(cleanSubject);
  const [newTask, setNewTask] = useState('');

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    setData({
      ...data,
      tasks: [...data.tasks, { id: Date.now().toString(), text: newTask.trim(), done: false }]
    });
    setNewTask('');
  };

  const toggleTask = (id: string) => {
    setData({
      ...data,
      tasks: data.tasks.map(t => t.id === id ? { ...t, done: !t.done } : t)
    });
  };

  const removeTask = (id: string) => {
    setData({
      ...data,
      tasks: data.tasks.filter(t => t.id !== id)
    });
  };

  return (
    <AnimatePresence>
      {isOpen && lesson && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.15}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) onClose();
            }}
            className="fixed bottom-0 left-0 right-0 z-50 flex flex-col max-h-[90vh] h-[85vh] rounded-t-[24px] bg-card-light dark:bg-card-dark shadow-2xl glass"
          >
            {/* Drag Handle */}
            <div className="flex w-full cursor-grab justify-center pt-4 pb-2 active:cursor-grabbing shrink-0">
              <div className="h-1.5 w-10 rounded-full bg-border-light dark:bg-border-dark" />
            </div>

            {/* Header */}
            <div className="flex items-start justify-between px-6 pb-4 shrink-0">
              <div className="pr-4">
                <h2 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark leading-tight">
                  {cleanSubject}
                </h2>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1 font-medium">
                  {lesson.teacher}
                </p>
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="rounded-full p-2.5 bg-bg-light dark:bg-bg-dark text-text-secondary-light dark:text-text-secondary-dark transition-colors hover:bg-card-hover-light shrink-0"
              >
                <X className="h-5 w-5" />
              </motion.button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-8 hide-scrollbar">
              
              {/* Tasks Section */}
              <div className="mb-8">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-text-muted-light dark:text-text-muted-dark mb-3">
                  <CheckSquare className="h-3.5 w-3.5" />
                  <span>{t('ui.tasks')}</span>
                </div>
                
                <div className="space-y-2 mb-3">
                  <AnimatePresence initial={false}>
                    {data.tasks.map(task => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-3 bg-bg-light dark:bg-bg-dark p-3 rounded-xl border border-border-light dark:border-border-dark overflow-hidden group"
                      >
                        <button onClick={() => toggleTask(task.id)} className="shrink-0 text-primary-500">
                          {task.done ? <CheckCircle2 size={20} /> : <Circle size={20} className="text-text-muted-light dark:text-text-muted-dark" />}
                        </button>
                        <span className={cn('flex-1 text-sm font-medium transition-all', task.done ? 'text-text-muted-light dark:text-text-muted-dark line-through' : 'text-text-primary-light dark:text-text-primary-dark')}>
                          {task.text}
                        </span>
                        <button onClick={() => removeTask(task.id)} className="shrink-0 text-text-muted-light hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 size={16} />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <form onSubmit={handleAddTask} className="flex gap-2">
                  <input
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder={t('ui.addTask')}
                    className="flex-1 bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-xl px-4 py-2.5 text-sm font-medium text-text-primary-light dark:text-text-primary-dark outline-none focus:border-primary-500 transition-colors"
                  />
                  <button type="submit" disabled={!newTask.trim()} className="bg-primary-500 text-white p-2.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed shrink-0">
                    <Plus size={20} />
                  </button>
                </form>
              </div>

              {/* Notes Section */}
              <div className="flex flex-col h-64">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-text-muted-light dark:text-text-muted-dark mb-3">
                  <StickyNote className="h-3.5 w-3.5" />
                  <span>{t('ui.notes')}</span>
                </div>
                <textarea
                  value={data.notes}
                  onChange={(e) => setData({ ...data, notes: e.target.value })}
                  placeholder={t('ui.typeNotes')}
                  className="flex-1 w-full bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-xl p-4 text-sm font-medium text-text-primary-light dark:text-text-primary-dark outline-none focus:border-primary-500 transition-colors resize-none leading-relaxed"
                />
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
