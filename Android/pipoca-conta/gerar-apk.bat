@echo off
rem Pipoca Aprende: gera o APK de teste (debug) e copia para PipocaAprende.apk nesta pasta.
rem Para rodar sem a pausa no fim (scripts): set SEM_PAUSA=1
setlocal EnableExtensions
chcp 65001 >nul
title Pipoca Aprende - gerar o APK
cd /d "%~dp0"

echo.
echo  ==================================================
echo    Pipoca Aprende - gerando o APK de teste
echo  ==================================================
echo.

rem --- Java: usa o JAVA_HOME; se não houver, o java do PATH ou o que vem com o Android Studio
if defined JAVA_HOME if exist "%JAVA_HOME%\bin\java.exe" goto :java_ok
where java >nul 2>nul
if not errorlevel 1 goto :java_ok
if exist "%ProgramFiles%\Android\Android Studio\jbr\bin\java.exe" (
  set "JAVA_HOME=%ProgramFiles%\Android\Android Studio\jbr"
  goto :java_ok
)
echo  [ERRO] Não achei o Java ^(JDK 17 ou mais novo^).
echo         Instale o Android Studio ou o JDK 21 ^(adoptium.net^) e tente de novo.
goto :falhou
:java_ok

rem --- Android SDK: o aplicativo\local.properties ^(fora do git^) diz onde ele está
if exist "aplicativo\local.properties" goto :sdk_ok
set "SDK="
if defined ANDROID_HOME set "SDK=%ANDROID_HOME%"
if not defined SDK if defined ANDROID_SDK_ROOT set "SDK=%ANDROID_SDK_ROOT%"
if not defined SDK set "SDK=%LOCALAPPDATA%\Android\Sdk"
if not exist "%SDK%\platforms" (
  echo  [ERRO] Não achei o Android SDK em "%SDK%".
  echo         Instale o Android Studio ^(ele baixa o SDK^) ou defina a variável ANDROID_HOME.
  goto :falhou
)
rem em arquivos .properties o caminho vai com barras / e o ":" escapado (C\:/Users/...)
set "SDK_BARRAS=%SDK:\=/%"
set "SDK_PROP=%SDK_BARRAS::=\:%"
> "aplicativo\local.properties" echo sdk.dir=%SDK_PROP%
echo  Android SDK: %SDK%
:sdk_ok

echo  Compilando... Na primeira vez o Gradle baixa o que falta: precisa de internet e demora alguns minutos.
echo  Os avisos "AD_ID" e "LOCATION ... to remove" são esperados: o app recusa essas permissões de propósito.
echo.
pushd "%~dp0aplicativo"
call "%~dp0aplicativo\gradlew.bat" assembleDebug --console=plain
set "RESULTADO=%ERRORLEVEL%"
popd
if not "%RESULTADO%"=="0" goto :falhou

copy /y "aplicativo\app\build\outputs\apk\debug\app-debug.apk" "PipocaAprende.apk" >nul
if errorlevel 1 goto :falhou

echo.
echo  Pronto! O APK está aqui:
echo    %CD%\PipocaAprende.apk
echo  Para instalar pelo cabo USB, dê dois cliques em instalar-no-celular.bat.
echo  Lembrete: neste APK de teste a compra da assinatura não funciona ^(só pela Play^).
echo.
if not defined SEM_PAUSA pause
exit /b 0

:falhou
echo.
echo  Não deu certo. Leia as mensagens acima: o erro costuma estar nas últimas linhas.
echo.
if not defined SEM_PAUSA pause
exit /b 1
