const {
  getCollectionsByUser,
  getCollectionById,
  createCollection,
  updateCollection,
  deleteCollection,
  addBookmarkToCollection,
  removeBookmarkFromCollection,
} = require('../models/collectionModel');
const { getBookmarkById } = require('../models/bookmarkModel');

// GET /api/collections
async function getAll(req, res) {
  try {
    const collections = await getCollectionsByUser(req.userId);
    res.json(collections);
  } catch (err) {
    console.error('Fout bij ophalen collecties:', err);
    res.status(500).json({ error: 'Kon collecties niet ophalen' });
  }
}

// POST /api/collections  body: { name, color? }
async function create(req, res) {
  try {
    const { name, color } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Naam is verplicht' });
    }
    const collection = await createCollection(req.userId, name.trim(), color);
    res.status(201).json(collection);
  } catch (err) {
    console.error('Fout bij aanmaken collectie:', err);
    res.status(500).json({ error: 'Kon collectie niet aanmaken' });
  }
}

// PATCH /api/collections/:id  body: { name?, color? }
async function update(req, res) {
  try {
    const { id } = req.params;
    const existing = await getCollectionById(id, req.userId);
    if (!existing) {
      return res.status(404).json({ error: 'Collectie niet gevonden' });
    }
    const updated = await updateCollection(id, req.userId, req.body);
    res.json(updated);
  } catch (err) {
    console.error('Fout bij bijwerken collectie:', err);
    res.status(500).json({ error: 'Kon collectie niet bijwerken' });
  }
}

// DELETE /api/collections/:id
async function remove(req, res) {
  try {
    const { id } = req.params;
    const deleted = await deleteCollection(id, req.userId);
    if (!deleted) {
      return res.status(404).json({ error: 'Collectie niet gevonden' });
    }
    res.json({ message: 'Collectie verwijderd', id: deleted.id });
  } catch (err) {
    console.error('Fout bij verwijderen collectie:', err);
    res.status(500).json({ error: 'Kon collectie niet verwijderen' });
  }
}

// POST /api/collections/:id/bookmarks/:bookmarkId
// Voegt een bookmark toe aan een collectie. We checken expliciet of zowel
// de collectie als de bookmark bij deze gebruiker horen, zodat niemand een
// bookmark in iemand anders' collectie kan zetten (of omgekeerd).
async function addBookmark(req, res) {
  try {
    const { id, bookmarkId } = req.params;
    const collection = await getCollectionById(id, req.userId);
    const bookmark = await getBookmarkById(bookmarkId, req.userId);
    if (!collection || !bookmark) {
      return res.status(404).json({ error: 'Collectie of bookmark niet gevonden' });
    }
    await addBookmarkToCollection(bookmarkId, id);
    res.status(201).json({ message: 'Toegevoegd aan collectie' });
  } catch (err) {
    console.error('Fout bij toevoegen aan collectie:', err);
    res.status(500).json({ error: 'Kon bookmark niet toevoegen aan collectie' });
  }
}

// DELETE /api/collections/:id/bookmarks/:bookmarkId
async function removeBookmark(req, res) {
  try {
    const { id, bookmarkId } = req.params;
    const collection = await getCollectionById(id, req.userId);
    if (!collection) {
      return res.status(404).json({ error: 'Collectie niet gevonden' });
    }
    await removeBookmarkFromCollection(bookmarkId, id);
    res.json({ message: 'Verwijderd uit collectie' });
  } catch (err) {
    console.error('Fout bij verwijderen uit collectie:', err);
    res.status(500).json({ error: 'Kon bookmark niet verwijderen uit collectie' });
  }
}

module.exports = { getAll, create, update, remove, addBookmark, removeBookmark };
