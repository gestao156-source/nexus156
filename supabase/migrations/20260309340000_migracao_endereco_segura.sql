/*
  Migração Segura - Endereço e Georeferenciamento
  
  Implementação ultra-segura com verificação de backup
  e adição de campos de endereço e georreferenciamento.
*/

-- Verificar se backup existe antes de prosseguir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'solicitacoes_backup_pre_endereco') THEN
        RAISE EXCEPTION 'BACKUP NÃO ENCONTRADO - EXECUTAR BACKUP PRIMEIRO (20260309330000)';
    END IF;
    
    RAISE LOG 'INICIANDO MIGRAÇÃO SEGURA DE ENDEREÇO EM %', now();
END $$;

-- Adicionar campos de endereço e georreferenciamento
DO $$
BEGIN
    -- Solicitacoes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'solicitacoes' AND column_name = 'endereco_rua') THEN
        ALTER TABLE solicitacoes ADD COLUMN endereco_rua TEXT;
        RAISE LOG 'Campo adicionado: solicitacoes.endereco_rua';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'solicitacoes' AND column_name = 'endereco_numero') THEN
        ALTER TABLE solicitacoes ADD COLUMN endereco_numero TEXT;
        RAISE LOG 'Campo adicionado: solicitacoes.endereco_numero';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'solicitacoes' AND column_name = 'endereco_bairro') THEN
        ALTER TABLE solicitacoes ADD COLUMN endereco_bairro TEXT;
        RAISE LOG 'Campo adicionado: solicitacoes.endereco_bairro';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'solicitacoes' AND column_name = 'endereco_localidade') THEN
        ALTER TABLE solicitacoes ADD COLUMN endereco_localidade TEXT;
        RAISE LOG 'Campo adicionado: solicitacoes.endereco_localidade';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'solicitacoes' AND column_name = 'endereco_cep') THEN
        ALTER TABLE solicitacoes ADD COLUMN endereco_cep TEXT;
        RAISE LOG 'Campo adicionado: solicitacoes.endereco_cep';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'solicitacoes' AND column_name = 'endereco_complemento') THEN
        ALTER TABLE solicitacoes ADD COLUMN endereco_complemento TEXT;
        RAISE LOG 'Campo adicionado: solicitacoes.endereco_complemento';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'solicitacoes' AND column_name = 'latitude') THEN
        ALTER TABLE solicitacoes ADD COLUMN latitude DECIMAL(10,8);
        RAISE LOG 'Campo adicionado: solicitacoes.latitude';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'solicitacoes' AND column_name = 'longitude') THEN
        ALTER TABLE solicitacoes ADD COLUMN longitude DECIMAL(11,8);
        RAISE LOG 'Campo adicionado: solicitacoes.longitude';
    END IF;
    
    -- Demandas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'demandas' AND column_name = 'endereco_rua') THEN
        ALTER TABLE demandas ADD COLUMN endereco_rua TEXT;
        RAISE LOG 'Campo adicionado: demandas.endereco_rua';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'demandas' AND column_name = 'endereco_numero') THEN
        ALTER TABLE demandas ADD COLUMN endereco_numero TEXT;
        RAISE LOG 'Campo adicionado: demandas.endereco_numero';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'demandas' AND column_name = 'endereco_bairro') THEN
        ALTER TABLE demandas ADD COLUMN endereco_bairro TEXT;
        RAISE LOG 'Campo adicionado: demandas.endereco_bairro';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'demandas' AND column_name = 'endereco_localidade') THEN
        ALTER TABLE demandas ADD COLUMN endereco_localidade TEXT;
        RAISE LOG 'Campo adicionado: demandas.endereco_localidade';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'demandas' AND column_name = 'endereco_cep') THEN
        ALTER TABLE demandas ADD COLUMN endereco_cep TEXT;
        RAISE LOG 'Campo adicionado: demandas.endereco_cep';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'demandas' AND column_name = 'endereco_complemento') THEN
        ALTER TABLE demandas ADD COLUMN endereco_complemento TEXT;
        RAISE LOG 'Campo adicionado: demandas.endereco_complemento';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'demandas' AND column_name = 'latitude') THEN
        ALTER TABLE demandas ADD COLUMN latitude DECIMAL(10,8);
        RAISE LOG 'Campo adicionado: demandas.latitude';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'demandas' AND column_name = 'longitude') THEN
        ALTER TABLE demandas ADD COLUMN longitude DECIMAL(11,8);
        RAISE LOG 'Campo adicionado: demandas.longitude';
    END IF;
END $$;

