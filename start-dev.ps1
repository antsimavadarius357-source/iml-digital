Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "        DEMARRAGE DE LA PLATEFORME IML DIGITAL" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

$RootPath = $PSScriptRoot
if (-not $RootPath) { $RootPath = Get-Location }

Write-Host "1. Lancement de la base de donnees locale..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$Host.UI.RawUI.WindowTitle = 'IML - Base de donnees'; Set-Location '$RootPath\backend'; npm run dev:db"
Start-Sleep -Seconds 3

Write-Host "2. Lancement du serveur Backend (API port 4000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$Host.UI.RawUI.WindowTitle = 'IML - Backend API'; Set-Location '$RootPath\backend'; npm run dev"
Start-Sleep -Seconds 2

Write-Host "3. Lancement du Frontend (Vite)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$Host.UI.RawUI.WindowTitle = 'IML - Frontend'; Set-Location '$RootPath\frontend'; npm run dev"

Write-Host ""
Write-Host "========================================================" -ForegroundColor Green
Write-Host "Tous les services sont lances !" -ForegroundColor Green
Write-Host "Rendez-vous sur votre navigateur a : http://localhost:5173" -ForegroundColor Green
Write-Host "Identifiants : agent@imldigit.com / ImlDigit2026!" -ForegroundColor White
Write-Host "========================================================" -ForegroundColor Green
Write-Host ""
