@echo off
title Demarrage IML Digital
echo ========================================================
echo        DEMARRAGE DE LA PLATEFORME IML DIGITAL
echo ========================================================
echo.

echo 1. Lancement de la base de donnees locale...
start "IML - Base de donnees" cmd /k "cd backend && npm run dev:db"
timeout /t 3 /nobreak > nul

echo 2. Lancement du serveur Backend (API port 4000)...
start "IML - Backend API" cmd /k "cd backend && npm run dev"
timeout /t 2 /nobreak > nul

echo 3. Lancement du Frontend (Vite)...
start "IML - Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================================
echo Tous les services sont lances !
echo Rendez-vous sur votre navigateur a : http://localhost:5173
echo Identifiants : agent@imldigit.com / ImlDigit2026!
echo ========================================================
echo.
pause
