/*
  Remove Endereço Fields - Voltar ao Estado Anterior
  
  Remove todos os campos de endereço e coordenadas das tabelas
  solicitacoes e demandas, voltando ao estado anterior à implementação
  de mapa e endereço.
*/

-- Remover campos de endereço da tabela solicitacoes
ALTER TABLE solicitacoes 
DROP COLUMN IF EXISTS endereco_rua,
DROP COLUMN IF EXISTS endereco_numero,
DROP COLUMN IF EXISTS endereco_bairro,
DROP COLUMN IF EXISTS endereco_localidade,
DROP COLUMN IF EXISTS endereco_cep,
DROP COLUMN IF EXISTS endereco_complemento,
DROP COLUMN IF EXISTS latitude,
DROP COLUMN IF EXISTS longitude;

-- Remover campos de endereço da tabela demandas
ALTER TABLE demandas 
DROP COLUMN IF EXISTS endereco_rua,
DROP COLUMN IF EXISTS endereco_numero,
DROP COLUMN IF EXISTS endereco_bairro,
DROP COLUMN IF EXISTS endereco_localidade,
DROP COLUMN IF EXISTS endereco_cep,
DROP COLUMN IF EXISTS endereco_complemento,
DROP COLUMN IF EXISTS latitude,
DROP COLUMN IF EXISTS longitude;

-- Remover índices relacionados a endereço
DROP INDEX IF EXISTS idx_solicitacoes_endereco_cep;
DROP INDEX IF EXISTS idx_demandas_endereco_cep;
DROP INDEX IF EXISTS idx_solicitacoes_coordenadas;
DROP INDEX IF EXISTS idx_demandas_coordenadas;
DROP INDEX IF EXISTS idx_solicitacoes_localidade;
DROP INDEX IF EXISTS idx_demandas_localidade;

-- Remover funções de endereço
DROP FUNCTION IF EXISTS validate_coordinates();
DROP FUNCTION IF EXISTS validate_endereco_coordinates();
DROP FUNCTION IF EXISTS format_endereco_completo();

-- Remover triggers de endereço
DROP TRIGGER IF EXISTS validate_solicitacoes_coordinates ON solicitacoes;
DROP TRIGGER IF EXISTS validate_demandas_coordinates ON demandas;

-- Remover views com endereço
DROP VIEW IF EXISTS solicitacoes_com_endereco;
DROP VIEW IF EXISTS demandas_com_endereco;

-- Log da operação
DO $$
BEGIN
    RAISE LOG 'Campos de endereço removidos em % - Sistema voltou ao estado anterior ao mapa';
END;
$$ LANGUAGE plpgsql;
