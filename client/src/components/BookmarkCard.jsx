import { useState, useRef } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import CollectionPicker from './CollectionPicker';

function getHostname(url) {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

export default function BookmarkCard({
  bookmark,
  onDeleteRequest,
  onSave,
  onTagClick,
  animationDelay = 0,
  selectMode = false,
  isSelected = false,
  onToggleSelected,
  collections = [],
  onToggleCollection,
}) {
  const { t } = useLanguage();
  const { url, title, description, image_url, favicon_url, tags, collection_ids } = bookmark;

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [editTags, setEditTags] = useState((tags || []).join(', '));
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const collectionBtnRef = useRef(null);

  function startEditing() {
    setEditTitle(title);
    setEditTags((tags || []).join(', '));
    setIsEditing(true);
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const newTags = editTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      await onSave(bookmark.id, { title: editTitle.trim(), tags: newTags });
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  }

  // Volgt de muispositie binnen de kaart en zet die als CSS-variabelen,
  // zodat de gloed in App.css de cursor kan volgen via een radial-gradient.
  // Puur visueel, dus we raken geen React state aan — dat zou bij elke
  // muisbeweging een re-render triggeren en voelt trager aan dan direct
  // de stijl van het DOM-element bijwerken.
  function handleMouseMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty('--my', `${e.clientY - rect.top}px`);
  }

  if (isEditing) {
    return (
      <article
        className="bm-card bm-card-editing"
        style={{ animationDelay: `${animationDelay}ms` }}
      >
        <form className="bm-edit-form" onSubmit={handleSaveEdit}>
          <label className="bm-edit-field">
            <span>{t('editTitleLabel')}</span>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              autoFocus
            />
          </label>
          <label className="bm-edit-field">
            <span>{t('editTagsLabel')}</span>
            <input
              type="text"
              value={editTags}
              onChange={(e) => setEditTags(e.target.value)}
            />
          </label>
          <div className="bm-edit-actions">
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setIsEditing(false)}
              disabled={saving}
            >
              {t('cancelButton')}
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {t('saveEditButton')}
            </button>
          </div>
        </form>
      </article>
    );
  }

  return (
    <article
      className={`bm-card ${selectMode ? 'bm-card-selectable' : ''} ${isSelected ? 'bm-card-selected' : ''}`}
      style={{ animationDelay: `${animationDelay}ms` }}
      onMouseMove={handleMouseMove}
      onClick={selectMode ? onToggleSelected : undefined}
    >
      {selectMode && (
        <label className="bm-select-checkbox" onClick={(e) => e.stopPropagation()}>
          <input type="checkbox" checked={isSelected} onChange={onToggleSelected} />
        </label>
      )}

      {image_url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="bm-image-link"
          onClick={(e) => selectMode && e.preventDefault()}
        >
          <img src={image_url} alt="" className="bm-image" loading="lazy" />
        </a>
      )}

      <div className="bm-body">
        <div className="bm-source">
          {favicon_url && <img src={favicon_url} alt="" className="bm-favicon" />}
          <span>{getHostname(url)}</span>
        </div>

        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="bm-title"
          onClick={(e) => selectMode && e.preventDefault()}
        >
          {title}
        </a>

        {description && <p className="bm-description">{description}</p>}

        {tags?.length > 0 && (
          <div className="bm-tags">
            {tags.map((tag) => (
              <button
                key={tag}
                type="button"
                className="bm-tag bm-tag-clickable"
                onClick={(e) => {
                  if (selectMode) return; // in selectiemodus filtert een tag niet
                  e.stopPropagation();
                  onTagClick(tag);
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {!selectMode && (
        <div className="bm-card-actions">
          <button
            type="button"
            ref={collectionBtnRef}
            className="bm-action-btn"
            onClick={() => setPickerOpen(true)}
            aria-label={`${t('addToCollectionLabel')}: ${title}`}
            title={t('addToCollectionLabel')}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.59 13.41 11 3.83A2 2 0 0 0 9.59 3.24H4a1 1 0 0 0-1 1v5.59a2 2 0 0 0 .59 1.41l9.58 9.59a2 2 0 0 0 2.82 0l4.6-4.6a2 2 0 0 0 0-2.82z" />
              <circle cx="7.5" cy="7.5" r="1.5" />
            </svg>
          </button>
          <button
            type="button"
            className="bm-action-btn"
            onClick={startEditing}
            aria-label={`${t('editAriaLabel')}: ${title}`}
            title={t('editTitle')}
          >
            ✎
          </button>
          <button
            type="button"
            className="bm-action-btn bm-action-btn-danger"
            onClick={() => onDeleteRequest(bookmark)}
            aria-label={`${t('deleteAriaLabel')}: ${title}`}
            title={t('deleteTitle')}
          >
            ×
          </button>
        </div>
      )}

      {pickerOpen && (
        <CollectionPicker
          collections={collections}
          selectedIds={collection_ids || []}
          onToggle={(collectionId) => onToggleCollection(bookmark, collectionId)}
          onClose={() => setPickerOpen(false)}
          anchorRef={collectionBtnRef}
        />
      )}
    </article>
  );
}
