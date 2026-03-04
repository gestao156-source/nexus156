/*
  # Add Responsável and Ponto de Contato Fields

  Adicionar campos de "responsável" e "ponto de contato" às tabelas solicitacoes e demandas.
  
  1. New Columns
    - `responsavel` (text) - Nome do responsável
    - `ponto_contato` (text) - Ponto de contato
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'solicitacoes' AND column_name = 'responsavel'
  ) THEN
    ALTER TABLE solicitacoes ADD COLUMN responsavel text DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'solicitacoes' AND column_name = 'ponto_contato'
  ) THEN
    ALTER TABLE solicitacoes ADD COLUMN ponto_contato text DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'demandas' AND column_name = 'responsavel'
  ) THEN
    ALTER TABLE demandas ADD COLUMN responsavel text DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'demandas' AND column_name = 'ponto_contato'
  ) THEN
    ALTER TABLE demandas ADD COLUMN ponto_contato text DEFAULT '';
  END IF;
END $$;