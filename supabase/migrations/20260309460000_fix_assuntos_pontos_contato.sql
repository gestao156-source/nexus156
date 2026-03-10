/*
  Migration: Fix Assuntos e Pontos de Contato
  
  Esta migration corrige as permissões RLS e insere dados básicos
  para resolver o problema dos dropdowns vazios.
*/

-- Remover políticas antigas que estão impedindo o acesso
DO $$
BEGIN
  -- Remover políticas restritivas de assuntos_padrao
  DROP POLICY IF EXISTS "Admins can manage assuntos_padrao" ON assuntos_padrao;
  
  -- Remover políticas restritivas de pontos_contato
  DROP POLICY IF EXISTS "Admins can manage pontos_contato" ON pontos_contato;
  
  RAISE NOTICE '✅ Políticas antigas removidas';
END $$;

-- Criar novas políticas que permitem acesso público leitura
DO $$
BEGIN
  -- Política para assuntos_padrao - todos podem ler
  CREATE POLICY "Enable read access for all users" ON assuntos_padrao
    FOR SELECT USING (true);
    
  -- Política para pontos_contato - todos podem ler  
  CREATE POLICY "Enable read access for all users" ON pontos_contato
    FOR SELECT USING (true);
    
  -- Política para admins gerenciarem assuntos_padrao
  CREATE POLICY "Admins can manage assuntos_padrao" ON assuntos_padrao
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
      )
    );
    
  -- Política para admins gerenciarem pontos_contato
  CREATE POLICY "Admins can manage pontos_contato" ON pontos_contato
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
      )
    );
    
  RAISE NOTICE '✅ Novas políticas RLS criadas';
END $$;

-- Inserir dados básicos se as tabelas estiverem vazias
DO $$
BEGIN
  -- Verificar e inserir assuntos padrão
  IF (SELECT COUNT(*) FROM assuntos_padrao) = 0 THEN
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
      ('00000000-0000-0000-0000-000000000015', 'Meio Ambiente', NOW(), NOW());
      
    RAISE NOTICE '✅ Assuntos padrão inseridos: 15 registros';
  ELSE
    RAISE NOTICE 'ℹ️ Assuntos padrão já existem: % registros', (SELECT COUNT(*) FROM assuntos_padrao);
  END IF;
  
  -- Verificar e inserir pontos de contato padrão
  IF (SELECT COUNT(*) FROM pontos_contato) = 0 THEN
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
      ('00000000-0000-0000-0000-000000000015', 'Guarda Municipal', NOW(), NOW());
      
    RAISE NOTICE '✅ Pontos de contato inseridos: 15 registros';
  ELSE
    RAISE NOTICE 'ℹ️ Pontos de contato já existem: % registros', (SELECT COUNT(*) FROM pontos_contato);
  END IF;
END $$;

-- Verificação final
DO $$
BEGIN
  RAISE NOTICE '🔍 Verificação final:';
  RAISE NOTICE '  - Assuntos disponíveis: %', (SELECT COUNT(*) FROM assuntos_padrao);
  RAISE NOTICE '  - Pontos de contato disponíveis: %', (SELECT COUNT(*) FROM pontos_contato);
  
  -- Mostrar alguns exemplos
  RAISE NOTICE '📋 Exemplos de assuntos:';
  FOR item IN 
    SELECT nome FROM assuntos_padrao ORDER BY nome LIMIT 3
  LOOP
    RAISE NOTICE '  - %', item.nome;
  END LOOP;
  
  RAISE NOTICE '📋 Exemplos de pontos de contato:';
  FOR item IN 
    SELECT nome FROM pontos_contato ORDER BY nome LIMIT 3
  LOOP
    RAISE NOTICE '  - %', item.nome;
  END LOOP;
END $$;

-- Log final
DO $$
BEGIN
  RAISE NOTICE '🎯 Migration fix_assuntos_pontos_contato executada com sucesso!';
  RAISE NOTICE '📋 Permissões RLS corrigidas';
  RAISE NOTICE '📋 Dados básicos inseridos';
  RAISE NOTICE '📋 Dropdowns devem funcionar agora';
END $$;
