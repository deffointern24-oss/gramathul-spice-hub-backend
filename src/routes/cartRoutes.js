const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
  addToCart,
  updateQuantity,
  removeItem,
  getCart,
  mergeCart
} = require('../controllers/cartController');

const router = express.Router();

router.post('/add', authenticate, addToCart);
router.put('/update', authenticate, updateQuantity);
router.delete('/remove{/:productId}', authenticate, removeItem);
router.get('/', authenticate, getCart);
router.post('/merge', authenticate, mergeCart);

module.exports = router;