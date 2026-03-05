# 🏗️ Arquitetura do Sistema Nexus156

## 📋 Visão Geral

O Nexus156 é uma aplicação web moderna construída com arquitetura SPA (Single Page Application) utilizando React no frontend e Supabase como backend-as-a-service.

## 🏛️ Arquitetura de Alto Nível

```
┌─────────────────────────────────────────────────────────────┐
│                    Navegador Web                          │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              React App (SPA)                       │    │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │    │
│  │  │  Dashboard  │ │    Kanban   │ │    Admin    │ │    │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase BaaS                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│  │ PostgreSQL  │ │    Auth     │ │   Storage   │        │
│  │   Database  │ │   Service   │ │   Service   │        │
│  └─────────────┘ └─────────────┘ └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

## 🛠️ Stack Tecnológico

### Frontend
- **React 18:** Biblioteca principal para UI
- **TypeScript:** Tipagem estática e segurança
- **Vite:** Build tool e servidor de desenvolvimento
- **Tailwind CSS:** Framework CSS utilitário
- **React Router DOM:** Navegação client-side
- **Lucide React:** Biblioteca de ícones

### Backend
- **Supabase:** Backend-as-a-Service completo
  - **PostgreSQL:** Banco de dados relacional
  - **Supabase Auth:** Autenticação e autorização
  - **Row Level Security (RLS):** Segurança em nível de linha
  - **Realtime:** Sincronização em tempo real
  - **Edge Functions:** Funções serverless

## 📁 Estrutura de Componentes

### Hierarquia Principal
```
App.tsx
├── AuthProvider
│   ├── ToastProvider
│   │   ├── BrowserRouter
│   │   │   ├── Routes
│   │   │   │   ├── Auth Route
│   │   │   │   └── Protected Routes
│   │   │   │       └── MainLayout
│   │   │   │           ├── Dashboard
│   │   │   │           ├── Solicitacoes
│   │   │   │           ├── Demandas
│   │   │   │           ├── AdminPanel
│   │   │   │           └── Perfil
```

### Componentes por Domínio

#### 📊 Dashboard
```
Dashboard/
├── Dashboard.tsx              # Componente principal
├── DashboardStats.tsx         # Tipos das estatísticas
├── PieChart.tsx              # Gráfico de pizza
├── BarChart.tsx              # Gráfico de barras
└── DashboardItemModal.tsx    # Modal de itens
```

#### 📋 Kanban
```
Kanban/
├── KanbanBoard.tsx           # Tabuleiro principal
├── KanbanColumn.tsx          # Coluna do kanban
├── KanbanCard.tsx           # Card individual
└── ItemModal.tsx            # Modal de edição
```

#### 🔐 Autenticação
```
Auth/
├── Auth.tsx                 # Página de login/cadastro
├── LoginForm.tsx           # Formulário de login
└── RegisterForm.tsx         # Formulário de cadastro
```

#### ⚙️ Admin
```
Admin/
└── RoleSelector.tsx         # Seletor de roles
```

#### 🎨 UI Components
```
UI/
├── Button.tsx              # Botão genérico
├── Input.tsx               # Input genérico
├── Modal.tsx               # Modal genérico
└── Loading.tsx             # Componente de loading
```

## 🗄️ Modelo de Dados

### Tabelas Principais

#### profiles
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### solicitacoes
```sql
CREATE TABLE solicitacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assunto TEXT NOT NULL,
  protocolo TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'aguardando',
  data_inicio DATE,
  data_contato DATE,
  data_finalizado DATE,
  observacoes TEXT,
  responsavel TEXT,
  ponto_contato TEXT,
  user_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### demandas
