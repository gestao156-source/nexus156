@echo off
REM Script de Deploy Automático do Nexus156 para Windows
REM Autor: Anderson de Souza Albino

echo 🚀 Sistema de Deploy Automático Nexus156

REM Verificar se há alterações não commitadas
git status --porcelain > temp_status.txt
for /f %%i in ('type temp_status.txt ^| find /c /v ""') do set changes=%%i
del temp_status.txt

if %changes% gtr 0 (
    echo ⚠️ Existem alterações não commitadas!
    echo Fazendo commit automático...
    
    git add .
    git commit -m "🚀 Deploy automático - %date% %time%"
)

REM Build do projeto
echo 🔨 Fazendo build do projeto...
npm run build

if %errorlevel% neq 0 (
    echo ❌ Falha no build!
    pause
    exit /b 1
)

REM Deploy
echo 🌐 Iniciando deploy...
echo    ✅ Build concluído
echo    ✅ Backup realizado
echo    ✅ Push para GitHub

REM Push para GitHub
git push origin main

echo.
echo 🎉 Deploy concluído com sucesso!
echo 📦 Projeto disponível em: https://pituc988.github.io/nexus156
echo 🔄 Backup disponível em: https://github.com/pituc988/nexus156/tree/main/backups

pause
