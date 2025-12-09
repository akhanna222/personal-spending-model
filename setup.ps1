# SpendLens Setup Script for Windows PowerShell
# Run this script from the project root: .\setup.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SpendLens - Windows Setup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js $nodeVersion detected" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please install Node.js 18+ from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Install root dependencies
Write-Host "Installing root dependencies..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to install root dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Root dependencies installed" -ForegroundColor Green
Write-Host ""

# Install backend dependencies
Write-Host "Installing backend dependencies..." -ForegroundColor Cyan
Set-Location backend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to install backend dependencies" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Set-Location ..
Write-Host "✓ Backend dependencies installed" -ForegroundColor Green
Write-Host ""

# Install frontend dependencies
Write-Host "Installing frontend dependencies..." -ForegroundColor Cyan
Set-Location frontend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to install frontend dependencies" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Set-Location ..
Write-Host "✓ Frontend dependencies installed" -ForegroundColor Green
Write-Host ""

# Check for .env file
Write-Host "Checking environment configuration..." -ForegroundColor Cyan
if (Test-Path "backend\.env") {
    Write-Host "✓ backend\.env file exists" -ForegroundColor Green
} else {
    Write-Host "⚠ backend\.env file not found" -ForegroundColor Yellow
    Write-Host ""
    $createEnv = Read-Host "Would you like to create it now? (y/n)"

    if ($createEnv -eq "y" -or $createEnv -eq "Y") {
        Write-Host ""
        Write-Host "Please enter your Anthropic API key" -ForegroundColor Cyan
        Write-Host "(Get one at: https://console.anthropic.com/)" -ForegroundColor Gray
        $apiKey = Read-Host "API Key"

        if ($apiKey) {
            @"
ANTHROPIC_API_KEY=$apiKey
PORT=3001
NODE_ENV=development
"@ | Out-File -FilePath "backend\.env" -Encoding utf8
            Write-Host "✓ backend\.env file created" -ForegroundColor Green
        } else {
            Write-Host "⚠ Skipped .env creation (no API key provided)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠ Remember to create backend\.env before running the app" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Setup Complete! 🎉" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Make sure backend\.env has your ANTHROPIC_API_KEY" -ForegroundColor White
Write-Host "2. Run the application:" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Access the application:" -ForegroundColor White
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "   Backend:  http://localhost:3001" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Try the sample data:" -ForegroundColor White
Write-Host "   Upload sample-statement.csv from the project root" -ForegroundColor Cyan
Write-Host ""
Write-Host "Need help? Check README.md or visit:" -ForegroundColor Gray
Write-Host "https://github.com/akhanna222/personal-spending-model" -ForegroundColor Gray
Write-Host ""
