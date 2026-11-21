'use strict';
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/db');
const db = require('../models');

const { User, MentorProfile, MenteeProfile, Event, Session, Registration, Round } = db;

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected...');

    await sequelize.sync({ force: true });
    console.log('Models synchronized...');

    console.log('Seeding data...');

    const salt = await bcrypt.genSalt(10);

    // Create organizer
    const organizer = await User.create({
      name: 'Organizador Career Connect',
      email: 'organizador@careerconnect.co.mz',
      phone: '+258840000000',
      role: 'organizer',
      password_hash: await bcrypt.hash('Organizer123!', salt),
      password_salt: salt,
      emailVerified: true,
    });

    // Create a mentor
    const mentorUser = await User.create({
      name: 'Carlos Tembe',
      email: 'carlos@careerconnect.co.mz',
      phone: '+258841111111',
      role: 'mentor',
      password_hash: await bcrypt.hash('Mentor123!', salt),
      password_salt: salt,
      emailVerified: true,
    });
    await MentorProfile.create({
      user_id: mentorUser.id,
      job_title: 'Engenheiro de Software',
      company: 'TechSolutions',
      sector: 'Tecnologia e TI',
      years: 10,
      interests: ['Tecnologia e TI', 'Engenharia'],
      can_help_goals: ['Escolher a minha área', 'Desenvolver competências'],
      support_type: 'Mentor',
      max_mentees: 3,
      approval: 'approved',
    });

    // Create a mentee
    const menteeUser = await User.create({
      name: 'Ana Mondlane',
      email: 'ana@careerconnect.co.mz',
      phone: '+258842222222',
      role: 'mentee',
      password_hash: await bcrypt.hash('Mentee123!', salt),
      password_salt: salt,
      emailVerified: true,
    });
    await MenteeProfile.create({
      user_id: menteeUser.id,
      level: 'estudante',
      course: 'Engenharia Informática',
      institution: 'UEM',
      interests: ['Tecnologia e TI', 'Engenharia'],
      goal: 'Escolher a minha área',
      pitch: 'Estudante do último ano à procura de orientação de carreira.',
    });

    // Create event
    const event = await Event.create({
      name: 'Career Connect 2026',
      starts_at: new Date('2026-12-04T14:00:00+02:00'),
      ends_at: new Date('2026-12-04T17:00:00+02:00'),
      venue: 'Hotel Cardoso, Maputo',
      capacity: 120,
      status: 'active',
      round_minutes: 5,
      rounds_per_break: 4,
      warn_seconds: 30,
      tables_count: 10,
      match_weights: { areas: 45, goal: 20, sector: 10, want: 15, variety: 10 },
    });

    // Create sessions (masterclasses and breaks)
    await Session.create({
      event_id: event.id,
      order: 1,
      type: 'masterclass',
      title: 'Estratégias para encontrar o primeiro passo',
      starts_at: new Date('2026-12-04T14:00:00+02:00'),
    });
    await Session.create({
      event_id: event.id,
      order: 2,
      type: 'break',
      title: 'Intervalo 1 - Rondas de networking',
      starts_at: new Date('2026-12-04T15:00:00+02:00'),
    });
    await Session.create({
      event_id: event.id,
      order: 3,
      type: 'masterclass',
      title: 'A arte de criar redes de contactos',
      starts_at: new Date('2026-12-04T15:40:00+02:00'),
    });
    await Session.create({
      event_id: event.id,
      order: 4,
      type: 'break',
      title: 'Intervalo 2 - Rondas de networking',
      starts_at: new Date('2026-12-04T16:20:00+02:00'),
    });
    await Session.create({
      event_id: event.id,
      order: 5,
      type: 'masterclass',
      title: 'O próximo passo depois da contratação',
      starts_at: new Date('2026-12-04T17:00:00+02:00'),
    });

    // Create rounds (2 breaks × 4 rounds each)
    for (let b = 1; b <= 2; b++) {
      for (let r = 1; r <= 4; r++) {
        await Round.create({
          event_id: event.id,
          break_no: b,
          round_no: r,
          status: 'planned',
        });
      }
    }

    // Register organizer, mentor, mentee for event
    for (const user of [organizer, mentorUser, menteeUser]) {
      await Registration.create({
        event_id: event.id,
        user_id: user.id,
        ticket_code: 'CC-' + Math.random().toString(36).slice(2, 7).toUpperCase(),
        status: 'registered',
      });
    }

    console.log('Seed data created successfully.');
    console.log('Organizer: organizador@careerconnect.co.mz / Organizer123!');
    console.log('Mentor: carlos@careerconnect.co.mz / Mentor123!');
    console.log('Mentee: ana@careerconnect.co.mz / Mentee123!');

    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
})();
