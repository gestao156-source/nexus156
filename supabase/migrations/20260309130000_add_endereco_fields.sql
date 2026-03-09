/*
  Add Endereço Fields
  
  Adiciona campos de endereço e georreferenciamento 
  nas tabelas solicitacoes e demandas.
  
  Fields adicionados:
  - endereco_rua, endereco_numero, endereco_bairro
  - endereco_localidade, endereco_cep, endereco_complemento
  - latitude, longitude (para georreferenciamento)
*/

-- Adicionar campos de endereço na tabela solicitacoes
ALTER TABLE solicitacoes 
ADD COLUMN endereco_rua TEXT,
ADD COLUMN endereco_numero TEXT,
ADD COLUMN endereco_bairro TEXT,
ADD COLUMN endereco_localidade TEXT,
ADD COLUMN endereco_cep TEXT,
ADD COLUMN endereco_complemento TEXT,
ADD COLUMN latitude DECIMAL(10,8),
ADD COLUMN longitude DECIMAL(11,8);

-- Adicionar campos de endereço na tabela demandas
ALTER TABLE demandas 
ADD COLUMN endereco_rua TEXT,
ADD COLUMN endereco_numero TEXT,
ADD COLUMN endereco_bairro TEXT,
ADD COLUMN endereco_localidade TEXT,
ADD COLUMN endereco_cep TEXT,
ADD COLUMN endereco_complemento TEXT,
ADD COLUMN latitude DECIMAL(10,8),
ADD COLUMN longitude DECIMAL(11,8);

-- Criar índices para performance
CREATE INDEX idx_solicitacoes_endereco_cep ON solicitacoes(endereco_cep) WHERE endereco_cep IS NOT NULL;
CREATE INDEX idx_demandas_endereco_cep ON demandas(endereco_cep) WHERE endereco_cep IS NOT NULL;

