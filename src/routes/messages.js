'use strict';
const express = require('express');
const router = express.Router();
const { getMessages, sendMessage } = require('../controllers/messageController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, getMessages);
router.post('/', authenticate, sendMessage);

module.exports = router;
