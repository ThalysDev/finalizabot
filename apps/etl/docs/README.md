# Documentação do SofaScore ETL

ETL que consome a API do SofaScore, normaliza dados de finalizações (shots) e persiste no PostgreSQL (schema `etl`) para uso pelo FinalizaBOT. Esta pasta reúne a documentação do sistema para consulta rápida e alterações em qualquer IDE.

## Documentos

| Documento | Conteúdo |
|-----------|----------|
| [ARQUITETURA.md](ARQUITETURA.md) | Visão geral, modos de execução, fluxo de dados e diagrama. |
| [SETUP.md](SETUP.md) | Pré-requisitos, instalação, variáveis de ambiente e migrações. |
| [COMPONENTES.md](COMPONENTES.md) | Descrição de cada pasta/arquivo e onde alterar o quê. |
| [API.md](API.md) | Endpoints da API Fastify, parâmetros e exemplos. |
| [BANCO-DADOS.md](BANCO-DADOS.md) | Schema Prisma, entidades, relações e uso no código. |
| [NEON.md](NEON.md) | Uso do Neon como banco: connection strings, migrações e prompt para o FinalizaBOT. |
| [DEPLOY-VERCEL-E-GITHUB-ACTIONS.md](DEPLOY-VERCEL-E-GITHUB-ACTIONS.md) | Prompt Copilot (FinalizaBOT na Vercel) e diretrizes do sync diário com GitHub Actions. |
| [FAQ-E-TROUBLESHOOTING.md](FAQ-E-TROUBLESHOOTING.md) | Dúvidas comuns e erros da sincronização. |
| [VERIFICACAO.md](VERIFICACAO.md) | Checklist de revisão e verificação para o sistema estar 100% funcional. |

## Ordem de leitura

- **Primeira vez no projeto:** SETUP → ARQUITETURA → BANCO-DADOS → COMPONENTES.
- **Só quero rodar:** SETUP e FAQ-E-TROUBLESHOOTING. Para checar se está tudo ok: VERIFICACAO.
- **Quero mudar a API ou endpoints:** API e COMPONENTES (api/server.ts).
- **Quero mudar o banco ou entidades:** BANCO-DADOS e COMPONENTES (services/db.ts, prisma/schema.prisma).
- **Quero mudar o ingest ou parser:** ARQUITETURA, COMPONENTES (crawlers, parsers).
