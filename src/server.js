require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path')
const fs=require('fs');
const { CronJob } = require('cron');
const { backupFolders, restoreFolders } = require('../backup-and-restore');
const { sequelize } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'career-connect-backend', version: process.env.APP_VERSION || '1.0.0' });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/events', require('./routes/events'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/registrations', require('./routes/registrations'));
app.use('/api/rounds', require('./routes/rounds'));
app.use('/api/matches', require('./routes/matches'));
app.use('/api/mentors', require('./routes/mentors'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/connections', require('./routes/connections'));
app.use('/api/mentorship-requests', require('./routes/mentorshipRequests'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/questions', require('./routes/questions'));
app.use('/api/polls', require('./routes/polls'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/survey', require('./routes/survey'));
app.use('/api/registration-config', require('./routes/registrationConfig'));
app.use('/api/landing', require('./routes/landing'));
app.use('/api/next-steps', require('./routes/nextSteps'));
app.use('/api/badges', require('./routes/badges'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/organizer', require('./routes/organizer'));
app.use('/api/tv', require('./routes/tv'));

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: err.message || 'Internal server error' });
});



let backupAndRestoreFolder=path.join(__dirname,'../career-connect-backup-folder')
let upload_file_path=path.join(__dirname,'/uploads')
let defaultFolders=[
  upload_file_path,
  backupAndRestoreFolder
]


function createDefaultFolders(){
     defaultFolders.forEach(i=>{
        if (!fs.existsSync(i)) {
          fs.mkdirSync(i, { recursive: true });
          console.log(`Folder created at ${i}`)
        } else {
          console.log(`Folder already exists at ${i}`)
        }
     })
}

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected...');

    // Sync models (schema changes handled by migrations)
    await sequelize.sync();
    console.log('Models synced...');


    createDefaultFolders()

    // Restore folders from the backup location on startup.
    restoreFolders();

    // Scheduled backup of the uploads folder (runs every hour at :00 and :55 UTC).
    const BackUpJob = new CronJob('*/55 * * * *', () => {
      console.log('Running backup...');
      backupFolders();
    }, null, true, 'UTC');
    BackUpJob.start();

    app.listen(PORT, () => {
      console.log(`Career Connect API running on http://localhost:${PORT}`);
    });
  } catch (e) {
    console.error('Failed to start:', e);
    process.exit(1);
  }
})();

module.exports = app;
