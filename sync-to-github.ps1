# =====================================================================
# Fayzar Computer - GitHub 1-Click Auto Sync (PowerShell)
# 100% Pure ASCII - Universal Windows Compatibility
# =====================================================================

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host " [Fayzar Computer] GitHub 1-Click Auto Sync Tool" -ForegroundColor Yellow
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

$ConfigPath = Join-Path $ScriptDir "github-config.json"
$Config = $null

if (Test-Path $ConfigPath) {
    try {
        $raw = Get-Content -Raw -Path $ConfigPath
        $Config = ConvertFrom-Json $raw
    } catch {
        Write-Host "[WARNING] Config file read error. Re-initializing setup..." -ForegroundColor Yellow
        $Config = $null
    }
}

if (-not $Config -or -not $Config.token -or -not $Config.repo -or -not $Config.owner) {
    Write-Host "[SETUP] First time setup. Please enter your GitHub details:" -ForegroundColor Green
    Write-Host ""
    
    $Owner = Read-Host "GitHub Username (e.g. fayzarcomputer)"
    $Repo = Read-Host "GitHub Repository Name (e.g. Fayzar-web)"
    $Branch = Read-Host "Branch name [default: main]"
    if ([string]::IsNullOrWhiteSpace($Branch)) { $Branch = "main" }
    
    Write-Host ""
    Write-Host "GitHub Classic Token with 'repo' permission is required." -ForegroundColor Yellow
    Write-Host "(Create one at: https://github.com/settings/tokens/new)" -ForegroundColor DarkGray
    $Token = Read-Host "Paste your GitHub Token (starts with ghp_)"
    
    $Config = [PSCustomObject]@{
        owner  = $Owner.Trim()
        repo   = $Repo.Trim()
        branch = $Branch.Trim()
        token  = $Token.Trim()
    }
    
    $Config | ConvertTo-Json -Depth 4 | Set-Content -Path $ConfigPath -Encoding Ascii
    Write-Host ""
    Write-Host "[SUCCESS] Configuration saved to github-config.json!" -ForegroundColor Green
    Write-Host ""
}

$Headers = @{
    "Authorization" = "Bearer $($Config.token)"
    "Accept"        = "application/vnd.github.v3+json"
    "User-Agent"    = "FayzarComputer-AutoSync"
}

# 2. Test Connection
Write-Host "[CONNECTING] Testing connection to repository: $($Config.owner)/$($Config.repo)..." -ForegroundColor Cyan

