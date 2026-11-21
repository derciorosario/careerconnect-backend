'use strict';
const express = require('express');
const router = express.Router();
const { getTVData } = require('../controllers/tvController');

router.get('/', getTVData);

module.exports = router;
