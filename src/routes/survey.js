'use strict';
const express = require('express');
const router = express.Router();
const { submitSurvey, getSurveyResults } = require('../controllers/surveyController');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, submitSurvey);
router.get('/', authenticate, getSurveyResults);

module.exports = router;
