const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
  getProfile,
  editProfile,
  changePassword,
  deleteAccount
} = require('../controllers/profileController');

const router = express.Router();

router.get('/', authenticate, getProfile);
router.put('/edit', authenticate, editProfile);
router.put('/change-password', authenticate, changePassword);
router.post('/account-delete', authenticate, deleteAccount)

module.exports = router;
