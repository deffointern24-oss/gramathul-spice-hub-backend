const express = require('express');
const { signup, login, googleSignup, resetPassword, forgotPassword } = require('../controllers/authController');
const router = express.Router();

router.post('/signup', signup); // Both Admin/User
router.post('/login', login);
router.post('/google', googleSignup);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
