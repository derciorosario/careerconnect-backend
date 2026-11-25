require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
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

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected...');

    // Sync models (schema changes handled by migrations)
    await sequelize.sync();
    console.log('Models synced...');

    app.listen(PORT, () => {
      console.log(`Career Connect API running on http://localhost:${PORT}`);
    });
  } catch (e) {
    console.error('Failed to start:', e);
    process.exit(1);
  }
})();

module.exports = app;
