-- Verificar se há coordenadas nas tabelas
SELECT 
    'solicitacoes' as tabela,
    COUNT(*) as total,
    COUNT(endereco_latitude) as com_latitude,
    COUNT(endereco_longitude) as com_longitude,
    COUNT(CASE WHEN endereco_latitude IS NOT NULL AND endereco_longitude IS NOT NULL THEN 1 END) as com_coordenadas_completas
FROM solicitacoes

UNION ALL

SELECT 
    'demandas' as tabela,
    COUNT(*) as total,
    COUNT(endereco_latitude) as com_latitude,
    COUNT(endereco_longitude) as com_longitude,
    COUNT(CASE WHEN endereco_latitude IS NOT NULL AND endereco_longitude IS NOT NULL THEN 1 END) as com_coordenadas_completas
FROM demandas;

-- Verificar itens específicos com coordenadas em solicitacoes
SELECT 
    id,
    'solicitacao' as tipo,
    endereco_rua,
    endereco_bairro,
    endereco_latitude,
    endereco_longitude,
    created_at
FROM solicitacoes 
WHERE endereco_latitude IS NOT NULL OR endereco_longitude IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- Verificar itens específicos com coordenadas em demandas
SELECT 
    id,
    'demanda' as tipo,
    endereco_rua,
    endereco_bairro,
    endereco_latitude,
    endereco_longitude,
    created_at
FROM demandas 
WHERE endereco_latitude IS NOT NULL OR endereco_longitude IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
