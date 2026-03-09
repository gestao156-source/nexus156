# 📋 Instruções para Rodar as Migrations

## 🔄 Migrations Criadas

### 1. Soft Delete Implementation
**Arquivo:** `supabase/migrations/20260309110000_soft_delete_implementation.sql`

**O que faz:**
- Adiciona campos `deleted_at` e `deleted_by` na tabela `profiles`
- Remove CASCADE DELETE e muda para SET NULL em `solicitacoes` e `demandas`
- Adiciona campos de backup do criador (`created_by_user_name`, `created_by_user_email`)
- Cria triggers para backup automático
- Atualiza RLS policies
- Cria índices para performance

### 2. Update Delete User Function
**Arquivo:** `supabase/migrations/20260309120000_update_delete_user_soft_delete.sql`

**O que faz:**
- Atualiza função `delete_user_complete` para soft delete
- Cria função `restore_user_deleted` para restauração
- Cria views `active_profiles` e `deleted_profiles`
- Adiciona logs de auditoria

### 3. Add Endereço Fields
**Arquivo:** `supabase/migrations/20260309130000_add_endereco_fields.sql`

**O que faz:**
- Adiciona campos de endereço em `solicitacoes` e `demandas`
- Cria validação de coordenadas
- Cria triggers e funções auxiliares
- Cria views para facilitar consultas
- Adiciona índices para performance

---

## 🚀 Como Rodar as Migrations

### Opção 1: Via Supabase CLI (Recomendado)
```bash
# 1. Iniciar Docker Desktop
# 2. Iniciar o projeto local
npx supabase start

# 3. Rodar as migrations
npx supabase db push

# 4. Verificar status
npx supabase status
```

### Opção 2: Via Dashboard Supabase
1. Acessar [dashboard.supabase.com](https://dashboard.supabase.com)
2. Selecionar seu projeto
3. Ir em `SQL Editor` > `New query`
4. Copiar e colar o conteúdo de cada migration
5. Executar na ordem correta

### Opção 3: Via psql (se tiver acesso direto)
```bash
psql -h [host] -U [user] -d [database] -f migration_file.sql
```

---

## 🧪 Testes para Validar

### 1. Soft Delete de Usuário
```sql
-- Testar soft delete
SELECT delete_user_complete('user_id_aqui');

-- Verificar usuário deletado
SELECT * FROM profiles WHERE deleted_at IS NOT NULL;

-- Verificar solicitações preservadas
SELECT * FROM solicitacoes WHERE user_id IS NULL;
```

### 2. Campos de Endereço
```sql
-- Inserir item com endereço
INSERT INTO solicitacoes (
  assunto, protocolo, status, 
  endereco_rua, endereco_numero, endereco_bairro, 
  endereco_localidade, endereco_cep, latitude, longitude,
  user_id
) VALUES (
  'Teste', 'TEST001', 'aguardando',
  'Rua das Flores', '123', 'Centro',
  'São Paulo', '01310-100', -23.5505, -46.6333,
  'user_id_aqui'
);

-- Verificar view com endereço formatado
SELECT * FROM solicitacoes_com_endereco;
```

### 3. Geocoding Frontend
- Abrir o modal de criar/editar solicitação
- Preencher CEP: `01310-100`
- Clicar em "Buscar"
- Verificar se endereço é preenchido automaticamente
- Verificar se mapa mostra localização correta

---

## 📦 Novos Componentes

### 1. EnderecoForm
**Arquivo:** `src/components/Endereco/EnderecoForm.tsx`

**Funcionalidades:**
- Busca de CEP automática (ViaCEP)
- Geocoding automático (Nominatim)
- Mapa interativo (Leaflet)
- Reverse geocoding (clique no mapa)
- Validação de coordenadas
- Cache para performance

### 2. GeocodingService
**Arquivo:** `src/services/geocoding.ts`

**Funcionalidades:**
- Integração com ViaCEP
- Integração com Nominatim
- Cache inteligente
- Debounce para evitar muitas requisições
- Validação e formatação

---

## 🎨 Estilos CSS

### Leaflet CSS
**Arquivo:** `src/styles/leaflet.css`

- Estilos personalizados para o mapa
- Correções para React + Leaflet
- Design responsivo
- Animações de loading

---

## 🔧 Dependências Instaladas

```json
{
  "leaflet": "^1.9.4",
  "react-leaflet": "^4.2.1", 
  "@types/leaflet": "^1.9.8",
  "@types/lodash": "^4.14.202"
}
```

---

## 📝 Mudanças nos Tipos

### KanbanItem Interface
- Adicionados campos de endereço
- Adicionados campos de backup do criador
- Mantida compatibilidade com código existente

---

## 🚀 Como Testar a Aplicação

### 1. Iniciar Desenvolvimento
```bash
npm run dev
```

### 2. Testar Soft Delete
1. Criar um usuário teste
2. Criar algumas solicitações/demandas
3. Excluir o usuário (via admin)
4. Verificar que solicitações/demandas ainda existem

### 3. Testar Endereços
1. Criar nova solicitação/demanda
2. Preencher CEP válido
3. Verificar preenchimento automático
4. Interagir com o mapa
5. Salvar e verificar dados

### 4. Testar Relatórios
- Verificar se novos campos aparecem nos relatórios
- Testar exportação com endereços

---

## ⚠️ Notas Importantes

1. **Backup:** Faça backup do banco antes de rodar as migrations
2. **Docker:** Certifique-se que Docker Desktop está rodando para usar CLI
3. **Permissões:** As migrations atualizam RLS policies, verifique permissões
4. **Performance:** Índices foram criados para manter performance
5. **Cache:** O serviço de geocoding usa cache para reduzir requisições

---

## 🎯 Próximos Passos

1. ✅ Rodar migrations
2. ✅ Testar soft delete
3. ✅ Testar endereços e mapa
4. 🔄 Atualizar dashboard com visualização geográfica
5. 🔄 Adicionar filtros por localidade
6. 🔄 Implementar analytics de localização

---

**Se encontrar algum problema, verifique os logs do console e os erros nas migrations.**
