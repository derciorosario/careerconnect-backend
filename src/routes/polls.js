'use strict';
const express = require('express');
const router = express.Router();
const { getPolls, createPoll, votePoll, getPollResults } = require('../controllers/pollController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, getPolls);
router.post('/', authenticate, authorize('organizer'), createPoll);
router.post('/vote', authenticate, votePoll);
router.get('/results', authenticate, getPollResults);

module.exports = router;
