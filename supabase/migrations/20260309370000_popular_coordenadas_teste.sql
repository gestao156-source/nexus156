/*
  Popular coordenadas de teste para visualização no mapa
  
  Adiciona coordenadas reais de São Paulo para registros existentes
  que não possuem latitude/longitude preenchidos.
*/

-- Atualizar algumas solicitações com coordenadas reais
UPDATE solicitacoes 
SET 
  latitude = CASE 
    WHEN id::text LIKE '1%' THEN -23.5505
    WHEN id::text LIKE '2%' THEN -23.5489
    WHEN id::text LIKE '3%' THEN -23.5589
    WHEN id::text LIKE '4%' THEN -23.5429
    WHEN id::text LIKE '5%' THEN -23.5641
    ELSE -23.5505
  END,
  longitude = CASE 
    WHEN id::text LIKE '1%' THEN -46.6333
    WHEN id::text LIKE '2%' THEN -46.6388
    WHEN id::text LIKE '3%' THEN -46.6394
    WHEN id::text LIKE '4%' THEN -46.6375
    WHEN id::text LIKE '5%' THEN -46.6321
    ELSE -46.6333
  END,
  endereco_bairro = CASE 
    WHEN id::text LIKE '1%' THEN 'Centro'
    WHEN id::text LIKE '2%' THEN 'Bela Vista'
    WHEN id::text LIKE '3%' THEN 'Consolação'
    WHEN id::text LIKE '4%' THEN 'Higienópolis'
    WHEN id::text LIKE '5%' THEN 'Sé'
    ELSE 'Centro'
  END
WHERE latitude IS NULL OR longitude IS NULL
LIMIT 5;

-- Atualizar algumas demandas com coordenadas reais
UPDATE demandas 
SET 
  latitude = CASE 
    WHEN id::text LIKE '1%' THEN -23.5678
    WHEN id::text LIKE '2%' THEN -23.5714
    WHEN id::text LIKE '3%' THEN -23.5609
    WHEN id::text LIKE '4%' THEN -23.5434
    WHEN id::text LIKE '5%' THEN -23.5891
    ELSE -23.5678
  END,
  longitude = CASE 
    WHEN id::text LIKE '1%' THEN -46.6523
    WHEN id::text LIKE '2%' THEN -46.6411
    WHEN id::text LIKE '3%' THEN -46.6865
    WHEN id::text LIKE '4%' THEN -46.6899
    WHEN id::text LIKE '5%' THEN -46.6348
    ELSE -46.6523
  END,
  endereco_bairro = CASE 
    WHEN id::text LIKE '1%' THEN 'Moema'
    WHEN id::text LIKE '2%' THEN 'Vila Mariana'
    WHEN id::text LIKE '3%' THEN 'Pinheiros'
    WHEN id::text LIKE '4%' THEN 'Itaim Bibi'
    WHEN id::text LIKE '5%' THEN 'Brooklin'
    ELSE 'Moema'
  END
WHERE latitude IS NULL OR longitude IS NULL
LIMIT 5;

-- Inserir alguns dados de teste se não houver registros
INSERT INTO solicitacoes (
  id, 
  assunto, 
  protocolo, 
  status, 
  data_inicio, 
  data_contato, 
  data_finalizado, 
  observacoes, 
  responsavel, 
  ponto_contato, 
  user_id, 
  created_at, 
  updated_at,
  latitude,
  longitude,
  endereco_bairro,
  endereco_rua
) SELECT 
  gen_random_uuid(),
  'Solicitação de Teste Mapa ' || generate_series(1, 3),
  'TESTE' || generate_series(1, 3),
  CASE WHEN generate_series(1, 3) % 3 = 0 THEN 'finalizado' 
       WHEN generate_series(1, 3) % 3 = 1 THEN 'em_analise'
       ELSE 'aguardando' END,
  CURRENT_DATE - INTERVAL '7 days',
  CURRENT_DATE - INTERVAL '5 days',
  CASE WHEN generate_series(1, 3) % 2 = 0 THEN CURRENT_DATE - INTERVAL '1 day' ELSE NULL END,
  'Dados de teste para visualização no mapa',
  'Responsável Teste',
  'Contato Teste',
  '00000000-0000-0000-0000-000000000000',
  NOW() - INTERVAL '7 days',
  NOW(),
  -23.5505 + (generate_series(1, 3) * 0.01),
  -46.6333 + (generate_series(1, 3) * 0.01),
  CASE WHEN generate_series(1, 3) = 1 THEN 'Centro'
       WHEN generate_series(1, 3) = 2 THEN 'Bela Vista'
       ELSE 'Consolação' END,
  CASE WHEN generate_series(1, 3) = 1 THEN 'Rua A, 123'
       WHEN generate_series(1, 3) = 2 THEN 'Rua B, 456'
       ELSE 'Rua C, 789' END
WHERE NOT EXISTS (SELECT 1 FROM solicitacoes WHERE latitude IS NOT NULL LIMIT 1);

-- Inserir algumas demandas de teste se não houver registros
INSERT INTO demandas (
  id, 
  assunto, 
  protocolo, 
  status, 
  data_inicio, 
  data_contato, 
  data_finalizado, 
  observacoes, 
  responsavel, 
  ponto_contato, 
  user_id, 
  created_at, 
  updated_at,
  latitude,
  longitude,
  endereco_bairro,
  endereco_rua
) SELECT 
  gen_random_uuid(),
  'Demanda de Teste Mapa ' || generate_series(1, 3),
  'DEMANDA' || generate_series(1, 3),
  CASE WHEN generate_series(1, 3) % 3 = 0 THEN 'finalizado' 
       WHEN generate_series(1, 3) % 3 = 1 THEN 'em_analise'
       ELSE 'aguardando' END,
  CURRENT_DATE - INTERVAL '10 days',
  CURRENT_DATE - INTERVAL '8 days',
  CASE WHEN generate_series(1, 3) % 2 = 0 THEN CURRENT_DATE - INTERVAL '2 day' ELSE NULL END,
  'Dados de teste para visualização no mapa',
  'Responsável Demanda',
  'Contato Demanda',
  '00000000-0000-0000-0000-000000000000',
  NOW() - INTERVAL '10 days',
  NOW(),
  -23.5678 + (generate_series(1, 3) * 0.01),
  -46.6523 + (generate_series(1, 3) * 0.01),
  CASE WHEN generate_series(1, 3) = 1 THEN 'Moema'
       WHEN generate_series(1, 3) = 2 THEN 'Vila Mariana'
       ELSE 'Pinheiros' END,
  CASE WHEN generate_series(1, 3) = 1 THEN 'Av D, 1000'
       WHEN generate_series(1, 3) = 2 THEN 'Rua E, 200'
       ELSE 'Alameda F, 300' END
WHERE NOT EXISTS (SELECT 1 FROM demandas WHERE latitude IS NOT NULL LIMIT 1);

-- Log
DO $$
BEGIN
    RAISE LOG 'Coordenadas de teste populadas em % - Mapa agora deve mostrar pontos!', NOW();
END;
$$ LANGUAGE plpgsql;
