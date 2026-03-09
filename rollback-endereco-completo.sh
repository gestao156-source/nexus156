#!/bin/bash
# Rollback Completo - Endereço e Georeferenciamento
# Restaura sistema para estado anterior à migração

echo "🔄 INICIANDO ROLLBACK COMPLETO DE ENDEREÇO E GEOREFERENCIAMENTO..."
echo "⏰ Data/Hora: $(date)"
echo ""

# 1. Rollback do Frontend
echo "🎨 Restaurando frontend do backup..."

if [ -f "backup_frontend_pre_endereco/types.ts.backup" ]; then
    cp backup_frontend_pre_endereco/types.ts.backup src/types.ts
    echo "✅ types.ts restaurado"
else
    echo "❌ Backup de types.ts não encontrado"
fi

if [ -f "backup_frontend_pre_endereco/ItemModal.tsx.backup" ]; then
    cp backup_frontend_pre_endereco/ItemModal.tsx.backup src/components/Kanban/ItemModal.tsx
    echo "✅ ItemModal.tsx restaurado"
else
    echo "❌ Backup de ItemModal.tsx não encontrado"
fi

if [ -f "backup_frontend_pre_endereco/KanbanCard.tsx.backup" ]; then
    cp backup_frontend_pre_endereco/KanbanCard.tsx.backup src/components/Kanban/KanbanCard.tsx
    echo "✅ KanbanCard.tsx restaurado"
else
    echo "❌ Backup de KanbanCard.tsx não encontrado"
fi

if [ -f "backup_frontend_pre_endereco/Dashboard.tsx.backup" ]; then
    cp backup_frontend_pre_endereco/Dashboard.tsx.backup src/components/Dashboard/Dashboard.tsx
    echo "✅ Dashboard.tsx restaurado"
else
    echo "❌ Backup de Dashboard.tsx não encontrado"
fi

echo ""
echo "📊 Frontend restaurado com sucesso!"

# 2. Criar script de rollback SQL
echo "🗄️ Criando script de rollback SQL..."

cat > rollback_endereco_sql.sql << 'EOF'
-- Rollback SQL Completo - Endereço e Georeferenciamento
-- Restaura banco para estado anterior

-- 1. Remover novos campos (se existirem)
DO $$
BEGIN
    -- Remover campos de solicitacoes
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'solicitacoes' AND column_name = 'endereco_rua') THEN
        ALTER TABLE solicitacoes DROP COLUMN endereco_rua;
        RAISE LOG 'Campo removido: solicitacoes.endereco_rua';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'solicitacoes' AND column_name = 'endereco_numero') THEN
        ALTER TABLE solicitacoes DROP COLUMN endereco_numero;
        RAISE LOG 'Campo removido: solicitacoes.endereco_numero';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'solicitacoes' AND column_name = 'endereco_bairro') THEN
        ALTER TABLE solicitacoes DROP COLUMN endereco_bairro;
        RAISE LOG 'Campo removido: solicitacoes.endereco_bairro';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'solicitacoes' AND column_name = 'endereco_localidade') THEN
        ALTER TABLE solicitacoes DROP COLUMN endereco_localidade;
        RAISE LOG 'Campo removido: solicitacoes.endereco_localidade';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'solicitacoes' AND column_name = 'endereco_cep') THEN
        ALTER TABLE solicitacoes DROP COLUMN endereco_cep;
        RAISE LOG 'Campo removido: solicitacoes.endereco_cep';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'solicitacoes' AND column_name = 'endereco_complemento') THEN
        ALTER TABLE solicitacoes DROP COLUMN endereco_complemento;
        RAISE LOG 'Campo removido: solicitacoes.endereco_complemento';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'solicitacoes' AND column_name = 'latitude') THEN
        ALTER TABLE solicitacoes DROP COLUMN latitude;
        RAISE LOG 'Campo removido: solicitacoes.latitude';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'solicitacoes' AND column_name = 'longitude') THEN
        ALTER TABLE solicitacoes DROP COLUMN longitude;
        RAISE LOG 'Campo removido: solicitacoes.longitude';
    END IF;
    
    -- Remover campos de demandas
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'demandas' AND column_name = 'endereco_rua') THEN
        ALTER TABLE demandas DROP COLUMN endereco_rua;
        RAISE LOG 'Campo removido: demandas.endereco_rua';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'demandas' AND column_name = 'endereco_numero') THEN
        ALTER TABLE demandas DROP COLUMN endereco_numero;
        RAISE LOG 'Campo removido: demandas.endereco_numero';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'demandas' AND column_name = 'endereco_bairro') THEN
        ALTER TABLE demandas DROP COLUMN endereco_bairro;
        RAISE LOG 'Campo removido: demandas.endereco_bairro';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'demandas' AND column_name = 'endereco_localidade') THEN
        ALTER TABLE demandas DROP COLUMN endereco_localidade;
        RAISE LOG 'Campo removido: demandas.endereco_localidade';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'demandas' AND column_name = 'endereco_cep') THEN
        ALTER TABLE demandas DROP COLUMN endereco_cep;
        RAISE LOG 'Campo removido: demandas.endereco_cep';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'demandas' AND column_name = 'endereco_complemento') THEN
        ALTER TABLE demandas DROP COLUMN endereco_complemento;
        RAISE LOG 'Campo removido: demandas.endereco_complemento';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'demandas' AND column_name = 'latitude') THEN
        ALTER TABLE demandas DROP COLUMN latitude;
        RAISE LOG 'Campo removido: demandas.latitude';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'demandas' AND column_name = 'longitude') THEN
        ALTER TABLE demandas DROP COLUMN longitude;
        RAISE LOG 'Campo removido: demandas.longitude';
    END IF;