try {
    $RepoUrl = "https://api.github.com/repos/$($Config.owner)/$($Config.repo)"
    $RepoInfo = Invoke-RestMethod -Uri $RepoUrl -Headers $Headers -Method Get
    Write-Host "[OK] Connected to repository: $($RepoInfo.full_name)" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Connection failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "If you received (403) Forbidden:" -ForegroundColor Yellow
    Write-Host "1. Create a Classic Token with 'repo' checked at: https://github.com/settings/tokens/new" -ForegroundColor White
    Write-Host "2. Delete github-config.json and run this script again." -ForegroundColor White
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# 3. Find files to sync
$IgnoreList = @(
    "github-config.json",
    "sync-to-github.bat",
    "sync-to-github.ps1",
    ".git",
    "bg-remover.html",
    "test-engine-syntax.js"
)

$AllFiles = Get-ChildItem -Path $ScriptDir -Recurse -File | Where-Object {
    $rel = $_.FullName.Substring($ScriptDir.Length).TrimStart('\', '/')
    $shouldIgnore = $false
    foreach ($ig in $IgnoreList) {
        if ($rel -eq $ig -or $rel.StartsWith("$ig\") -or $rel.StartsWith("$ig/")) {
            $shouldIgnore = $true
            break
        }
    }
    return -not $shouldIgnore
}

$TotalFiles = $AllFiles.Count
Write-Host ""
Write-Host "[SYNC] Found $TotalFiles files to sync to branch '$($Config.branch)'..." -ForegroundColor Cyan
Write-Host ""

function Get-GitBlobSha($filePath) {
    $bytes = [System.IO.File]::ReadAllBytes($filePath)
    $header = [System.Text.Encoding]::ASCII.GetBytes("blob $($bytes.Length)`0")
    $combined = New-Object byte[] ($header.Length + $bytes.Length)
    [System.Buffer]::BlockCopy($header, 0, $combined, 0, $header.Length)
    [System.Buffer]::BlockCopy($bytes, 0, $combined, $header.Length, $bytes.Length)
    $sha1 = [System.Security.Cryptography.SHA1]::Create()
    $hash = $sha1.ComputeHash($combined)
    return ($hash | ForEach-Object { "{0:x2}" -f $_ }) -join ""
}

$SuccessCount = 0
$ErrorCount = 0
$SkippedCount = 0

foreach ($File in $AllFiles) {
    $RelPath = $File.FullName.Substring($ScriptDir.Length).TrimStart('\', '/').Replace('\', '/')
    Write-Host "-> $RelPath ... " -NoNewline -ForegroundColor White
    
    try {
        $LocalSha = Get-GitBlobSha $File.FullName
        $Ticks = (Get-Date).Ticks
        $FileApiUrl = "https://api.github.com/repos/$($Config.owner)/$($Config.repo)/contents/$RelPath`?ref=$($Config.branch)&_t=$Ticks"
        
        $RemoteSha = $null
        try {
            $ExistingFile = Invoke-RestMethod -Uri $FileApiUrl -Headers $Headers -Method Get
            $RemoteSha = $ExistingFile.sha
        } catch {
            # File does not exist yet (404)
        }
        
        # Check if remote file is already identical
        if ($RemoteSha -and ($RemoteSha -eq $LocalSha)) {
            Write-Host "[UP TO DATE]" -ForegroundColor DarkGray
            $SkippedCount++
            $SuccessCount++
            continue
        }
        
        $Bytes = [System.IO.File]::ReadAllBytes($File.FullName)
        $Base64Content = [System.Convert]::ToBase64String($Bytes)
        
        $BodyObj = @{
            message = "Auto-update $RelPath via Fayzar Computer Sync"
            content = $Base64Content
            branch  = $Config.branch
        }
        if ($RemoteSha) {
            $BodyObj["sha"] = $RemoteSha
        }
        
        $PutUrl = "https://api.github.com/repos/$($Config.owner)/$($Config.repo)/contents/$RelPath"
        
        $MaxRetries = 4
        $Attempt = 0
        $Uploaded = $false
        $LastError = $null
        
        while ($Attempt -lt $MaxRetries -and -not $Uploaded) {
            $Attempt++
            try {
                $JsonBody = $BodyObj | ConvertTo-Json -Compress
                $UploadResult = Invoke-RestMethod -Uri $PutUrl -Headers $Headers -Method Put -Body $JsonBody
                if ($Attempt -eq 1) {
                    Write-Host "[OK]" -ForegroundColor Green
                } else {
                    Write-Host "[OK (Attempt $Attempt)]" -ForegroundColor Green
                }
                $Uploaded = $true
                $SuccessCount++
                # Brief pause so GitHub branch ref lock settles
                Start-Sleep -Milliseconds 600
            } catch {
                $LastError = $_
                if ($Attempt -lt $MaxRetries) {
                    Write-Host "[409/Retry $Attempt] ... " -NoNewline -ForegroundColor Yellow
                    Start-Sleep -Milliseconds ($Attempt * 1200)
                    # Refresh fresh remote sha
                    try {
                        $FreshTicks = (Get-Date).Ticks
                        $FreshApiUrl = "https://api.github.com/repos/$($Config.owner)/$($Config.repo)/contents/$RelPath`?ref=$($Config.branch)&_t=$FreshTicks"
                        $FreshFile = Invoke-RestMethod -Uri $FreshApiUrl -Headers $Headers -Method Get
                        $BodyObj["sha"] = $FreshFile.sha
                    } catch {
                        $BodyObj.Remove("sha")
                    }
                }
            }
        }
        
        if (-not $Uploaded) {
            Write-Host "[FAILED] ($($LastError.Exception.Message))" -ForegroundColor Red
            $ErrorCount++
        }
    } catch {
        Write-Host "[FAILED] ($($_.Exception.Message))" -ForegroundColor Red
        $ErrorCount++
    }
}

Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Cyan
if ($ErrorCount -eq 0) {
    $UploadedCount = $SuccessCount - $SkippedCount
    Write-Host "[SUCCESS] Sync complete! ($UploadedCount uploaded, $SkippedCount already up-to-date)" -ForegroundColor Green
    Write-Host "Live Website URL: https://$($Config.owner).github.io/$($Config.repo)/" -ForegroundColor Yellow
} else {
    Write-Host "[RESULT] Sync completed: $SuccessCount succeeded, $ErrorCount failed." -ForegroundColor Yellow
    if ($ErrorCount -eq $TotalFiles) {
        Write-Host ""
        Write-Host "[NOTE] If you got (403) Forbidden:" -ForegroundColor Red
        Write-Host "Your Token lacks Write permissions." -ForegroundColor Yellow
        Write-Host "Fix: Go to https://github.com/settings/tokens/new and check the 'repo' checkbox." -ForegroundColor White
        Write-Host "Then delete 'github-config.json' and paste your new token." -ForegroundColor White
    }
}
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""
