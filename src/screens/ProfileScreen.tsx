import { useState } from 'react';
import { User, LogOut, Loader2, Save, Palette } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { stringToColor } from '../utils/colors';

const COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', 
  '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e'
];

export function ProfileScreen() {
  const { user, profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [avatarColor, setAvatarColor] = useState(profile?.avatar_color || stringToColor(user?.id || ''));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          bio,
          avatar_color: avatarColor,
        })
        .eq('id', user.id);

      if (error) throw error;
      await refreshProfile();
    } catch (err) {
      console.error('Error updating profile:', err);
      alert('Ошибка при сохранении профиля');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-bg-main-light dark:bg-bg-main-dark">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary-600 to-blue-600 text-white p-6 pt-16 pb-28 relative shadow-lg">
        <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-black mb-1">Профиль</h1>
          <p className="opacity-80 text-sm">Настройте свой внешний вид</p>
        </div>
        {/* Decorative curve at the bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-bg-main-light dark:bg-bg-main-dark rounded-t-[32px]"></div>
      </div>

      <div className="px-5 -mt-20 relative z-20 pb-28">
        <form onSubmit={handleSave} className="bg-card-light dark:bg-card-dark rounded-[32px] p-6 shadow-xl border border-border-light/50 dark:border-border-dark/50 flex flex-col gap-6 backdrop-blur-sm">
          
          {/* Avatar Section */}
          <div className="flex flex-col items-center">
            <div 
              className="w-28 h-28 rounded-full flex items-center justify-center text-5xl font-black text-white shadow-lg mb-6 border-4 border-card-light dark:border-card-dark transition-all duration-300"
              style={{ backgroundColor: avatarColor }}
            >
              {fullName ? fullName.substring(0, 2).toUpperCase() : <User size={48} />}
            </div>
            
            <div className="w-full">
              <label className="text-sm font-bold text-text-secondary-light dark:text-text-secondary-dark flex items-center gap-2 mb-3">
                <Palette size={16} /> Цвет аватара
              </label>
              <div className="flex flex-wrap gap-3 justify-center px-2">
                {COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setAvatarColor(color)}
                    className="w-9 h-9 rounded-full transition-transform hover:scale-110 focus:outline-none relative"
                    style={{ 
                      backgroundColor: color,
                    }}
                  >
                    {avatarColor === color && (
                      <div className="absolute inset-0 rounded-full border-2 border-white dark:border-black mix-blend-overlay shadow-inner"></div>
                    )}
                    {avatarColor === color && (
                      <div className="absolute -inset-1 rounded-full border border-current opacity-50" style={{ borderColor: color }}></div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="h-px bg-border-light dark:bg-border-dark w-full" />

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-text-secondary-light dark:text-text-secondary-dark mb-1">
                Имя и фамилия
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 bg-bg-main-light dark:bg-bg-main-dark border border-border-light dark:border-border-dark rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-text-primary-light dark:text-text-primary-dark"
                placeholder="Иван Иванов"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-text-secondary-light dark:text-text-secondary-dark mb-1">
                Статус / О себе
              </label>
              <input
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-4 py-3 bg-bg-main-light dark:bg-bg-main-dark border border-border-light dark:border-border-dark rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-text-primary-light dark:text-text-primary-dark"
                placeholder="Студент 1 курса..."
              />
            </div>


            
            <div>
              <label className="block text-sm font-bold text-text-secondary-light dark:text-text-secondary-dark mb-1">
                Группа
              </label>
              <div className="w-full px-4 py-3 bg-bg-main-light dark:bg-bg-main-dark opacity-50 border border-border-light dark:border-border-dark rounded-xl text-text-primary-light dark:text-text-primary-dark cursor-not-allowed">
                {profile?.groups?.name || 'Не состоит в группе'}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 mt-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            Сохранить изменения
          </button>
        </form>

        <button
          onClick={handleLogout}
          disabled={loading}
          className="w-full py-4 mt-6 bg-red-500/10 hover:bg-red-500/20 text-red-500 dark:text-red-400 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors border border-red-500/20"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <LogOut size={20} />}
          Выйти из аккаунта
        </button>
      </div>
    </div>
  );
}
