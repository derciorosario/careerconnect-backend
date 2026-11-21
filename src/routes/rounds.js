'use strict';
const express = require('express');
const router = express.Router();
const {
  getRounds, advanceRound, pauseRound, resumeRound, getCurrentRound,
} = require('../controllers/roundController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, getRounds);
router.post('/advance', authenticate, authorize('organizer'), advanceRound);
router.post('/pause', authenticate, authorize('organizer'), pauseRound);
router.post('/resume', authenticate, authorize('organizer'), resumeRound);
router.get('/current', authenticate, getCurrentRound);

module.exports = router;
