'use strict';
const express = require('express');
const router = express.Router();
const { getAnnouncements, createAnnouncement } = require('../controllers/announcementController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, getAnnouncements);
router.post('/', authenticate, authorize('organizer'), createAnnouncement);

module.exports = router;
