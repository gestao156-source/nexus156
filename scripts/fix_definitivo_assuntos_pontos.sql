-- Script Definitivo para Corrigir Assuntos e Pontos de Contato
-- Baseado no backup que funcionava

-- 1. REMOVER TODAS AS POLÍTICAS EXISTENTES
DROP POLICY IF EXISTS "Admins can manage assuntos_padrao" ON assuntos_padrao;
DROP POLICY IF EXISTS "Admins can manage pontos_contato" ON pontos_contato;
DROP POLICY IF EXISTS "Enable read access for all users" ON assuntos_padrao;
DROP POLICY IF EXISTS "Enable read access for all users" ON pontos_contato;

-- 2. INSERIR DADOS BÁSICOS (se não existirem)
INSERT INTO assuntos_padrao (id, nome, created_at, updated_at) VALUES
  (gen_random_uuid(), 'Solicitação de Serviço', NOW(), NOW()),
  (gen_random_uuid(), 'Reclamação', NOW(), NOW()),
  (gen_random_uuid(), 'Elogio', NOW(), NOW()),
  (gen_random_uuid(), 'Sugestão', NOW(), NOW()),
  (gen_random_uuid(), 'Denúncia', NOW(), NOW()),
  (gen_random_uuid(), 'Informação', NOW(), NOW()),
  (gen_random_uuid(), 'Manutenção', NOW(), NOW()),
  (gen_random_uuid(), 'Limpeza Urbana', NOW(), NOW()),
  (gen_random_uuid(), 'Iluminação Pública', NOW(), NOW()),
  (gen_random_uuid(), 'Saúde', NOW(), NOW()),
  (gen_random_uuid(), 'Educação', NOW(), NOW()),
  (gen_random_uuid(), 'Segurança', NOW(), NOW()),
  (gen_random_uuid(), 'Transporte', NOW(), NOW()),
  (gen_random_uuid(), 'Obras', NOW(), NOW()),
  (gen_random_uuid(), 'Meio Ambiente', NOW(), NOW())
ON CONFLICT DO NOTHING;

INSERT INTO pontos_contato (id, nome, created_at, updated_at) VALUES
  (gen_random_uuid(), 'Secretaria Municipal', NOW(), NOW()),
  (gen_random_uuid(), 'Prefeitura', NOW(), NOW()),
  (gen_random_uuid(), 'Setor de Serviços', NOW(), NOW()),
  (gen_random_uuid(), 'Departamento de Obras', NOW(), NOW()),
  (gen_random_uuid(), 'Setor de Limpeza', NOW(), NOW()),
  (gen_random_uuid(), 'Iluminação Pública', NOW(), NOW()),
  (gen_random_uuid(), 'Saúde Pública', NOW(), NOW()),
  (gen_random_uuid(), 'Educação', NOW(), NOW()),
  (gen_random_uuid(), 'Segurança Pública', NOW(), NOW()),
  (gen_random_uuid(), 'Transporte Público', NOW(), NOW()),
  (gen_random_uuid(), 'Meio Ambiente', NOW(), NOW()),
  (gen_random_uuid(), 'Ouvidoria', NOW(), NOW()),
  (gen_random_uuid(), 'Procon', NOW(), NOW()),
  (gen_random_uuid(), 'Defesa Civil', NOW(), NOW()),
  (gen_random_uuid(), 'Guarda Municipal', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- 3. CRIAR POLÍTICAS SIMPLES E FUNCIONAIS
-- Política para assuntos_padrao - todos podem ler
CREATE POLICY "Users can view assuntos_padrao" ON assuntos_padrao
  FOR SELECT USING (true);

-- Política para assuntos_padrao - admins podem gerenciar
CREATE POLICY "Admins can manage assuntos_padrao" ON assuntos_padrao
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Política para pontos_contato - todos podem ler
CREATE POLICY "Users can view pontos_contato" ON pontos_contato
  FOR SELECT USING (true);

-- Política para pontos_contato - admins podem gerenciar
CREATE POLICY "Admins can manage pontos_contato" ON pontos_contato
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 4. VERIFICAÇÃO FINAL
SELECT '=== VERIFICAÇÃO FINAL ===' as info;

SELECT 'Assuntos disponíveis:' as info, COUNT(*) as total FROM assuntos_padrao;

SELECT 'Pontos de contato disponíveis:' as info, COUNT(*) as total FROM pontos_contato;

SELECT 'Assuntos (primeiros 5):' as info, nome FROM assuntos_padrao ORDER BY nome LIMIT 5;

SELECT 'Pontos de contato (primeiros 5):' as info, nome FROM pontos_contato ORDER BY nome LIMIT 5;

-- 5. VERIFICAR POLÍTICAS CRIADAS
SELECT '=== POLÍTICAS RLS ===' as info;

SELECT 
  tablename,
  policyname,
  permissive,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('assuntos_padrao', 'pontos_contato')
ORDER BY tablename, policyname;
