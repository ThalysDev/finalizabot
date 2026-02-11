# ============================================================================
# Script de Verificação Pós-Deploy - FinalizaBOT v2
# ============================================================================
# Executa verificações automáticas após deploy para validar implementações
# Uso: .\scripts\verify-deployment.ps1

param(
    [switch]$Detailed = $false,
    [string]$DeployUrl = "https://finalizabot-d6rro1djx-thalys-rodrigues-projects.vercel.app"
)

Write-Host "`n" -NoNewline
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  FinalizaBOT - Verificação Pós-Deploy v2" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$script:passCount = 0
$script:failCount = 0
$script:warnCount = 0

function Test-Check {
    param(
        [string]$Name,
        [scriptblock]$Check,
        [string]$SuccessMsg = "OK",
        [string]$FailureMsg = "FALHOU"
    )

    Write-Host "  ⏳ $Name..." -NoNewline

    try {
        $result = & $Check
        if ($result) {
            Write-Host " ✅ $SuccessMsg" -ForegroundColor Green
            $script:passCount++
            return $true
        } else {
            Write-Host " ❌ $FailureMsg" -ForegroundColor Red
            $script:failCount++
            return $false
        }
    } catch {
        Write-Host " ⚠️  ERRO: $($_.Exception.Message)" -ForegroundColor Yellow
        $script:warnCount++
        return $false
    }
}

function Test-Warning {
    param(
        [string]$Name,
        [scriptblock]$Check,
        [string]$Message
    )

    Write-Host "  ⏳ $Name..." -NoNewline

    try {
        $result = & $Check
        if ($result) {
            Write-Host " ⚠️  $Message" -ForegroundColor Yellow
            $script:warnCount++
        } else {
            Write-Host " ✅ OK" -ForegroundColor Green
            $script:passCount++
        }
    } catch {
        Write-Host " ❔ N/A" -ForegroundColor Gray
    }
}

# ============================================================================
# 1. VERIFICAÇÃO DE ARQUIVOS E CÓDIGO
# ============================================================================
Write-Host "📁 Verificando arquivos modificados..." -ForegroundColor Yellow
Write-Host ""

Test-Check "Schema Prisma com FK constraints" {
    $schema = Get-Content "packages\shared\prisma\schema.prisma" -Raw
    ($schema -match 'relation\("MatchHomeImage"') -and
    ($schema -match 'relation\("PlayerImage"')
}

Test-Check "MatchCardData com campos raw" {
    $types = Get-Content "apps\web\src\data\types.ts" -Raw
    ($types -match 'homeTeamImageUrl') -and
    ($types -match 'homeTeamSofascoreId')
}

Test-Check "MatchCard usando fallbackSrcs" {
    $matchCard = Get-Content "apps\web\src\components\match\MatchCard.tsx" -Raw
    ($matchCard -match 'fallbackSrcs=\{homeFallbacks\}') -and
    ($matchCard -match 'fallbackSrcs=\{awayFallbacks\}')
}

Test-Check "CV dinâmico implementado" {
    $playerDetail = Get-Content "apps\web\src\components\player\PlayerDetailView.tsx" -Raw
    ($playerDetail -match 'const dynamicCV = useMemo') -and
    ($playerDetail -match 'const dynamicCVL5 = useMemo') -and
    ($playerDetail -match 'const dynamicCVL10 = useMemo')
}

Test-Check "Image sync com concorrência configurável" {
    $imageDownloader = Get-Content "apps\etl\src\services\imageDownloader.ts" -Raw
    ($imageDownloader -match 'IMAGE_DOWNLOAD_CONCURRENCY') -and
    ($imageDownloader -match 'successRate')
}

# ============================================================================
# 2. VERIFICAÇÃO DE ENV VARS
# ============================================================================
Write-Host "`n📋 Verificando configurações..." -ForegroundColor Yellow
Write-Host ""

Test-Warning "SKIP_IMAGE_SYNC ativado" {
    $env:SKIP_IMAGE_SYNC -eq "true" -or $env:SKIP_IMAGE_SYNC -eq "1"
} "Imagens NÃO serão baixadas! Desabilite em produção."

Test-Check ".env.example documentado" {
    $envExample = Get-Content "apps\etl\.env.example" -Raw
    ($envExample -match 'IMAGE_DOWNLOAD_CONCURRENCY') -and
    ($envExample -match 'CRÍTICO.*SKIP_IMAGE_SYNC')
}

# ============================================================================
# 3. VERIFICAÇÃO DE BUILD
# ============================================================================
Write-Host "`n🔨 Verificando builds..." -ForegroundColor Yellow
Write-Host ""

