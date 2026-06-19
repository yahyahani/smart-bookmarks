import { useLanguage } from '../i18n/LanguageContext';

// Een simpele, herbruikbare bevestigingsdialoog. Sluit ook bij een klik
// buiten de dialoog (op de overlay), wat gebruikers verwachten.
export default function ConfirmDialog({ title, body, confirmLabel, onConfirm, onCancel }) {
  const { t } = useLanguage();

  return (
    <div className="dialog-overlay" onClick={onCancel}>
      <div
        className="dialog-card"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="dialog-title" className="dialog-title">{title}</h2>
        {body && <p className="dialog-body">{body}</p>}
        <div className="dialog-actions">
          <button type="button" className="btn-ghost" onClick={onCancel}>
            {t('cancelButton')}
          </button>
          <button type="button" className="btn-danger" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
