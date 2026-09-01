import { Coffee } from 'lucide-react';
import { parseClassTime } from '../utils/time';
import { differenceInMinutes } from 'date-fns';
import { motion } from 'framer-motion';
import { useLanguage } from '../i18n';


interface FreeTimeBlockProps {
  prevLessonTime: string;
  nextLessonTime: string;
  currentTime: Date;
}

export function FreeTimeBlock({ prevLessonTime, nextLessonTime, currentTime }: FreeTimeBlockProps) {
  const { t } = useLanguage();
  const { endTime: prevEnd } = parseClassTime(prevLessonTime, currentTime);
  const { startTime: nextStart } = parseClassTime(nextLessonTime, currentTime);

  const duration = differenceInMinutes(nextStart, prevEnd);

  if (duration <= 15) return null;

  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;
  let durationStr = '';
  if (hours > 0) durationStr += `${hours} ${t('ui.hoursShort')} `;
  if (minutes > 0) durationStr += `${minutes} ${t('ui.minutesShort')}`;

  return (
    <div className="relative py-3 flex w-full">
      {/* Timeline Dot & Dashed Line Connection */}
      <div className="absolute left-[27px] top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 w-2 h-2 rounded-full bg-border-light dark:bg-border-dark" />
      <div className="absolute left-[27px] top-1/2 -translate-y-1/2 w-full border-t border-dashed border-border-light dark:border-border-dark" />
      
      {/* Label Pill */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 ml-[56px] mr-auto flex justify-center"
      >
        <span className="bg-bg-light dark:bg-bg-dark px-3 py-1 flex items-center gap-1.5 text-text-muted-light dark:text-text-muted-dark rounded-full border border-border-light dark:border-border-dark shadow-sm backdrop-blur-sm glass">
          <Coffee size={12} className="text-primary-500" />
          <span className="text-[10px] font-bold uppercase tracking-wider">
            {t('ui.window')}: {durationStr.trim()}
          </span>
        </span>
      </motion.div>
    </div>
  );
}
