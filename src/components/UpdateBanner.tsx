import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X } from 'lucide-react';

interface UpdateBannerWrapperProps {
  isVisible: boolean;
  onUpdate: () => void;
  onDismiss: () => void;
}

function UpdateBanner({ onUpdate, onDismiss }: { onUpdate: () => void; onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ y: 120, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 120, opacity: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      className="fixed bottom-4 left-4 right-4 z-[100] flex items-center gap-3 rounded-[20px] bg-primary-500 px-4 py-3.5 shadow-2xl shadow-primary-500/40 max-w-lg mx-auto"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-white/20">
        <RefreshCw size={18} className="text-white animate-spin" style={{ animationDuration: '3s' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white leading-tight">Доступно обновление!</p>
        <p className="text-[11px] text-white/75 font-medium mt-0.5">Новая версия приложения готова</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onUpdate}
          className="px-3 py-1.5 bg-white text-primary-600 rounded-xl text-xs font-bold hover:bg-primary-50 transition-colors active:scale-95"
        >
          Обновить
        </button>
        <button onClick={onDismiss} className="p-1.5 text-white/70 hover:text-white transition-colors" aria-label="Close">
          <X size={16} />
        </button>
      </div>
    </motion.div>
  );
}

export function UpdateBannerWrapper({ isVisible, onUpdate, onDismiss }: UpdateBannerWrapperProps) {
  return (
    <AnimatePresence>
      {isVisible && <UpdateBanner onUpdate={onUpdate} onDismiss={onDismiss} />}
    </AnimatePresence>
  );
}