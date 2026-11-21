'use strict';
const express = require('express');
const router = express.Router();
const { getBadges, awardBadge } = require('../controllers/badgeController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, getBadges);
router.post('/', authenticate, authorize('organizer'), awardBadge);

module.exports = router;
