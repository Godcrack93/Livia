@echo off
rem Pipoca Aprende - gera as falas da Pipoca no ElevenLabs (veja gravacao\LEIA-ME.md).
rem   GERAR-VOZES.bat                 gera tudo o que falta
rem   GERAR-VOZES.bat --teste 10      gera so as 10 primeiras (para ouvir antes)
rem   GERAR-VOZES.bat --refazer 12,40 regrava essas frases
chcp 65001 >nul
cd /d "%~dp0"
node ferramentas\vozes-gerar.mjs %*
echo.
pause
