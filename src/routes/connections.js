'use strict';
const express = require('express');
const router = express.Router();
const { getConnections } = require('../controllers/connectionController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, getConnections);

module.exports = router;