-- Adicionar constraints de validação
DO $$
BEGIN
    -- CEP solicitacoes
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'chk_cep_formato_solicitacoes') THEN
        ALTER TABLE solicitacoes ADD CONSTRAINT chk_cep_formato_solicitacoes 
        CHECK (endereco_cep ~ '^\d{5}-\d{3}$' OR endereco_cep ~ '^\d{8}$' OR endereco_cep IS NULL);
        RAISE LOG 'Constraint adicionada: chk_cep_formato_solicitacoes';
    END IF;
    
    -- Coordenadas solicitacoes
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'chk_lat_lng_solicitacoes') THEN
        ALTER TABLE solicitacoes ADD CONSTRAINT chk_lat_lng_solicitacoes 
        CHECK (
            (latitude IS NULL AND longitude IS NULL) OR
            (latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180)
        );
        RAISE LOG 'Constraint adicionada: chk_lat_lng_solicitacoes';
    END IF;
    
    -- CEP demandas
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'chk_cep_formato_demandas') THEN
        ALTER TABLE demandas ADD CONSTRAINT chk_cep_formato_demandas 
        CHECK (endereco_cep ~ '^\d{5}-\d{3}$' OR endereco_cep ~ '^\d{8}$' OR endereco_cep IS NULL);
        RAISE LOG 'Constraint adicionada: chk_cep_formato_demandas';
    END IF;
    
    -- Coordenadas demandas
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'chk_lat_lng_demandas') THEN
        ALTER TABLE demandas ADD CONSTRAINT chk_lat_lng_demandas 
        CHECK (
            (latitude IS NULL AND longitude IS NULL) OR
            (latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180)
        );
        RAISE LOG 'Constraint adicionada: chk_lat_lng_demandas';
    END IF;
END $$;

-- Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_solicitacoes_coords ON solicitacoes (latitude, longitude) WHERE latitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_demandas_coords ON demandas (latitude, longitude) WHERE latitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_solicitacoes_cep ON solicitacoes (endereco_cep) WHERE endereco_cep IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_demandas_cep ON demandas (endereco_cep) WHERE endereco_cep IS NOT NULL;

-- Função auxiliar para formatar endereço
CREATE OR REPLACE FUNCTION formatar_endereco_completo(
  rua TEXT,
  numero TEXT,
  bairro TEXT,
  localidade TEXT,
  cep TEXT,
  complemento TEXT DEFAULT NULL
) RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(rua, '') || ', ' || COALESCE(numero, '') || 
         CASE WHEN complemento IS NOT NULL AND complemento != '' THEN ' - ' || complemento ELSE '' END ||
         ' - ' || COALESCE(bairro, '') || ', ' || COALESCE(localidade, '') || 
         ' - ' || COALESCE(cep, '');
END;
$$ LANGUAGE plpgsql;

-- Views para consultas
CREATE OR REPLACE VIEW solicitacoes_georreferenciadas AS
SELECT 
  s.*,
  formatar_endereco_completo(
    s.endereco_rua, s.endereco_numero, s.endereco_bairro, 
    s.endereco_localidade, s.endereco_cep, s.endereco_complemento
  ) as endereco_completo
FROM solicitacoes s
WHERE s.latitude IS NOT NULL AND s.longitude IS NOT NULL;

CREATE OR REPLACE VIEW demandas_georreferenciadas AS
SELECT 
  d.*,
  formatar_endereco_completo(
    d.endereco_rua, d.endereco_numero, d.endereco_bairro, 
    d.endereco_localidade, d.endereco_cep, d.endereco_complemento
  ) as endereco_completo
FROM demandas d
WHERE d.latitude IS NOT NULL AND d.longitude IS NOT NULL;

-- Verificação final
DO $$
DECLARE
    sol_count INTEGER;
    dem_count INTEGER;
    sol_new_fields INTEGER;
    dem_new_fields INTEGER;
BEGIN
    SELECT COUNT(*) INTO sol_count FROM solicitacoes;
    SELECT COUNT(*) INTO dem_count FROM demandas;
    SELECT COUNT(*) INTO sol_new_fields FROM solicitacoes WHERE endereco_rua IS NOT NULL OR latitude IS NOT NULL;
    SELECT COUNT(*) INTO dem_new_fields FROM demandas WHERE endereco_rua IS NOT NULL OR latitude IS NOT NULL;
    
    RAISE LOG '=== MIGRAÇÃO SEGURA CONCLUÍDA EM % ===', now();
    RAISE LOG 'Solicitacoes: % registros (% com novos campos)', sol_count, sol_new_fields;
    RAISE LOG 'Demandas: % registros (% com novos campos)', dem_count, dem_new_fields;
    RAISE LOG '====================================';
END;
$$ LANGUAGE plpgsql;
