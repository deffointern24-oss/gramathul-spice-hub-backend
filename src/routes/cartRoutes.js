const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
  addToCart,
  updateQuantity,
  removeItem,
  getCart
} = require('../controllers/cartController');

const router = express.Router();

router.post('/add', authenticate, addToCart);
router.put('/update', authenticate, updateQuantity);
router.delete('/remove/:productId',  authenticate, removeItem);
router.get('/', authenticate, getCart);

module.exports = router;