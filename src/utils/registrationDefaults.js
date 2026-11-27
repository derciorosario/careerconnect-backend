'use strict';

const DEFAULT_REGISTRATION_CONFIG = {
  areas: [
    'Recursos Humanos',
    'Secretariado',
    'Contabilidade',
    'Relações Públicas e Marketing',
    'Tecnologia (Redes e Hardware)',
    'Marketing Digital',
    'Programação Web',
  ],
  goals: [
    'Escolher a minha área',
    'Preparar o primeiro estágio',
    'Construir a minha marca pessoal',
    'Desenvolver competências',
    'Mudar de percurso',
    'Criar o meu negócio',
  ],
  obstacles: ['Falta de experiência', 'Falta de contactos', 'Falta de formação', 'Outro'],
  support_types: ['Mentor', 'Coach', 'Orientação pontual'],
  levels: ['Estudante', 'Recém-graduado', 'Profissional Júnior'],
  academic_education: [
    '12.ª Classe (Ensino Secundário)',
    'Ensino Técnico Médio',
    'Ensino Superior (Licenciatura)',
    'Pós-graduação',
  ],
  technical_courses: [
    'Recursos Humanos',
    'Secretariado',
    'Contabilidade',
    'Relações Públicas e Marketing',
    'Tecnologia (Redes e Hardware)',
    'Marketing Digital',
    'Programação Web',
  ],
};

const LEVEL_TO_ENUM = {
  'Estudante': 'estudante',
  'Recém-graduado': 'recem_graduado',
  'Profissional Júnior': 'profissional_junior',
};

const normalizeLevel = (level) => LEVEL_TO_ENUM[level] || level;

module.exports = { DEFAULT_REGISTRATION_CONFIG, normalizeLevel };