# 📚 Referência da API - Nexus156

## 🎯 Visão Geral

O Nexus156 utiliza o Supabase como backend, fornecendo uma API REST completa com recursos em tempo real, autenticação integrada e segurança em nível de linha (RLS).

## 🔐 Autenticação

### Endpoints de Autenticação

#### Login
```http
POST /auth/v1/token?grant_type=password
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Resposta:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600,
  "user": {
    "id": "uuid-do-usuario",
    "email": "user@example.com",
    "aud": "authenticated"
  }
}
```

#### Registro
```http
POST /auth/v1/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "options": {
    "data": {
      "full_name": "Nome Completo",
      "role": "user"
    }
  }
}
```

#### Logout
```http
POST /auth/v1/logout
Authorization: Bearer <access_token>
```

#### Refresh Token
```http
POST /auth/v1/token?grant_type=refresh_token
Content-Type: application/json

{
  "refresh_token": "refresh_token_aqui"
}
```

## 📊 Tabelas da API

### profiles

Gerenciamento de perfis de usuários.

#### Estrutura
```typescript
interface Profile {
  id: string;           // UUID, PK, FK para auth.users
  email: string;        // Email do usuário
  full_name: string;    // Nome completo
  role: 'admin' | 'user'; // Nível de acesso
  created_at: string;   // Timestamp ISO
  updated_at: string;   // Timestamp ISO
}
```

#### Operações

**Listar todos os perfis (admin apenas)**
```http
GET /rest/v1/profiles?order=full_name
Authorization: Bearer <access_token>
```

**Obter perfil próprio**
```http
GET /rest/v1/profiles?id=eq.<user_id>
Authorization: Bearer <access_token>
```

**Atualizar perfil**
```http
PATCH /rest/v1/profiles?id=eq.<user_id>
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "full_name": "Novo Nome",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### solicitacoes

Gerenciamento de solicitações.

#### Estrutura
```typescript
interface Solicitacao {
  id: string;              // UUID, PK
  assunto: string;          // Assunto da solicitação
  protocolo: string;       // Protocolo único
  status: 'aguardando' | 'em_analise' | 'finalizado';
  data_inicio?: string;     // Data YYYY-MM-DD
  data_contato?: string;    // Data YYYY-MM-DD
  data_finalizado?: string; // Data YYYY-MM-DD
  observacoes?: string;     // Observações
  responsavel?: string;     // Nome do responsável
  ponto_contato?: string;   // Ponto de contato
  user_id: string;          // FK para profiles.id
  created_at: string;       // Timestamp ISO
  updated_at: string;       // Timestamp ISO
}
```

#### Operações

**Listar solicitações**
```http
GET /rest/v1/solicitacoes?order=created_at.desc
Authorization: Bearer <access_token>
```

**Filtrar por status**
```http
GET /rest/v1/solicitacoes?status=eq.aguardando&order=created_at.desc
Authorization: Bearer <access_token>
```

**Filtrar por usuário**
```http
GET /rest/v1/solicitacoes?user_id=eq.<user_id>
Authorization: Bearer <access_token>
```

**Criar solicitação**
```http
POST /rest/v1/solicitacoes
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "assunto": "Nova solicitação",
  "protocolo": "SOL-2024-001",
  "status": "aguardando",
  "responsavel": "João Silva",
  "ponto_contato": "Setor Financeiro",
  "user_id": "uuid-do-usuario"
}
```

**Atualizar solicitação**
```http
PATCH /rest/v1/solicitacoes?id=eq.<solicitacao_id>
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "status": "em_analise",
  "data_contato": "2024-01-15",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

**Excluir solicitação**
```http
DELETE /rest/v1/solicitacoes?id=eq.<solicitacao_id>
Authorization: Bearer <access_token>
```

### demandas

Gerenciamento de demandas (estrutura idêntica a solicitacoes).

#### Estrutura
```typescript
interface Demanda {
  id: string;              // UUID, PK
  assunto: string;          // Assunto da demanda
  protocolo: string;       // Protocolo único
  status: 'aguardando' | 'em_analise' | 'finalizado';
  data_inicio?: string;     // Data YYYY-MM-DD
  data_contato?: string;    // Data YYYY-MM-DD
  data_finalizado?: string; // Data YYYY-MM-DD
  observacoes?: string;     // Observações
  responsavel?: string;     // Nome do responsável
  ponto_contato?: string;   // Ponto de contato
  user_id: string;          // FK para profiles.id
  created_at: string;       // Timestamp ISO
  updated_at: string;       // Timestamp ISO
}
```

