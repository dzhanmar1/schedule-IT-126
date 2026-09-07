import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Library, Shield, ArrowLeft, BookOpen, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { GroupsManager } from './components/GroupsManager';
import { UsersManager } from './components/UsersManager';
import { DictionariesManager } from './components/DictionariesManager';

export function AdminDashboardScreen() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'groups' | 'users' | 'dictionaries' | null>(null);

  if (profile?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-light dark:bg-bg-dark text-text-primary-light dark:text-text-primary-dark">
        <p>Доступ запрещен</p>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'groups':
        return <GroupsManager onBack={() => setActiveTab(null)} />;
      case 'users':
        return <UsersManager onBack={() => setActiveTab(null)} />;
      case 'dictionaries':
        return <DictionariesManager onBack={() => setActiveTab(null)} />;
      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/schedule-editor')}
              className="flex flex-col items-center justify-center p-8 bg-card-light dark:bg-card-dark rounded-[24px] border border-border-light dark:border-border-dark shadow-xl text-primary-500 hover:border-primary-500 transition-colors"
            >
              <Clock className="w-12 h-12 mb-4" />
              <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">Расписание</h3>
              <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-2 text-center">
                Управление расписанием и исключениями для вашей группы
              </p>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('groups')}
              className="flex flex-col items-center justify-center p-8 bg-card-light dark:bg-card-dark rounded-[24px] border border-border-light dark:border-border-dark shadow-xl text-blue-500 hover:border-blue-500 transition-colors"
            >
              <Library className="w-12 h-12 mb-4" />
              <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">Группы</h3>
              <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-2 text-center">
                Просмотр всех групп, создание новых и управление кодами доступа
              </p>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('users')}
              className="flex flex-col items-center justify-center p-8 bg-card-light dark:bg-card-dark rounded-[24px] border border-border-light dark:border-border-dark shadow-xl text-orange-500 hover:border-orange-500 transition-colors"
            >
              <Users className="w-12 h-12 mb-4" />
              <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">Пользователи</h3>
              <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-2 text-center">
                Выдача ролей (админ, староста), смена группы
              </p>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('dictionaries')}
              className="flex flex-col items-center justify-center p-8 bg-card-light dark:bg-card-dark rounded-[24px] border border-border-light dark:border-border-dark shadow-xl text-green-500 hover:border-green-500 transition-colors"
            >
              <BookOpen className="w-12 h-12 mb-4" />
              <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">Справочники</h3>
              <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-2 text-center">
                Управление списком преподавателей и дисциплин (в разработке)
              </p>
            </motion.button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark text-text-primary-light dark:text-text-primary-dark p-4 md:p-8 transition-colors">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-full bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark shadow-sm hover:bg-card-hover-light dark:hover:bg-card-hover-dark transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary-500" />
              <div>
                <h1 className="text-2xl font-bold">Панель администратора</h1>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  Глобальное управление приложением
                </p>
              </div>
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab || 'main'}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
