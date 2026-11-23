'use strict';
const express = require('express');
const router = express.Router();
const {
  registerForEvent, checkIn, walkIn, cancelCheckIn, getRegistrations, deleteRegistration,
} = require('../controllers/registrationController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/', authenticate, registerForEvent);
router.post('/checkin', authenticate, authorize('organizer'), checkIn);
router.post('/walkin', authenticate, authorize('organizer'), walkIn);
router.post('/cancel-checkin', authenticate, authorize('organizer'), cancelCheckIn);
router.delete('/:id', authenticate, authorize('organizer'), deleteRegistration);
router.get('/', authenticate, authorize('organizer'), getRegistrations);

module.exports = router;
