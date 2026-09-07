import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Share2 } from 'lucide-react';
import QRCode from 'react-qr-code';
import { useAuth } from '../contexts/AuthContext';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InviteModal({ isOpen, onClose }: InviteModalProps) {
  const { profile } = useAuth();
  const [copied, setCopied] = useState(false);

  const inviteCode = profile?.personal_invite_code || 'error-no-code';
  const inviteLink = `${window.location.origin}/?ref=${inviteCode}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Присоединяйся к моей группе!',
          text: 'Переходи по ссылке, чтобы смотреть расписание нашей группы:',
          url: inviteLink,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      copyToClipboard();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-sm bg-card-light dark:bg-card-dark rounded-3xl shadow-2xl border border-border-light dark:border-border-dark overflow-hidden p-6 text-center"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-bg-light dark:hover:bg-bg-dark text-text-secondary-light dark:text-text-secondary-dark transition-colors"
            >
              <X size={20} />
            </button>

            <div className="w-16 h-16 mx-auto bg-primary-100 dark:bg-primary-900/30 text-primary-500 rounded-2xl flex items-center justify-center mb-4">
              <Share2 size={32} />
            </div>

            <h2 className="text-xl font-bold mb-2">Пригласить друзей</h2>
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-6">
              Поделитесь ссылкой или дайте отсканировать этот QR-код, чтобы добавить одногруппников.
            </p>

            <div className="bg-white p-4 rounded-2xl mb-6 inline-block shadow-sm">
              <QRCode value={inviteLink} size={180} className="w-full h-auto" />
            </div>

            <div className="flex gap-2">
              <button
                onClick={copyToClipboard}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-xl font-bold hover:bg-border-light dark:hover:bg-border-dark transition-colors"
              >
                {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                {copied ? 'Скопировано' : 'Копировать'}
              </button>
              {!!navigator.share && (
                <button
                  onClick={handleShare}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary-500 text-white rounded-xl font-bold shadow-lg shadow-primary-500/25 hover:bg-primary-600 transition-colors"
                >
                  <Share2 size={18} />
                  Поделиться
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
