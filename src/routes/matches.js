'use strict';
const express = require('express');
const router = express.Router();
const {
  getMyMatch, getMentorMatch, getAllMatches, generateMatches,
} = require('../controllers/matchController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/my', authenticate, authorize('mentee'), getMyMatch);
router.get('/mentor', authenticate, authorize('mentor'), getMentorMatch);
router.get('/', authenticate, authorize('organizer'), getAllMatches);
router.post('/generate', authenticate, authorize('organizer'), generateMatches);

module.exports = router;
