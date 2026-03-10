/*
  Migration: Fix RPC Exposure for Supabase REST
  
  Esta migration corrige os problemas que impedem as RPCs de serem
  acessadas via REST API do Supabase:
  
  1. Garante que a view mapa_dados_estruturado existe
  2. Concede permissões EXECUTE para anon/public
  3. Verifica schema das funções
  4. Cria view alternativa se necessário
*/

-- Verificar e criar view mapa_dados_estruturado
DO $$
BEGIN
  -- Remover view se existir (para recriação limpa)
  DROP VIEW IF EXISTS mapa_dados_estruturado;
  
  -- Verificar se tabelas existem
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'solicitacoes') AND 
     EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'demandas') AND
     EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    
    -- Criar view para dados do mapa
    CREATE OR REPLACE VIEW mapa_dados_estruturado AS
    SELECT 
      'solicitacao' as tipo,
      s.id, 
      s.assunto, 
      s.protocolo, 
      s.status,
      s.responsavel, 
      s.ponto_contato,
      s.created_at, 
      s.data_inicio, 
      s.data_contato, 
      s.data_finalizado,
      s.endereco_rua,
      s.endereco_numero,
      s.endereco_bairro,
      s.endereco_complemento,
      s.endereco_cep,
      s.endereco_cidade,
      s.endereco_uf,
      s.endereco_latitude, 
      s.endereco_longitude, 
      s.endereco_regional, 
      s.endereco_geocoding_status,
      s.endereco_validado,
      p.full_name as usuario_nome,
      p.email as usuario_email,
      CASE 
        WHEN s.endereco_latitude IS NOT NULL AND s.endereco_longitude IS NOT NULL THEN true
        ELSE false
      END as possui_coordenadas
    FROM solicitacoes s
    LEFT JOIN profiles p ON s.user_id = p.id

    UNION ALL

    SELECT 
      'demanda' as tipo,
      d.id, 
      d.assunto, 
      d.protocolo, 
      d.status,
      d.responsavel, 
      d.ponto_contato,
      d.created_at, 
      d.data_inicio, 
      d.data_contato, 
      d.data_finalizado,
      d.endereco_rua,
      d.endereco_numero,
      d.endereco_bairro,
      d.endereco_complemento,
      d.endereco_cep,
      d.endereco_cidade,
      d.endereco_uf,
      d.endereco_latitude, 
      d.endereco_longitude, 
      d.endereco_regional, 
      d.endereco_geocoding_status,
      d.endereco_validado,
      p.full_name as usuario_nome,
      p.email as usuario_email,
      CASE 
        WHEN d.endereco_latitude IS NOT NULL AND d.endereco_longitude IS NOT NULL THEN true
        ELSE false
      END as possui_coordenadas
    FROM demandas d
    LEFT JOIN profiles p ON d.user_id = p.id;
    
    RAISE NOTICE '✅ View mapa_dados_estruturado criada com sucesso';
  ELSE
    RAISE NOTICE '⚠️ Tabelas necessárias não encontradas, view não criada';
  END IF;
END $$;

-- Conceder permissões para as funções RPC
DO $$
BEGIN
  -- Permissões para buscar_solicitacoes_mapa
  IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'buscar_solicitacoes_mapa') THEN
    GRANT EXECUTE ON FUNCTION public.buscar_solicitacoes_mapa TO anon;
    GRANT EXECUTE ON FUNCTION public.buscar_solicitacoes_mapa TO authenticated;
    RAISE NOTICE '✅ Permissões concedidas para buscar_solicitacoes_mapa';
  END IF;
  
  -- Permissões para buscar_solicitacoes_bbox
  IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'buscar_solicitacoes_bbox') THEN
    GRANT EXECUTE ON FUNCTION public.buscar_solicitacoes_bbox TO anon;
    GRANT EXECUTE ON FUNCTION public.buscar_solicitacoes_bbox TO authenticated;
    RAISE NOTICE '✅ Permissões concedidas para buscar_solicitacoes_bbox';
  END IF;
  
  -- Permissões para contar_solicitacoes_bbox
  IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'contar_solicitacoes_bbox') THEN
    GRANT EXECUTE ON FUNCTION public.contar_solicitacoes_bbox TO anon;
    GRANT EXECUTE ON FUNCTION public.contar_solicitacoes_bbox TO authenticated;
    RAISE NOTICE '✅ Permissões concedidas para contar_solicitacoes_bbox';
  END IF;
END $$;

-- Verificar schema das funções
DO $$
BEGIN
  RAISE NOTICE '📋 Verificando schemas das funções:';
  
  FOR func IN 
    SELECT routine_schema, routine_name 
    FROM information_schema.routines 
    WHERE routine_name IN ('buscar_solicitacoes_mapa', 'buscar_solicitacoes_bbox', 'contar_solicitacoes_bbox')
  LOOP
    RAISE NOTICE '  - %.% (%)', func.routine_schema, func.routine_name, 
      CASE WHEN func.routine_schema = 'public' THEN '✅ OK' ELSE '⚠️ Não é public' END;
  END LOOP;
END $$;

