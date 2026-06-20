const pool = require('../db');

async function getCollectionsByUser(userId) {
  const result = await pool.query(
    `SELECT c.*, COUNT(bc.bookmark_id)::int AS bookmark_count
     FROM collections c
     LEFT JOIN bookmark_collections bc ON bc.collection_id = c.id
     WHERE c.user_id = $1
     GROUP BY c.id
     ORDER BY c.created_at ASC`,
    [userId]
  );
  return result.rows;
}

async function getCollectionById(id, userId) {
  const result = await pool.query(
    'SELECT * FROM collections WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  return result.rows[0];
}

async function createCollection(userId, name, color) {
  const result = await pool.query(
    'INSERT INTO collections (user_id, name, color) VALUES ($1, $2, $3) RETURNING *',
    [userId, name, color || '#e8694a']
  );
  return result.rows[0];
}

async function updateCollection(id, userId, data) {
  const { name, color } = data;
  const result = await pool.query(
    `UPDATE collections
     SET name = COALESCE($1, name),
         color = COALESCE($2, color)
     WHERE id = $3 AND user_id = $4
     RETURNING *`,
    [name, color, id, userId]
  );
  return result.rows[0];
}

async function deleteCollection(id, userId) {
  const result = await pool.query(
    'DELETE FROM collections WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, userId]
  );
  return result.rows[0];
}

// Koppelt een bookmark aan een collectie. ON CONFLICT DO NOTHING zorgt
// dat dubbel toevoegen geen foutmelding geeft (de samengestelde primary
// key zou anders een unique-violation gooien).
async function addBookmarkToCollection(bookmarkId, collectionId) {
  await pool.query(
    `INSERT INTO bookmark_collections (bookmark_id, collection_id)
     VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [bookmarkId, collectionId]
  );
}

async function removeBookmarkFromCollection(bookmarkId, collectionId) {
  await pool.query(
    'DELETE FROM bookmark_collections WHERE bookmark_id = $1 AND collection_id = $2',
    [bookmarkId, collectionId]
  );
}

// Geeft de collectie-ID's terug waar een specifieke bookmark in zit
async function getCollectionIdsForBookmark(bookmarkId) {
  const result = await pool.query(
    'SELECT collection_id FROM bookmark_collections WHERE bookmark_id = $1',
    [bookmarkId]
  );
  return result.rows.map((row) => row.collection_id);
}

module.exports = {
  getCollectionsByUser,
  getCollectionById,
  createCollection,
  updateCollection,
  deleteCollection,
  addBookmarkToCollection,
  removeBookmarkFromCollection,
  getCollectionIdsForBookmark,
};
