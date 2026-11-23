'use strict';
const express = require('express');
const router = express.Router();
const {
  getSessions, createSession, updateSession, deleteSession,
} = require('../controllers/sessionController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', getSessions);
router.post('/', authenticate, authorize('organizer'), createSession);
router.put('/:id', authenticate, authorize('organizer'), updateSession);
router.delete('/:id', authenticate, authorize('organizer'), deleteSession);

module.exports = router;