CREATE INDEX idx_solicitacoes_coordenadas ON solicitacoes(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX idx_demandas_coordenadas ON demandas(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

CREATE INDEX idx_solicitacoes_localidade ON solicitacoes(endereco_localidade) WHERE endereco_localidade IS NOT NULL;
CREATE INDEX idx_demandas_localidade ON demandas(endereco_localidade) WHERE endereco_localidade IS NOT NULL;

-- Criar função para validar coordenadas
CREATE OR REPLACE FUNCTION validate_coordinates(lat DECIMAL, lng DECIMAL)
RETURNS BOOLEAN AS $$
BEGIN
    -- Validar latitude: -90 a 90
    IF lat IS NOT NULL AND (lat < -90 OR lat > 90) THEN
        RETURN FALSE;
    END IF;
    
    -- Validar longitude: -180 a 180
    IF lng IS NOT NULL AND (lng < -180 OR lng > 180) THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para validar coordenadas
CREATE OR REPLACE FUNCTION validate_endereco_coordinates()
RETURNS TRIGGER AS $$
BEGIN
    -- Validar coordenadas para solicitacoes
    IF TG_TABLE_NAME = 'solicitacoes' THEN
        IF NOT validate_coordinates(NEW.latitude, NEW.longitude) THEN
            RAISE EXCEPTION 'Coordenadas inválidas. Latitude deve estar entre -90 e 90, longitude entre -180 e 180';
        END IF;
    END IF;
    
    -- Validar coordenadas para demandas
    IF TG_TABLE_NAME = 'demandas' THEN
        IF NOT validate_coordinates(NEW.latitude, NEW.longitude) THEN
            RAISE EXCEPTION 'Coordenadas inválidas. Latitude deve estar entre -90 e 90, longitude entre -180 e 180';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar triggers de validação
DROP TRIGGER IF EXISTS validate_solicitacoes_coordinates ON solicitacoes;
CREATE TRIGGER validate_solicitacoes_coordinates
    BEFORE INSERT OR UPDATE ON solicitacoes
    FOR EACH ROW
    EXECUTE FUNCTION validate_endereco_coordinates();

DROP TRIGGER IF EXISTS validate_demandas_coordinates ON demandas;
CREATE TRIGGER validate_demandas_coordinates
    BEFORE INSERT OR UPDATE ON demandas
    FOR EACH ROW
    EXECUTE FUNCTION validate_endereco_coordinates();

-- Criar função para formatar endereço completo
CREATE OR REPLACE FUNCTION format_endereco_completo(
    rua TEXT,
    numero TEXT,
    bairro TEXT,
    localidade TEXT,
    cep TEXT
)
RETURNS TEXT AS $$
BEGIN
    RETURN COALESCE(rua, '') || 
           CASE WHEN rua IS NOT NULL AND numero IS NOT NULL THEN ', ' || numero ELSE '' END ||
           CASE WHEN (rua IS NOT NULL OR numero IS NOT NULL) AND bairro IS NOT NULL THEN ' - ' || bairro ELSE '' END ||
           CASE WHEN (rua IS NOT NULL OR numero IS NOT NULL OR bairro IS NOT NULL) AND localidade IS NOT NULL THEN ', ' || localidade ELSE '' END ||
           CASE WHEN cep IS NOT NULL THEN ' - CEP: ' || cep ELSE '' END;
END;
$$ LANGUAGE plpgsql;

-- Criar views para facilitar consultas
CREATE OR REPLACE VIEW solicitacoes_com_endereco AS
SELECT 
    s.*,
    format_endereco_completo(
        s.endereco_rua,
        s.endereco_numero,
        s.endereco_bairro,
        s.endereco_localidade,
        s.endereco_cep
    ) AS endereco_completo
FROM solicitacoes s;

CREATE OR REPLACE VIEW demandas_com_endereco AS
SELECT 
    d.*,
    format_endereco_completo(
        d.endereco_rua,
        d.endereco_numero,
        d.endereco_bairro,
        d.endereco_localidade,
        d.endereco_cep
    ) AS endereco_completo
FROM demandas d;

-- Grant permissions nas views
GRANT SELECT ON solicitacoes_com_endereco TO authenticated;
GRANT SELECT ON demandas_com_endereco TO authenticated;

-- Adicionar comentários para documentação
COMMENT ON COLUMN solicitacoes.endereco_rua IS 'Rua/Avenida do endereço';
COMMENT ON COLUMN solicitacoes.endereco_numero IS 'Número do imóvel';
COMMENT ON COLUMN solicitacoes.endereco_bairro IS 'Bairro do endereço';
COMMENT ON COLUMN solicitacoes.endereco_localidade IS 'Cidade/Localidade';
COMMENT ON COLUMN solicitacoes.endereco_cep IS 'CEP (formato: 00000-000)';
COMMENT ON COLUMN solicitacoes.endereco_complemento IS 'Complemento do endereço';
COMMENT ON COLUMN solicitacoes.latitude IS 'Coordenada geográfica latitude (-90 a 90)';
COMMENT ON COLUMN solicitacoes.longitude IS 'Coordenada geográfica longitude (-180 a 180)';

COMMENT ON COLUMN demandas.endereco_rua IS 'Rua/Avenida do endereço';
COMMENT ON COLUMN demandas.endereco_numero IS 'Número do imóvel';
COMMENT ON COLUMN demandas.endereco_bairro IS 'Bairro do endereço';
COMMENT ON COLUMN demandas.endereco_localidade IS 'Cidade/Localidade';
COMMENT ON COLUMN demandas.endereco_cep IS 'CEP (formato: 00000-000)';
COMMENT ON COLUMN demandas.endereco_complemento IS 'Complemento do endereço';
COMMENT ON COLUMN demandas.latitude IS 'Coordenada geográfica latitude (-90 a 90)';
COMMENT ON COLUMN demandas.longitude IS 'Coordenada geográfica longitude (-180 a 180)';
