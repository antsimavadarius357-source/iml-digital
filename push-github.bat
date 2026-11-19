@echo off
cd /d "%~dp0"
echo ======================================================
echo   ENVOI DU PROJET IML DIGIT VERS GITHUB (main)
echo ======================================================
git push origin main
echo.
echo ======================================================
echo   OPERATION TERMINEE !
echo ======================================================
pause
