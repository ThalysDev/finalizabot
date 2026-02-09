# ============================================================
# FinalizaBOT — Sync Pipeline (run-sync.ps1)
# Direct execution — no Start-Process, no child processes.
# Usage: powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\run-sync.ps1
# ============================================================

$ErrorActionPreference = "Continue"

# ── Paths ────────────────────────────────────────────────────
$root = Split-Path $PSScriptRoot -Parent
$logDir = Join-Path $root "logs"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$logFile = Join-Path $logDir "sync-$stamp.log"

Set-Location $root

# ── Config ───────────────────────────────────────────────────
$maxRetries       = 1          # 1 retry = 2 total attempts
$retryDelaySec    = 30         # seconds between retries
$safetyTimeoutMin = 90         # kill entire script after 90 min (safety net)

# ── Helpers ──────────────────────────────────────────────────
function Write-Log {
  param(
    [Parameter(Mandatory)] [string] $Message,
    [string] $Level = "INFO"
  )
  $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] [$Level] $Message"
  Write-Host $line
  $line | Out-File -FilePath $logFile -Append -Encoding utf8
}

function Send-TelegramAlert {
  param(
    [Parameter(Mandatory)] [string] $Message
  )
  $token  = $env:TELEGRAM_BOT_TOKEN
  $chatId = $env:TELEGRAM_CHAT_ID

  if ([string]::IsNullOrWhiteSpace($token) -or [string]::IsNullOrWhiteSpace($chatId)) {
    Write-Log "Telegram skipped (no token/chatId)" "WARN"
    return
  }

  $uri  = "https://api.telegram.org/bot$token/sendMessage"
  $body = @{ chat_id = $chatId; text = $Message; parse_mode = "HTML" }

  try {
    Invoke-RestMethod -Method Post -Uri $uri -Body $body -TimeoutSec 15 | Out-Null
    Write-Log "Telegram alert sent"
  } catch {
    Write-Log "Telegram alert failed: $($_.Exception.Message)" "WARN"
  }
}

function Invoke-Step {
  param(
    [Parameter(Mandatory)] [string] $Name,
    [Parameter(Mandatory)] [string] $Command
  )

  for ($attempt = 1; $attempt -le ($maxRetries + 1); $attempt++) {
    Write-Log ">>> $Name  (attempt $attempt/$($maxRetries + 1))"

    $sw = [System.Diagnostics.Stopwatch]::StartNew()

    # Direct execution — inherits env vars, stdout streams in real-time
    & cmd /c "$Command 2>&1" | Tee-Object -FilePath $logFile -Append

    $exitCode = $LASTEXITCODE
    $sw.Stop()
    $elapsed = [math]::Round($sw.Elapsed.TotalSeconds, 1)

    if ($exitCode -eq 0) {
      Write-Log "<<< $Name completed in ${elapsed}s"
      return $true
    }

    Write-Log "<<< $Name failed (exit $exitCode) after ${elapsed}s" "ERROR"

    if ($attempt -le $maxRetries) {
      Write-Log "Retrying $Name in ${retryDelaySec}s..." "WARN"
      Start-Sleep -Seconds $retryDelaySec
    }
  }

  return $false
}

# ── Safety timeout (background watchdog) ─────────────────────
$watchdogJob = Start-Job -ScriptBlock {
  param($pid, $timeoutMin)
  Start-Sleep -Seconds ($timeoutMin * 60)
  try { Stop-Process -Id $pid -Force } catch {}
} -ArgumentList $PID, $safetyTimeoutMin

# ── Main pipeline ────────────────────────────────────────────
$pipelineStart = Get-Date
Write-Log "========== FinalizaBOT Sync Start =========="
Write-Log "Log: $logFile"
Write-Log "Safety timeout: ${safetyTimeoutMin} min"

$failed = $false

# Step 1 — ETL ingest
if (-not (Invoke-Step "ETL ingest" "npm run sync")) {
  Write-Log "ETL ingest failed after all attempts" "ERROR"
  Send-TelegramAlert "<b>FinalizaBOT FALHOU</b>`nETL ingest falhou.`nLog: $logFile"
  $failed = $true
}

# Step 2 — Bridge sync (only if ingest succeeded)
if (-not $failed) {
  if (-not (Invoke-Step "Bridge sync" "npm run sync:bridge")) {
    Write-Log "Bridge sync failed after all attempts" "ERROR"
    Send-TelegramAlert "<b>FinalizaBOT FALHOU</b>`nBridge sync falhou.`nLog: $logFile"
    $failed = $true
  }
}

# ── Summary ──────────────────────────────────────────────────
$totalElapsed = [math]::Round(((Get-Date) - $pipelineStart).TotalMinutes, 1)

if ($failed) {
  Write-Log "========== Sync FAILED (${totalElapsed} min) =========="
  # Stop watchdog
  Stop-Job $watchdogJob -ErrorAction SilentlyContinue
  Remove-Job $watchdogJob -Force -ErrorAction SilentlyContinue
  exit 1
} else {
  Write-Log "========== Sync OK (${totalElapsed} min) =========="
  Send-TelegramAlert "<b>FinalizaBOT OK</b>`nSync concluido em ${totalElapsed} min."
  # Stop watchdog
  Stop-Job $watchdogJob -ErrorAction SilentlyContinue
  Remove-Job $watchdogJob -Force -ErrorAction SilentlyContinue
  exit 0
}
