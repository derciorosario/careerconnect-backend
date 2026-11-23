'use strict';
const express = require('express');
const router = express.Router();
const {
  getRounds, advanceRound, pauseRound, resumeRound, getCurrentRound, resetRounds,
  createRound, updateRound, deleteRound,
} = require('../controllers/roundController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, getRounds);
router.post('/', authenticate, authorize('organizer'), createRound);
router.put('/:id', authenticate, authorize('organizer'), updateRound);
router.delete('/:id', authenticate, authorize('organizer'), deleteRound);
router.post('/advance', authenticate, authorize('organizer'), advanceRound);
router.post('/pause', authenticate, authorize('organizer'), pauseRound);
router.post('/resume', authenticate, authorize('organizer'), resumeRound);
router.get('/current', authenticate, getCurrentRound);
router.post('/reset', authenticate, authorize('organizer'), resetRounds);

module.exports = router;