```sql
CREATE TABLE demandas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assunto TEXT NOT NULL,
  protocolo TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'aguardando',
  data_inicio DATE,
  data_contato DATE,
  data_finalizado DATE,
  observacoes TEXT,
  responsavel TEXT,
  ponto_contato TEXT,
  user_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### assuntos_padrao
```sql
CREATE TABLE assuntos_padrao (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### pontos_contato
```sql
CREATE TABLE pontos_contato (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### admin_logs
```sql
CREATE TABLE admin_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  operation TEXT NOT NULL,
  target_user_id UUID,
  old_value TEXT,
  new_value TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔐 Modelo de Segurança

### Row Level Security (RLS)

#### Políticas de profiles
```sql
-- Usuários podem ver seu próprio perfil
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Admins podem ver todos os perfis
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
```

#### Políticas de solicitacoes/demandas
```sql
-- Usuários autenticados podem ver todos os itens
CREATE POLICY "Authenticated users can view items" ON solicitacoes
  FOR SELECT USING (auth.role() = 'authenticated');

-- Usuários autenticados podem inserir itens
CREATE POLICY "Authenticated users can insert items" ON solicitacoes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Usuários podem atualizar próprios itens ou admins podem atualizar todos
CREATE POLICY "Users can update own items" ON solicitacoes
  FOR UPDATE USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
```

### RPC Functions

#### update_user_role
```sql
CREATE OR REPLACE FUNCTION update_user_role(user_id uuid, new_role text)
RETURNS boolean 
SECURITY DEFINER 
SET search_path = public
AS $$
-- Implementação segura para alteração de roles
$$;
```

#### delete_user_complete
```sql
CREATE OR REPLACE FUNCTION delete_user_complete(user_id_to_delete uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
-- Implementação para deletar usuário completamente
$$;
```

## 🔄 Fluxo de Dados

### Autenticação
1. Usuário faz login via Supabase Auth
2. Token JWT é retornado e armazenado
3. AuthContext gerencia estado de autenticação
4. Perfil do usuário é carregado do banco
5. RLS é aplicado automaticamente

### Operações CRUD
1. Componente faz chamada via cliente Supabase
2. Token JWT é incluído automaticamente
3. RLS valida permissões no banco
4. Operação é executada ou negada
5. Realtime atualiza outros clientes se aplicável

### Operações Admin
1. Apenas usuários com role='admin' podem acessar
2. RPC functions validam permissões adicionalmente
3. Logs são registrados em admin_logs
4. Operações críticas exigem confirmação

## 🎨 Estado da Aplicação

### React Contexts

#### AuthContext
```typescript
interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (newProfile: Partial<Profile>) => void;
  createTestUser: () => Promise<void>;
}
```

#### ToastContext
```typescript
interface ToastContextType {
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
  showInfo: (title: string, message?: string) => void;
  showWarning: (title: string, message?: string) => void;
}
```

### Estado Local vs Global
- **Estado Global:** Autenticação, notificações
- **Estado Local:** Formulários, modais, UI states
- **Estado Cache:** Dados do Supabase com React Query (planejado)

## 🚀 Performance e Otimizações

### Build e Bundle
- **Code Splitting:** React.lazy() para rotas
- **Tree Shaking:** Importações dinâmicas
- **Minificação:** Terser para JS/TS
- **CSS Optimization:** PurgeCSS para Tailwind

### Runtime
- **React.memo:** Para componentes puros
- **useMemo/useCallback:** Para cálculos pesados
- **Virtual Scrolling:** Para listas longas (planejado)
- **Image Optimization:** Lazy loading e WebP

### Database
- **Índices:** Em colunas frequentemente consultadas
- **Query Optimization:** SELECT específicos
- **Connection Pooling:** Gerenciado pelo Supabase
- **Caching:** Edge caching para estáticos

## 🔧 Configuração e Deploy

### Variáveis de Ambiente
```typescript
// src/lib/supabase.ts
export const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);
```

### Build Process
```bash
# Development
npm run dev          # Servidor de desenvolvimento

# Production
npm run build        # Build otimizado
npm run preview      # Preview do build
```

### Deploy Pipeline
1. Backup automático do código e dados
2. Build para produção
3. Deploy para ambiente de staging
4. Testes automatizados
5. Deploy para produção
6. Validação pós-deploy

## 📈 Escalabilidade

### Horizontal Scaling
- **Frontend:** CDN e cache estático
- **Backend:** Supabase auto-scaling
- **Database:** PostgreSQL com connection pooling

### Vertical Scaling
- **Frontend:** Code splitting e lazy loading
- **Backend:** Edge functions para compute intensivo
- **Database:** Índices e query optimization

## 🛡️ Monitoramento e Logging

### Frontend
- **Error Boundaries:** Captura de erros React
- **Performance Monitoring:** Web Vitals
- **User Analytics:** Comportamento do usuário

### Backend
- **Supabase Logs:** Query performance e errors
- **Admin Logs:** Auditoria de ações administrativas
- **Database Metrics:** Performance e utilização

---

**Última atualização:** 05 de Março de 2026  
**Versão:** 2.0.0  
**Arquitetura:** SPA + BaaS (React + Supabase)
