# Quick Deploy Verification - FinalizaBOT v2
Write-Host "`n=== FinalizaBOT - Verificacao Rapida ===" -ForegroundColor Cyan
Write-Host ""

$checks = @()

# 1. Schema Prisma
$schema = Get-Content "packages\shared\prisma\schema.prisma" -Raw
$hasFKRelations = ($schema -match 'relation\("MatchHomeImage"') -and ($schema -match 'relation\("PlayerImage"')
$checks += @{ Name = "Schema Prisma com FK constraints"; Pass = $hasFKRelations }

# 2. MatchCardData
$types = Get-Content "apps\web\src\data\types.ts" -Raw
$hasRawFields = ($types -match 'homeTeamImageUrl') -and ($types -match 'homeTeamSofascoreId')
$checks += @{ Name = "MatchCardData com campos raw"; Pass = $hasRawFields }

# 3. MatchCard fallbackSrcs
$matchCard = Get-Content "apps\web\src\components\match\MatchCard.tsx" -Raw
$hasFallbackSrcs = ($matchCard -match 'fallbackSrcs=') -and ($matchCard -match 'homeFallbacks')
$checks += @{ Name = "MatchCard usando fallbackSrcs"; Pass = $hasFallbackSrcs }

# 4. CV Dinamico
$playerDetail = Get-Content "apps\web\src\components\player\PlayerDetailView.tsx" -Raw
$hasDynamicCV = ($playerDetail -match 'const dynamicCV = useMemo') -and ($playerDetail -match 'dynamicCVL5')
$checks += @{ Name = "CV dinamico implementado"; Pass = $hasDynamicCV }

# 5. Image Sync Concurrency
$imageDownloader = Get-Content "apps\etl\src\services\imageDownloader.ts" -Raw
$hasImageConfig = ($imageDownloader -match 'IMAGE_DOWNLOAD_CONCURRENCY') -and ($imageDownloader -match 'successRate')
$checks += @{ Name = "Image sync com metricas"; Pass = $hasImageConfig }

# 6. Build artifacts
$hasSharedBuild = Test-Path "packages\shared\dist\index.js"
$checks += @{ Name = "Shared package compilado"; Pass = $hasSharedBuild }

$hasWebBuild = Test-Path "apps\web\.next"
$checks += @{ Name = "Web app buildado"; Pass = $hasWebBuild }

# 7. Commits
$commits = git log --oneline -20
$hasCommit1 = $commits -match "e34816a"
$hasCommit2 = $commits -match "0eae4d8"
$checks += @{ Name = "Commit e34816a presente"; Pass = $hasCommit1 }
$checks += @{ Name = "Commit 0eae4d8 presente"; Pass = $hasCommit2 }

# Results
Write-Host "Resultados:" -ForegroundColor Yellow
Write-Host ""

$passCount = 0
$failCount = 0

foreach ($check in $checks) {
    if ($check.Pass) {
        Write-Host "  [OK] " -NoNewline -ForegroundColor Green
        Write-Host $check.Name
        $passCount++
    } else {
        Write-Host "  [X]  " -NoNewline -ForegroundColor Red
        Write-Host $check.Name
        $failCount++
    }
}

Write-Host ""
Write-Host "Total: $passCount/$($checks.Count) passaram" -ForegroundColor $(if ($failCount -eq 0) { "Green" } else { "Yellow" })

if ($failCount -eq 0) {
    Write-Host "`nSUCESSO! Todas as verificacoes passaram." -ForegroundColor Green
} else {
    Write-Host "`nALERTA: $failCount verificacoes falharam." -ForegroundColor Yellow
}

Write-Host ""
