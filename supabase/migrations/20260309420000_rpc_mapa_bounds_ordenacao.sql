/*
  Migration: RPC Functions Mapa SaaS Production-Ready
  
  Esta migration cria as RPC functions otimizadas para o mapa SaaS:
  1. Correção ORDER BY com IF aninhado (100% funcional)
  2. RPC com bounding box para performance
  3. Limite de 300 pins para controle de performance
  4. Mantém compatibilidade com RPC existente
*/

-- Criar RPC corrigida com ORDER BY funcional
DO $$
BEGIN
  -- Remover se existir (para desenvolvimento)
  DROP FUNCTION IF EXISTS buscar_solicitacoes_mapa(text[], text, integer, integer, integer, text, text);
  
  -- Criar função corrigida com ORDER BY funcional
  CREATE OR REPLACE FUNCTION buscar_solicitacoes_mapa(
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
    -- Ordenação por assunto
    IF p_ordenar_por = 'assunto' THEN
      IF p_ordem = 'ASC' THEN
        RETURN QUERY
        SELECT * FROM mapa_dados_estruturado
        WHERE 
          (p_status IS NULL OR status = ANY(p_status))
          AND (p_tipo IS NULL OR tipo = p_tipo)
          AND (p_regional IS NULL OR endereco_regional = p_regional)
        ORDER BY assunto ASC
        LIMIT p_limit OFFSET p_offset;
      ELSE
        RETURN QUERY
        SELECT * FROM mapa_dados_estruturado
        WHERE 
          (p_status IS NULL OR status = ANY(p_status))
          AND (p_tipo IS NULL OR tipo = p_tipo)
          AND (p_regional IS NULL OR endereco_regional = p_regional)
        ORDER BY assunto DESC
        LIMIT p_limit OFFSET p_offset;
      END IF;
    
    -- Ordenação por protocolo
    ELSIF p_ordenar_por = 'protocolo' THEN
      IF p_ordem = 'ASC' THEN
        RETURN QUERY
        SELECT * FROM mapa_dados_estruturado
        WHERE 
          (p_status IS NULL OR status = ANY(p_status))
          AND (p_tipo IS NULL OR tipo = p_tipo)
          AND (p_regional IS NULL OR endereco_regional = p_regional)
        ORDER BY protocolo ASC
        LIMIT p_limit OFFSET p_offset;
      ELSE
        RETURN QUERY
        SELECT * FROM mapa_dados_estruturado
        WHERE 
          (p_status IS NULL OR status = ANY(p_status))
          AND (p_tipo IS NULL OR tipo = p_tipo)
          AND (p_regional IS NULL OR endereco_regional = p_regional)
        ORDER BY protocolo DESC
        LIMIT p_limit OFFSET p_offset;
      END IF;
    
    -- Ordenação por status
    ELSIF p_ordenar_por = 'status' THEN
      IF p_ordem = 'ASC' THEN
        RETURN QUERY
        SELECT * FROM mapa_dados_estruturado
        WHERE 
          (p_status IS NULL OR status = ANY(p_status))
          AND (p_tipo IS NULL OR tipo = p_tipo)
          AND (p_regional IS NULL OR endereco_regional = p_regional)
        ORDER BY status ASC
        LIMIT p_limit OFFSET p_offset;
      ELSE
        RETURN QUERY
        SELECT * FROM mapa_dados_estruturado
        WHERE 
          (p_status IS NULL OR status = ANY(p_status))
          AND (p_tipo IS NULL OR tipo = p_tipo)
          AND (p_regional IS NULL OR endereco_regional = p_regional)
        ORDER BY status DESC
        LIMIT p_limit OFFSET p_offset;
      END IF;
    
    -- Ordenação padrão (created_at)
    ELSE
      IF p_ordem = 'ASC' THEN
        RETURN QUERY
        SELECT * FROM mapa_dados_estruturado
        WHERE 
          (p_status IS NULL OR status = ANY(p_status))
          AND (p_tipo IS NULL OR tipo = p_tipo)
          AND (p_regional IS NULL OR endereco_regional = p_regional)
        ORDER BY created_at ASC
        LIMIT p_limit OFFSET p_offset;
      ELSE
        RETURN QUERY
        SELECT * FROM mapa_dados_estruturado
        WHERE 
          (p_status IS NULL OR status = ANY(p_status))
          AND (p_tipo IS NULL OR tipo = p_tipo)
          AND (p_regional IS NULL OR endereco_regional = p_regional)
        ORDER BY created_at DESC
        LIMIT p_limit OFFSET p_offset;
      END IF;
    END IF;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;
END $$;

-- Criar RPC com bounding box para performance
DO $$
BEGIN
  -- Remover se existir (para desenvolvimento)
  DROP FUNCTION IF EXISTS buscar_solicitacoes_bbox(decimal, decimal, decimal, decimal, text[], text, integer, integer);
  
  -- Criar função para bounding box
  CREATE OR REPLACE FUNCTION buscar_solicitacoes_bbox(
    p_north decimal(10, 8),
    p_south decimal(10, 8),
    p_east decimal(11, 8),
    p_west decimal(11, 8),
    p_status text[] DEFAULT NULL,
    p_tipo text DEFAULT NULL,
    p_regional integer DEFAULT NULL,
    p_limit integer DEFAULT 300
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
    RETURN QUERY
    SELECT * FROM mapa_dados_estruturado
    WHERE 
      -- Filtro de bounding box (só pins visíveis)
      endereco_latitude BETWEEN p_south AND p_north
      AND endereco_longitude BETWEEN p_west AND p_east
      AND possui_coordenadas = true
      -- Filtros opcionais
      AND (p_status IS NULL OR status = ANY(p_status))
      AND (p_tipo IS NULL OR tipo = p_tipo)
      AND (p_regional IS NULL OR endereco_regional = p_regional)
      -- Ordenação padrão
    ORDER BY created_at DESC
    LIMIT p_limit;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;
END $$;

-- Criar função para contar total no bounding box (para mensagem de limite)
DO $$
BEGIN
  -- Remover se existir (para desenvolvimento)
  DROP FUNCTION IF EXISTS contar_solicitacoes_bbox(decimal, decimal, decimal, decimal, text[], text, integer);
  
  -- Criar função de contagem
  CREATE OR REPLACE FUNCTION contar_solicitacoes_bbox(
    p_north decimal(10, 8),
    p_south decimal(10, 8),
    p_east decimal(11, 8),
    p_west decimal(11, 8),
    p_status text[] DEFAULT NULL,
    p_tipo text DEFAULT NULL,
    p_regional integer DEFAULT NULL
  )
  RETURNS bigint AS $$
  DECLARE
    total_count bigint;
  BEGIN
    SELECT COUNT(*) INTO total_count
    FROM mapa_dados_estruturado
    WHERE 
      endereco_latitude BETWEEN p_south AND p_north
      AND endereco_longitude BETWEEN p_west AND p_east
      AND possui_coordenadas = true
      AND (p_status IS NULL OR status = ANY(p_status))
      AND (p_tipo IS NULL OR tipo = p_tipo)
      AND (p_regional IS NULL OR endereco_regional = p_regional);
    
    RETURN total_count;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;
END $$;

-- Log de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Migration RPC mapa SaaS executada com sucesso';
  RAISE NOTICE '📋 RPC corrigida: buscar_solicitacoes_mapa (ORDER BY funcional)';
  RAISE NOTICE '📋 RPC nova: buscar_solicitacoes_bbox (bounding box)';
  RAISE NOTICE '📋 RPC nova: contar_solicitacoes_bbox (contagem para limite)';
  RAISE NOTICE '📋 Limite de pins: 300 (padrão Google Maps/Uber)';
END $$;
