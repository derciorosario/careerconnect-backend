'use strict';
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/db');
const db = require('../models');

const BASIC_SEED = false; // Set to false to seed everything

const {
  User, MentorProfile, MenteeProfile, Event, Session, Registration, Round,
  Speaker, Booking, Wish, Match, Feedback, Connection, MentorshipRequest,
  Message, Question, Poll, Announcement, Notification, SurveyResponse,
  NextStep, Badge, AuditLog, Questionnaire, RegistrationConfig, LandingConfig,
} = db;
const { DEFAULT_QUESTIONNAIRE } = require('../utils/questionnaireDefaults');
const { DEFAULT_REGISTRATION_CONFIG } = require('../utils/registrationDefaults');
const { DEFAULT_LANDING_CONFIG } = require('../utils/landingDefaults');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected...');

    await sequelize.sync({ force: true });
    console.log('Models synchronized...');

    console.log('Seeding data...');

    const salt = await bcrypt.genSalt(10);

    // ── USERS (always created, even in BASIC_SEED) ──────────────
    const organizer = await User.create({
      name: 'Organizador Career Connect',
      email: 'organizador@careerconnect.co.mz',
      phone: '+258840000000',
      role: 'organizer',
      password_hash: await bcrypt.hash('Organizer123!', salt),
      password_salt: salt,
      emailVerified: true,
    });

 
    


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
  job_title: 'Programador Web',
  company: 'TechSolutions',
  sector: 'Programação Web',
  years: 10,
  interests: ['Programação Web', 'Tecnologia (Redes e Hardware)'],
  can_help_goals: ['Escolher a minha área', 'Desenvolver competências'],
  support_type: 'Mentor',
  max_mentees: 3,
  approval: 'approved',
});

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
  interests: ['Programação Web', 'Tecnologia (Redes e Hardware)'],
  goal: 'Escolher a minha área',
  pitch: 'Estudante do último ano à procura de orientação de carreira.',
  job_obstacle: 'Falta de experiência',
});

// Additional mentors (always created)
const mentor2 = await User.create({
  name: 'Sara Cumbe',
  email: 'sara@careerconnect.co.mz',
  phone: '+258843333333',
  role: 'mentor',
  password_hash: await bcrypt.hash('Mentor123!', salt),
  password_salt: salt,
  emailVerified: true,
});

await MentorProfile.create({
  user_id: mentor2.id,
  job_title: 'Directora de Finanças',
  company: 'Standard Bank',
  sector: 'Contabilidade',
  years: 8,
  interests: ['Contabilidade', 'Recursos Humanos'],
  can_help_goals: ['Construir a minha marca pessoal', 'Desenvolver competências'],
  support_type: 'Mentor',
  max_mentees: 3,
  approval: 'approved',
});

const mentor3 = await User.create({
  name: 'Nuno Bila',
  email: 'nuno@careerconnect.co.mz',
  phone: '+258844444444',
  role: 'mentor',
  password_hash: await bcrypt.hash('Mentor123!', salt),
  password_salt: salt,
  emailVerified: true,
});

await MentorProfile.create({
  user_id: mentor3.id,
  job_title: 'Engenheiro de Software',
  company: 'Vodacom',
  sector: 'Programação Web',
  years: 6,
  interests: ['Programação Web', 'Tecnologia (Redes e Hardware)'],
  can_help_goals: ['Escolher a minha área', 'Desenvolver competências'],
  support_type: 'Coach',
  max_mentees: 3,
  approval: 'approved',
});

const mentor4 = await User.create({
  name: 'Ilda Mussa',
  email: 'ilda@careerconnect.co.mz',
  phone: '+258845555555',
  role: 'mentor',
  password_hash: await bcrypt.hash('Mentor123!', salt),
  password_salt: salt,
  emailVerified: true,
});

await MentorProfile.create({
  user_id: mentor4.id,
  job_title: 'Advogada',
  company: 'Mussa & Associados',
  sector: 'Relações Públicas e Marketing',
  years: 12,
  interests: ['Relações Públicas e Marketing', 'Contabilidade'],
  can_help_goals: ['Criar o meu negócio'],
  support_type: 'Orientação pontual',
  max_mentees: 2,
  approval: 'pending',
});

