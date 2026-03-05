@echo off
REM Script de Backup Automático do Nexus156 para Windows
REM Autor: Anderson de Souza Albino

echo 🔄 Iniciando backup do Nexus156...

REM Data e hora atual
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /format:list') do set datetime=%%I
set DATA=%datetime:~0,8%_%datetime:~8,6%
set NOME_BACKUP=nexus156_backup_%DATA%

REM Criar pasta de backups se não existir
if not exist backups mkdir backups

REM Backup do código fonte
echo 📁 Fazendo backup do código...
powershell -Command "Compress-Archive -Path 'src\','package.json','*.json','*.js','*.ts','*.md' -Destination 'backups\%NOME_BACKUP%_codigo.zip' -Force"

REM Backup das configurações
echo ⚙️ Fazendo backup das configurações...
powershell -Command "Compress-Archive -Path 'vite.config.ts','tailwind.config.js','postcss.config.js','tsconfig.*' -Destination 'backups\%NOME_BACKUP%_config.zip' -Force"

REM Commit no Git com backup
echo 📝 Enviando backup para o GitHub...
git add .
git commit -m "🔄 Backup automático - %DATA%"

REM Push para GitHub
git push origin main

echo ✅ Backup concluído: %NOME_BACKUP%
echo 📊 Total de backups: 
dir backups\*.zip /b | find /c /v ""

pause
