'use strict';
const express = require('express');
const router = express.Router();
const { getConnections, ensureConnection } = require('../controllers/connectionController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, getConnections);
router.post('/', authenticate, ensureConnection);

module.exports = router;