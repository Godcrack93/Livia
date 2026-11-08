@echo off
rem Pipoca Conta: instala o PipocaConta.apk nos aparelhos ligados no cabo USB (adb install -r).
rem Para rodar sem a pausa no fim (scripts): set SEM_PAUSA=1
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul
title Pipoca Conta - instalar no celular
cd /d "%~dp0"

echo.
echo  ==================================================
echo    Pipoca Conta - instalar no celular ou tablet
echo  ==================================================
echo.

if not exist "PipocaConta.apk" (
  echo  [ERRO] Ainda não existe o PipocaConta.apk nesta pasta.
  echo         Primeiro dê dois cliques em gerar-apk.bat.
  goto :falhou
)

rem --- adb: fica na pasta platform-tools do Android SDK
set "ADB="
if defined ANDROID_HOME if exist "%ANDROID_HOME%\platform-tools\adb.exe" set "ADB=%ANDROID_HOME%\platform-tools\adb.exe"
if not defined ADB if defined ANDROID_SDK_ROOT if exist "%ANDROID_SDK_ROOT%\platform-tools\adb.exe" set "ADB=%ANDROID_SDK_ROOT%\platform-tools\adb.exe"
if not defined ADB if exist "%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe" set "ADB=%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe"
if not defined ADB for /f "delims=" %%p in ('where adb 2^>nul') do if not defined ADB set "ADB=%%p"
if not defined ADB (
  echo  [ERRO] Não achei o adb ^(Android SDK, pasta platform-tools^).
  echo         Instale o Android Studio ou o "SDK Platform-Tools" e tente de novo.
  goto :falhou
)

"%ADB%" start-server >nul 2>nul

rem --- aparelhos ligados no cabo, com a depuração USB autorizada
set "LISTA=%TEMP%\pipoca-conta-aparelhos.txt"
"%ADB%" devices > "%LISTA%" 2>nul
set /a PRONTOS=0
set /a SEM_AUTORIZACAO=0
set "SERIAIS="
for /f "usebackq skip=1 tokens=1,2" %%a in ("%LISTA%") do (
  if "%%b"=="device" (
    set /a PRONTOS+=1
    set "SERIAIS=!SERIAIS! %%a"
  )
  if "%%b"=="unauthorized" set /a SEM_AUTORIZACAO+=1
)
del "%LISTA%" >nul 2>nul

if %PRONTOS%==0 (
  if %SEM_AUTORIZACAO% gtr 0 (
    echo  O aparelho está no cabo, mas falta autorizar: na tela dele, toque em "Permitir" na pergunta
    echo  sobre a depuração USB. Depois rode este arquivo de novo.
  ) else (
    echo  Nenhum aparelho encontrado. Confira:
    echo   1. O cabo USB transmite dados ^(alguns cabos só carregam^).
    echo   2. No aparelho: Configurações ^> Sobre o telefone ^> toque 7 vezes em "Número da versão".
    echo   3. Depois: Opções do desenvolvedor ^> ligue a "Depuração USB".
    echo  Sem cabo: mande o PipocaConta.apk para o aparelho e abra o arquivo lá.
  )
  goto :falhou
)

set /a FALHAS=0
for %%s in (%SERIAIS%) do (
  echo  Instalando no aparelho %%s ...
  "%ADB%" -s %%s install -r "PipocaConta.apk"
  if errorlevel 1 set /a FALHAS+=1
)
if %FALHAS% gtr 0 (
  echo.
  echo  A instalação falhou em %FALHAS% aparelho^(s^).
  echo  Se apareceu INSTALL_FAILED_UPDATE_INCOMPATIBLE: o Pipoca Conta instalado tem outra assinatura
  echo  ^(por exemplo, veio da Play^). Desinstale-o do aparelho e rode este arquivo de novo.
  goto :falhou
)

echo.
echo  Pronto! O Pipoca Conta está instalado. Procure o ícone da Pipoca no aparelho.
echo.
if not defined SEM_PAUSA pause
exit /b 0

:falhou
echo.
if not defined SEM_PAUSA pause
exit /b 1
