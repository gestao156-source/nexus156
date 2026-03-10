-- Script para inserir dados básicos nas tabelas
-- Execute este script diretamente no SQL Editor do Supabase

-- Inserir assuntos padrão
INSERT INTO assuntos_padrao (id, nome, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Solicitação de Serviço', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000002', 'Reclamação', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000003', 'Elogio', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000004', 'Sugestão', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000005', 'Denúncia', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000006', 'Informação', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000007', 'Manutenção', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000008', 'Limpeza Urbana', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000009', 'Iluminação Pública', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000010', 'Saúde', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000011', 'Educação', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000012', 'Segurança', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000013', 'Transporte', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000014', 'Obras', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000015', 'Meio Ambiente', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Inserir pontos de contato padrão
INSERT INTO pontos_contato (id, nome, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Secretaria Municipal', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000002', 'Prefeitura', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000003', 'Setor de Serviços', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000004', 'Departamento de Obras', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000005', 'Setor de Limpeza', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000006', 'Iluminação Pública', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000007', 'Saúde Pública', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000008', 'Educação', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000009', 'Segurança Pública', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000010', 'Transporte Público', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000011', 'Meio Ambiente', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000012', 'Ouvidoria', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000013', 'Procon', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000014', 'Defesa Civil', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000015', 'Guarda Municipal', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Verificar dados inseridos
SELECT 'assuntos_padrao' as tabela, COUNT(*) as total FROM assuntos_padrao
UNION ALL
SELECT 'pontos_contato' as tabela, COUNT(*) as total FROM pontos_contato;

-- Mostrar exemplos
SELECT 'Assuntos:' as info, nome FROM assuntos_padrao ORDER BY nome LIMIT 5
UNION ALL
SELECT 'Pontos de Contato:' as info, nome FROM pontos_contato ORDER BY nome LIMIT 5;
