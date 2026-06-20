import { useState, useEffect, useCallback } from 'react';
import { bookmarksApi, collectionsApi } from '../api/client';
import BookmarkCard from '../components/BookmarkCard';
import SkeletonCard from '../components/SkeletonCard';
import LanguageSwitcher from '../components/LanguageSwitcher';
import ThemeToggle from '../components/ThemeToggle';
import ConfirmDialog from '../components/ConfirmDialog';
import CollectionsSidebar from '../components/CollectionsSidebar';
import { useLanguage } from '../i18n/LanguageContext';

export default function DashboardPage({ user, onLogout }) {
  const { t } = useLanguage();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [newUrl, setNewUrl] = useState('');
  const [newTags, setNewTags] = useState('');
  const [adding, setAdding] = useState(false);

  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState(null);
  const [sortBy, setSortBy] = useState('newest');
  const [activeCollectionId, setActiveCollectionId] = useState(null);

  const [collections, setCollections] = useState([]);
  const [pendingDeleteCollection, setPendingDeleteCollection] = useState(null);

  // De bookmark waarvoor net op het verwijder-kruisje is geklikt,
  // in afwachting van bevestiging. null = geen dialoog open.
  const [pendingDelete, setPendingDelete] = useState(null);

  // Bulk-selectiemodus: een Set van geselecteerde bookmark-ID's.
  // Een Set in plaats van een array, omdat we vooral checken of een
  // ID erin staat (O(1) in plaats van O(n) bij elke render).
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [pendingBulkDelete, setPendingBulkDelete] = useState(false);

  const loadBookmarks = useCallback(async (searchTerm = '', tag = null, collectionId = null) => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (tag) params.tag = tag;
      if (collectionId) params.collection = collectionId;
      const data = await bookmarksApi.getAll(params);
      setBookmarks(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCollections = useCallback(async () => {
    try {
      const data = await collectionsApi.getAll();
      setCollections(data);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    loadCollections();
  }, [loadCollections]);

  useEffect(() => {
    loadBookmarks(search, activeTag, activeCollectionId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounce: wacht 400ms na de laatste toets voordat we zoeken,
  // zodat we niet bij elke letter een nieuwe request versturen.
  useEffect(() => {
    const timeout = setTimeout(
      () => loadBookmarks(search, activeTag, activeCollectionId),
      400
    );
    return () => clearTimeout(timeout);
  }, [search, activeTag, activeCollectionId, loadBookmarks]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!newUrl.trim()) return;

    setAdding(true);
    setError(null);
    try {
      const tags = newTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      const bookmark = await bookmarksApi.create(newUrl.trim(), tags);
      setBookmarks((prev) => [bookmark, ...prev]);
      setNewUrl('');
      setNewTags('');
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  }

  async function handleSaveEdit(id, data) {
    try {
      const updated = await bookmarksApi.update(id, data);
      setBookmarks((prev) => prev.map((b) => (b.id === id ? updated : b)));
    } catch (err) {
      setError(err.message);
      throw err; // zodat BookmarkCard de edit-modus niet sluit bij een fout
    }
  }

  function handleDeleteRequest(bookmark) {
    setPendingDelete(bookmark);
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    try {
      await bookmarksApi.remove(pendingDelete.id);
      setBookmarks((prev) => prev.filter((b) => b.id !== pendingDelete.id));
    } catch (err) {
      setError(err.message);
    } finally {
      setPendingDelete(null);
    }
  }

  function handleTagClick(tag) {
    setActiveTag((prev) => (prev === tag ? null : tag));
  }

  function toggleSelectMode() {
    setSelectMode((prev) => !prev);
    setSelectedIds(new Set()); // start altijd schoon, of we nu in- of uitgaan
  }

  function toggleSelected(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleSelectAll() {
    if (selectedIds.size === sortedBookmarks.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedBookmarks.map((b) => b.id)));
    }
  }

  async function handleBulkDelete() {
    try {
      // We sturen de verwijder-requests parallel, niet één voor één na elkaar,
      // zodat het bij veel geselecteerde bookmarks niet merkbaar trager aanvoelt.
      await Promise.all([...selectedIds].map((id) => bookmarksApi.remove(id)));
      setBookmarks((prev) => prev.filter((b) => !selectedIds.has(b.id)));
      setSelectedIds(new Set());
      setSelectMode(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setPendingBulkDelete(false);
    }
  }

  async function handleBulkAddTag() {
    const tag = window.prompt(t('bulkAddTagPrompt'));
    const trimmed = tag?.trim();
    if (!trimmed) return;

    try {
      const updates = await Promise.all(
        [...selectedIds].map(async (id) => {
          const bookmark = bookmarks.find((b) => b.id === id);
          const existingTags = bookmark?.tags || [];
          if (existingTags.includes(trimmed)) return bookmark; // niet dubbel toevoegen
          return bookmarksApi.update(id, { tags: [...existingTags, trimmed] });
        })
      );
      setBookmarks((prev) =>
        prev.map((b) => updates.find((u) => u.id === b.id) || b)
      );
    } catch (err) {
      setError(err.message);
    }
  }

  function handleSelectCollection(collectionId) {
    setActiveCollectionId(collectionId);
  }

  async function handleCreateCollection(name) {
    try {
      const collection = await collectionsApi.create(name);
      setCollections((prev) => [...prev, { ...collection, bookmark_count: 0 }]);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleConfirmDeleteCollection() {
    if (!pendingDeleteCollection) return;
    try {
      await collectionsApi.remove(pendingDeleteCollection.id);
      setCollections((prev) => prev.filter((c) => c.id !== pendingDeleteCollection.id));
      // Was deze collectie actief geselecteerd? Dan terug naar "alle bookmarks".
      if (activeCollectionId === pendingDeleteCollection.id) {
        setActiveCollectionId(null);
        loadBookmarks(search, activeTag, null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setPendingDeleteCollection(null);
    }
  }

  // Voegt een bookmark toe aan een collectie, of verwijdert hem erui,
  // afhankelijk van de huidige staat (toggle-gedrag). Werkt de lokale
  // bookmark-state direct bij, zodat de checkbox in de UI meteen klopt
  // zonder een volledige herlaad-cyclus.
  async function handleToggleCollection(bookmark, collectionId) {
    const isInCollection = (bookmark.collection_ids || []).includes(collectionId);
    try {
      if (isInCollection) {
        await collectionsApi.removeBookmark(collectionId, bookmark.id);
      } else {
        await collectionsApi.addBookmark(collectionId, bookmark.id);
      }
      setBookmarks((prev) =>
        prev.map((b) => {
          if (b.id !== bookmark.id) return b;
          const ids = b.collection_ids || [];
          return {
            ...b,
            collection_ids: isInCollection
              ? ids.filter((id) => id !== collectionId)
              : [...ids, collectionId],
          };
        })
      );
      // Houd de bookmark-tellers in de zijbalk in sync
      setCollections((prev) =>
        prev.map((c) =>
          c.id === collectionId
            ? { ...c, bookmark_count: c.bookmark_count + (isInCollection ? -1 : 1) }
            : c
        )
      );
    } catch (err) {
      setError(err.message);
    }
  }

  // Sorteren gebeurt client-side op de al-geladen lijst — geen nieuwe
  // API-call nodig, want we hebben de data al in de browser.
  const sortedBookmarks = [...bookmarks].sort((a, b) => {
    switch (sortBy) {
      case 'oldest':
        return new Date(a.created_at) - new Date(b.created_at);
      case 'title-az':
        return a.title.localeCompare(b.title);
      case 'title-za':
        return b.title.localeCompare(a.title);
      case 'newest':
      default:
        return new Date(b.created_at) - new Date(a.created_at);
    }
  });

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <p className="dashboard-eyebrow">{t('dashboardEyebrow')}</p>
          <h1 className="dashboard-title">{t('dashboardTitle')}</h1>
        </div>
        <div className="dashboard-user">
          <ThemeToggle />
          <LanguageSwitcher />
          <span className="dashboard-user-email">{user.email}</span>
          <button type="button" className="btn-ghost" onClick={toggleSelectMode}>
            {selectMode ? t('selectModeExit') : t('selectModeToggle')}
          </button>
          <button type="button" className="btn-ghost" onClick={onLogout}>
            {t('logoutButton')}
          </button>
        </div>
      </header>

      <div className="dashboard-layout">
        <CollectionsSidebar
          collections={collections}
          activeCollectionId={activeCollectionId}
          onSelectCollection={handleSelectCollection}
          onCreateCollection={handleCreateCollection}
          onDeleteRequest={setPendingDeleteCollection}
        />

        <div className="dashboard-main">
          <form onSubmit={handleAdd} className="add-form">
            <input
              type="text"
              required
              placeholder={t('urlPlaceholder')}
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              className="add-url-input"
            />
            <input
              type="text"
              placeholder={t('tagsPlaceholder')}
              value={newTags}
              onChange={(e) => setNewTags(e.target.value)}
              className="add-tags-input"
            />
            <button type="submit" className="btn-primary" disabled={adding}>
              {adding ? t('savingButton') : t('saveButton')}
            </button>
          </form>

          <div className="search-row">
            <input
              type="search"
              placeholder={t('searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
            <label className="sort-select">
              <span className="sr-only">{t('sortLabel')}</span>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="newest">{t('sortNewest')}</option>
                <option value="oldest">{t('sortOldest')}</option>
                <option value="title-az">{t('sortTitleAZ')}</option>
                <option value="title-za">{t('sortTitleZA')}</option>
              </select>
            </label>
            {activeTag && (
              <button type="button" className="active-tag-chip" onClick={() => setActiveTag(null)}>
                {t('activeTagPrefix')} {activeTag} <span aria-hidden="true">×</span>
              </button>
            )}
          </div>

          {error && <p className="dashboard-error">{error}</p>}

          {selectMode && (
            <div className="bulk-bar">
              <label className="bulk-select-all">
                <input
                  type="checkbox"
                  checked={sortedBookmarks.length > 0 && selectedIds.size === sortedBookmarks.length}
                  onChange={handleSelectAll}
                />
                {t('selectAllLabel')}
              </label>
              <span className="bulk-count">{t('selectedCount', { count: selectedIds.size })}</span>
              <div className="bulk-actions">
                <button
                  type="button"
                  className="btn-ghost"
                  disabled={selectedIds.size === 0}
                  onClick={handleBulkAddTag}
                >
                  {t('bulkAddTagButton')}
                </button>
                <button
                  type="button"
                  className="btn-danger"
                  disabled={selectedIds.size === 0}
                  onClick={() => setPendingBulkDelete(true)}
                >
                  {t('bulkDeleteButton')}
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="bm-grid" aria-busy="true" aria-label={t('loadingBookmarks')}>
              {[0, 1, 2].map((i) => (
                <SkeletonCard key={i} animationDelay={i * 60} />
              ))}
            </div>
          ) : bookmarks.length === 0 ? (
            <div className="empty-state">
              <svg className="empty-state-icon" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
              </svg>
              <p>{t('emptyStateTitle')}</p>
              <p className="empty-state-sub">{t('emptyStateSubtitle')}</p>
            </div>
          ) : (
            <div className="bm-grid">
              {sortedBookmarks.map((bookmark, index) => (
                <BookmarkCard
                  key={bookmark.id}
                  bookmark={bookmark}
                  onDeleteRequest={handleDeleteRequest}
                  onSave={handleSaveEdit}
                  onTagClick={handleTagClick}
                  animationDelay={index * 40}
                  selectMode={selectMode}
                  isSelected={selectedIds.has(bookmark.id)}
                  onToggleSelected={() => toggleSelected(bookmark.id)}
                  collections={collections}
                  onToggleCollection={handleToggleCollection}
                />
              ))}
            </div>
          )}

          {pendingDelete && (
            <ConfirmDialog
              title={t('confirmDeleteTitle')}
              body={t('confirmDeleteBody')}
              confirmLabel={t('confirmDeleteConfirm')}
              onConfirm={handleConfirmDelete}
              onCancel={() => setPendingDelete(null)}
            />
          )}

          {pendingBulkDelete && (
            <ConfirmDialog
              title={t('bulkConfirmDeleteTitle', { count: selectedIds.size })}
              body={t('confirmDeleteBody')}
              confirmLabel={t('confirmDeleteConfirm')}
              onConfirm={handleBulkDelete}
              onCancel={() => setPendingBulkDelete(false)}
            />
          )}
        </div>
      </div>

      {pendingDeleteCollection && (
        <ConfirmDialog
          title={t('deleteCollectionTitle')}
          body={t('deleteCollectionBody')}
          confirmLabel={t('confirmDeleteConfirm')}
          onConfirm={handleConfirmDeleteCollection}
          onCancel={() => setPendingDeleteCollection(null)}
        />
      )}
    </div>
  );
}
