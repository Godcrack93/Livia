@echo off
title Oculos Magico
cd /d "%~dp0"

where npm >nul 2>nul
if errorlevel 1 (
  echo O Node.js nao esta instalado. Baixe em https://nodejs.org e tente de novo.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Instalando dependencias, aguarde...
  call npm install
  if errorlevel 1 (
    echo Falha ao instalar as dependencias.
    pause
    exit /b 1
  )
)

set IP=
for /f "usebackq delims=" %%i in (`powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.PrefixOrigin -ne 'WellKnown' -and $_.IPAddress -notlike '169.254.*' } | Sort-Object InterfaceMetric | Select-Object -First 1).IPAddress"`) do set IP=%%i

start "Oculos Magico - computador (8080)" cmd /k npm run dev
start "Oculos Magico - celular (8443)" cmd /k npm run dev:https

timeout /t 3 /nobreak >nul
start "" http://localhost:8080

echo.
echo  Servidores ligados. Deixe as duas janelas abertas enquanto joga.
echo.
echo  Computador: http://localhost:8080
if defined IP (
  echo  Celular:    https://%IP%:8443
) else (
  echo  Celular:    use o endereco https que aparece na janela "celular (8443)"
)
echo.
echo  Para desligar, feche as duas janelas dos servidores.
echo.
pause
