import { useState } from 'react';
import { ArrowLeft, Plus, Trash2, Loader2, Sparkles, Copy, X, Pencil, CopyPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useSchedule } from '../../hooks/useSchedule';
import { useLanguage } from '../../i18n';

const getTypeColorClass = (type: string | null) => {
  if (!type) return 'border-l-primary-500';
  const lower = type.toLowerCase();
  if (lower.includes('лекц')) return 'border-l-blue-500';
  if (lower.includes('практ') || lower.includes('семин')) return 'border-l-emerald-500';
  if (lower.includes('лаб')) return 'border-l-purple-500';
  return 'border-l-primary-500';
};

const calculateNextTime = (lessons: any[]) => {
  if (lessons.length === 0) return { start_time: '09:00', end_time: '10:30' };
  
  const latestLesson = lessons.reduce((prev, current) => {
    return (prev.end_time > current.end_time) ? prev : current;
  });

  const [hours, minutes] = latestLesson.end_time.split(':').map(Number);
  const endDate = new Date();
  endDate.setHours(hours, minutes, 0, 0);
  
  const nextStart = new Date(endDate.getTime() + 15 * 60000);
  const nextEnd = new Date(nextStart.getTime() + 90 * 60000);
  
  const formatTime = (d: Date) => d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
  
  return { start_time: formatTime(nextStart), end_time: formatTime(nextEnd) };
};

