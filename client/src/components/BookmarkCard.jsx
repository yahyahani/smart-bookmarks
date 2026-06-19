import { useLanguage } from '../i18n/LanguageContext';

function getHostname(url) {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

export default function BookmarkCard({ bookmark, onDelete, animationDelay = 0 }) {
  const { t } = useLanguage();
  const { url, title, description, image_url, favicon_url, tags } = bookmark;

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
              <span key={tag} className="bm-tag">{tag}</span>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        className="bm-delete"
        onClick={() => onDelete(bookmark.id)}
        aria-label={`${t('deleteAriaLabel')}: ${title}`}
        title={t('deleteTitle')}
      >
        ×
      </button>
    </article>
  );
}
