# ============================================================================
# FinalizaBOT - Post-deploy verification script
# ============================================================================
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts/verify-deployment.ps1
#   powershell -ExecutionPolicy Bypass -File scripts/verify-deployment.ps1 -Detailed

param(
    [switch]$Detailed = $false,
    [string]$DeployUrl = "https://finalizabot-d6rro1djx-thalys-rodrigues-projects.vercel.app"
)

$script:passCount = 0
$script:failCount = 0
$script:warnCount = 0

function Write-Header {
    param([string]$Text)
    Write-Host ""
    Write-Host "===============================================================" -ForegroundColor Cyan
    Write-Host "  $Text" -ForegroundColor Cyan
    Write-Host "===============================================================" -ForegroundColor Cyan
    Write-Host ""
}

function Test-Check {
    param(
        [string]$Name,
        [scriptblock]$Check,
        [string]$SuccessMsg = "OK",
        [string]$FailureMsg = "FAILED"
    )

    Write-Host "  [..] $Name..." -NoNewline
    try {
        $result = & $Check
        if ([bool]$result) {
            Write-Host " [OK] $SuccessMsg" -ForegroundColor Green
            $script:passCount++
            return $true
        }

        Write-Host " [FAIL] $FailureMsg" -ForegroundColor Red
        $script:failCount++
        return $false
    } catch {
        Write-Host " [WARN] $($_.Exception.Message)" -ForegroundColor Yellow
        $script:warnCount++
        return $false
    }
}

function Test-Warning {
    param(
        [string]$Name,
        [scriptblock]$Check,
        [string]$WarningMsg
    )

    Write-Host "  [..] $Name..." -NoNewline
    try {
        $result = & $Check
        if ([bool]$result) {
            Write-Host " [WARN] $WarningMsg" -ForegroundColor Yellow
            $script:warnCount++
            return
        }

        Write-Host " [OK] OK" -ForegroundColor Green
        $script:passCount++
    } catch {
        Write-Host " [WARN] N/A" -ForegroundColor Yellow
        $script:warnCount++
    }
}

Write-Header "FinalizaBOT - Post-deploy verification"

Write-Host "[1/6] Checking files and code..." -ForegroundColor Yellow
Write-Host ""

$null = Test-Check "Prisma schema includes image relations" {
    $schema = Get-Content "packages\shared\prisma\schema.prisma" -Raw
    ($schema -match 'relation\("MatchHomeImage"') -and ($schema -match 'relation\("PlayerImage"')
}

$null = Test-Check "MatchCard type has image fields" {
    $types = Get-Content "apps\web\src\data\types.ts" -Raw
    ($types -match 'homeTeamImageUrl') -and ($types -match 'homeTeamSofascoreId')
}

$null = Test-Check "MatchCard has fallback image sources" {
    $matchCard = Get-Content "apps\web\src\components\match\MatchCard.tsx" -Raw
    ($matchCard -match 'fallbackSrcs=\{homeFallbacks\}') -and ($matchCard -match 'fallbackSrcs=\{awayFallbacks\}')
}

$null = Test-Check "PlayerDetail computes dynamic CV" {
    $playerDetail = Get-Content "apps\web\src\components\player\PlayerDetailView.tsx" -Raw
    ($playerDetail -match 'dynamicCV') -and ($playerDetail -match 'dynamicCVL5') -and ($playerDetail -match 'dynamicCVL10')
}

Write-Host ""
Write-Host "[2/6] Checking environment hints..." -ForegroundColor Yellow
Write-Host ""

$null = Test-Warning "SKIP_IMAGE_SYNC is enabled" {
    $env:SKIP_IMAGE_SYNC -eq "true" -or $env:SKIP_IMAGE_SYNC -eq "1"
} "Images will not be downloaded. Disable in production."

$null = Test-Check "ETL env example documents image concurrency" {
    $envExample = Get-Content "apps\etl\.env.example" -Raw
    ($envExample -match 'IMAGE_DOWNLOAD_CONCURRENCY')
}

Write-Host ""
Write-Host "[3/6] Checking build artifacts..." -ForegroundColor Yellow
Write-Host ""

$null = Test-Check "Shared package is built" { Test-Path "packages\shared\dist\index.js" }
$null = Test-Check "Web app build output exists" { Test-Path "apps\web\.next" }
$null = Test-Check "Prisma client is generated" { Test-Path "node_modules\@prisma\client\index.js" }

Write-Host ""
Write-Host "[4/6] Checking git status..." -ForegroundColor Yellow
Write-Host ""

$null = Test-Warning "Working tree has pending changes" {
    git diff-index --quiet HEAD --
    $hasModified = $LASTEXITCODE -ne 0

    $hasUntracked = $false
    $firstUntracked = git ls-files --others --exclude-standard | Select-Object -First 1
    if ($firstUntracked) {
        $hasUntracked = $true
    }

    $hasModified -or $hasUntracked
} "Local changes detected. Commit/stash before final release checks."

Write-Host ""
Write-Host "[5/6] Optional remote checks..." -ForegroundColor Yellow
Write-Host ""

if ($Detailed) {
    $null = Test-Check "Deploy URL is reachable" {
        try {
            $response = Invoke-WebRequest -Uri $DeployUrl -Method Head -TimeoutSec 10
            $response.StatusCode -ge 200 -and $response.StatusCode -lt 500
        } catch {
            if ($_.Exception.Response) {
                $code = [int]$_.Exception.Response.StatusCode
                return ($code -ge 200 -and $code -lt 500)
            }
            return $false
        }
    }

    $null = Test-Check "Health endpoint responds" {
        try {
            $response = Invoke-WebRequest -Uri "$DeployUrl/api/health" -TimeoutSec 10
            $response.StatusCode -ge 200 -and $response.StatusCode -lt 500
        } catch {
            if ($_.Exception.Response) {
                $code = [int]$_.Exception.Response.StatusCode
                return ($code -ge 200 -and $code -lt 500)
            }
            return $false
        }
    }
} else {
    Write-Host "  [SKIP] Use -Detailed to run remote checks." -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "[6/6] Summary" -ForegroundColor Yellow

$total = $script:passCount + $script:failCount + $script:warnCount
$passPercent = if ($total -gt 0) { [math]::Round(($script:passCount / $total) * 100, 1) } else { 0 }

Write-Host ""
Write-Host "  Pass:    $($script:passCount)" -ForegroundColor Green
Write-Host "  Fail:    $($script:failCount)" -ForegroundColor Red
Write-Host "  Warning: $($script:warnCount)" -ForegroundColor Yellow
Write-Host "  Success rate: $passPercent%"
Write-Host ""

if ($script:failCount -gt 0) {
    Write-Host "One or more critical checks failed." -ForegroundColor Red
} elseif ($script:warnCount -gt 0) {
    Write-Host "Checks passed with warnings." -ForegroundColor Yellow
} else {
    Write-Host "All checks passed." -ForegroundColor Green
}

exit $script:failCount