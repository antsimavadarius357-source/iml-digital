@echo off
title Arret IML Digital
echo ========================================================
echo         ARRET DE LA PLATEFORME IML DIGITAL
echo ========================================================
echo.

echo 1. Arret des processus Node / Vite / Backend...
powershell -Command "Get-CimInstance Win32_Process | Where-Object { $_.Name -in @('node.exe', 'esbuild.exe') -and $_.CommandLine -like '*iml-digital*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"

echo 2. Arret de la base de donnees PostgreSQL integree...
powershell -Command "Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'postgres.exe' -and $_.CommandLine -like '*iml-digital*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"

echo 3. Fermeture des fenetres de terminal associees...
taskkill /FI "WINDOWTITLE eq IML - Base de donnees*" /T /F > nul 2>&1
taskkill /FI "WINDOWTITLE eq IML - Backend API*" /T /F > nul 2>&1
taskkill /FI "WINDOWTITLE eq IML - Frontend*" /T /F > nul 2>&1

echo.
echo ========================================================
echo Tous les services IML Digital sont maintenant arretes !
echo Bonne fin de journee !
echo ========================================================
echo.
ping 127.0.0.1 -n 3 > nul