const mentor5 = await User.create({
  name: 'Rui Machava',
  email: 'rui@careerconnect.co.mz',
  phone: '+258846666666',
  role: 'mentor',
  password_hash: await bcrypt.hash('Mentor123!', salt),
  password_salt: salt,
  emailVerified: true,
});

await MentorProfile.create({
  user_id: mentor5.id,
  job_title: 'Director de RH',
  company: 'Vale Moçambique',
  sector: 'Recursos Humanos',
  years: 10,
  interests: ['Recursos Humanos', 'Secretariado'],
  can_help_goals: ['Escolher a minha área', 'Mudar de percurso'],
  support_type: 'Mentor',
  max_mentees: 4,
  approval: 'approved',
});

const mentor6 = await User.create({
  name: 'Lídia Zimba',
  email: 'lidia@careerconnect.co.mz',
  phone: '+258847777777',
  role: 'mentor',
  password_hash: await bcrypt.hash('Mentor123!', salt),
  password_salt: salt,
  emailVerified: true,
});

await MentorProfile.create({
  user_id: mentor6.id,
  job_title: 'Fundadora',
  company: 'Zimba Agro',
  sector: 'Marketing Digital',
  years: 7,
  interests: ['Marketing Digital', 'Relações Públicas e Marketing'],
  can_help_goals: ['Criar o meu negócio'],
  support_type: 'Coach',
  max_mentees: 3,
  approval: 'approved',
});

// Additional mentees (always created)
const mentee2 = await User.create({
  name: 'Bruno Chissano',
  email: 'bruno@careerconnect.co.mz',
  phone: '+258848888888',
  role: 'mentee',
  password_hash: await bcrypt.hash('Mentee123!', salt),
  password_salt: salt,
  emailVerified: true,
});

await MenteeProfile.create({
  user_id: mentee2.id,
  level: 'recem_graduado',
  course: 'Engenharia Informática',
  institution: 'ISCTEM',
  interests: ['Programação Web', 'Tecnologia (Redes e Hardware)'],
  goal: 'Preparar o primeiro estágio',
  pitch: 'Procuro orientação para o meu primeiro estágio.',
  job_obstacle: 'Falta de contactos',
});

const mentee3 = await User.create({
  name: 'Cláudia Nhantumbo',
  email: 'claudia@careerconnect.co.mz',
  phone: '+258849999999',
  role: 'mentee',
  password_hash: await bcrypt.hash('Mentee123!', salt),
  password_salt: salt,
  emailVerified: true,
});

await MenteeProfile.create({
  user_id: mentee3.id,
  level: 'Estudante',
  course: 'Direito',
  institution: 'UEM',
  interests: ['Relações Públicas e Marketing', 'Contabilidade'],
  goal: 'Construir a minha marca pessoal',
  pitch: 'Quero comunicar melhor o que sei fazer.',
  job_obstacle: 'Falta de formação',
});

const mentee4 = await User.create({
  name: 'Dino Matola',
  email: 'dino@careerconnect.co.mz',
  phone: '+258850000000',
  role: 'mentee',
  password_hash: await bcrypt.hash('Mentee123!', salt),
  password_salt: salt,
  emailVerified: true,
});

await MenteeProfile.create({
  user_id: mentee4.id,
  level: 'Estudante',
  course: 'Economia',
  institution: 'ISUTC',
  interests: ['Contabilidade', 'Marketing Digital'],
  goal: 'Desenvolver competências',
  pitch: 'Quero reforçar a análise de dados.',
  job_obstacle: 'Falta de experiência',
});

const mentee5 = await User.create({
  name: 'Elsa Macie',
  email: 'elsa@careerconnect.co.mz',
  phone: '+258851111111',
  role: 'mentee',
  password_hash: await bcrypt.hash('Mentee123!', salt),
  password_salt: salt,
  emailVerified: true,
});

await MenteeProfile.create({
  user_id: mentee5.id,
  level: 'Estudante',
  course: 'Agronomia',
  institution: 'UEM',
  interests: ['Marketing Digital', 'Recursos Humanos'],
  goal: 'Criar o meu negócio',
  pitch: 'Tenho uma ideia de negócio agrícola.',
  job_obstacle: 'Outro',
});

