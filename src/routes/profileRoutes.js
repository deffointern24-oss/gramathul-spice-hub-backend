const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
  getProfile,
  editProfile,
  changePassword
} = require('../controllers/profileController');

const router = express.Router();

router.get('/', authenticate, getProfile);
router.put('/edit', authenticate, editProfile);
router.put('/change-password', authenticate, changePassword);

module.exports = router;
