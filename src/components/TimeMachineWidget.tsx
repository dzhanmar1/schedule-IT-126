import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TimerReset, X, Clock, CalendarDays, FastForward, Play } from 'lucide-react';
import { useTimeMachine } from '../contexts/TimeContext';
import { ToggleSwitch } from './ToggleSwitch';
import { cn } from '../utils/cn';

export function TimeMachineWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const { currentTime, isTimeMachineActive, setMockTime } = useTimeMachine();

  const handleToggle = (enabled: boolean) => {
    if (enabled) {
      setMockTime(new Date()); // Freeze at current real time initially
    } else {
      setMockTime(null);
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isTimeMachineActive) return;
    const [hours, minutes] = e.target.value.split(':').map(Number);
    const newDate = new Date(currentTime);
    newDate.setHours(hours, minutes, 0, 0);
    setMockTime(newDate);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isTimeMachineActive) return;
    const datePart = e.target.value; // YYYY-MM-DD
    if (!datePart) return;
    
    const [year, month, day] = datePart.split('-').map(Number);
    const newDate = new Date(currentTime);
    newDate.setFullYear(year, month - 1, day);
    setMockTime(newDate);
  };

  const applyPreset = (dayOffset: number, hours: number, minutes: number) => {
    const newDate = new Date(); // base it on real today
    newDate.setDate(newDate.getDate() + dayOffset);
    newDate.setHours(hours, minutes, 0, 0);
    setMockTime(newDate);
  };

  // Ensure double digits for inputs
  const timeString = `${String(currentTime.getHours()).padStart(2, '0')}:${String(currentTime.getMinutes()).padStart(2, '0')}`;
  
  // Create YYYY-MM-DD string with local timezone awareness
  const y = currentTime.getFullYear();
  const m = String(currentTime.getMonth() + 1).padStart(2, '0');
  const d = String(currentTime.getDate()).padStart(2, '0');
  const dateString = `${y}-${m}-${d}`;

  return (
    <>
      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed bottom-6 left-4 z-50 p-3 rounded-full shadow-lg backdrop-blur-md border transition-colors',
          isTimeMachineActive
            ? 'bg-amber-500/90 border-amber-400 text-white shadow-amber-500/30'
            : 'bg-card-light/80 dark:bg-card-dark/80 border-border-light dark:border-border-dark text-text-secondary-light dark:text-text-secondary-dark glass'
        )}
      >
        <TimerReset size={20} className={isTimeMachineActive ? 'animate-pulse' : ''} />
      </motion.button>

      {/* Expanded Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-20 left-4 z-50 w-72 bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-[20px] shadow-2xl glass overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border-light dark:border-border-dark bg-amber-500/10 dark:bg-amber-500/5">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500 font-bold">
                <TimerReset size={18} />
                <span>Машина времени</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-text-muted-light dark:text-text-muted-dark transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 space-y-5">
              {/* Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
                  Переопределить время
                </span>
                <ToggleSwitch checked={isTimeMachineActive} onChange={handleToggle} />
              </div>

              {/* Controls */}
              <div className={cn('space-y-4 transition-opacity', !isTimeMachineActive && 'opacity-40 pointer-events-none')}>
                
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider">
                    <CalendarDays size={14} /> Дата
                  </label>
                  <input
                    type="date"
                    value={dateString}
                    onChange={handleDateChange}
                    className="w-full bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-xl px-3 py-2 text-sm text-text-primary-light dark:text-text-primary-dark outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider">
                    <Clock size={14} /> Время
                  </label>
                  <input
                    type="time"
                    value={timeString}
                    onChange={handleTimeChange}
                    className="w-full bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-xl px-3 py-2 text-sm text-text-primary-light dark:text-text-primary-dark outline-none focus:border-amber-500"
                  />
                </div>

                {/* Presets */}
                <div className="pt-2 border-t border-border-light dark:border-border-dark space-y-2">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider">
                    <FastForward size={14} /> Быстрые тесты
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <PresetButton onClick={() => applyPreset(0, 9, 20)} label="Утро (09:20)" />
                    <PresetButton onClick={() => applyPreset(0, 10, 55)} label="Окно (10:55)" />
                    <PresetButton onClick={() => applyPreset(0, 15, 0)} label="Конец (15:00)" />
                    <PresetButton onClick={() => applyPreset(2, 10, 0)} label="+2 Дня" />
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function PresetButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="flex items-center justify-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/20 rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors"
    >
      <Play size={10} />
      {label}
    </motion.button>
  );
}
