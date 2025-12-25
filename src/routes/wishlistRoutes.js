const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
  addToWishlist,
  removeFromWishlist,
  getWishlist,
  mergeWishlist
} = require('../controllers/wishlistController');

const router = express.Router();

router.post('/add', authenticate, addToWishlist);
router.delete('/remove/:productId', authenticate, removeFromWishlist);
router.get('/', authenticate, getWishlist);
router.post('/merge', authenticate, mergeWishlist);
module.exports = router;
