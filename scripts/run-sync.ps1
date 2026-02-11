# ============================================================================
# FinalizaBOT - Script de Sincronização Local
# ============================================================================
# Este script executa a pipeline de sync completa (Ingest → Bridge → Images)
# com opções configuráveis para desenvolvimento e produção.
#
# Uso:
#   .\scripts\run-sync.ps1                    # Sync completo (modo padrão)
#   .\scripts\run-sync.ps1 -FastMode          # Modo rápido (dev)
#   .\scripts\run-sync.ps1 -SkipImages        # Pula download de imagens
#   .\scripts\run-sync.ps1 -FastMode -SkipImages  # Combinado
#
# ============================================================================

param(
    [switch]$SkipImages = $false,
    [switch]$FastMode = $false,
    [switch]$Verbose = $false
)

Write-Host ""
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "FinalizaBOT - Pipeline de Sincronizacao" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# Configurar perfil de performance
if ($FastMode) {
    $env:SYNC_CONCURRENCY = "5"
    $env:SYNC_DELAY_SCALE = "0.5"
    $env:SYNC_PHASE2_DAYS = "7"
    $env:SKIP_IMAGE_SYNC = "true"
    Write-Host "[FAST MODE] Ativado" -ForegroundColor Yellow
    Write-Host "  - Concorrencia: 5" -ForegroundColor DarkGray
    Write-Host "  - Delays: 50%" -ForegroundColor DarkGray
    Write-Host "  - Historico: 7 dias" -ForegroundColor DarkGray
    Write-Host ""
}

# Criar diretório de logs
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$logFile = "logs/sync-$timestamp.log"
New-Item -ItemType Directory -Force -Path "logs" | Out-Null

Write-Host "Logs: $logFile" -ForegroundColor DarkGray
Write-Host ""

try {
    Write-Host "[FASE 1] ETL Ingest..." -ForegroundColor Green
    npm run sync 2>&1 | Tee-Object -FilePath $logFile -Append
    if ($LASTEXITCODE -ne 0) { throw "Ingest falhou" }

    Write-Host ""
    Write-Host "[FASE 2] Bridge sync..." -ForegroundColor Green
    npm run sync:bridge 2>&1 | Tee-Object -FilePath $logFile -Append
    if ($LASTEXITCODE -ne 0) { throw "Bridge falhou" }

    if (-not $SkipImages -and -not $FastMode) {
        Write-Host ""
        Write-Host "[FASE 3] Image sync..." -ForegroundColor Green
        npm run sync:images 2>&1 | Tee-Object -FilePath $logFile -Append
    }

    Write-Host ""
    Write-Host "[SUCCESS] Sincronizacao concluida!" -ForegroundColor Green
    Write-Host "Logs salvos em: $logFile" -ForegroundColor Cyan
    Write-Host ""

} catch {
    Write-Host ""
    Write-Host "[ERROR] Falha: $_" -ForegroundColor Red
    Write-Host "Ver logs em: $logFile" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}
