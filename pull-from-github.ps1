# =====================================================================
# Fayzar Computer - GitHub 1-Click Auto Pull / Update (PowerShell)
# 100% Pure ASCII - Universal Windows Compatibility
# =====================================================================

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host " [Fayzar Computer] GitHub 1-Click Auto Pull / Update Tool" -ForegroundColor Yellow
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

$ConfigPath = Join-Path $ScriptDir "github-config.json"
if (-not (Test-Path $ConfigPath)) {
    Write-Host "[ERROR] Configuration file 'github-config.json' not found!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

try {
    $Config = Get-Content -Raw -Path $ConfigPath | ConvertFrom-Json
} catch {
    Write-Host "[ERROR] Could not parse 'github-config.json': $($_.Exception.Message)" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

$Headers = @{
    "Authorization" = "Bearer $($Config.token)"
    "Accept"        = "application/vnd.github.v3+json"
    "User-Agent"    = "FayzarComputer-AutoPull"
}

Write-Host "[CONNECTING] Checking latest updates from $($Config.owner)/$($Config.repo) (branch: $($Config.branch))..." -ForegroundColor Cyan

try {
    $LatestCommit = (Invoke-RestMethod -Uri "https://api.github.com/repos/$($Config.owner)/$($Config.repo)/commits?sha=$($Config.branch)&per_page=1" -Headers $Headers)[0]
    $ShortSha = $LatestCommit.sha.Substring(0, 7)
    Write-Host "[LATEST COMMIT] $ShortSha - $($LatestCommit.commit.message)" -ForegroundColor Green
    Write-Host "                Date: $($LatestCommit.commit.author.date)" -ForegroundColor DarkGray
} catch {
    Write-Host "[ERROR] Could not connect to GitHub: $($_.Exception.Message)" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

$TempZip = Join-Path $env:TEMP "fayzar_update_$ShortSha.zip"
$TempExtract = Join-Path $env:TEMP "fayzar_update_extracted_$ShortSha"

Write-Host ""
Write-Host "[DOWNLOADING] Downloading repository archive from GitHub..." -ForegroundColor Cyan

try {
    $ZipUrl = "https://api.github.com/repos/$($Config.owner)/$($Config.repo)/zipball/$($Config.branch)"
    Invoke-WebRequest -Uri $ZipUrl -Headers $Headers -OutFile $TempZip
    $ZipSize = (Get-Item $TempZip).Length
    Write-Host "[OK] Download completed ($([math]::Round($ZipSize / 1MB, 2)) MB)." -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Download failed: $($_.Exception.Message)" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "[EXTRACTING] Unpacking files..." -ForegroundColor Cyan
if (Test-Path $TempExtract) {
    Remove-Item -Recurse -Force $TempExtract
}
Expand-Archive -Path $TempZip -DestinationPath $TempExtract

$ExtractedRoot = (Get-ChildItem -Path $TempExtract | Where-Object { $_.PSIsContainer } | Select-Object -First 1).FullName

# Files/Folders that should NEVER be overwritten by pull
$PreserveList = @(
    "github-config.json",
    "sync-to-github.ps1",
    "sync-to-github.bat",
    "pull-from-github.ps1",
    "pull-from-github.bat"
)

Write-Host "[UPDATING] Updating local files..." -ForegroundColor Cyan
$AllSourceFiles = Get-ChildItem -Path $ExtractedRoot -Recurse -File
$UpdatedCount = 0

foreach ($srcFile in $AllSourceFiles) {
    $rel = $srcFile.FullName.Substring($ExtractedRoot.Length).TrimStart('\', '/')
    
    # Check preserve list
    $skip = $false
    foreach ($p in $PreserveList) {
        if ($rel -ieq $p) {
            $skip = $true
            break
        }
    }
    if ($skip) { continue }

    # If it's data\site_config.json and local exists, preserve local rich shop details
    if ($rel -ieq "data\site_config.json" -or $rel -ieq "data/site_config.json") {
        $localCfgPath = Join-Path $ScriptDir "data\site_config.json"
        if (Test-Path $localCfgPath) {
            try {
                $existingCfg = Get-Content $localCfgPath -Raw | ConvertFrom-Json
                if ($existingCfg.shop -and $existingCfg.shop.name) {
                    continue
                }
            } catch {}
        }
    }

    $destPath = Join-Path $ScriptDir $rel
    $destDir = Split-Path -Parent $destPath
    if (-not (Test-Path $destDir)) {
        New-Item -ItemType Directory -Path $destDir -Force | Out-Null
    }

    Copy-Item -Path $srcFile.FullName -Destination $destPath -Force
    $UpdatedCount++
}

# Clean up temp files
Remove-Item -Force $TempZip -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force $TempExtract -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "[SUCCESS] Successfully updated $UpdatedCount files to commit $ShortSha!" -ForegroundColor Green
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""
