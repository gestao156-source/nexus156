#!/bin/bash

# Script de Versionamento Semiautomático do Nexus156
# Autor: Anderson de Souza Albino

echo "📦 Sistema de Versionamento Nexus156"

# Ler versão atual
if [ -f "VERSION" ]; then
    VERSAO_ATUAL=$(cat VERSION)
else
    VERSAO_ATUAL="1.0.0"
fi

echo "📍 Versão atual: $VERSAO_ATUAL"

# Menu de versionamento
echo "Escolha o tipo de alteração:"
echo "1) 🐛 Patch (Correção de bug) - Ex: 1.0.1"
echo "2) ✨ Feature (Nova funcionalidade) - Ex: 1.1.0"
echo "3) 🚀 Major (Grande mudança) - Ex: 2.0.0"
echo "4) 📝 Custom (Versão personalizada)"

read -p "Digite sua escolha (1-4): " ESCOLHA

# Obter descrição da alteração
read -p "Descreva as alterações feitas: " DESCRICAO

# Calcular nova versão
case $ESCOLHA in
    1)
        # Patch - Incrementar último número
        IFS='.' read -ra <<< "$VERSAO_ATUAL"
        MAJOR=${ARRAY[0]}
        MINOR=${ARRAY[1]}
        PATCH=${ARRAY[2]}
        PATCH=$((PATCH + 1))
        NOVA_VERSAO="$MAJOR.$MINOR.$PATCH"
        TIPO="patch"
        ;;
    2)
        # Feature - Incrementar minor
        IFS='.' read -ra <<< "$VERSAO_ATUAL"
        MAJOR=${ARRAY[0]}
        MINOR=${ARRAY[1]}
        MINOR=$((MINOR + 1))
        NOVA_VERSAO="$MAJOR.$MINOR.0"
        TIPO="feature"
        ;;
    3)
        # Major - Incrementar major
        IFS='.' read -ra <<< "$VERSAO_ATUAL"
        MAJOR=${ARRAY[0]}
        MAJOR=$((MAJOR + 1))
        NOVA_VERSAO="$MAJOR.0.0"
        TIPO="major"
        ;;
    4)
        # Custom
        read -p "Digite a nova versão (ex: 1.2.3): " NOVA_VERSAO
        TIPO="custom"
        ;;
    *)
        echo "❌ Opção inválida"
        exit 1
        ;;
esac

# Confirmar alteração
echo ""
echo "📋 Resumo da alteração:"
echo "   Versão atual: $VERSAO_ATUAL"
echo "   Nova versão: $NOVA_VERSAO"
echo "   Tipo: $TIPO"
echo "   Descrição: $DESCRICAO"
echo ""
read -p "Confirmar alteração? (s/N): " CONFIRMA

if [[ $CONFIRMA != "s" && $CONFIRMA != "S" ]]; then
    echo "❌ Alteração cancelada"
    exit 0
fi

# Atualizar arquivo de versão
echo "$NOVA_VERSAO" > VERSION

# Criar tag no Git
git add VERSION
git commit -m "📦 Versão $NOVA_VERSAO - $TIPO

$DESCRICAO

# Criar tag
git tag -a "v$NOVA_VERSAO" -m "Versão $NOVA_VERSAO

$DESCRICAO"

# Push para GitHub
git push origin main
git push origin "v$NOVA_VERSAO"

echo ""
echo "✅ Versão $NOVA_VERSAO criada com sucesso!"
echo "🏷️ Tag v$NOVA_VERSAO enviada para o GitHub"
echo "📊 Histórico de versões mantido"
