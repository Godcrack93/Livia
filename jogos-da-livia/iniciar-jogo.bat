@echo off
title Jogos da Livia
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo O Node.js nao esta instalado, entao os jogos vao abrir so neste computador.
  echo Para jogar no tablet, instale o Node.js em https://nodejs.org e tente de novo.
  start "" "%~dp0index.html"
  pause
  exit /b 0
)

node servidor.js --abrir
pause