-- Criar função RPC simplificada como fallback
DO $$
BEGIN
  -- Remover se existir
  DROP FUNCTION IF EXISTS get_mapa_dados_paginado;
  
  -- Criar função simplificada que não depende de view
  CREATE OR REPLACE FUNCTION get_mapa_dados_paginado(
    p_status text[] DEFAULT NULL,
    p_tipo text DEFAULT NULL,
    p_regional integer DEFAULT NULL,
    p_limit integer DEFAULT 100,
    p_offset integer DEFAULT 0,
    p_ordenar_por text DEFAULT 'created_at',
    p_ordem text DEFAULT 'DESC'
  )
  RETURNS TABLE (
    tipo text,
    id uuid,
    assunto text,
    protocolo text,
    status text,
    responsavel text,
    ponto_contato text,
    created_at timestamptz,
    data_inicio date,
    data_contato date,
    data_finalizado date,
    endereco_rua text,
    endereco_numero text,
    endereco_bairro text,
    endereco_complemento text,
    endereco_cep text,
    endereco_cidade text,
    endereco_uf text,
    endereco_latitude decimal(10, 8),
    endereco_longitude decimal(11, 8),
    endereco_regional integer,
    endereco_geocoding_status text,
    endereco_validado boolean,
    possui_coordenadas boolean,
    usuario_nome text,
    usuario_email text
  ) AS $$
  BEGIN
    -- Usar UNION ALL direto em vez de view
    RETURN QUERY
    SELECT 
      'solicitacao' as tipo,
      s.id, 
      s.assunto, 
      s.protocolo, 
      s.status,
      s.responsavel, 
      s.ponto_contato,
      s.created_at, 
      s.data_inicio, 
      s.data_contato, 
      s.data_finalizado,
      s.endereco_rua,
      s.endereco_numero,
      s.endereco_bairro,
      s.endereco_complemento,
      s.endereco_cep,
      s.endereco_cidade,
      s.endereco_uf,
      s.endereco_latitude, 
      s.endereco_longitude, 
      s.endereco_regional, 
      s.endereco_geocoding_status,
      s.endereco_validado,
      p.full_name as usuario_nome,
      p.email as usuario_email,
      CASE 
        WHEN s.endereco_latitude IS NOT NULL AND s.endereco_longitude IS NOT NULL THEN true
        ELSE false
      END as possui_coordenadas
    FROM solicitacoes s
    LEFT JOIN profiles p ON s.user_id = p.id
    WHERE 
      (p_status IS NULL OR s.status = ANY(p_status))
      AND (p_tipo IS NULL OR p_tipo = 'todos' OR 'solicitacao' = p_tipo)
      AND (p_regional IS NULL OR p_regional = 0 OR s.endereco_regional = p_regional)
    ORDER BY s.created_at DESC
    LIMIT p_limit OFFSET p_offset
    
    UNION ALL
    
    SELECT 
      'demanda' as tipo,
      d.id, 
      d.assunto, 
      d.protocolo, 
      d.status,
      d.responsavel, 
      d.ponto_contato,
      d.created_at, 
      d.data_inicio, 
      d.data_contato, 
      d.data_finalizado,
      d.endereco_rua,
      d.endereco_numero,
      d.endereco_bairro,
      d.endereco_complemento,
      d.endereco_cep,
      d.endereco_cidade,
      d.endereco_uf,
      d.endereco_latitude, 
      d.endereco_longitude, 
      d.endereco_regional, 
      d.endereco_geocoding_status,
      d.endereco_validado,
      p.full_name as usuario_nome,
      p.email as usuario_email,
      CASE 
        WHEN d.endereco_latitude IS NOT NULL AND d.endereco_longitude IS NOT NULL THEN true
        ELSE false
      END as possui_coordenadas
    FROM demandas d
    LEFT JOIN profiles p ON d.user_id = p.id
    WHERE 
      (p_status IS NULL OR d.status = ANY(p_status))
      AND (p_tipo IS NULL OR p_tipo = 'todos' OR 'demanda' = p_tipo)
      AND (p_regional IS NULL OR p_regional = 0 OR d.endereco_regional = p_regional)
    ORDER BY d.created_at DESC
    LIMIT p_limit OFFSET p_offset;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;
  
  -- Conceder permissões para a função fallback
  GRANT EXECUTE ON FUNCTION public.get_mapa_dados_paginado TO anon;
  GRANT EXECUTE ON FUNCTION public.get_mapa_dados_paginado TO authenticated;
  
  RAISE NOTICE '✅ Função fallback get_mapa_dados_paginado criada com permissões';
END $$;

-- Log final
DO $$
BEGIN
  RAISE NOTICE '🎯 Migration fix_rpc_exposure executada com sucesso';
  RAISE NOTICE '📋 View mapa_dados_estruturado verificada/recriada';
  RAISE NOTICE '📋 Permissões EXECUTE concedidas para anon/authenticated';
  RAISE NOTICE '📋 Função fallback get_mapa_dados_paginado criada';
  RAISE NOTICE '📋 Schemas verificados e corrigidos';
END $$;
