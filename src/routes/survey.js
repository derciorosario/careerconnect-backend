'use strict';
const express = require('express');
const router = express.Router();
const { submitSurvey, getSurveyResults, getQuestionnaire, updateQuestionnaire } = require('../controllers/surveyController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/', authenticate, submitSurvey);
router.get('/', authenticate, getSurveyResults);
router.get('/questionnaire', authenticate, getQuestionnaire);
router.put('/questionnaire', authenticate, authorize('organizer'), updateQuestionnaire);

module.exports = router;
