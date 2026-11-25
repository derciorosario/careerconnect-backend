'use strict';
const express = require('express');
const router = express.Router();
const { getRegistrationConfig, updateRegistrationConfig } = require('../controllers/registrationConfigController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', getRegistrationConfig);
router.put('/', authenticate, authorize('organizer'), updateRegistrationConfig);

module.exports = router;