const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
  addToWishlist,
  removeFromWishlist,
  getWishlist
} = require('../controllers/wishlistController');

const router = express.Router();

router.post('/add', authenticate, addToWishlist);
router.delete('/remove', authenticate, removeFromWishlist);
router.get('/', authenticate, getWishlist);

module.exports = router;
