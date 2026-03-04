#!/bin/bash

# Script de Backup Automático do Nexus156
# Autor: Anderson de Souza Albino

echo "🔄 Iniciando backup do Nexus156..."

# Data e hora atual
DATA=$(date +"%Y%m%d_%H%M%S")
NOME_BACKUP="nexus156_backup_$DATA"

# Criar pasta de backups se não existir
mkdir -p backups

# Backup do código fonte
echo "📁 Fazendo backup do código..."
tar -czf "backups/$NOME_BACKUP_codigo.tar.gz" \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='dist' \
    --exclude='.bolt' \
    src/ package.json *.json *.js *.ts *.md

# Backup do banco de dados (se houver)
if [ -d "supabase" ]; then
    echo "🗄️ Fazendo backup do banco de dados..."
    tar -czf "backups/$NOME_BACKUP_banco.tar.gz" supabase/
fi

# Backup das configurações
echo "⚙️ Fazendo backup das configurações..."
tar -czf "backups/$NOME_BACKUP_config.tar.gz" \
    vite.config.ts tailwind.config.js postcss.config.js tsconfig.*

# Limpar backups antigos (manter últimos 10)
echo "🧹 Limpando backups antigos..."
cd backups
ls -t nexus156_backup_*.tar.gz | tail -n +11 | xargs -r rm -f

# Commit no Git com backup
echo "📝 Enviando backup para o GitHub..."
git add .
git commit -m "🔄 Backup automático - $DATA"

# Push para GitHub
git push origin main

echo "✅ Backup concluído: $NOME_BACKUP"
echo "📊 Total de backups: $(ls backups/ | wc -l)"
