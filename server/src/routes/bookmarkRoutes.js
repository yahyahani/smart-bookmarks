const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/authMiddleware');
const { getAll, create, update, remove } = require('../controllers/bookmarkController');

// Alle routes hieronder vereisen een geldig token.
// requireAuth wordt eerst uitgevoerd; alleen als die `next()` aanroept,
// komt de request bij de eigenlijke controller-functie terecht.
router.use(requireAuth);

router.get('/', getAll);
router.post('/', create);
router.patch('/:id', update);
router.delete('/:id', remove);

module.exports = router;
