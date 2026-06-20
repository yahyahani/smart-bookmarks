const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/authMiddleware');
const {
  getAll,
  create,
  update,
  remove,
  addBookmark,
  removeBookmark,
} = require('../controllers/collectionController');

// Net als bij de bookmarks: alle routes hier vereisen een geldig token.
router.use(requireAuth);

router.get('/', getAll);
router.post('/', create);
router.patch('/:id', update);
router.delete('/:id', remove);
router.post('/:id/bookmarks/:bookmarkId', addBookmark);
router.delete('/:id/bookmarks/:bookmarkId', removeBookmark);

module.exports = router;
