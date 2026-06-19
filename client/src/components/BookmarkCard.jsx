import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

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
}) {
  const { t } = useLanguage();
  const { url, title, description, image_url, favicon_url, tags } = bookmark;

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [editTags, setEditTags] = useState((tags || []).join(', '));
  const [saving, setSaving] = useState(false);

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
      className="bm-card"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      {image_url && (
        <a href={url} target="_blank" rel="noopener noreferrer" className="bm-image-link">
          <img src={image_url} alt="" className="bm-image" loading="lazy" />
        </a>
      )}

      <div className="bm-body">
        <div className="bm-source">
          {favicon_url && <img src={favicon_url} alt="" className="bm-favicon" />}
          <span>{getHostname(url)}</span>
        </div>

        <a href={url} target="_blank" rel="noopener noreferrer" className="bm-title">
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
                onClick={() => onTagClick(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="bm-card-actions">
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
    </article>
  );
}