export function ScheduleEditorScreen() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { profile } = useAuth();
  const { lessons, loading, addLesson, updateLesson, deleteLesson, replaceSchedule } = useSchedule();
  
  const [selectedDay, setSelectedDay] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importJson, setImportJson] = useState('');
  
  const [newLesson, setNewLesson] = useState<{
    day_of_week: number;
    start_time: string;
    end_time: string;
    subject: string;
    teacher: string;
    auditorium: string;
    type_tag: string;
    week_parity: 1 | 2 | null;
  }>({
    day_of_week: 1,
    start_time: '09:00',
    end_time: '10:30',
    subject: '',
    teacher: '',
    auditorium: '',
    type_tag: '',
    week_parity: null
  });

  if (profile?.role !== 'starosta' && profile?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-light dark:bg-bg-dark text-text-primary-light dark:text-text-primary-dark">
        <div className="text-center p-6">
          <h1 className="text-xl font-bold text-danger mb-4">Доступ запрещен</h1>
          <p className="mb-6">Управлять расписанием может только староста группы.</p>
          <button onClick={() => navigate('/')} className="px-6 py-2 bg-primary-500 text-white rounded-xl font-bold">
            Вернуться назад
          </button>
        </div>
      </div>
    );
  }

  const dayLessons = lessons
    .filter(l => l.day_of_week === selectedDay)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLesson.subject.trim()) return;

    try {
      const lessonData = {
        day_of_week: newLesson.day_of_week,
        week_parity: newLesson.week_parity,
        start_time: newLesson.start_time.length === 5 ? newLesson.start_time + ':00' : newLesson.start_time,
        end_time: newLesson.end_time.length === 5 ? newLesson.end_time + ':00' : newLesson.end_time,
        subject: newLesson.subject,
        teacher: newLesson.teacher || null,
        auditorium: newLesson.auditorium || null,
        type_tag: newLesson.type_tag || null,
        subgroup: null
      };

      if (editingLessonId) {
        await updateLesson(editingLessonId, lessonData);
      } else {
        await addLesson(lessonData);
      }
      
      closeForm();
    } catch (err) {
      alert('Ошибка при сохранении пары');
    }
  };

  const openAddForm = () => {
    const { start_time, end_time } = calculateNextTime(dayLessons);
    setNewLesson({
      day_of_week: selectedDay,
      start_time,
      end_time,
      subject: '',
      teacher: '',
      auditorium: '',
      type_tag: '',
      week_parity: null
    });
    setEditingLessonId(null);
    setIsAdding(true);
  };

  const handleEditClick = (lesson: any) => {
    setEditingLessonId(lesson.id);
    setNewLesson({
      day_of_week: lesson.day_of_week,
      start_time: lesson.start_time.slice(0, 5),
      end_time: lesson.end_time.slice(0, 5),
      subject: lesson.subject,
      teacher: lesson.teacher || '',
      auditorium: lesson.auditorium || '',
      type_tag: lesson.type_tag || '',
      week_parity: lesson.week_parity
    });
    setIsAdding(true);
  };

  const handleDuplicateClick = (lesson: any) => {
    setEditingLessonId(null); 
    setNewLesson({
      day_of_week: lesson.day_of_week,
      start_time: lesson.start_time.slice(0, 5),
      end_time: lesson.end_time.slice(0, 5),
      subject: lesson.subject,
      teacher: lesson.teacher || '',
      auditorium: lesson.auditorium || '',
      type_tag: lesson.type_tag || '',
      week_parity: lesson.week_parity
    });
    setIsAdding(true);
  };

  const closeForm = () => {
    setIsAdding(false);
    setEditingLessonId(null);
  };

  const handleImport = async () => {
    try {
      const parsed = JSON.parse(importJson);
      if (!Array.isArray(parsed)) throw new Error('Ожидается массив пар');
      if (!window.confirm('Внимание! Это полностью заменит текущее расписание. Продолжить?')) return;
      
      await replaceSchedule(parsed);
      setIsImporting(false);
      setImportJson('');
      alert('Расписание успешно обновлено!');
    } catch (err: any) {
      alert('Ошибка при импорте JSON. Проверьте формат. ' + err.message);
    }
  };

  const aiPrompt = `Привет! Я староста. Вот моё расписание в виде текста/фото. 
Преобразуй его в JSON массив объектов строго такого формата. Ничего кроме чистого JSON не пиши!

[
  { 
    "day_of_week": 1, // 1-ПН, 2-ВТ, 3-СР, 4-ЧТ, 5-ПТ, 6-СБ, 7-ВС
    "week_parity": null, // null (каждую), "even" (четная), "odd" (нечетная)
    "start_time": "09:00:00", 
    "end_time": "10:30:00", 
    "subject": "Высшая математика", 
    "teacher": "Иванов И.И.", 
    "auditorium": "101", 
    "type_tag": "Лекция" 
  }
]`;

  const daysArr = [
    { key: 'monday', val: 1 },
    { key: 'tuesday', val: 2 },
    { key: 'wednesday', val: 3 },
    { key: 'thursday', val: 4 },
    { key: 'friday', val: 5 },
    { key: 'saturday', val: 6 },
    { key: 'sunday', val: 7 }
  ];

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark text-text-primary-light dark:text-text-primary-dark relative">
      <div className="max-w-lg mx-auto pb-24">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-bg-light/80 dark:bg-bg-dark/80 backdrop-blur-xl border-b border-border-light dark:border-border-dark p-4 flex items-center gap-4">
          <button onClick={() => navigate('/')} className="p-2 -ml-2 rounded-xl hover:bg-card-light dark:hover:bg-card-dark transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold flex-1">Редактор расписания</h1>
        </div>

        {/* Days Selector */}
        <div className="flex overflow-x-auto hide-scrollbar p-4 gap-2">
          {daysArr.map((d) => (
            <button
              key={d.key}
              onClick={() => setSelectedDay(d.val)}
              className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all active:scale-95 ${
                selectedDay === d.val 
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25' 
                  : 'bg-card-light dark:bg-card-dark text-text-secondary-light dark:text-text-secondary-dark hover:bg-border-light dark:hover:bg-border-dark'
              }`}
            >
              {t(`daysShort.${d.key}` as any)}
            </button>
          ))}
        </div>

        {/* Lessons List */}
        <div className="p-4 space-y-4 overflow-hidden">
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary-500" /></div>
          ) : dayLessons.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="text-center p-8 bg-card-light dark:bg-card-dark rounded-2xl border border-border-light dark:border-border-dark border-dashed"
            >
              <p className="text-text-muted-light dark:text-text-muted-dark font-medium">Нет пар в этот день</p>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              {dayLessons.map(lesson => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  key={lesson.id} 
                  className={`p-4 rounded-2xl bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark flex justify-between items-center gap-4 border-l-4 ${getTypeColorClass(lesson.type_tag)} shadow-sm`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-primary-500 bg-primary-500/10 px-2 py-0.5 rounded">
                        {lesson.start_time.slice(0,5)} - {lesson.end_time.slice(0,5)}
                      </span>
                      {lesson.week_parity === 2 && <span className="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded uppercase">Четная</span>}
                      {lesson.week_parity === 1 && <span className="text-[10px] font-bold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded uppercase">Нечетная</span>}
                    </div>
                    <div className="font-bold text-lg leading-tight mb-1">{lesson.subject}</div>
                    <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark flex flex-wrap gap-x-4 gap-y-1">
                      {lesson.type_tag && <span className="font-medium text-text-primary-light dark:text-text-primary-dark">{lesson.type_tag}</span>}
                      {lesson.auditorium && <span>🚪 {lesson.auditorium}</span>}
                      {lesson.teacher && <span>👨‍🏫 {lesson.teacher}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button onClick={() => handleEditClick(lesson)} className="p-2 text-text-muted-light dark:text-text-muted-dark hover:text-primary-500 hover:bg-primary-500/10 rounded-lg transition-colors">
                      <Pencil size={18} />
                    </button>
                    <button onClick={() => handleDuplicateClick(lesson)} className="p-2 text-text-muted-light dark:text-text-muted-dark hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors">
                      <CopyPlus size={18} />
                    </button>
                    <button onClick={() => { if (window.confirm('Точно удалить пару?')) deleteLesson(lesson.id); }} className="p-2 text-text-muted-light dark:text-text-muted-dark hover:text-danger hover:bg-danger/10 rounded-lg transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}

          <motion.button 
            whileTap={{ scale: 0.98 }}
            onClick={openAddForm}
            className="w-full mt-4 p-4 rounded-2xl border-2 border-dashed border-primary-500/50 text-primary-500 font-bold flex items-center justify-center gap-2 hover:bg-primary-500/10 transition-colors"
          >
            <Plus size={20} />
            Добавить пару
          </motion.button>
        </div>
      </div>

      {/* Add/Edit Modal (Bottom Sheet style) */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
              onClick={closeForm}
            />
            
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative bg-bg-light dark:bg-bg-dark w-full max-w-lg mx-auto rounded-t-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-4 border-b border-border-light dark:border-border-dark flex justify-between items-center bg-card-light dark:bg-card-dark shrink-0">
                <h3 className="font-bold text-lg">{editingLessonId ? 'Редактировать пару' : 'Новая пара'}</h3>
                <button onClick={closeForm} className="p-2 rounded-xl bg-bg-light dark:bg-bg-dark hover:bg-border-light transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="overflow-y-auto p-4 hide-scrollbar">
                <form onSubmit={handleSave} className="space-y-4">
                  
                  {/* Day Selector (for duplication / moving) */}
                  <div>
                    <label className="text-xs font-bold text-text-muted-light dark:text-text-muted-dark block mb-2">День недели</label>
                    <select 
                      value={newLesson.day_of_week}
                      onChange={e => setNewLesson({...newLesson, day_of_week: Number(e.target.value)})}
                      className="w-full p-3 rounded-xl bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark outline-none font-bold focus:border-primary-500 transition-colors appearance-none"
                    >
                      {daysArr.map(d => (
                        <option key={d.key} value={d.val}>{t(`days.${d.key}` as any) || t(`daysShort.${d.key}` as any)}</option>
                      ))}
                    </select>
                  </div>

                  {/* Parity Selector */}
                  <div>
                    <label className="text-xs font-bold text-text-muted-light dark:text-text-muted-dark block mb-2">Четность недели</label>
                    <div className="flex bg-card-light dark:bg-card-dark rounded-xl p-1 border border-border-light dark:border-border-dark relative">
                      <button type="button" onClick={() => setNewLesson({...newLesson, week_parity: null})} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors z-10 ${newLesson.week_parity === null ? 'text-white' : 'text-text-secondary-light dark:text-text-secondary-dark'}`}>
                        Все
                      </button>
                      <button type="button" onClick={() => setNewLesson({...newLesson, week_parity: 1})} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors z-10 ${newLesson.week_parity === 1 ? 'text-white' : 'text-text-secondary-light dark:text-text-secondary-dark'}`}>
                        Нечетная
                      </button>
                      <button type="button" onClick={() => setNewLesson({...newLesson, week_parity: 2})} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors z-10 ${newLesson.week_parity === 2 ? 'text-white' : 'text-text-secondary-light dark:text-text-secondary-dark'}`}>
                        Четная
                      </button>
                      
                      {/* Animated sliding background for parity */}
                      <motion.div 
                        layoutId="parityBg"
                        initial={false}
                        className={`absolute top-1 bottom-1 w-[calc(33.33%-4px)] rounded-lg shadow-sm ${
                          newLesson.week_parity === null ? 'left-1 bg-primary-500' : 
                          newLesson.week_parity === 1 ? 'left-[33.33%] bg-orange-500' : 
                          'left-[66.66%] -ml-1 bg-blue-500'
                        }`}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-xs font-bold text-text-muted-light dark:text-text-muted-dark block mb-1">Начало</label>
                      <input type="time" required value={newLesson.start_time} onChange={e => setNewLesson({...newLesson, start_time: e.target.value})} className="w-full p-3 rounded-xl bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark outline-none focus:border-primary-500 transition-colors" />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs font-bold text-text-muted-light dark:text-text-muted-dark block mb-1">Конец</label>
                      <input type="time" required value={newLesson.end_time} onChange={e => setNewLesson({...newLesson, end_time: e.target.value})} className="w-full p-3 rounded-xl bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark outline-none focus:border-primary-500 transition-colors" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs font-bold text-text-muted-light dark:text-text-muted-dark block mb-1">Предмет</label>
                    <input type="text" required placeholder="Например: Высшая математика" value={newLesson.subject} onChange={e => setNewLesson({...newLesson, subject: e.target.value})} className="w-full p-3 rounded-xl bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark outline-none font-medium focus:border-primary-500 transition-colors" />
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-xs font-bold text-text-muted-light dark:text-text-muted-dark block mb-1">Аудитория</label>
                      <input type="text" placeholder="101а" value={newLesson.auditorium} onChange={e => setNewLesson({...newLesson, auditorium: e.target.value})} className="w-full p-3 rounded-xl bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark outline-none text-sm focus:border-primary-500 transition-colors" />
                    </div>
                    <div className="flex-[2]">
                      <label className="text-xs font-bold text-text-muted-light dark:text-text-muted-dark block mb-1">Преподаватель</label>
                      <input type="text" placeholder="Фамилия И.О." value={newLesson.teacher} onChange={e => setNewLesson({...newLesson, teacher: e.target.value})} className="w-full p-3 rounded-xl bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark outline-none text-sm focus:border-primary-500 transition-colors" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs font-bold text-text-muted-light dark:text-text-muted-dark block mb-1">Тип занятия (тег)</label>
                    <input type="text" placeholder="Лекция, Семинар, Лабораторная..." value={newLesson.type_tag} onChange={e => setNewLesson({...newLesson, type_tag: e.target.value})} className="w-full p-3 rounded-xl bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark outline-none text-sm focus:border-primary-500 transition-colors" />
                  </div>
                  
                  <div className="pt-4 pb-6">
                    <motion.button 
                      whileTap={{ scale: 0.98 }}
                      type="submit" 
                      className="w-full py-4 bg-primary-500 text-white rounded-2xl font-bold shadow-lg shadow-primary-500/25 transition-all"
                    >
                      {editingLessonId ? 'Сохранить изменения' : 'Создать пару'}
                    </motion.button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Import Button */}
      <AnimatePresence>
        {!isAdding && !isImporting && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-0 right-0 px-4 flex justify-center pointer-events-none z-30"
          >
            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => setIsImporting(true)}
              className="pointer-events-auto flex items-center gap-2 px-6 py-3.5 bg-card-light dark:bg-card-dark border border-primary-500/30 text-primary-500 rounded-full font-bold shadow-xl transition-colors glass"
            >
              <Sparkles size={18} />
              <span>Импорт через ИИ</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Import Modal (Bottom Sheet style) */}
      <AnimatePresence>
        {isImporting && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
              onClick={() => setIsImporting(false)}
            />
            
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative bg-bg-light dark:bg-bg-dark w-full max-w-lg mx-auto rounded-t-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-4 border-b border-border-light dark:border-border-dark flex justify-between items-center bg-card-light dark:bg-card-dark shrink-0">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Sparkles className="text-primary-500" size={24} /> Импорт JSON
                </h2>
                <button onClick={() => setIsImporting(false)} className="p-2 rounded-xl bg-bg-light dark:bg-bg-dark hover:bg-border-light transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="overflow-y-auto p-4 space-y-4 hide-scrollbar">
                <div className="p-4 bg-primary-500/10 border border-primary-500/20 rounded-2xl">
                  <p className="text-sm font-medium mb-3">
                    Отправь нейросети (ChatGPT / Claude) фото расписания вместе с этим промптом, чтобы получить правильный JSON.
                  </p>
                  <motion.button 
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      navigator.clipboard.writeText(aiPrompt);
                      alert('Промпт скопирован!');
                    }}
                    className="w-full flex items-center justify-center gap-2 p-3 bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-xl font-bold text-sm hover:border-primary-500 transition-colors"
                  >
                    <Copy size={16} /> Скопировать промпт
                  </motion.button>
                </div>

                <div>
                  <label className="block text-sm font-bold text-text-muted-light dark:text-text-muted-dark mb-2">Вставь полученный JSON сюда:</label>
                  <textarea 
                    value={importJson}
                    onChange={e => setImportJson(e.target.value)}
                    placeholder="[\n  {\n    'day_of_week': 1,\n    'start_time': '09:00:00'\n  }\n]"
                    className="w-full h-48 p-4 rounded-2xl bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark outline-none font-mono text-xs focus:border-primary-500 transition-colors resize-none"
                  />
                </div>
                
                <div className="pt-2 pb-6">
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleImport}
                    disabled={!importJson.trim()}
                    className="w-full py-4 bg-primary-500 text-white font-bold rounded-2xl shadow-lg shadow-primary-500/25 disabled:opacity-50 transition-all"
                  >
                    Применить расписание
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
