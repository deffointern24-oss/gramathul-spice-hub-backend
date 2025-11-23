const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const ctrl = require('../controllers/productController');

const router = express.Router();

// Admin only
router.post('/', authenticate, authorize(['ADMIN']), upload.array('images'), ctrl.createProduct);
router.put('/:id', authenticate, authorize(['ADMIN']), upload.array('images'), ctrl.editProduct);
router.delete('/:id', authenticate, authorize(['ADMIN']), ctrl.deleteProduct);

// Public
router.get('/', ctrl.listProducts);
router.get('/:id', ctrl.productDetails);
router.get('/:id/image/:imgIndex', ctrl.serveProductImage);

module.exports = router;
