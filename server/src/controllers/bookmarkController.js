const {
  getBookmarksByUser,
  getBookmarkById,
  createBookmark,
  updateBookmark,
  deleteBookmark,
} = require('../models/bookmarkModel');
const { scrapeMetadata } = require('../utils/scraper');
const { isPlausibleUrl, sanitizeTags } = require('../utils/validation');

// GET /api/bookmarks?search=...&tag=...&collection=...
async function getAll(req, res) {
  try {
    const { search, tag, collection } = req.query;
    const bookmarks = await getBookmarksByUser(req.userId, {
      search,
      tag,
      collectionId: collection,
    });
    res.json(bookmarks);
  } catch (err) {
    console.error('Fout bij ophalen bookmarks:', err);
    res.status(500).json({ error: 'Kon bookmarks niet ophalen' });
  }
}

// POST /api/bookmarks  body: { url, tags? }
async function create(req, res) {
  try {
    const { url, tags } = req.body;

    if (!url || !url.trim()) {
      return res.status(400).json({ error: 'URL is verplicht' });
    }
    if (!isPlausibleUrl(url)) {
      return res.status(400).json({ error: 'Dit lijkt geen geldige URL te zijn' });
    }

    const cleanTags = sanitizeTags(tags);

    let metadata;
    try {
      metadata = await scrapeMetadata(url);
    } catch (scrapeErr) {
      console.error('Scraping mislukt:', scrapeErr.message);
      // Scraping mislukt? Dan slaan we de bookmark toch op, maar met alleen de URL.
      // Beter een bookmark zonder mooie preview, dan helemaal geen bookmark.
      // We voegen wel een https:// toe als de gebruiker dat zelf niet deed,
      // zodat de link in de UI altijd klikbaar is.
      const fallbackUrl = /^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`;
      metadata = { url: fallbackUrl, title: fallbackUrl, description: null, imageUrl: null, faviconUrl: null };
    }

    const bookmark = await createBookmark(req.userId, {
      ...metadata,
      tags: cleanTags,
    });

    res.status(201).json(bookmark);
  } catch (err) {
    console.error('Fout bij aanmaken bookmark:', err);
    res.status(500).json({ error: 'Kon bookmark niet aanmaken' });
  }
}

// PATCH /api/bookmarks/:id  body: { title?, tags? }
async function update(req, res) {
  try {
    const { id } = req.params;
    const { title, tags } = req.body;

    if (title !== undefined && (!title.trim() || title.length > 500)) {
      return res.status(400).json({ error: 'Titel moet tussen 1 en 500 tekens zijn' });
    }

    const existing = await getBookmarkById(id, req.userId);
    if (!existing) {
      return res.status(404).json({ error: 'Bookmark niet gevonden' });
    }

    const cleanTags = tags !== undefined ? sanitizeTags(tags) : undefined;
    const updated = await updateBookmark(id, req.userId, {
      title: title?.trim(),
      tags: cleanTags,
    });
    res.json(updated);
  } catch (err) {
    console.error('Fout bij bijwerken bookmark:', err);
    res.status(500).json({ error: 'Kon bookmark niet bijwerken' });
  }
}

// DELETE /api/bookmarks/:id
async function remove(req, res) {
  try {
    const { id } = req.params;
    const deleted = await deleteBookmark(id, req.userId);

    if (!deleted) {
      return res.status(404).json({ error: 'Bookmark niet gevonden' });
    }

    res.json({ message: 'Bookmark verwijderd', id: deleted.id });
  } catch (err) {
    console.error('Fout bij verwijderen bookmark:', err);
    res.status(500).json({ error: 'Kon bookmark niet verwijderen' });
  }
}

module.exports = { getAll, create, update, remove };
