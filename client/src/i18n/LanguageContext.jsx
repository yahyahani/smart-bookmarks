import { createContext, useContext, useState, useEffect } from 'react';
import { translations } from './translations';

const LanguageContext = createContext(null);

const STORAGE_KEY = 'language';
const DEFAULT_LANGUAGE = 'nl';

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_LANGUAGE;
  });

  const dict = translations[language];

  // Zet de richting (ltr/rtl) en taal-attribuut op het <html>-element.
  // Dit is wat de browser vertelt om Arabische tekst van rechts naar
  // links te tonen, inclusief de layout-spiegeling via CSS logical properties.
  useEffect(() => {
    document.documentElement.dir = dict.dir;
    document.documentElement.lang = language;
    localStorage.setItem(STORAGE_KEY, language);
  }, [language, dict.dir]);

  // Tweede argument is optioneel: een object met waarden die {placeholders}
  // in de vertaling vervangen, bv. t('selectedCount', { count: 3 })
  // → "3 selected" als de vertaling "{count} selected" is.
  function t(key, params) {
    let text = dict[key] ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(`{${k}}`, v);
      }
    }
    return text;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir: dict.dir }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage moet gebruikt worden binnen een LanguageProvider');
  }
  return context;
}
