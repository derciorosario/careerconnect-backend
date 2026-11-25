'use strict';
const express = require('express');
const router = express.Router();
const {
  getEvent, configureEvent, getProgram,
  listEvents, createEvent, updateEvent, deleteEvent,
} = require('../controllers/eventController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', getEvent);
router.get('/all', authenticate, authorize('organizer'), listEvents);
router.get('/program', getProgram);
router.put('/configure', authenticate, authorize('organizer'), configureEvent);
router.post('/', authenticate, authorize('organizer'), createEvent);
router.put('/:id', authenticate, authorize('organizer'), updateEvent);
router.delete('/:id', authenticate, authorize('organizer'), deleteEvent);

module.exports = router;