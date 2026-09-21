import { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, 
  BookOpen, 
  GraduationCap, 
  MapPin, 
  Plus, 
  Search, 
  Pencil, 
  Trash2, 
  Loader2, 
  Sparkles, 
  X, 
  Check, 
  Mail, 
  Phone, 
  Building,
  AlertCircle,
  Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../lib/supabase';
import type { Teacher, Subject, Auditorium } from '../../../types';

type TabType = 'teachers' | 'subjects' | 'auditoriums';

export function DictionariesManager({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<TabType>('teachers');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data states
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [auditoriums, setAuditoriums] = useState<Auditorium[]>([]);
  const [loading, setLoading] = useState(true);
  const [missingTables, setMissingTables] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form inputs
  const [teacherForm, setTeacherForm] = useState({ name: '', email: '', phone: '' });
  const [subjectForm, setSubjectForm] = useState({ name: '', short_name: '' });
  const [auditoriumForm, setAuditoriumForm] = useState({ name: '', building: '' });

  // Sync state
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  // Fetch all dictionary data
  const fetchData = async () => {
    setLoading(true);
    setMissingTables(false);

    try {
      const [tRes, sRes, aRes] = await Promise.all([
        supabase.from('teachers').select('*').order('name'),
        supabase.from('subjects').select('*').order('name'),
        supabase.from('auditoriums').select('*').order('name')
      ]);

      if (tRes.error && tRes.error.code === '42P01') {
        setMissingTables(true);
        setLoading(false);
        return;
      }

      if (tRes.data) setTeachers(tRes.data);
      if (sRes.data) setSubjects(sRes.data);
      if (aRes.data) setAuditoriums(aRes.data);
    } catch (e) {
      console.error('Error fetching dictionaries:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered lists
  const filteredTeachers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return teachers;
    return teachers.filter(t => 
      t.name.toLowerCase().includes(q) || 
      (t.email && t.email.toLowerCase().includes(q)) ||
      (t.phone && t.phone.toLowerCase().includes(q))
    );
  }, [teachers, searchQuery]);

  const filteredSubjects = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return subjects;
    return subjects.filter(s => 
      s.name.toLowerCase().includes(q) || 
      (s.short_name && s.short_name.toLowerCase().includes(q))
    );
  }, [subjects, searchQuery]);

  const filteredAuditoriums = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return auditoriums;
    return auditoriums.filter(a => 
      a.name.toLowerCase().includes(q) || 
      (a.building && a.building.toLowerCase().includes(q))
    );
  }, [auditoriums, searchQuery]);

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingId(null);
    setTeacherForm({ name: '', email: '', phone: '' });
    setSubjectForm({ name: '', short_name: '' });
    setAuditoriumForm({ name: '', building: '' });
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (item: Teacher | Subject | Auditorium) => {
    setEditingId(item.id);
    if (activeTab === 'teachers') {
      const t = item as Teacher;
      setTeacherForm({ name: t.name, email: t.email || '', phone: t.phone || '' });
    } else if (activeTab === 'subjects') {
      const s = item as Subject;
      setSubjectForm({ name: s.name, short_name: s.short_name || '' });
    } else {
      const a = item as Auditorium;
      setAuditoriumForm({ name: a.name, building: a.building || '' });
    }
    setIsModalOpen(true);
  };

  // Handle Save (Create or Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (activeTab === 'teachers') {
        if (!teacherForm.name.trim()) return;
        const payload = {
          name: teacherForm.name.trim(),
          email: teacherForm.email.trim() || null,
          phone: teacherForm.phone.trim() || null
        };

        if (editingId) {
          const { error } = await supabase.from('teachers').update(payload).eq('id', editingId);
          if (error) throw error;
          setTeachers(prev => prev.map(t => t.id === editingId ? { ...t, ...payload } : t));
        } else {
          const { data, error } = await supabase.from('teachers').insert([payload]).select().single();
          if (error) throw error;
          if (data) setTeachers(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
        }
      } else if (activeTab === 'subjects') {
        if (!subjectForm.name.trim()) return;
        const payload = {
          name: subjectForm.name.trim(),
          short_name: subjectForm.short_name.trim() || null
        };

        if (editingId) {
          const { error } = await supabase.from('subjects').update(payload).eq('id', editingId);
          if (error) throw error;
          setSubjects(prev => prev.map(s => s.id === editingId ? { ...s, ...payload } : s));
        } else {
          const { data, error } = await supabase.from('subjects').insert([payload]).select().single();
          if (error) throw error;
          if (data) setSubjects(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
        }
      } else {
        if (!auditoriumForm.name.trim()) return;
        const payload = {
          name: auditoriumForm.name.trim(),
          building: auditoriumForm.building.trim() || null
        };

        if (editingId) {
          const { error } = await supabase.from('auditoriums').update(payload).eq('id', editingId);
          if (error) throw error;
          setAuditoriums(prev => prev.map(a => a.id === editingId ? { ...a, ...payload } : a));
        } else {
          const { data, error } = await supabase.from('auditoriums').insert([payload]).select().single();
          if (error) throw error;
          if (data) setAuditoriums(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
        }
      }

      setIsModalOpen(false);
    } catch (err: any) {
      alert(`Ошибка при сохранении: ${err.message || 'Проверьте соединение'}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Удалить «${name}» из справочника?`)) return;

    const table = activeTab;
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (!error) {
      if (activeTab === 'teachers') setTeachers(prev => prev.filter(i => i.id !== id));
      if (activeTab === 'subjects') setSubjects(prev => prev.filter(i => i.id !== id));
      if (activeTab === 'auditoriums') setAuditoriums(prev => prev.filter(i => i.id !== id));
    } else {
      alert('Ошибка при удалении записи');
    }
  };

  // Sync / Import unique items from current schedule (lesson_templates)
  const handleSyncFromSchedule = async () => {
    setSyncing(true);
    setSyncResult(null);

    try {
      const { data: lessons, error } = await supabase
        .from('lesson_templates')
        .select('subject, teacher, auditorium');

      if (error) throw error;
      if (!lessons || lessons.length === 0) {
        setSyncResult('В расписании нет пар для импорта.');
        return;
      }

      // Collect existing names for quick lookup
      const existingTeachers = new Set(teachers.map(t => t.name.trim().toLowerCase()));
      const existingSubjects = new Set(subjects.map(s => s.name.trim().toLowerCase()));
      const existingAuditoriums = new Set(auditoriums.map(a => a.name.trim().toLowerCase()));

      const newTeachers = new Set<string>();
      const newSubjects = new Set<string>();
      const newAuditoriums = new Set<string>();

      lessons.forEach(l => {
        if (l.teacher && l.teacher.trim() && !existingTeachers.has(l.teacher.trim().toLowerCase())) {
          newTeachers.add(l.teacher.trim());
        }
        if (l.subject && l.subject.trim() && !existingSubjects.has(l.subject.trim().toLowerCase())) {
          newSubjects.add(l.subject.trim());
        }
        if (l.auditorium && l.auditorium.trim() && !existingAuditoriums.has(l.auditorium.trim().toLowerCase())) {
          newAuditoriums.add(l.auditorium.trim());
        }
      });

      if (newTeachers.size === 0 && newSubjects.size === 0 && newAuditoriums.size === 0) {
        setSyncResult('Все предметы, преподаватели и аудитории из расписания уже есть в справочниках!');
        return;
      }

      const promises = [];
      if (newTeachers.size > 0) {
        promises.push(
          supabase.from('teachers').insert(Array.from(newTeachers).map(name => ({ name })))
        );
      }
      if (newSubjects.size > 0) {
        promises.push(
          supabase.from('subjects').insert(Array.from(newSubjects).map(name => ({ name })))
        );
      }
      if (newAuditoriums.size > 0) {
        promises.push(
          supabase.from('auditoriums').insert(Array.from(newAuditoriums).map(name => ({ name })))
        );
      }

      await Promise.all(promises);
      await fetchData();

      setSyncResult(
        `Успешно добавлено: ${newSubjects.size} предметов, ${newTeachers.size} преподавателей, ${newAuditoriums.size} аудиторий!`
      );
    } catch (err: any) {
      alert(`Ошибка при синхронизации: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const copyMigrationSql = () => {
    navigator.clipboard.writeText(`
CREATE TABLE IF NOT EXISTS public.teachers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    short_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.auditoriums (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    building TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoriums ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view teachers" ON public.teachers FOR SELECT USING (true);
CREATE POLICY "Admins can manage teachers" ON public.teachers FOR ALL USING (public.get_user_role() = 'admin') WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Anyone can view subjects" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Admins can manage subjects" ON public.subjects FOR ALL USING (public.get_user_role() = 'admin') WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Anyone can view auditoriums" ON public.auditoriums FOR SELECT USING (true);
CREATE POLICY "Admins can manage auditoriums" ON public.auditoriums FOR ALL USING (public.get_user_role() = 'admin') WITH CHECK (public.get_user_role() = 'admin');
    `.trim());
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="bg-card-light dark:bg-card-dark rounded-[24px] border border-border-light dark:border-border-dark shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-border-light dark:border-border-dark flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-card-hover-light dark:hover:bg-card-hover-dark transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-bold">Справочники</h2>
            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
              Управление преподавателями, предметами и аудиториями
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSyncFromSchedule}
            disabled={syncing || missingTables}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-primary-500/10 text-primary-500 hover:bg-primary-500/20 disabled:opacity-50 transition-colors"
            title="Автоматически собрать отсутствующие записи из текущего расписания"
          >
            {syncing ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
            <span>Собрать из пар</span>
          </button>

          <button
            onClick={handleOpenCreate}
            disabled={missingTables}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary-500 text-white rounded-xl text-xs font-bold hover:bg-primary-600 disabled:opacity-50 transition-colors shadow-sm"
          >
            <Plus size={16} />
            <span>Добавить</span>
          </button>
        </div>
      </div>

      {/* Missing tables banner if migration wasn't run yet */}
      {missingTables && (
        <div className="m-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-start gap-3">
          <AlertCircle size={22} className="shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <p className="font-bold">Таблицы справочников еще не созданы в Supabase</p>
            <p className="text-xs opacity-90 mt-1">
              Для работы справочников выполните миграцию <code>dictionaries_migration.sql</code> в SQL Editor вашего Supabase Dashboard.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={copyMigrationSql}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 rounded-lg font-bold text-xs transition-colors"
              >
                {copiedSql ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedSql ? 'SQL скопирован!' : 'Скопировать SQL код'}</span>
              </button>
              <button
                onClick={fetchData}
                className="px-3 py-1.5 bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-lg font-bold text-xs hover:bg-card-hover-light transition-colors"
              >
                Проверить снова
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sync success alert */}
      {syncResult && (
        <div className="mx-6 mt-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center justify-between">
          <span>{syncResult}</span>
          <button onClick={() => setSyncResult(null)} className="p-1 hover:opacity-75">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="px-6 pt-4 pb-2 border-b border-border-light dark:border-border-dark">
        <div className="flex gap-2">
          <button
            onClick={() => { setActiveTab('teachers'); setSearchQuery(''); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'teachers'
                ? 'bg-blue-500/15 text-blue-500 shadow-sm'
                : 'text-text-secondary-light dark:text-text-secondary-dark hover:bg-card-hover-light dark:hover:bg-card-hover-dark'
            }`}
          >
            <GraduationCap size={18} />
            <span>Преподаватели</span>
            <span className="px-1.5 py-0.5 rounded-full text-[11px] bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark">
              {teachers.length}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab('subjects'); setSearchQuery(''); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'subjects'
                ? 'bg-emerald-500/15 text-emerald-500 shadow-sm'
                : 'text-text-secondary-light dark:text-text-secondary-dark hover:bg-card-hover-light dark:hover:bg-card-hover-dark'
            }`}
          >
            <BookOpen size={18} />
            <span>Предметы</span>
            <span className="px-1.5 py-0.5 rounded-full text-[11px] bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark">
              {subjects.length}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab('auditoriums'); setSearchQuery(''); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'auditoriums'
                ? 'bg-orange-500/15 text-orange-500 shadow-sm'
                : 'text-text-secondary-light dark:text-text-secondary-dark hover:bg-card-hover-light dark:hover:bg-card-hover-dark'
            }`}
          >
            <MapPin size={18} />
            <span>Аудитории</span>
            <span className="px-1.5 py-0.5 rounded-full text-[11px] bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark">
              {auditoriums.length}
            </span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="p-6 pb-2">
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted-light dark:text-text-muted-dark" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === 'teachers' 
                ? 'Поиск по ФИО, почте или телефону...' 
                : activeTab === 'subjects'
                ? 'Поиск по названию или аббревиатуре...'
                : 'Поиск по номеру аудитории или корпусу...'
            }
            className="w-full pl-10 pr-10 py-2.5 bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-xl text-sm outline-none focus:border-primary-500 transition-colors"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted-light dark:text-text-muted-dark hover:text-text-primary-light"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Content List */}
      <div className="p-6 pt-4">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-text-muted-light">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500 mb-2" />
            <span className="text-xs">Загрузка справочника...</span>
          </div>
        ) : (
          <div>
            {/* Teachers Tab */}
            {activeTab === 'teachers' && (
              filteredTeachers.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-border-light dark:border-border-dark rounded-2xl">
                  <GraduationCap className="w-10 h-10 mx-auto text-text-muted-light dark:text-text-muted-dark mb-2 opacity-50" />
                  <p className="font-bold text-sm">Преподаватели не найдены</p>
                  <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
                    {searchQuery ? 'Попробуйте изменить поисковый запрос' : 'Добавьте первого преподавателя или нажмите «Собрать из пар»'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredTeachers.map(teacher => (
                    <div
                      key={teacher.id}
                      className="p-4 rounded-xl border border-border-light dark:border-border-dark bg-bg-light/50 dark:bg-bg-dark/50 hover:bg-card-hover-light dark:hover:bg-card-hover-dark transition-all flex items-center justify-between group"
                    >
                      <div className="min-w-0 pr-3">
                        <div className="font-bold text-sm truncate flex items-center gap-2">
                          <GraduationCap size={16} className="text-blue-500 shrink-0" />
                          <span>{teacher.name}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-text-secondary-light dark:text-text-secondary-dark">
                          {teacher.email && (
                            <span className="flex items-center gap-1 truncate">
                              <Mail size={12} className="opacity-70" />
                              <a href={`mailto:${teacher.email}`} className="hover:underline">{teacher.email}</a>
                            </span>
                          )}
                          {teacher.phone && (
                            <span className="flex items-center gap-1">
                              <Phone size={12} className="opacity-70" />
                              <span>{teacher.phone}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenEdit(teacher)}
                          className="p-2 rounded-lg hover:bg-primary-500/10 hover:text-primary-500 transition-colors"
                          title="Редактировать"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(teacher.id, teacher.name)}
                          className="p-2 rounded-lg hover:bg-danger/10 hover:text-danger transition-colors"
                          title="Удалить"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* Subjects Tab */}
            {activeTab === 'subjects' && (
              filteredSubjects.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-border-light dark:border-border-dark rounded-2xl">
                  <BookOpen className="w-10 h-10 mx-auto text-text-muted-light dark:text-text-muted-dark mb-2 opacity-50" />
                  <p className="font-bold text-sm">Предметы не найдены</p>
                  <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
                    {searchQuery ? 'Попробуйте изменить поисковый запрос' : 'Добавьте первую дисциплину или нажмите «Собрать из пар»'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredSubjects.map(subject => (
                    <div
                      key={subject.id}
                      className="p-4 rounded-xl border border-border-light dark:border-border-dark bg-bg-light/50 dark:bg-bg-dark/50 hover:bg-card-hover-light dark:hover:bg-card-hover-dark transition-all flex items-center justify-between group"
                    >
                      <div className="min-w-0 pr-3">
                        <div className="font-bold text-sm truncate flex items-center gap-2">
                          <BookOpen size={16} className="text-emerald-500 shrink-0" />
                          <span>{subject.name}</span>
                        </div>
                        {subject.short_name && (
                          <div className="mt-1">
                            <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
                              {subject.short_name}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenEdit(subject)}
                          className="p-2 rounded-lg hover:bg-primary-500/10 hover:text-primary-500 transition-colors"
                          title="Редактировать"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(subject.id, subject.name)}
                          className="p-2 rounded-lg hover:bg-danger/10 hover:text-danger transition-colors"
                          title="Удалить"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* Auditoriums Tab */}
            {activeTab === 'auditoriums' && (
              filteredAuditoriums.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-border-light dark:border-border-dark rounded-2xl">
                  <MapPin className="w-10 h-10 mx-auto text-text-muted-light dark:text-text-muted-dark mb-2 opacity-50" />
                  <p className="font-bold text-sm">Аудитории не найдены</p>
                  <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
                    {searchQuery ? 'Попробуйте изменить поисковый запрос' : 'Добавьте первую аудиторию или нажмите «Собрать из пар»'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {filteredAuditoriums.map(auditorium => (
                    <div
                      key={auditorium.id}
                      className="p-4 rounded-xl border border-border-light dark:border-border-dark bg-bg-light/50 dark:bg-bg-dark/50 hover:bg-card-hover-light dark:hover:bg-card-hover-dark transition-all flex items-center justify-between group"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-bold text-base flex items-center gap-2">
                          <MapPin size={16} className="text-orange-500 shrink-0" />
                          <span>{auditorium.name}</span>
                        </div>
                        {auditorium.building && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-text-secondary-light dark:text-text-secondary-dark truncate">
                            <Building size={12} className="opacity-70" />
                            <span className="truncate">{auditorium.building}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenEdit(auditorium)}
                          className="p-2 rounded-lg hover:bg-primary-500/10 hover:text-primary-500 transition-colors"
                          title="Редактировать"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(auditorium.id, auditorium.name)}
                          className="p-2 rounded-lg hover:bg-danger/10 hover:text-danger transition-colors"
                          title="Удалить"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-card-light dark:bg-card-dark w-full max-w-md rounded-2xl shadow-2xl border border-border-light dark:border-border-dark overflow-hidden z-10"
            >
              <div className="p-5 border-b border-border-light dark:border-border-dark flex items-center justify-between">
                <h3 className="font-bold text-lg">
                  {editingId ? 'Редактировать' : 'Добавить'} {
                    activeTab === 'teachers' ? 'преподавателя' :
                    activeTab === 'subjects' ? 'предмет' : 'аудиторию'
                  }
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-card-hover-light dark:hover:bg-card-hover-dark transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {/* Teacher Form */}
                {activeTab === 'teachers' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-text-muted-light dark:text-text-muted-dark mb-1">
                        ФИО преподавателя <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={teacherForm.name}
                        onChange={e => setTeacherForm({ ...teacherForm, name: e.target.value })}
                        placeholder="Например: Иванов Иван Иванович"
                        className="w-full px-3.5 py-2.5 bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-xl text-sm outline-none focus:border-primary-500 transition-colors font-medium"
                        autoFocus
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-text-muted-light dark:text-text-muted-dark mb-1">
                        Электронная почта
                      </label>
                      <input
                        type="email"
                        value={teacherForm.email}
                        onChange={e => setTeacherForm({ ...teacherForm, email: e.target.value })}
                        placeholder="ivanov@university.ru"
                        className="w-full px-3.5 py-2.5 bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-xl text-sm outline-none focus:border-primary-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-text-muted-light dark:text-text-muted-dark mb-1">
                        Телефон или Telegram
                      </label>
                      <input
                        type="text"
                        value={teacherForm.phone}
                        onChange={e => setTeacherForm({ ...teacherForm, phone: e.target.value })}
                        placeholder="+7 999 123-45-67 или @telegram"
                        className="w-full px-3.5 py-2.5 bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-xl text-sm outline-none focus:border-primary-500 transition-colors"
                      />
                    </div>
                  </>
                )}

                {/* Subject Form */}
                {activeTab === 'subjects' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-text-muted-light dark:text-text-muted-dark mb-1">
                        Название дисциплины <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={subjectForm.name}
                        onChange={e => setSubjectForm({ ...subjectForm, name: e.target.value })}
                        placeholder="Например: Высшая математика"
                        className="w-full px-3.5 py-2.5 bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-xl text-sm outline-none focus:border-primary-500 transition-colors font-medium"
                        autoFocus
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-text-muted-light dark:text-text-muted-dark mb-1">
                        Краткое название / аббревиатура
                      </label>
                      <input
                        type="text"
                        value={subjectForm.short_name}
                        onChange={e => setSubjectForm({ ...subjectForm, short_name: e.target.value })}
                        placeholder="Например: Вышмат или ВМ"
                        className="w-full px-3.5 py-2.5 bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-xl text-sm outline-none focus:border-primary-500 transition-colors"
                      />
                    </div>
                  </>
                )}

                {/* Auditorium Form */}
                {activeTab === 'auditoriums' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-text-muted-light dark:text-text-muted-dark mb-1">
                        Номер аудитории / название <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={auditoriumForm.name}
                        onChange={e => setAuditoriumForm({ ...auditoriumForm, name: e.target.value })}
                        placeholder="Например: 101а или Актовый зал"
                        className="w-full px-3.5 py-2.5 bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-xl text-sm outline-none focus:border-primary-500 transition-colors font-medium"
                        autoFocus
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-text-muted-light dark:text-text-muted-dark mb-1">
                        Корпус / Здание
                      </label>
                      <input
                        type="text"
                        value={auditoriumForm.building}
                        onChange={e => setAuditoriumForm({ ...auditoriumForm, building: e.target.value })}
                        placeholder="Например: Главный корпус или Корпус 2"
                        className="w-full px-3.5 py-2.5 bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-xl text-sm outline-none focus:border-primary-500 transition-colors"
                      />
                    </div>
                  </>
                )}

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-border-light dark:border-border-dark font-bold text-sm hover:bg-card-hover-light dark:hover:bg-card-hover-dark transition-colors"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2.5 rounded-xl bg-primary-500 text-white font-bold text-sm hover:bg-primary-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
                    <span>Сохранить</span>
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