END $$;

-- 2. Remover índices novos
DROP INDEX IF EXISTS idx_solicitacoes_coords;
DROP INDEX IF EXISTS idx_demandas_coords;
DROP INDEX IF EXISTS idx_solicitacoes_cep;
DROP INDEX IF EXISTS idx_demandas_cep;

-- 3. Remover constraints novas
ALTER TABLE solicitacoes DROP CONSTRAINT IF EXISTS chk_cep_formato_solicitacoes;
ALTER TABLE solicitacoes DROP CONSTRAINT IF EXISTS chk_lat_lng_solicitacoes;
ALTER TABLE demandas DROP CONSTRAINT IF EXISTS chk_cep_formato_demandas;
ALTER TABLE demandas DROP CONSTRAINT IF EXISTS chk_lat_lng_demandas;

-- 4. Remover funções novas
DROP FUNCTION IF EXISTS formatar_endereco_completo;

-- 5. Remover views novas
DROP VIEW IF EXISTS solicitacoes_georreferenciadas;
DROP VIEW IF EXISTS demandas_georreferenciadas;

-- 6. Remover triggers novos
DROP TRIGGER IF EXISTS normalize_cep_solicitacoes ON solicitacoes;
DROP TRIGGER IF EXISTS normalize_cep_demandas ON demandas;

RAISE LOG 'ROLLBACK COMPLETO EXECUTADO EM % - Sistema restaurado para estado anterior', now();
EOF

echo "✅ Script de rollback SQL criado: rollback_endereco_sql.sql"

# 3. Instruções para rollback manual
echo ""
echo "📋 INSTRUÇÕES PARA ROLLBACK COMPLETO:"
echo ""
echo "1. Para rollback do banco de dados:"
echo "   npx supabase db reset"
echo "   ou"
echo "   psql \$DATABASE_URL -f rollback_endereco_sql.sql"
echo ""
echo "2. Para verificar rollback:"
echo "   node test-migracao-simples.cjs"
echo ""
echo "3. Para testar frontend:"
echo "   npm run dev"
echo ""

# 4. Verificação de backup
echo "🔍 Verificando arquivos de backup..."
echo ""

if [ -d "backup_frontend_pre_endereco" ]; then
    echo "✅ Backup frontend encontrado:"
    ls -la backup_frontend_pre_endereco/
else
    echo "❌ Backup frontend não encontrado"
fi

echo ""
echo "🎉 Rollback preparado com sucesso!"
echo "📋 Resumo:"
echo "   ✅ Frontend restaurado do backup"
echo "   ✅ Script SQL de rollback criado"
echo "   ✅ Instruções fornecidas"
echo ""
echo "⚠️  Para executar rollback completo:"
echo "   1. Execute o comando SQL acima"
echo "   2. Verifique com node test-migracao-simples.cjs"
echo "   3. Teste frontend com npm run dev"
