import { ArrowLeft, BookOpen, GraduationCap, MapPin } from 'lucide-react';

export function DictionariesManager({ onBack }: { onBack: () => void }) {
  return (
    <div className="bg-card-light dark:bg-card-dark rounded-[24px] border border-border-light dark:border-border-dark shadow-xl overflow-hidden">
      <div className="p-6 border-b border-border-light dark:border-border-dark flex items-center gap-4">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-card-hover-light dark:hover:bg-card-hover-dark transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-bold">Справочники</h2>
      </div>

      <div className="p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-500 mb-6">
          <BookOpen size={32} />
        </div>
        <h3 className="text-xl font-bold mb-2">Раздел в разработке</h3>
        <p className="text-text-secondary-light dark:text-text-secondary-dark max-w-md mx-auto mb-8">
          Здесь появится управление списком преподавателей, дисциплин и аудиторий. Это позволит выбирать их из списка при редактировании расписания, исключая ошибки ввода.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto opacity-50 pointer-events-none">
          <div className="p-6 rounded-xl border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark">
            <GraduationCap className="w-8 h-8 mx-auto mb-3 text-blue-500" />
            <div className="font-bold">Преподаватели</div>
          </div>
          <div className="p-6 rounded-xl border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark">
            <BookOpen className="w-8 h-8 mx-auto mb-3 text-green-500" />
            <div className="font-bold">Предметы</div>
          </div>
          <div className="p-6 rounded-xl border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark">
            <MapPin className="w-8 h-8 mx-auto mb-3 text-orange-500" />
            <div className="font-bold">Аудитории</div>
          </div>
        </div>
      </div>
    </div>
  );
}
