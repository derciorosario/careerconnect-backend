'use strict';

// Default event evaluation questionnaire content.
// Structure:
// {
//   participant: [ { id, label, type: 'radio'|'ratings', options?, items? } ],
//   mentor: [ ... ],
//   impact: {
//     mentee: { conexao, aplicacao, resultados },
//     mentor: { conexao, aplicacao, resultados }
//   }
// }

const DEFAULT_QUESTIONNAIRE = {
  participant: [
    {
      id: 'geral',
      label: '1. Como avalias a tua experiência geral no Career Connect 2026?',
      type: 'radio',
      options: ['Muito satisfeito(a)', 'Satisfeito(a)', 'Pouco satisfeito(a)', 'Insatisfeito(a)'],
    },
    {
      id: 'masterclasses',
      label: '2. Como avalias a qualidade e impacto das masterclasses? (1 a 5)',
      type: 'ratings',
      items: [
        'Vicente Sitoe – Estratégias para o Primeiro Emprego',
        'Arafat Cossa – A Arte do Networking',
        'Marlene Chambule – Crescimento Pós-Contratação',
      ],
    },
    {
      id: 'conexao',
      label: '3. Como avalias o Momento Conexão para conhecer profissionais e mentores?',
      type: 'radio',
      options: ['Muito produtivo', 'Satisfatório', 'Pouco produtivo', 'Não consegui interagir suficientemente'],
    },
    {
      id: 'continuidade',
      label: '4. Estás preparado(a) para dar continuidade ao plano de mentoria e desafios práticos definidos com o teu mentor?',
      type: 'radio',
      options: ['Sim, totalmente motivado(a)', 'Sim, mas preciso de mais orientação', 'Não pretendo continuar o acompanhamento'],
    },
    {
      id: 'resultado',
      label: '5. Qual foi o resultado prático do evento para além do conhecimento?',
      type: 'radio',
      options: ['Encontrei um mentor', 'Conectei-me com excelentes profissionais', 'Tenho uma entrevista de estágio/emprego marcada', 'Nada de concreto'],
    },
    {
      id: 'plataforma',
      label: '6. Como avalias a plataforma digital do evento?',
      type: 'radio',
      options: ['Muito eficaz e fácil de usar', 'Eficaz mas não muito fácil de usar', 'Nada eficaz e nada prática'],
    },
  ],
  mentor: [
    {
      id: 'organizacao',
      label: '1. Como avalia a organização e a estrutura do evento?',
      type: 'radio',
      options: ['Muito satisfeito(a)', 'Satisfeito(a)', 'Pouco satisfeito(a)', 'Insatisfeito(a)'],
    },
    {
      id: 'potencial',
      label: '2. Considera que os participantes demonstraram o potencial e a postura necessários para o mercado de trabalho?',
      type: 'radio',
      options: ['Superaram as expectativas', 'Corresponderam às expectativas', 'Demonstraram necessidade de maior preparação'],
    },
    {
      id: 'matching',
      label: '3. A metodologia de matching facilitou a identificação de talentos alinhados ao seu perfil e experiência?',
      type: 'radio',
      options: ['Sim, de forma eficaz', 'Parcialmente', 'Prefiro o modelo tradicional baseado em CV'],
    },
    {
      id: 'disponibilidade',
      label: '4. Tem disponibilidade para assumir o acompanhamento contínuo do(s) mentorado(s)?',
      type: 'radio',
      options: ['Sim, compromisso confirmado', 'Sim, dependendo da agenda', 'Não tenho disponibilidade neste momento'],
    },
    {
      id: 'plataforma',
      label: '5. Como avalia a plataforma digital do evento?',
      type: 'radio',
      options: ['Muito eficaz e fácil de usar', 'Eficaz mas não muito fácil de usar', 'Nada eficaz e nada prática'],
    },
  ],
  impact: {
    mentee: {
      conexao: 'Já realizaste a primeira sessão de mentoria com o teu mentor?',
      aplicacao: 'Estás a aplicar as orientações e tarefas definidas durante a mentoria?',
      resultados: 'Que avanços concretos alcançaste desde o evento? (ex.: entrevistas, melhoria do CV, fortalecimento do LinkedIn, networking, candidaturas submetidas).',
    },
    mentor: {
      conexao: 'Já iniciou formalmente o acompanhamento do seu mentorado?',
      aplicacao: 'O mentorado demonstra compromisso com as atividades e metas acordadas?',
      resultados: 'Que evolução observou no comportamento, clareza de objetivos ou preparação profissional do mentorado?',
    },
  },
};

module.exports = { DEFAULT_QUESTIONNAIRE };