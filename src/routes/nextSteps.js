'use strict';
const express = require('express');
const router = express.Router();
const { createNextStep, getMyNextStep } = require('../controllers/nextStepController');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, createNextStep);
router.get('/my', authenticate, getMyNextStep);

module.exports = router;
