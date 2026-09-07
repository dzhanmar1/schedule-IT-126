import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, ArrowRight, Loader2, LogOut, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export function OnboardingScreen() {
  const { user, profile, refreshProfile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const [tab, setTab] = useState<'join' | 'create'>('join');
  const [inviteCode, setInviteCode] = useState('');
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingInvite, setPendingInvite] = useState<{ groupId: string, inviterId: string, groupName: string } | null>(null);

  useEffect(() => {
    const checkRef = async () => {
      const refCode = localStorage.getItem('invite_ref');
      if (refCode && user && !profile?.group_id) {
        setLoading(true);
        try {
          // Get group_id from RPC
          const { data: groupId } = await supabase.rpc('get_group_by_invite_code', { code: refCode });
          const { data: inviterId } = await supabase.rpc('get_inviter_id_by_code', { code: refCode });

          if (groupId) {
            const { data: groupData } = await supabase.from('groups').select('name').eq('id', groupId).single();
            if (groupData) {
              setPendingInvite({ groupId, inviterId, groupName: groupData.name });
            } else {
              localStorage.removeItem('invite_ref');
            }
          } else {
            setError('Реферальная ссылка недействительна или устарела.');
            localStorage.removeItem('invite_ref');
          }
        } catch (e) {
          console.error(e);
        }
        setLoading(false);
      }
    };
    
    checkRef();
  }, [user, profile?.group_id]);

  const handleConfirmInvite = async () => {
    if (!pendingInvite || !user) return;
    setLoading(true);
    try {
      await supabase.from('profiles').update({ 
        group_id: pendingInvite.groupId,
        invited_by: pendingInvite.inviterId || null
      }).eq('id', user.id);
      
      localStorage.removeItem('invite_ref');
      await refreshProfile();
    } catch (e: any) {
      setError(e.message || 'Ошибка при вступлении');
      setLoading(false);
    }
  };

  const handleRejectInvite = () => {
    localStorage.removeItem('invite_ref');
    setPendingInvite(null);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim() || !user) return;
    
    setError(null);
    setLoading(true);

    try {
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('id')
        .eq('invite_code', inviteCode.trim())
        .single();

      if (groupError || !group) {
        throw new Error('Группа не найдена. Проверьте код.');
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ group_id: group.id })
        .eq('id', user.id);

      if (updateError) throw updateError;
      await refreshProfile();
    } catch (err: any) {
      setError(err.message || 'Ошибка подключения');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || !user || !isAdmin) return;

    setError(null);
    setLoading(true);

    try {
      // Create group
      const { data: newGroup, error: createError } = await supabase
        .from('groups')
        .insert([{ name: groupName.trim() }])
        .select('id')
        .single();

      if (createError) throw createError;

      // Make user starosta of this group
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ group_id: newGroup.id, role: 'starosta' })
        .eq('id', user.id);

      if (updateError) throw updateError;
      await refreshProfile();
    } catch (err: any) {
      setError(err.message || 'Ошибка при создании группы');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-bg-light dark:bg-bg-dark text-text-primary-light dark:text-text-primary-dark">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm p-8 rounded-[32px] bg-card-light dark:bg-card-dark shadow-xl border border-border-light dark:border-border-dark glass text-center"
      >
        <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 text-primary-500 rounded-full mx-auto mb-6 flex items-center justify-center">
          <QrCode className="w-8 h-8" />
        </div>
        
        {pendingInvite ? (
          <div className="animate-fade-in">
            <h1 className="text-2xl font-bold mb-2">Присоединиться к группе?</h1>
            <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm mb-6 font-medium">
              Пользователь, который вас пригласил, состоит в группе{' '}
              <span className="font-bold text-primary-500">{pendingInvite.groupName}</span>.
              <br /><br />
              Это ваша группа?
            </p>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-danger text-sm font-medium mb-4"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-3 mt-4">
              <button
                onClick={handleRejectInvite}
                disabled={loading}
                className="flex-1 py-3 bg-red-500/10 text-red-500 rounded-xl font-bold hover:bg-red-500/20 transition-colors disabled:opacity-70"
              >
                Нет
              </button>
              <button
                onClick={handleConfirmInvite}
                disabled={loading}
                className="flex-[2] flex items-center justify-center gap-2 py-3 bg-primary-500 text-white rounded-xl font-bold shadow-lg shadow-primary-500/25 active:scale-95 transition-all disabled:opacity-70"
              >
                {loading ? <Loader2 className="animate-spin" /> : 'Да, моя'}
              </button>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in">
            <h1 className="text-2xl font-bold mb-2">Присоединиться к группе</h1>
            <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm mb-8 font-medium">
              Введите код приглашения, который вам дал староста, чтобы увидеть расписание.
            </p>

            {isAdmin && (
              <div className="flex bg-border-light dark:bg-border-dark rounded-xl p-1 mb-8">
                <button
                  onClick={() => { setTab('join'); setError(null); }}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                    tab === 'join' 
                      ? 'bg-card-light dark:bg-card-dark text-text-primary-light dark:text-text-primary-dark shadow-sm' 
                      : 'text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark'
                  }`}
                >
                  Вступить
                </button>
                <button
                  onClick={() => { setTab('create'); setError(null); }}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                    tab === 'create' 
                      ? 'bg-card-light dark:bg-card-dark text-text-primary-light dark:text-text-primary-dark shadow-sm' 
                      : 'text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark'
                  }`}
                >
                  Создать
                </button>
              </div>
            )}

            {!isAdmin || tab === 'join' ? (
              <form onSubmit={handleJoin} className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="Код приглашения"
                    className="w-full px-4 py-3 text-center tracking-widest bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-xl text-lg font-bold outline-none focus:border-primary-500 transition-colors"
                  />
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-danger text-sm font-medium"
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={loading || !inviteCode.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary-500 text-white rounded-xl font-bold shadow-lg shadow-primary-500/25 active:scale-95 transition-all disabled:opacity-70"
                >
                  {loading ? <Loader2 className="animate-spin" /> : 'Вступить в группу'}
                  {!loading && <ArrowRight size={18} />}
                </button>
              </form>
            ) : (
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Название группы (напр. IT-126)"
                    className="w-full px-4 py-3 text-center bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-xl text-lg font-bold outline-none focus:border-primary-500 transition-colors"
                  />
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-danger text-sm font-medium"
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={loading || !groupName.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary-500 text-white rounded-xl font-bold shadow-lg shadow-primary-500/25 active:scale-95 transition-all disabled:opacity-70"
                >
                  {loading ? <Loader2 className="animate-spin" /> : 'Создать и стать старостой'}
                  {!loading && <Users size={18} />}
                </button>
              </form>
            )}
          </div>
        )}
        
        <div className="mt-8 pt-6 border-t border-border-light dark:border-border-dark">
          <button
            onClick={() => supabase.auth.signOut()}
            className="flex items-center justify-center gap-2 w-full text-sm font-bold text-text-muted-light dark:text-text-muted-dark hover:text-danger transition-colors"
          >
            <LogOut size={16} /> Выйти
          </button>
        </div>
      </motion.div>
    </div>
  );
}
