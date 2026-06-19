const pool = require('../db');

// Alle bookmarks van een gebruiker, optioneel gefilterd op zoekterm en/of tag
async function getBookmarksByUser(userId, { search, tag } = {}) {
  let query = 'SELECT * FROM bookmarks WHERE user_id = $1';
  const params = [userId];

  if (search) {
    params.push(`%${search}%`);
    query += ` AND (title ILIKE $${params.length} OR description ILIKE $${params.length})`;
  }

  if (tag) {
    params.push(tag);
    query += ` AND $${params.length} = ANY(tags)`;
  }

  query += ' ORDER BY created_at DESC';

  const result = await pool.query(query, params);
  return result.rows;
}

// Eén specifieke bookmark ophalen, maar alleen als die bij deze user hoort
async function getBookmarkById(id, userId) {
  const result = await pool.query(
    'SELECT * FROM bookmarks WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  return result.rows[0];
}

async function createBookmark(userId, data) {
  const { url, title, description, imageUrl, faviconUrl, tags } = data;
  const result = await pool.query(
    `INSERT INTO bookmarks (user_id, url, title, description, image_url, favicon_url, tags)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [userId, url, title, description, imageUrl, faviconUrl, tags || []]
  );
  return result.rows[0];
}

// Update alleen de velden die zijn meegegeven (tags en/of title bijvoorbeeld)
async function updateBookmark(id, userId, data) {
  const { title, tags } = data;
  const result = await pool.query(
    `UPDATE bookmarks
     SET title = COALESCE($1, title),
         tags = COALESCE($2, tags)
     WHERE id = $3 AND user_id = $4
     RETURNING *`,
    [title, tags, id, userId]
  );
  return result.rows[0];
}

async function deleteBookmark(id, userId) {
  const result = await pool.query(
    'DELETE FROM bookmarks WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, userId]
  );
  return result.rows[0];
}

module.exports = {
  getBookmarksByUser,
  getBookmarkById,
  createBookmark,
  updateBookmark,
  deleteBookmark,
};
