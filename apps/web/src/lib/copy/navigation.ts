export const NAV_COPY = {
  dashboard: "Painel",
  goToDashboard: "Ir para o painel",
  backToDashboard: "Voltar ao painel",
  backToHome: "Voltar ao início",
} as const;

export const STATE_COPY = {
  pageNotFoundTitle: "Página não encontrada",
  pageNotFoundDescription:
    "A página que você procura não existe ou foi movida.",
  protectedNotFoundDescription:
    "A página que você procura não existe ou foi movida. Verifique a URL ou volte para o painel.",
  noPlayerFound: "Nenhum jogador encontrado",
} as const;

export const LOADING_COPY = {
  protectedData: "Carregando dados…",
  alerts: "Carregando alertas",
  dashboard: "Carregando dashboard",
  proTable: "Carregando tabela PRO",
  advancedTable: "Carregando tabela avançada",
  player: "Carregando jogador",
  match: "Carregando partida…",
} as const;

export const ERROR_COPY = {
  retry: "Tentar novamente",
  genericTitle: "Algo deu errado",
  protectedDescription:
    "Ocorreu um erro inesperado ao carregar esta página. Nossa equipe foi notificada automaticamente.",
  globalDescription: "Ocorreu um erro inesperado. Tente recarregar a página.",
  dashboardTitle: "Erro no Dashboard",
  dashboardDescription:
    "Não foi possível carregar os dados do dashboard no momento. Tente novamente em instantes.",
  advancedTableTitle: "Erro ao carregar a tabela avançada",
  advancedTableDescription:
    "Ocorreu um erro ao processar os dados. Isso pode acontecer quando o serviço ETL está indisponível ou existem dados inconsistentes.",
  playerTitle: "Erro ao carregar jogador",
  playerDescription:
    "Não foi possível carregar os dados deste jogador. Isso pode ser temporário — tente novamente.",
  matchTitle: "Erro ao carregar partida",
  matchDescription:
    "Não foi possível carregar os dados desta partida. Isso pode ser temporário — tente novamente.",
} as const;
