import { useState, useEffect } from 'react';

import { ArrowLeft, Trash2, Plus, Copy, Check, Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface Group {
  id: string;
  name: string;
  invite_code: string;
}

export function GroupsManager({ onBack }: { onBack: () => void }) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  // For creating new group
  const [isCreating, setIsCreating] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  const fetchGroups = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('groups').select('*').order('name');
    if (!error && data) {
      setGroups(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Вы уверены, что хотите удалить группу ${name}? Это удалит всех пользователей и расписание!`)) return;
    const { error } = await supabase.from('groups').delete().eq('id', id);
    if (!error) {
      setGroups(groups.filter(g => g.id !== id));
    } else {
      alert('Ошибка удаления группы');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    const { data, error } = await supabase
      .from('groups')
      .insert([{ name: newGroupName.trim() }])
      .select()
      .single();
      
    if (!error && data) {
      setGroups([...groups, data].sort((a, b) => a.name.localeCompare(b.name)));
      setIsCreating(false);
      setNewGroupName('');
    } else {
      alert('Ошибка создания группы');
    }
  };

  return (
    <div className="bg-card-light dark:bg-card-dark rounded-[24px] border border-border-light dark:border-border-dark shadow-xl overflow-hidden">
      <div className="p-6 border-b border-border-light dark:border-border-dark flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-card-hover-light dark:hover:bg-card-hover-dark transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-bold">Управление группами</h2>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-xl font-bold hover:bg-primary-600 transition-colors"
        >
          <Plus size={18} />
          Создать
        </button>
      </div>

      <div className="p-6">
        {isCreating && (
          <form onSubmit={handleCreate} className="mb-6 p-4 bg-bg-light dark:bg-bg-dark rounded-xl border border-border-light dark:border-border-dark flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-xs font-bold text-text-muted-light dark:text-text-muted-dark mb-1">Название группы</label>
              <input
                type="text"
                value={newGroupName}
                onChange={e => setNewGroupName(e.target.value)}
                placeholder="IT-126"
                className="w-full bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-xl px-4 py-2 focus:border-primary-500 transition-colors"
                autoFocus
              />
            </div>
            <button type="submit" className="px-6 py-2 bg-primary-500 text-white rounded-xl font-bold h-[42px]">
              Сохранить
            </button>
            <button type="button" onClick={() => setIsCreating(false)} className="px-6 py-2 bg-red-500/10 text-red-500 rounded-xl font-bold h-[42px]">
              Отмена
            </button>
          </form>
        )}

        {loading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-light dark:border-border-dark text-text-muted-light dark:text-text-muted-dark text-sm">
                  <th className="pb-3 font-bold">Название</th>
                  <th className="pb-3 font-bold">Код приглашения</th>
                  <th className="pb-3 font-bold text-right">Действия</th>
                </tr>
              </thead>
              <tbody>
                {groups.map(group => (
                  <tr key={group.id} className="border-b border-border-light dark:border-border-dark last:border-0">
                    <td className="py-4 font-bold">{group.name}</td>
                    <td className="py-4">
                      <div className="flex items-center gap-2 text-sm font-mono bg-bg-light dark:bg-bg-dark px-3 py-1.5 rounded-lg w-max">
                        {group.invite_code}
                        <button onClick={() => copyCode(group.invite_code)} className="text-primary-500 hover:text-primary-600 transition-colors">
                          {copiedCode === group.invite_code ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                      </div>
                    </td>
                    <td className="py-4 text-right">
                      <button
                        onClick={() => handleDelete(group.id, group.name)}
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {groups.length === 0 && (
              <div className="py-12 text-center text-text-secondary-light dark:text-text-secondary-dark">
                Нет групп
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
