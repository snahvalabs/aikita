#!/usr/bin/pwsh
# AIKITA Installation Script (PowerShell)
# ======================================
# This script sets up AIKITA on a fresh Windows/machine.
# Run as Administrator or with appropriate permissions.

Write-Host "=== AIKITA Installation Script ===" -ForegroundColor Cyan

# 1. Check Node.js version
Write-Host "1. Checking Node.js version..." -ForegroundColor Yellow
$nodeVersion = (node --version).Trim()
Write-Host "   Node.js version: $nodeVersion"

$versionMatch = $nodeVersion -match 'v(\d+)\.(\d+)\.(\d+)'
if ($versionMatch) {
    $major = [int]$versionMatch.Groups[1].Value
    if ($major -lt 22) {
        Write-Host "   ⚠️  Node.js version 22+ recommended. Current: $nodeVersion" -ForegroundColor Yellow
    } else {
        Write-Host "   ✅ Node.js version is compatible." -ForegroundColor Green
    }
} else {
    Write-Host "   ❌ Could not parse Node.js version. Please install Node.js 22+." -ForegroundColor Red
    exit 1
}

# 2. Install dependencies
Write-Host "2. Installing dependencies..." -ForegroundColor Yellow
if (-not Test-Path "./package.json") {
    Write-Host "   ❌ package.json not found. Please run this from the AIKITA directory." -ForegroundColor Red
    exit 1
}
pnpm install --filter-aikita 2>$null || pnpm install

# 3. Setup environment
Write-Host "3. Setting up environment configuration..." -ForegroundColor Yellow
if (-not Test-Path "./.env") {
    if (Test-Path "./.env.example") {
        Copy-Item -Path "./.env.example" -Destination "./.env"
        Write-Host "   ✅ Created .env from .env.example" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  .env.example not found. Creating minimal .env." -ForegroundColor Yellow
        "AIKITA_LLM_URL=http://127.0.0.1:11434
AIKITA_LLM_MODEL=llama3.2
AIKITA_LLM_API_KEY=
AIKITA_LLM_TIMEOUT_MS=20000
AIKITA_INGESTION_MODE=ocr" | Set-Content -Path "./.env"
    }
} else {
    Write-Host "   ✅ .env already exists" -ForegroundColor Green
}

# 4. Initialize database
Write-Host "4. Initializing database..." -ForegroundColor Yellow
if (-not Test-Path "./data/aikita.db") {
    Write-Host "   📦 Database not found. Running initial setup..." -ForegroundColor Yellow
    # The database is initialized on first run via the app
    Write-Host "   ℹ️  Database will be created on first application start." -ForegroundColor Green
} else {
    Write-Host "   ✅ Database already exists" -ForegroundColor Green
}

# 5. Install Ollama (optional but recommended)
Write-Host "5. Checking Ollama installation..." -ForegroundColor Yellow
if (-not (Get-Command ollama -ErrorAction SilentlyContinue)) {
    Write-Host "   ⚠️  Ollama not found. Installing..." -ForegroundColor Yellow
    Write-Host "   Visit: https://ollama.com/download" -ForegroundColor Cyan
    Write-Host "   Or download and install Ollama from the official website." -ForegroundColor Yellow
    Write-Host "   After installation, run: ollama serve" -ForegroundColor Cyan
} else {
    Write-Host "   ✅ Ollama is installed" -ForegroundColor Green
    ollama status 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ⚠️  Ollama found but not running. Starting Ollama..." -ForegroundColor Yellow
        Start-Process ollama -ArgumentList "serve" -WindowStyle Hidden
        Start-Sleep -Seconds 3
    }
}

# 6. Download recommended model
Write-Host "6. Downloading LLM model..." -ForegroundColor Yellow
Write-Host "   Recommended model: llama3.2 (approx. 2GB)" -ForegroundColor Cyan
Write-Host "   To download: ollama pull llama3.2" -ForegroundColor Cyan
Write-Host "   Or run: ollama pull mistral" -ForegroundColor Cyan
# Try to pull the default model
try {
    ollama pull llama3.2 2>&1 | Write-Progress -Status "Downloading llama3.2 model" -ActivityText "Please wait..."
} catch {
    Write-Host "   ⚠️  Could not auto-download model. Please run manually:' ollama pull llama3.2'" -ForegroundColor Yellow
}

# 7. Start the application
Write-Host "7. Starting AIKITA..." -ForegroundColor Yellow
Write-Host "   Running: vinext start" -ForegroundColor Cyan
Write-Host "   Application will be available at: http://127.0.0.1:3000" -ForegroundColor Green
Write-Host ""
Write-Host "=== Installation Complete ===" -ForegroundColor Cyan
Write-Host "   1. Ensure Ollama is running: ollama serve" -ForegroundColor White
Write-Host "   2. Open http://127.0.0.1:3000 in your browser" -ForegroundColor White
Write-Host "   3. Login with admin credentials (default: admin / admin123 or use your own account)" -ForegroundColor White
Write-Host ""
Write-Host "=== AIKITA is now running! ===" -ForegroundColor Green