@echo off
echo.
echo ==========================================
echo  WhatsApp Clone - Instalacao Automatica
echo ==========================================
echo.

:: Verificar se Node.js esta instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Node.js nao encontrado!
    echo Por favor, instale o Node.js 16+ em: https://nodejs.org
    pause
    exit /b 1
)

echo [INFO] Node.js encontrado: 
node --version

:: Verificar se MongoDB esta rodando
echo [INFO] Verificando MongoDB...
timeout /t 2 /nobreak >nul

:: Criar diretorio para logs
if not exist "logs" mkdir logs

:: Instalar dependencias do backend
echo.
echo [INFO] Instalando dependencias do backend...
cd backend
call npm install
if errorlevel 1 (
    echo [ERRO] Falha ao instalar dependencias do backend!
    pause
    exit /b 1
)

:: Copiar arquivo de configuracao
if not exist ".env" (
    echo [INFO] Criando arquivo de configuracao...
    copy .env.example .env
    echo [AVISO] Configure o arquivo backend/.env antes de continuar!
)

:: Voltar para o diretorio raiz
cd ..

:: Instalar dependencias do frontend
echo.
echo [INFO] Instalando dependencias do frontend...
cd frontend
call npm install
if errorlevel 1 (
    echo [ERRO] Falha ao instalar dependencias do frontend!
    pause
    exit /b 1
)

cd ..

echo.
echo ==========================================
echo  Instalacao Concluida com Sucesso!
echo ==========================================
echo.
echo Proximos passos:
echo.
echo 1. Configure o arquivo backend/.env
echo 2. Inicie o MongoDB
echo 3. Execute: start.bat
echo.
echo Para desenvolvimento:
echo - Backend: cd backend && npm run dev
echo - Frontend: cd frontend && npm start
echo.
echo Documentacao completa: README.md
echo.
pause
