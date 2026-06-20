import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

export default function CollectionsSidebar({
  collections,
  activeCollectionId,
  onSelectCollection,
  onCreateCollection,
  onDeleteRequest,
}) {
  const { t } = useLanguage();
  const [newName, setNewName] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    onCreateCollection(newName.trim());
    setNewName('');
  }

  return (
    <aside className="collections-sidebar">
      <h2 className="collections-title">{t('collectionsTitle')}</h2>

      <button
        type="button"
        className={`collection-item ${activeCollectionId === null ? 'collection-item-active' : ''}`}
        onClick={() => onSelectCollection(null)}
      >
        <span className="collection-dot collection-dot-all" aria-hidden="true" />
        {t('allBookmarksLabel')}
      </button>

      {collections.length === 0 ? (
        <p className="collections-empty">{t('noCollectionsYet')}</p>
      ) : (
        collections.map((collection) => (
          <div key={collection.id} className="collection-row">
            <button
              type="button"
              className={`collection-item ${activeCollectionId === collection.id ? 'collection-item-active' : ''}`}
              onClick={() => onSelectCollection(collection.id)}
            >
              <span
                className="collection-dot"
                style={{ background: collection.color }}
                aria-hidden="true"
              />
              <span className="collection-name">{collection.name}</span>
              <span className="collection-count">{collection.bookmark_count}</span>
            </button>
            <button
              type="button"
              className="collection-delete"
              onClick={() => onDeleteRequest(collection)}
              aria-label={`${t('deleteCollectionTitle')}: ${collection.name}`}
              title={t('deleteCollectionTitle')}
            >
              ×
            </button>
          </div>
        ))
      )}

      <form className="collection-add-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={t('newCollectionPlaceholder')}
        />
        <button type="submit" className="btn-ghost">
          {t('addCollectionButton')}
        </button>
      </form>
    </aside>
  );
}
