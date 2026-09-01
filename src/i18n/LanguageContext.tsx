import { createContext, useContext, useState, type ReactNode } from 'react';
import { translations, type Language } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function getNestedValue(obj: Record<string, unknown>, path: string): string | undefined {
  const keys = path.split('.');
  let current: unknown = obj;

  for (const k of keys) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[k];
  }

  return typeof current === 'string' ? current : undefined;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('schedule-language');
      if (saved === 'kk' || saved === 'ru' || saved === 'en') return saved;
    } catch { /* SSR / privacy mode */ }
    return 'kk';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try { localStorage.setItem('schedule-language', lang); } catch { /* noop */ }
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    const dict = translations[language] as unknown as Record<string, unknown>;
    let result = getNestedValue(dict, key);

    if (result === undefined) {
      // Fallback to key itself
      console.warn(`[i18n] Missing key "${key}" for language "${language}"`);
      return key;
    }

    if (params) {
      for (const [param, value] of Object.entries(params)) {
        result = result!.replace(`{${param}}`, String(value));
      }
    }

    return result!;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
