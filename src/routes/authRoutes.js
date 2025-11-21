const express = require('express');
const { signup, login } = require('../controllers/authController');
const router = express.Router();

router.post('/signup', signup); // Both Admin/User
router.post('/login', login);

module.exports = router;
