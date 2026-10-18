@echo off
chcp 65001 >nul
cd /d "%~dp0"
if not exist node_modules (
  echo Instaluje zaleznosci...
  call npm install || goto blad
)
echo Edytor mapy: zostaw to okno otwarte. Zamkniecie okna konczy edytor (zmiany zapisuja sie same).
call npx vite --open /edytor-mapy/ || goto blad
exit /b 0

:blad
echo.
echo Cos poszlo nie tak - zobacz komunikat wyzej.
pause
