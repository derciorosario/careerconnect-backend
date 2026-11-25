'use strict';
const express = require('express');
const router = express.Router();
const { getLanding, updateLanding } = require('../controllers/landingController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', getLanding);
router.put('/', authenticate, authorize('organizer'), updateLanding);

module.exports = router;