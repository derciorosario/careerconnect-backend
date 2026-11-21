'use strict';
const express = require('express');
const router = express.Router();
const { getEvent, configureEvent, getProgram } = require('../controllers/eventController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', getEvent);
router.get('/program', getProgram);
router.put('/configure', authenticate, authorize('organizer'), configureEvent);

module.exports = router;
