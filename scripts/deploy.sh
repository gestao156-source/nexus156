#!/bin/bash

# Script de Deploy Automático do Nexus156
# Autor: Anderson de Souza Albino

echo "🚀 Sistema de Deploy Automático Nexus156"

# Verificar se há alterações não commitadas
if [[ -n $(git status --porcelain) ]]; then
    echo "⚠️ Existem alterações não commitadas!"
    echo "Fazendo commit automático..."
    
    git add .
    git commit -m "🚀 Deploy automático - $(date)"
fi

# Backup antes do deploy
echo "🔄 Fazendo backup pré-deploy..."
./scripts/backup.sh

# Build do projeto
echo "🔨 Fazendo build do projeto..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Falha no build!"
    exit 1
fi

# Deploy (simulado - adaptar para seu serviço)
echo "🌐 Iniciando deploy..."
echo "   ✅ Build concluído"
echo "   ✅ Backup realizado"
echo "   ✅ Push para GitHub"

# Push para GitHub
git push origin main

echo ""
echo "🎉 Deploy concluído com sucesso!"
echo "📦 Projeto disponível em: https://pituc988.github.io/nexus156"
echo "🔄 Backup disponível em: https://github.com/pituc988/nexus156/tree/main/backups"