#### Operações

As mesmas operações de `solicitacoes` se aplicam a `demandas`.

### assuntos_padrao

Gerenciamento de assuntos padrão para formulários.

#### Estrutura
```typescript
interface AssuntoPadrao {
  id: string;          // UUID, PK
  nome: string;        // Nome do assunto (único)
  created_at: string;  // Timestamp ISO
  updated_at: string;  // Timestamp ISO
}
```

#### Operações

**Listar assuntos**
```http
GET /rest/v1/assuntos_padrao?order=nome
Authorization: Bearer <access_token>
```

**Criar assunto**
```http
POST /rest/v1/assuntos_padrao
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "nome": "Assunto Padrão"
}
```

### pontos_contato

Gerenciamento de pontos de contato padrão.

#### Estrutura
```typescript
interface PontoContato {
  id: string;          // UUID, PK
  nome: string;        // Nome do contato (único)
  created_at: string;  // Timestamp ISO
  updated_at: string;  // Timestamp ISO
}
```

#### Operações

**Listar pontos de contato**
```http
GET /rest/v1/pontos_contato?order=nome
Authorization: Bearer <access_token>
```

**Criar ponto de contato**
```http
POST /rest/v1/pontos_contato
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "nome": "Setor Financeiro"
}
```

### admin_logs

Logs de auditoria para ações administrativas.

#### Estrutura
```typescript
interface AdminLog {
  id: string;              // UUID, PK
  operation: string;       // Tipo de operação
  target_user_id?: string;  // UUID do usuário alvo
  old_value?: string;       // Valor anterior
  new_value?: string;       // Novo valor
  created_by: string;       // UUID do admin que executou
  created_at: string;       // Timestamp ISO
}
```

#### Operações

**Listar logs (admin apenas)**
```http
GET /rest/v1/admin_logs?order=created_at.desc
Authorization: Bearer <access_token>
```

## 🔧 RPC Functions

Funções personalizadas para operações administrativas.

### update_user_role

Altera o role de um usuário (admin apenas).

#### Parâmetros
```typescript
{
  user_id: string;    // UUID do usuário
  new_role: string;   // 'admin' | 'user'
}
```

#### Chamada
```http
POST /rest/v1/rpc/update_user_role
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "user_id": "uuid-do-usuario",
  "new_role": "admin"
}
```

#### Resposta
```json
true
```

### delete_user_complete

Remove completamente um usuário (perfil + auth).

#### Parâmetros
```typescript
{
  user_id_to_delete: string;  // UUID do usuário a ser deletado
}
```

#### Chamada
```http
POST /rest/v1/rpc/delete_user_complete
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "user_id_to_delete": "uuid-do-usuario"
}
```

#### Resposta
```json
true
```

### reset_user_password

Registra solicitação de reset de senha.

#### Parâmetros
```typescript
{
  user_id: string;       // UUID do usuário
  new_password: string;   // Nova senha (geralmente "123")
}
```

#### Chamada
```http
POST /rest/v1/rpc/reset_user_password
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "user_id": "uuid-do-usuario",
  "new_password": "123"
}
```

#### Resposta
```json
true
```

## 🔄 Realtime

Subscrição a mudanças em tempo real.

### Subscrição a Tabela
```javascript
import { supabase } from './lib/supabase';

const subscription = supabase
  .channel('solicitacoes_changes')
  .on(
    'postgres_changes',
    {
      event: '*', // INSERT, UPDATE, DELETE
      schema: 'public',
      table: 'solicitacoes'
    },
    (payload) => {
      console.log('Mudança detectada:', payload);
    }
  )
  .subscribe();
```

### Eventos Possíveis
- `INSERT`: Novo registro criado
- `UPDATE`: Registro atualizado
- `DELETE`: Registro removido

### Payload do Evento
```typescript
{
  eventType: 'INSERT' | 'UPDATE' | 'DELETE',
  table: string,
  schema: string,
  new: Record<string, any> | null,  // Para INSERT/UPDATE
  old: Record<string, any> | null,  // Para UPDATE/DELETE
  commit_timestamp: string
}
```

