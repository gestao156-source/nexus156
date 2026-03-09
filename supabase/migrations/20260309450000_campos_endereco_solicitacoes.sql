/*
  Migration: Campos de Endereço para Solicitações e Demandas
  
  Esta migration adiciona os campos de endereço que faltam
  nas tabelas solicitacoes e demandas para compatibilidade
  com o formulário de endereço.
*/

-- Adicionar campos de endereço à tabela solicitacoes
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'solicitacoes') THEN
    -- Adicionar campos se não existirem
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'solicitacoes' AND column_name = 'endereco_rua') THEN
      ALTER TABLE solicitacoes ADD COLUMN endereco_rua text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'solicitacoes' AND column_name = 'endereco_numero') THEN
      ALTER TABLE solicitacoes ADD COLUMN endereco_numero text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'solicitacoes' AND column_name = 'endereco_bairro') THEN
      ALTER TABLE solicitacoes ADD COLUMN endereco_bairro text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'solicitacoes' AND column_name = 'endereco_localidade') THEN
      ALTER TABLE solicitacoes ADD COLUMN endereco_localidade text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'solicitacoes' AND column_name = 'endereco_cep') THEN
      ALTER TABLE solicitacoes ADD COLUMN endereco_cep text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'solicitacoes' AND column_name = 'endereco_complemento') THEN
      ALTER TABLE solicitacoes ADD COLUMN endereco_complemento text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'solicitacoes' AND column_name = 'endereco_latitude') THEN
      ALTER TABLE solicitacoes ADD COLUMN endereco_latitude decimal(10, 8);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'solicitacoes' AND column_name = 'endereco_longitude') THEN
      ALTER TABLE solicitacoes ADD COLUMN endereco_longitude decimal(11, 8);
    END IF;
    
    RAISE NOTICE '✅ Campos de endereço adicionados à tabela solicitacoes';
  END IF;
END $$;

-- Adicionar campos de endereço à tabela demandas
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'demandas') THEN
    -- Adicionar campos se não existirem
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'demandas' AND column_name = 'endereco_rua') THEN
      ALTER TABLE demandas ADD COLUMN endereco_rua text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'demandas' AND column_name = 'endereco_numero') THEN
      ALTER TABLE demandas ADD COLUMN endereco_numero text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'demandas' AND column_name = 'endereco_bairro') THEN
      ALTER TABLE demandas ADD COLUMN endereco_bairro text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'demandas' AND column_name = 'endereco_localidade') THEN
      ALTER TABLE demandas ADD COLUMN endereco_localidade text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'demandas' AND column_name = 'endereco_cep') THEN
      ALTER TABLE demandas ADD COLUMN endereco_cep text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'demandas' AND column_name = 'endereco_complemento') THEN
      ALTER TABLE demandas ADD COLUMN endereco_complemento text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'demandas' AND column_name = 'endereco_latitude') THEN
      ALTER TABLE demandas ADD COLUMN endereco_latitude decimal(10, 8);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'demandas' AND column_name = 'endereco_longitude') THEN
      ALTER TABLE demandas ADD COLUMN endereco_longitude decimal(11, 8);
    END IF;
    
    RAISE NOTICE '✅ Campos de endereço adicionados à tabela demandas';
  END IF;
END $$;

-- Adicionar comentários aos campos
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'solicitacoes') THEN
    COMMENT ON COLUMN solicitacoes.endereco_rua IS 'Rua do endereço da solicitação';
    COMMENT ON COLUMN solicitacoes.endereco_numero IS 'Número do endereço da solicitação';
    COMMENT ON COLUMN solicitacoes.endereco_bairro IS 'Bairro do endereço da solicitação';
    COMMENT ON COLUMN solicitacoes.endereco_localidade IS 'Localidade/cidade do endereço da solicitação';
    COMMENT ON COLUMN solicitacoes.endereco_cep IS 'CEP do endereço da solicitação';
    COMMENT ON COLUMN solicitacoes.endereco_complemento IS 'Complemento do endereço da solicitação';
    COMMENT ON COLUMN solicitacoes.endereco_latitude IS 'Latitude da localização';
    COMMENT ON COLUMN solicitacoes.endereco_longitude IS 'Longitude da localização';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'demandas') THEN
    COMMENT ON COLUMN demandas.endereco_rua IS 'Rua do endereço da demanda';
    COMMENT ON COLUMN demandas.endereco_numero IS 'Número do endereço da demanda';
    COMMENT ON COLUMN demandas.endereco_bairro IS 'Bairro do endereço da demanda';
    COMMENT ON COLUMN demandas.endereco_localidade IS 'Localidade/cidade do endereço da demanda';
    COMMENT ON COLUMN demandas.endereco_cep IS 'CEP do endereço da demanda';
    COMMENT ON COLUMN demandas.endereco_complemento IS 'Complemento do endereço da demanda';
    COMMENT ON COLUMN demandas.endereco_latitude IS 'Latitude da localização';
    COMMENT ON COLUMN demandas.endereco_longitude IS 'Longitude da localização';
  END IF;
END $$;

-- Log final
DO $$
BEGIN
  RAISE NOTICE '🎯 Migration campos_endereco_solicitacoes executada com sucesso';
  RAISE NOTICE '📋 Campos de endereço adicionados às tabelas solicitacoes e demandas';
  RAISE NOTICE '📋 Comentários descritivos adicionados';
END $$;
