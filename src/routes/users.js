'use strict';
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const {
  getProfile, updateProfile, getAllUsers, getMenteeDashboard, getMentorDashboard, updateUserByOrganizer,
} = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'photo-' + unique + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|webp)$/i)) {
      return cb(new Error('Only image files (jpg, jpeg, png, webp) are allowed'), false);
    }
    cb(null, true);
  },
});

router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, upload.single('photo'), updateProfile);
router.get('/', authenticate, authorize('organizer'), getAllUsers);
router.put('/:id', authenticate, authorize('organizer'), upload.single('photo'), updateUserByOrganizer);
router.get('/mentee/dashboard', authenticate, authorize('mentee'), getMenteeDashboard);
router.get('/mentor/dashboard', authenticate, authorize('mentor'), getMentorDashboard);

module.exports = router;