## 🔍 Query Avançadas

### Filtros Compostos
```http
GET /rest/v1/solicitacoes?
  status=eq.aguardando&
  created_at=gte.2024-01-01&
  user_id=eq.<user_id>&
  order=created_at.desc
```

### Operadores de Filtro
- `eq`: Igual a
- `neq`: Diferente de
- `gt`: Maior que
- `gte`: Maior ou igual a
- `lt`: Menor que
- `lte`: Menor ou igual a
- `like`: Like SQL
- `ilike`: Like case insensitive
- `in`: Em uma lista
- `cs`: Contém (para arrays)
- `cd`: Contido em (para arrays)

### Select com Relacionamentos
```http
GET /rest/v1/solicitacoes?select=*,profiles(full_name,email)
Authorization: Bearer <access_token>
```

### Aggregate Functions
```http
GET /rest/v1/solicitacoes?select=count(*)
Authorization: Bearer <access_token>
```

### Group By
```http
GET /rest/v1/solicitacoes?select=status,count(*)&groupby=status
Authorization: Bearer <access_token>
```

## 🛡️ Segurança

### Row Level Security (RLS)

Políticas ativas em todas as tabelas principais:

#### profiles
- Usuários podem ver/editar próprio perfil
- Admins podem ver/editar todos os perfis

#### solicitacoes/demandas
- Usuários autenticados podem ver todos os itens
- Usuários podem editar próprios itens
- Admins podem editar todos os itens

#### admin_logs
- Apenas admins podem ver logs

### Headers de Autenticação
```http
Authorization: Bearer <access_token>
apikey: <supabase_anon_key>
```

### Rate Limiting
- Configurado via Supabase
- Limites por usuário e por IP
- Proteção contra abuso

## 📊 Respostas e Erros

### Formato de Resposta de Sucesso
```json
{
  "data": [...],  // Array ou objeto
  "error": null
}
```

### Formato de Erro
```json
{
  "data": null,
  "error": {
    "message": "Erro detalhado",
    "code": "PGRST116", // Código PostgreSQL
    "details": "Detalhes adicionais"
  }
}
```

### Códigos de Erro Comuns
- `PGRST116`: Registro não encontrado
- `42501`: Permissão negada (RLS)
- `23505`: Violação de unique constraint
- `23503`: Violação de foreign key
- `23514`: Violação de check constraint

### Status HTTP
- `200`: Sucesso (GET, PATCH)
- `201`: Criado (POST)
- `204`: Sem conteúdo (DELETE)
- `400`: Bad Request
- `401`: Não autorizado
- `403`: Proibido
- `404`: Não encontrado
- `429`: Rate limit exceeded
- `500`: Erro interno do servidor

## 🚀 SDKs e Clientes

### JavaScript/TypeScript
```bash
npm install @supabase/supabase-js
```

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key);
```

### Python
```bash
pip install supabase
```

```python
from supabase import create_client

supabase = create_client(url, key)
```

### Outros SDKs
- [Dart/Flutter](https://pub.dev/packages/supabase_flutter)
- [Go](https://github.com/supabase-community/gotrue-go)
- [Java/Kotlin](https://github.com/supabase-community/supabase-java)

## 📈 Performance e Otimização

### Índices de Banco
```sql
-- Índices existentes
CREATE INDEX idx_solicitacoes_status ON solicitacoes(status);
CREATE INDEX idx_solicitacoes_user_id ON solicitacoes(user_id);
CREATE INDEX idx_solicitacoes_created_at ON solicitacoes(created_at);
```

### Cache Headers
```http
Cache-Control: public, max-age=300  // 5 minutos para dados dinâmicos
Cache-Control: public, max-age=86400 // 24 horas para dados estáticos
```

### Paginação
```http
GET /rest/v1/solicitacoes?limit=20&offset=0
Authorization: Bearer <access_token>
```

### Select Específico
```http
GET /rest/v1/solicitacoes?select=id,assunto,status
Authorization: Bearer <access_token>
```

---

**Última atualização:** 05 de Março de 2026  
**Versão:** 2.0.0  
**Backend:** Supabase (PostgreSQL + REST + Realtime)
