import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: 'student' | 'starosta' | 'admin' | 'teacher';
  group_id: string | null;
  inviter?: { email: string; full_name: string | null } | null;
}

interface Group {
  id: string;
  name: string;
}

export function UsersManager({ onBack }: { onBack: () => void }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const [profilesRes, groupsRes] = await Promise.all([
      supabase.from('profiles').select('*, inviter:invited_by(email, full_name)').order('created_at', { ascending: false }),
      supabase.from('groups').select('id, name').order('name')
    ]);

    if (profilesRes.data) setProfiles(profilesRes.data as any);
    if (groupsRes.data) setGroups(groupsRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateRole = async (id: string, newRole: Profile['role']) => {
    setSavingId(id);
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', id);
    if (!error) {
      setProfiles(profiles.map(p => p.id === id ? { ...p, role: newRole } : p));
    } else {
      alert('Ошибка обновления роли');
    }
    setSavingId(null);
  };

  const handleUpdateGroup = async (id: string, newGroupId: string | null) => {
    setSavingId(id);
    const { error } = await supabase.from('profiles').update({ group_id: newGroupId }).eq('id', id);
    if (!error) {
      setProfiles(profiles.map(p => p.id === id ? { ...p, group_id: newGroupId } : p));
    } else {
      alert('Ошибка обновления группы');
    }
    setSavingId(null);
  };

  return (
    <div className="bg-card-light dark:bg-card-dark rounded-[24px] border border-border-light dark:border-border-dark shadow-xl overflow-hidden">
      <div className="p-6 border-b border-border-light dark:border-border-dark flex items-center gap-4">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-card-hover-light dark:hover:bg-card-hover-dark transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-bold">Управление пользователями</h2>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-light dark:border-border-dark text-text-muted-light dark:text-text-muted-dark text-sm">
                  <th className="pb-3 font-bold">Email</th>
                  <th className="pb-3 font-bold">Роль</th>
                  <th className="pb-3 font-bold">Группа</th>
                  <th className="pb-3 font-bold">Приглашен</th>
                  <th className="pb-3 font-bold text-center">Статус</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map(profile => (
                  <tr key={profile.id} className="border-b border-border-light dark:border-border-dark last:border-0 hover:bg-card-hover-light dark:hover:bg-card-hover-dark transition-colors">
                    <td className="py-3">
                      <div className="font-medium text-sm">{profile.email}</div>
                      {profile.full_name && <div className="text-xs text-text-muted-light dark:text-text-muted-dark">{profile.full_name}</div>}
                    </td>
                    <td className="py-3">
                      <select
                        value={profile.role}
                        onChange={(e) => handleUpdateRole(profile.id, e.target.value as Profile['role'])}
                        className="bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-lg px-2 py-1 text-sm outline-none focus:border-primary-500"
                        disabled={savingId === profile.id}
                      >
                        <option value="student">Студент</option>
                        <option value="starosta">Староста</option>
                        <option value="teacher">Преподаватель</option>
                        <option value="admin">Администратор</option>
                      </select>
                    </td>
                    <td className="py-3">
                      <select
                        value={profile.group_id || ''}
                        onChange={(e) => handleUpdateGroup(profile.id, e.target.value || null)}
                        className="bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-lg px-2 py-1 text-sm outline-none focus:border-primary-500 max-w-[150px]"
                        disabled={savingId === profile.id}
                      >
                        <option value="">Без группы</option>
                        {groups.map(g => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                      {profile.inviter ? (
                        <div title={profile.inviter.email}>
                          {profile.inviter.full_name || profile.inviter.email}
                        </div>
                      ) : (
                        <span className="opacity-50">—</span>
                      )}
                    </td>
                    <td className="py-3 text-center">
                      {savingId === profile.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-primary-500 mx-auto" />
                      ) : (
                        <Save className="w-4 h-4 text-text-muted-light dark:text-text-muted-dark mx-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {profiles.length === 0 && (
              <div className="py-12 text-center text-text-secondary-light dark:text-text-secondary-dark">
                Нет пользователей
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