const mentee6 = await User.create({
  name: 'Fátima Sitoe',
  email: 'fatima@careerconnect.co.mz',
  phone: '+258852222222',
  role: 'mentee',
  password_hash: await bcrypt.hash('Mentee123!', salt),
  password_salt: salt,
  emailVerified: true,
});

await MenteeProfile.create({
  user_id: mentee6.id,
  level: 'recem_graduado',
  course: 'Marketing',
  institution: 'ISCIM',
  interests: ['Marketing Digital', 'Relações Públicas e Marketing'],
  goal: 'Mudar de percurso',
  pitch: 'Quero passar de vendas para marketing.',
  job_obstacle: 'Falta de contactos',
});


    




    // ── EVENT ──────────────────────────────────────────────
    const event = await Event.create({
      name: 'Career Connect 2026',
      starts_at: new Date('2026-12-04T14:00:00+02:00'),
      ends_at: new Date('2026-12-04T17:00:00+02:00'),
      venue: 'Hotel Cardoso, Maputo',
      capacity: 120,
      status: 'active',
      round_minutes: 10,
      rounds_per_break: 2,
      warn_seconds: 30,
      tables_count: 10,
      match_weights: { areas: 45, goal: 20, sector: 10, want: 15, variety: 10 },
    });

    // ── QUESTIONNAIRE (event evaluation form) ────────────────
    await Questionnaire.create({
      event_id: event.id,
      content: DEFAULT_QUESTIONNAIRE,
    });

    // ── REGISTRATION CONFIG (editable form options) ──────────
    await RegistrationConfig.create(DEFAULT_REGISTRATION_CONFIG);

    // ── LANDING PAGE CONFIG ──────────────────────────────────
    await LandingConfig.create({ content: DEFAULT_LANDING_CONFIG });

    // ── LANDING MASTERCLASS MENTORS (show_on_landing) ────────
    const landingMentors = [
      {
        name: 'Vicente Sitoe', email: 'vicente@careerconnect.co.mz', initials: 'VS',
        job_title: 'Director Geral da SDO Moçambique', company: 'SDO Moçambique', sector: 'Preparação para o Mercado de Trabalho',
        theme: 'Preparação para o Mercado de Trabalho',
        title: 'Da Formação para o Mercado de Trabalho: Estratégias para Encontrar o Primeiro Emprego',
        biography: 'Mestre em Psicologia e Pedagogia, com experiência em consultoria estratégica, gestão de recursos humanos e desenvolvimento organizacional. É autor de “RH com H de Humano” e de “Para uma Gestão de Pessoas Humanizada”.',
        works: 'Obras: Viagem, pelos trilhos da vida · Avaliação de Desempenho Automatizada, Guia Prático · Para uma Gestão de Pessoas Humanizada · Poemas para Boi Dormir · Ensaio sobre um Manifesto · RH com H de Humano',
      },
      {
        name: 'Arafat Cossa', email: 'arafat@careerconnect.co.mz', initials: 'AC',
        job_title: 'Director da Arafat Executive Academy', company: 'Arafat Executive Academy', sector: 'Posicionamento e Oportunidades',
        theme: 'Posicionamento e Oportunidades',
        title: 'A Arte do Networking: Como Transformar Conexões em Oportunidades de Carreira',
        biography: 'Formado em Comunicação e Relações Empresariais pelo ISCIM, é orador, formador, escritor e consultor. É autor de “Oratória: O Oxigénio das Relações de Influência”.',
        works: '',
      },
      {
        name: 'Marlene Chambule', email: 'marlene@careerconnect.co.mz', initials: 'MC',
        job_title: 'Directora Executiva da Salto Moçambique', company: 'Salto Moçambique', sector: 'Desenvolvimento e Crescimento na Carreira',
        theme: 'Desenvolvimento e Crescimento na Carreira',
        title: 'Fui Contratado. E Agora? Como Construir uma Carreira de Sucesso',
        biography: 'Licenciada em Ciências Políticas pela Universidade Eduardo Mondlane (UEM), construiu a sua carreira na Vale Moçambique e na Galp Moçambique. É fundadora da Salto Moçambique, dedicada à formação e à mentoria.',
        works: '',
      },
    ];

    const landingSessions = [];
    const breakSessions = [];
    for (let i = 0; i < landingMentors.length; i++) {
      const lm = landingMentors[i];
      const u = await User.create({
        name: lm.name,
        email: lm.email,
        phone: `+2588500000${i}`,
        role: 'mentor',
        password_hash: await bcrypt.hash('Mentor123!', salt),
        password_salt: salt,
        emailVerified: true,
      });
      await MentorProfile.create({
        user_id: u.id,
        job_title: lm.job_title,
        company: lm.company,
        sector: lm.sector,
        years: 8,
        interests: [lm.sector],
        can_help_goals: ['Desenvolver competências'],
        support_type: 'Mentor',
        max_mentees: 3,
        approval: 'approved',
        show_on_landing: true,
        initials: lm.initials,
        biography: lm.biography,
        works: lm.works,
      });
      const masterclassOrder = i * 2 + 1;
      const s = await Session.create({
        event_id: event.id,
        order: masterclassOrder,
        type: 'masterclass',
        title: lm.title,
        theme: lm.theme,
        mentor_id: u.id,
        starts_at: new Date('2026-12-04T14:00:00+02:00'),
      });
      landingSessions.push(s);

      if (i < landingMentors.length - 1) {
        const b = await Session.create({
          event_id: event.id,
          order: masterclassOrder + 1,
          type: 'break',
          title: `Intervalo ${i + 1} - Rondas de networking`,
          starts_at: new Date('2026-12-04T15:00:00+02:00'),
        });
        breakSessions.push(b);
      }
    }

    // ── ROUNDS (always created, all "planned" in BASIC_SEED) ──
    const rounds = [];
    for (let b = 1; b <= 2; b++) {
      for (let r = 1; r <= 2; r++) {
        const round = await Round.create({
          event_id: event.id,
          break_no: b,
          round_no: r,
          status: 'planned' // BASIC_SEED ? 'planned' : r <= 3 ? 'done' : 'planned',
        });
        rounds.push(round);
      }
    }

    if (!BASIC_SEED) {
      // ── SPEAKERS ────────────────────────────────────────────
      await Speaker.create({
        event_id: event.id,
        session_id: landingSessions[0].id,
        name: 'Carlos Tembe',
        role: 'Engenheiro de Software',
        company: 'TechSolutions',
        topic: 'Estratégias para encontrar o primeiro passo',
        bio: 'Engenheiro com 10 anos de experiência em desenvolvimento de software.',
        user_id: mentorUser.id,
      });
      await Speaker.create({
        event_id: event.id,
        session_id: landingSessions[1].id,
        name: 'Sara Cumbe',
        role: 'Directora de Finanças',
        company: 'Standard Bank',
        topic: 'A arte de criar redes de contactos',
        bio: 'Directora de Finanças com 8 anos de experiência no setor bancário.',
        user_id: mentor2.id,
      });
      await Speaker.create({
        event_id: event.id,
        session_id: landingSessions[2].id,
        name: 'Rui Machava',
        role: 'Director de RH',
        company: 'Vale Moçambique',
        topic: 'O próximo passo depois da contratação',
        bio: 'Director de Recursos Humanos com experiência em recrutamento e desenvolvimento de carreira.',
        user_id: mentor5.id,
      });

      // ── REGISTRATIONS ───────────────────────────────────────
      const allUsers = [organizer, mentorUser, menteeUser, mentor2, mentor3, mentor4, mentor5, mentor6, mentee2, mentee3, mentee4, mentee5, mentee6];
      for (const user of allUsers) {
        await Registration.create({
          event_id: event.id,
          user_id: user.id,
          ticket_code: 'CC-' + Math.random().toString(36).slice(2, 7).toUpperCase(),
          status: 'registered',
        });
      }

      // ── BOOKINGS (mentees booking sessions) ─────────────────
      const mentees = [menteeUser, mentee2, mentee3, mentee4, mentee5, mentee6];
      const masterclassSessions = landingSessions;
      for (const mentee of mentees) {
        for (const session of masterclassSessions) {
          await Booking.create({
            user_id: mentee.id,
            session_id: session.id,
          });
        }
      }

      // ── WISHES (mentees wishing for mentors) ────────────────
      const mentors = [mentorUser, mentor2, mentor3, mentor5, mentor6];
      for (const mentee of mentees) {
        const numWishes = Math.min(3, mentors.length);
        for (let i = 0; i < numWishes; i++) {
          const mentor = mentors[i % mentors.length];
          await Wish.create({
            mentee_id: mentee.id,
            mentor_id: mentor.id,
            event_id: event.id,
          });
        }
      }

      // ── MATCHES (round matches) ─────────────────────────────
      for (let i = 0; i < rounds.length; i++) {
        const round = rounds[i];
        if (round.status === 'done') {
          for (let j = 0; j < mentees.length; j++) {
            const mentee = mentees[j];
            const mentor = mentors[j % mentors.length];
            await Match.create({
              round_id: round.id,
              table_no: (j % 10) + 1,
              mentor_id: mentor.id,
              mentee_ids: [mentee.id],
              score: Math.floor(Math.random() * 40) + 60,
            });
          }
        }
      }

      // ── FEEDBACK (after completed matches) ──────────────────
      const completedRounds = rounds.filter((r) => r.status === 'done');
      const matches = [];
      for (const round of completedRounds) {
        const roundMatches = await Match.findAll({ where: { round_id: round.id } });
        matches.push(...roundMatches);
      }
      for (const match of matches) {
        await Feedback.create({
          match_id: match.id,
          from_user_id: match.mentee_ids[0],
          to_user_id: match.mentor_id,
          wants_to_continue: Math.random() > 0.3,
          usefulness: Math.floor(Math.random() * 5) + 1,
          private_note: 'Boa conversa, aprendi muito.',
        });
      }

      // ── CONNECTIONS (mutual connections) ────────────────────
      for (let i = 0; i < mentees.length; i++) {
        const mentee = mentees[i];
        const mentor = mentors[i % mentors.length];
        await Connection.create({
          user_a: mentee.id,
          user_b: mentor.id,
          origin: 'mutual',
        });
      }

      // ── MENTORSHIP REQUESTS ─────────────────────────────────
      await MentorshipRequest.create({
        mentee_id: menteeUser.id,
        mentor_id: mentorUser.id,
        status: 'accepted',
        message: 'Olá Carlos, gostava de ter o teu apoio como mentor.',
        decided_at: new Date(),
      });
      await MentorshipRequest.create({
        mentee_id: mentee2.id,
        mentor_id: mentor2.id,
        status: 'pending',
        message: 'Olá Sara, gostava de ter o teu apoio como mentor.',
      });
      await MentorshipRequest.create({
        mentee_id: mentee3.id,
        mentor_id: mentor5.id,
        status: 'declined',
        message: 'Olá Rui, gostava de ter o teu apoio.',
        decided_at: new Date(),
      });

      // ── MESSAGES (within connections) ───────────────────────
      const connections = await Connection.findAll();
      for (const conn of connections) {
        await Message.create({
          connection_id: conn.id,
          from_user_id: conn.user_a,
          body: 'Olá! Foi bom conhecer-te no evento.',
          read_at: new Date(),
        });
        await Message.create({
          connection_id: conn.id,
          from_user_id: conn.user_b,
          body: 'Olá! Também gostei de falar contigo.',
          read_at: new Date(),
        });
      }

      // ── QUESTIONS (for sessions) ────────────────────────────
      for (const session of landingSessions) {
        await Question.create({
          session_id: session.id,
          user_id: menteeUser.id,
          body: 'Como posso destacar o meu CV para a primeira vaga?',
          anonymous: false,
          status: 'visible',
          projected: false,
        });
        await Question.create({
          session_id: session.id,
          user_id: mentee2.id,
          body: 'Quais habilidades são mais valorizadas no mercado atual?',
          anonymous: true,
          status: 'visible',
          projected: false,
        });
      }

      // ── POLLS (for sessions) ────────────────────────────────
      const poll = await Poll.create({
        session_id: breakSessions[0].id,
        question: 'Maior obstáculo na busca de emprego?',
        options: ['Falta de experiência', 'Falta de contactos', 'Falta de formação', 'Outro'],
      });

      // ── POLL VOTES ──────────────────────────────────────────
      const { PollVote } = db;
      for (const mentee of mentees) {
        await PollVote.create({
          poll_id: poll.id,
          user_id: mentee.id,
          option_index: Math.floor(Math.random() * 4),
        });
      }

      // ── ANNOUNCEMENTS ───────────────────────────────────────
      await Announcement.create({
        event_id: event.id,
        body: 'Bem-vindos ao Career Connect 2026! O evento começa às 14H00.',
        sent_by: organizer.id,
        sent_at: new Date(),
      });
      await Announcement.create({
        event_id: event.id,
        body: 'O intervalo de networking começa daqui a 10 minutos. Dirigam-se às mesas.',
        sent_by: organizer.id,
        sent_at: new Date(),
      });

      // ── NOTIFICATIONS ───────────────────────────────────────
      for (const user of allUsers) {
        await Notification.create({
          user_id: user.id,
          channel: 'app',
          template: 'welcome',
          payload: { event: 'Career Connect 2026' },
          status: 'sent',
          sent_at: new Date(),
        });
      }

      // ── SURVEY RESPONSES ────────────────────────────────────
      for (const user of allUsers) {
        await SurveyResponse.create({
          user_id: user.id,
          event_id: event.id,
          rating: Math.floor(Math.random() * 3) + 3,
          nps: Math.floor(Math.random() * 11),
          comment: 'Evento muito útil para a minha carreira.',
        });
      }

      // ── NEXT STEPS ──────────────────────────────────────────
      for (const mentee of mentees) {
        await NextStep.create({
          user_id: mentee.id,
          text: 'Enviar CV para pelo menos 3 empresas esta semana.',
          due_date: new Date('2026-12-11T00:00:00+02:00'),
        });
        await NextStep.create({
          user_id: mentee.id,
          text: 'Atualizar perfil do LinkedIn com novas competências.',
          due_date: new Date('2026-12-18T00:00:00+02:00'),
        });
      }

      // ── BADGES ──────────────────────────────────────────────
      await Badge.create({
        user_id: menteeUser.id,
        code: 'PRIMEIRA_LIGACAO',
      });
      await Badge.create({
        user_id: menteeUser.id,
        code: 'MEIO_CAMINHO',
      });
      await Badge.create({
        user_id: mentee2.id,
        code: 'PRIMEIRA_LIGACAO',
      });
      await Badge.create({
        user_id: mentorUser.id,
        code: 'MENTORIA_ATIVA',
      });

      // ── AUDIT LOGS ──────────────────────────────────────────
      await AuditLog.create({
        actor_id: organizer.id,
        action: 'create_event',
        entity: 'Event',
        entity_id: event.id,
      });
      await AuditLog.create({
        actor_id: menteeUser.id,
        action: 'register',
        entity: 'Registration',
        entity_id: menteeUser.id,
      });
    }

    console.log('Seed data created successfully.');
    console.log('');
    console.log('Accounts:');
    console.log('  Organizer: organizador@careerconnect.co.mz / Organizer123!');
    console.log('  Mentor:    carlos@careerconnect.co.mz / Mentor123!');
    console.log('  Mentee:    ana@careerconnect.co.mz / Mentee123!');
    console.log('');
    if (!BASIC_SEED) {
      console.log('Additional mentors:');
      console.log('  sara@careerconnect.co.mz / Mentor123!');
      console.log('  nuno@careerconnect.co.mz / Mentor123!');
      console.log('  ilda@careerconnect.co.mz / Mentor123! (pending approval)');
      console.log('  rui@careerconnect.co.mz / Mentor123!');
      console.log('  lidia@careerconnect.co.mz / Mentor123!');
      console.log('');
      console.log('Additional mentees:');
      console.log('  bruno@careerconnect.co.mz / Mentee123!');
      console.log('  claudia@careerconnect.co.mz / Mentee123!');
      console.log('  dino@careerconnect.co.mz / Mentee123!');
      console.log('  elsa@careerconnect.co.mz / Mentee123!');
      console.log('  fatima@careerconnect.co.mz / Mentee123!');
    }

    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
})();
