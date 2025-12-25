const express = require('express');
const { sendGmail } = require('../controllers/gmailController');

const router = express.Router();

router.post('/subscribe', sendGmail);

module.exports = router;