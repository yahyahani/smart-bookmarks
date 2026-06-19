import { useLanguage } from '../i18n/LanguageContext';
import { languageOptions } from '../i18n/translations';

export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <label className="lang-switcher">
      <span className="sr-only">{t('languageLabel')}</span>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        aria-label={t('languageLabel')}
      >
        {languageOptions.map((opt) => (
          <option key={opt.code} value={opt.code}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
