# Script de Setup Automático - FinalizaBOT MVP
# Execute com: .\setup.ps1

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   FinalizaBOT MVP - Setup Automático" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se Docker está instalado
Write-Host "[1/6] Verificando Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "✓ Docker encontrado: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker não encontrado!" -ForegroundColor Red
    Write-Host "  Instale o Docker Desktop: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
    Write-Host "  Após instalar, reinicie o computador e execute este script novamente." -ForegroundColor Yellow
    exit 1
}

# Verificar se há .env.local
Write-Host "[2/6] Verificando arquivo .env.local..." -ForegroundColor Yellow
if (-Not (Test-Path ".env.local")) {
    Write-Host "  Criando .env.local..." -ForegroundColor Cyan
    Copy-Item ".env.example" ".env.local"
    Write-Host "✓ Arquivo .env.local criado" -ForegroundColor Green
} else {
    Write-Host "✓ Arquivo .env.local já existe" -ForegroundColor Green
}

# Iniciar Docker Compose
Write-Host "[3/6] Iniciando PostgreSQL com Docker Compose..." -ForegroundColor Yellow
docker compose up -d
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ PostgreSQL iniciado com sucesso" -ForegroundColor Green
    Write-Host "  Aguardando 5 segundos para o banco inicializar..." -ForegroundColor Cyan
    Start-Sleep -Seconds 5
} else {
    Write-Host "✗ Erro ao iniciar Docker Compose" -ForegroundColor Red
    exit 1
}

# Gerar Prisma Client
Write-Host "[4/6] Gerando Prisma Client..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Prisma Client gerado" -ForegroundColor Green
} else {
    Write-Host "✗ Erro ao gerar Prisma Client" -ForegroundColor Red
    exit 1
}

# Aplicar schema no banco
Write-Host "[5/6] Aplicando schema no banco de dados..." -ForegroundColor Yellow
npx prisma db push --accept-data-loss
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Schema aplicado com sucesso" -ForegroundColor Green
} else {
    Write-Host "✗ Erro ao aplicar schema" -ForegroundColor Red
    Write-Host "  Verifique se o PostgreSQL está rodando: docker compose ps" -ForegroundColor Yellow
    exit 1
}

# Popular banco com seed
Write-Host "[6/6] Populando banco de dados com dados exemplo..." -ForegroundColor Yellow
npx prisma db seed
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Dados populados com sucesso" -ForegroundColor Green
} else {
    Write-Host "✗ Erro ao popular dados" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   ✓ Setup concluído com sucesso!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para iniciar o app, execute:" -ForegroundColor Yellow
Write-Host "  npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "Acesse no navegador:" -ForegroundColor Yellow
Write-Host "  http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Comandos úteis:" -ForegroundColor Yellow
Write-Host "  npx prisma studio       # GUI para visualizar dados" -ForegroundColor Gray
Write-Host "  docker compose logs     # Ver logs do PostgreSQL" -ForegroundColor Gray
Write-Host "  docker compose down     # Parar PostgreSQL" -ForegroundColor Gray
Write-Host ""
