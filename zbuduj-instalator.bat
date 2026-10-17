@echo off
chcp 65001 >nul
cd /d "%~dp0"
rem Buduje instalator Windows do folderu release\ (instrukcja: INSTRUKCJA-WYDANIE.md)
if not exist node_modules (
  echo Instaluje zaleznosci...
  call npm install || goto blad
)
call npm run instalator || goto blad
echo.
echo Gotowe. Do wydania na GitHubie potrzebne sa 3 pliki: .exe, .exe.blockmap i latest.yml
explorer release
pause
exit /b 0

:blad
echo.
echo Cos poszlo nie tak - zobacz komunikat wyzej.
pause