Test-Check "Shared package compilado" {
    Test-Path "packages\shared\dist\index.js"
}

Test-Check "Web app buildado (.next exists)" {
    Test-Path "apps\web\.next"
}

# ============================================================================
# 4. VERIFICAÇÃO DE GIT
# ============================================================================
Write-Host "`n📦 Verificando commits..." -ForegroundColor Yellow
Write-Host ""

Test-Check "Commit e34816a existe" {
    $commits = git log --oneline -20
    $commits -match "e34816a"
}

Test-Check "Commit 0eae4d8 existe" {
    $commits = git log --oneline -20
    $commits -match "0eae4d8"
}

Test-Check "Branch main atualizado" {
    $status = git status --porcelain
    $status.Length -eq 0  # Sem mudanças pendentes
}

# ============================================================================
# 5. VERIFICAÇÃO DE DEPLOY (Opcional)
# ============================================================================
if ($Detailed) {
    Write-Host "`n🌐 Verificando deploy remoto..." -ForegroundColor Yellow
    Write-Host ""

    Test-Check "Deploy URL acessível" {
        try {
            $response = Invoke-WebRequest -Uri $DeployUrl -Method Head -TimeoutSec 10
            $response.StatusCode -eq 200
        } catch {
            $false
        }
    }

    Test-Check "Dashboard carrega" {
        try {
            $response = Invoke-WebRequest -Uri "$DeployUrl/dashboard" -TimeoutSec 10
            $response.StatusCode -eq 200
        } catch {
            $false
        }
    }
}

# ============================================================================
# 6. VERIFICAÇÃO DE PRISMA CLIENT
# ============================================================================
Write-Host "`n💾 Verificando Prisma Client..." -ForegroundColor Yellow
Write-Host ""

Test-Check "Prisma Client gerado" {
    Test-Path "node_modules\@prisma\client\index.js"
}

# ============================================================================
# RESUMO
# ============================================================================
Write-Host "`n" -NoNewline
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  RESUMO DA VERIFICAÇÃO" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$total = $script:passCount + $script:failCount + $script:warnCount
$passPercent = if ($total -gt 0) { [math]::Round(($script:passCount / $total) * 100, 1) } else { 0 }

Write-Host "  ✅ Sucessos:  " -NoNewline -ForegroundColor Green
Write-Host "$($script:passCount)"

Write-Host "  ❌ Falhas:    " -NoNewline -ForegroundColor Red
Write-Host "$($script:failCount)"

Write-Host "  ⚠️  Warnings:  " -NoNewline -ForegroundColor Yellow
Write-Host "$($script:warnCount)"

Write-Host ""
Write-Host "  Taxa de Sucesso: " -NoNewline
if ($passPercent -ge 90) {
    Write-Host "$passPercent% 🎉" -ForegroundColor Green
} elseif ($passPercent -ge 70) {
    Write-Host "$passPercent% ⚠️" -ForegroundColor Yellow
} else {
    Write-Host "$passPercent% ❌" -ForegroundColor Red
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# RECOMENDAÇÕES
# ============================================================================
if ($script:failCount -gt 0 -or $script:warnCount -gt 0) {
    Write-Host "📋 PRÓXIMOS PASSOS:" -ForegroundColor Yellow
    Write-Host ""

    if ($script:failCount -gt 0) {
        Write-Host "  ❌ Há falhas críticas. Verifique os itens marcados em vermelho acima." -ForegroundColor Red
        Write-Host "     Consulte DEPLOY_CHECKLIST.md para troubleshooting." -ForegroundColor Gray
        Write-Host ""
    }

    if ($script:warnCount -gt 0) {
        Write-Host "  ⚠️  Há warnings. Revise as configurações:" -ForegroundColor Yellow
        Write-Host "     - SKIP_IMAGE_SYNC deve ser FALSE em produção" -ForegroundColor Gray
        Write-Host "     - Variáveis de ambiente devem estar configuradas" -ForegroundColor Gray
        Write-Host ""
    }

    Write-Host "  📚 Documentação completa: DEPLOY_CHECKLIST.md" -ForegroundColor Cyan
    Write-Host "  🔍 Para verificação detalhada: .\scripts\verify-deployment.ps1 -Detailed" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host "🎉 TODAS AS VERIFICAÇÕES PASSARAM!" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Próximo passo: Rodar sync completo" -ForegroundColor Cyan
    Write-Host "  Comando: .\scripts\run-sync.ps1" -ForegroundColor Gray
    Write-Host ""
}

# Exit code baseado em falhas
exit $script:failCount
