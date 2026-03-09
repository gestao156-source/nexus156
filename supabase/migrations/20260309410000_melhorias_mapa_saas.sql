/*
  Migration: Melhorias Mapa SaaS Production-Ready
  
  Esta migration implementa as melhorias críticas para transformar o mapa
  em um sistema SaaS enterprise-ready com performance e escalabilidade.
  
  1. Campo provider para tracking de geocoding
  2. Tabela de cache para evitar chamadas duplicadas
  3. Índices otimizados para queries geográficas
  4. Mantém 100% backward compatibility
*/

-- Adicionar campo provider para tracking
DO $$
BEGIN
  -- Verificar se a tabela solicitacoes existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'solicitacoes') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'solicitacoes' AND column_name = 'endereco_geocoding_provider') THEN
      ALTER TABLE solicitacoes ADD COLUMN endereco_geocoding_provider text DEFAULT 'nominatim';
    END IF;
  END IF;
  
  -- Verificar se a tabela demandas existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'demandas') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'demandas' AND column_name = 'endereco_geocoding_provider') THEN
      ALTER TABLE demandas ADD COLUMN endereco_geocoding_provider text DEFAULT 'nominatim';
    END IF;
  END IF;
END $$;

-- Criar tabela de cache de geocoding
DO $$
BEGIN
  -- Remover se existir (para desenvolvimento)
  DROP TABLE IF EXISTS geocoding_cache;
  
  -- Criar tabela de cache
  CREATE TABLE geocoding_cache (
    endereco_hash text PRIMARY KEY,
    endereco_completo text NOT NULL,
    latitude decimal(10, 8) NOT NULL,
    longitude decimal(11, 8) NOT NULL,
    provider text DEFAULT 'nominatim',
    created_at timestamptz DEFAULT now(),
    expires_at timestamptz DEFAULT (now() + interval '7 days'),
    usage_count integer DEFAULT 1,
    last_used_at timestamptz DEFAULT now()
  );
  
  -- Índices para performance
  CREATE INDEX idx_geocoding_cache_expires ON geocoding_cache(expires_at);
  CREATE INDEX idx_geocoding_cache_usage ON geocoding_cache(usage_count DESC);
  CREATE INDEX idx_geocoding_cache_last_used ON geocoding_cache(last_used_at DESC);
  
  -- Adicionar comentários
  COMMENT ON TABLE geocoding_cache IS 'Cache de geocoding para evitar chamadas duplicadas à API externa';
  COMMENT ON COLUMN geocoding_cache.endereco_hash IS 'Hash SHA256 do endereço normalizado';
  COMMENT ON COLUMN geocoding_cache.endereco_completo IS 'Endereço completo usado para gerar o hash';
  COMMENT ON COLUMN geocoding_cache.provider IS 'Provedor de geocoding (nominatim, google, etc)';
  COMMENT ON COLUMN geocoding_cache.usage_count IS 'Número de vezes que este cache foi utilizado';
END $$;

-- Criar índices geoespaciais otimizados
DO $$
BEGIN
  -- Índice composto para solicitacoes
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'solicitacoes') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'solicitacoes' AND indexname = 'idx_solicitacoes_lat_lng') THEN
      CREATE INDEX idx_solicitacoes_lat_lng 
      ON solicitacoes (endereco_latitude, endereco_longitude) 
      WHERE endereco_latitude IS NOT NULL AND endereco_longitude IS NOT NULL;
    END IF;
    
    -- Índice para bounding box queries
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'solicitacoes' AND indexname = 'idx_solicitacoes_geo_bounds') THEN
      CREATE INDEX idx_solicitacoes_geo_bounds 
      ON solicitacoes (
        endereco_latitude, 
        endereco_longitude
      ) 
      WHERE 
        endereco_latitude IS NOT NULL 
        AND endereco_longitude IS NOT NULL
        AND endereco_geocoding_status = 'sucesso';
    END IF;
  END IF;
  
  -- Índice composto para demandas
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'demandas') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'demandas' AND indexname = 'idx_demandas_lat_lng') THEN
      CREATE INDEX idx_demandas_lat_lng 
      ON demandas (endereco_latitude, endereco_longitude) 
      WHERE endereco_latitude IS NOT NULL AND endereco_longitude IS NOT NULL;
    END IF;
    
    -- Índice para bounding box queries
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'demandas' AND indexname = 'idx_demandas_geo_bounds') THEN
      CREATE INDEX idx_demandas_geo_bounds 
      ON demandas (
        endereco_latitude, 
        endereco_longitude
      ) 
      WHERE 
        endereco_latitude IS NOT NULL 
        AND endereco_longitude IS NOT NULL
        AND endereco_geocoding_status = 'sucesso';
    END IF;
  END IF;
END $$;

-- Log de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Migration melhorias_mapa_saas executada com sucesso';
  RAISE NOTICE '📋 Campos adicionados: endereco_geocoding_provider';
  RAISE NOTICE '📋 Tabela criada: geocoding_cache';
  RAISE NOTICE '📋 Índices criados: idx_solicitacoes_lat_lng, idx_demandas_lat_lng, idx_*_geo_bounds';
  RAISE NOTICE '📋 Índices de cache: idx_geocoding_cache_expires, idx_geocoding_cache_usage, idx_geocoding_cache_last_used';
END $$;
