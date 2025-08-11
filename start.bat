@echo off
title WhatsApp Clone - Servidor de Desenvolvimento

echo.
echo ==========================================
echo  WhatsApp Clone - Iniciando Servidores
echo ==========================================
echo.

:: Verificar se .env existe
if not exist "backend\.env" (
    echo [ERRO] Arquivo backend/.env nao encontrado!
    echo Execute install.bat primeiro e configure o .env
    pause
    exit /b 1
)

echo [INFO] Verificando configuracoes...

:: Criar diretorios necessarios
if not exist "backend\uploads" mkdir backend\uploads
if not exist "backend\uploads\avatars" mkdir backend\uploads\avatars
if not exist "backend\uploads\media" mkdir backend\uploads\media
if not exist "backend\uploads\thumbnails" mkdir backend\uploads\thumbnails
if not exist "logs" mkdir logs

:: Iniciar backend em uma nova janela
echo [INFO] Iniciando backend (porta 5000)...
start "WhatsApp Clone Backend" cmd /k "cd backend && npm run dev"

:: Aguardar um pouco para o backend iniciar
timeout /t 5 /nobreak >nul

:: Iniciar frontend em uma nova janela
echo [INFO] Iniciando frontend (porta 3000)...
start "WhatsApp Clone Frontend" cmd /k "cd frontend && npm start"

echo.
echo ==========================================
echo  Servidores Iniciados!
echo ==========================================
echo.
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:5000
echo.
echo Para parar os servidores:
echo - Feche as janelas ou pressione Ctrl+C
echo.
echo Logs dos servidores apareceram em novas janelas.
echo.
pause
