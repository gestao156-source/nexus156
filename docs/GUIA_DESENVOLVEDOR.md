# 👨‍💻 Guia do Desenvolvedor - Nexus156

## 🎯 Introdução

Este guia é destinado a desenvolvedores que desejam contribuir, estender ou manter o sistema Nexus156. Aqui você encontrará informações detalhadas sobre a arquitetura, padrões de código, fluxos de trabalho e melhores práticas.

## 🛠️ Ambiente de Desenvolvimento

### Pré-requisitos
- **Node.js:** 18.0.0 ou superior
- **npm:** 9.0.0 ou superior
- **Git:** 2.30.0 ou superior
- **VS Code:** Recomendado com extensões específicas
- **Conta Supabase:** Para desenvolvimento local

### Configuração Inicial

#### 1. Clonar o Repositório
```bash
git clone https://github.com/pituc988/nexus156.git
cd nexus156
```

#### 2. Instalar Dependências
```bash
npm install
```

#### 3. Configurar Variáveis de Ambiente
```bash
# Criar arquivo .env.local
cp .env.example .env.local
```

Edite `.env.local`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

#### 4. Iniciar Servidor de Desenvolvimento
```bash
npm run dev
```

Acesse: http://localhost:5173

### VS Code Extensions Recomendadas
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "ms-vscode.vscode-json",
    "ms-vscode.vscode-eslint"
  ]
}
```

## 🏗️ Estrutura do Projeto

### Visão Geral
```
src/
├── components/          # Componentes React reutilizáveis
├── contexts/           # React Contexts para estado global
├── hooks/              # Hooks personalizados
├── lib/                # Bibliotecas externas (Supabase)
├── pages/              # Páginas principais
├── types/              # Tipos TypeScript
├── utils/              # Funções utilitárias
├── assets/             # Assets estáticos
└── styles/             # Estilos globais
```

### Detalhamento das Pastas

#### components/
Organizado por domínio de negócio:
```
components/
├── Admin/              # Componentes administrativos
├── Auth/               # Autenticação e login
├── Dashboard/          # Dashboard e gráficos
├── Kanban/             # Sistema Kanban
├── Layout/             # Layout principal
└── UI/                 # Componentes genéricos
```

#### contexts/
Gerenciamento de estado global:
```
contexts/
├── AuthContext.tsx     # Estado de autenticação
└── ToastContext.tsx    # Sistema de notificações
```

#### hooks/
Hooks personalizados reutilizáveis:
```
hooks/
└── useSupabase.ts      # Hook para operações Supabase
```

#### types/
Definições de tipos TypeScript:
```
types/
├── index.ts            # Tipos principais
└── api.ts              # Tipos de API (planejado)
```

#### utils/
Funções utilitárias:
```
utils/
├── calculoDiasUteis.ts # Cálculo de dias úteis
├── formatters.ts        # Formatação de dados
└── validators.ts       # Validações (planejado)
```

## 📝 Padrões de Código

### Convenções de Nomenclatura

#### Componentes React
- **PascalCase:** `Dashboard.tsx`, `KanbanCard.tsx`
- **Nome descritivo:** `UserProfile.tsx` (não `UserProf.tsx`)
- **Prefixo de domínio:** `DashboardItemModal.tsx`

#### Arquivos e Funções
- **camelCase:** `calculoDiasUteis.ts`, `formatarData()`
- **Constantes:** `UPPER_SNAKE_CASE`, `API_BASE_URL`
- **Interfaces:** `PascalCase` com sufixo `I` opcional: `IUserProfile`

#### CSS Classes
- **Tailwind:** Prefira classes utilitárias
- **Custom:** `kebab-case` quando necessário: `.kanban-board`

### Estrutura de Componentes

#### Template Padrão
```tsx
import { useState, useEffect } from 'react';
import { SomeType } from '../types';

interface ComponentProps {
  prop1: string;
  prop2?: number; // Opcional
  onAction?: () => void; // Callback opcional
}

export default function Component({ prop1, prop2, onAction }: ComponentProps) {
  const [state, setState] = useState<Type>(initialValue);
  
  useEffect(() => {
    // Efeito colateral
  }, [dependencies]);

  const handleClick = () => {
    // Handler
    onAction?.();
  };

  return (
    <div className="p-4 bg-white rounded-lg">
      {/* JSX */}
    </div>
  );
}
```

#### Props Typing
```tsx
// ✅ Bom - Interface explícita
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
  disabled?: boolean;
}

// ❌ Evitar - Props genéricas
interface Props {
  // Evite nomes genéricos
}
```

### Estado e Efeitos

#### useState
```tsx
// ✅ Bom - Tipado explicitamente
const [items, setItems] = useState<KanbanItem[]>([]);

// ✅ Bom - Com valor inicial
const [loading, setLoading] = useState(false);

// ❌ Evitar - Sem tipagem
const [data, setData] = useState(null);
```

#### useEffect
```tsx
// ✅ Bom - Dependências explícitas
useEffect(() => {
  loadItems();
}, [userId, status]); // Dependências array

// ✅ Bom - Cleanup function
useEffect(() => {
  const subscription = supabase
    .channel('changes')
    .on('postgres_changes', handleRealtime)
    .subscribe();

  return () => subscription.unsubscribe();
}, []);
```

### Convenções de Importação

#### Ordem de Importação
```tsx
// 1. React e hooks
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// 2. Bibliotecas externas
import { supabase } from '../lib/supabase';

// 3. Tipos
import { Profile, KanbanItem } from '../types';

// 4. Componentes internos
import { Button, Modal } from '../components/UI';
import DashboardCard from '../components/Dashboard/DashboardCard';
```

#### Importações Dinâmicas
```tsx
// Para code splitting
const LazyComponent = lazy(() => import('./HeavyComponent'));

// Uso com Suspense
<Suspense fallback={<Loading />}>
  <LazyComponent />
</Suspense>
```

## 🔧 Configuração do Supabase

### Cliente Supabase
```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Operações Básicas

#### Select
```typescript
// Simples
const { data, error } = await supabase
  .from('solicitacoes')
  .select('*');

// Com filtros
const { data, error } = await supabase
  .from('solicitacoes')
  .select('*')
  .eq('status', 'aguardando')
  .order('created_at', { ascending: false });
```

#### Insert
```typescript
const { data, error } = await supabase
  .from('solicitacoes')
  .insert([{
    assunto: 'Novo assunto',
    status: 'aguardando',
    user_id: userId
  }]);
```

#### Update
```typescript
const { data, error } = await supabase
  .from('solicitacoes')
  .update({ status: 'em_analise' })
  .eq('id', itemId);
```

#### Delete
```typescript
const { error } = await supabase
  .from('solicitacoes')
  .delete()
  .eq('id', itemId);
```

### RPC Functions
```typescript
// Chamada de função RPC
const { data, error } = await supabase
  .rpc('update_user_role', {
    user_id: userId,
    new_role: 'admin'
  });
```

## 🎨 Estilização com Tailwind CSS

### Configuração
```javascript
// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
        }
      }
    },
  },
  plugins: [],
}
```

### Padrões de Classes

#### Layout
```tsx
// Container principal
<div className="min-h-screen bg-gray-50">

// Card padrão
<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">

// Grid responsivo
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
```

#### Componentes
```tsx
// Botão primário
<button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">

// Botão secundário
<button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300">

// Input
<input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
```

#### Estados
```tsx
// Loading
<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600">

// Success
<div className="bg-green-50 text-green-700 p-4 rounded-lg">

// Error
<div className="bg-red-50 text-red-700 p-4 rounded-lg">
```

## 🔄 Fluxo de Trabalho Git

### Branch Strategy

#### Branches Principais
- **main:** Produção estável
- **develop:** Desenvolvimento (planejado)
- **feature/*:** Novas funcionalidades
- **fix/*:** Correções de bugs
- **hotfix/*:** Correções urgentes em produção

#### Criando Branch
```bash
# Para nova funcionalidade
git checkout -b feature/nova-funcionalidade

# Para correção
git checkout -b fix/correction-descricao

# Para hotfix
git checkout -b hotfix/critical-fix
```

### Commits Padrão

#### Mensagem de Commit
```
<tipo>(<escopo>): <descrição>

[opcional: corpo]

[opcional: footer]
```

#### Tipos de Commit
- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Documentação
- `style:` Formatação, código limpo
- `refactor:` Refatoração
- `test:` Testes
- `chore:` Manutenção, dependências

#### Exemplos
```bash
feat(dashboard): add real-time statistics
fix(kanban): resolve drag and drop issue
docs(readme): update installation guide
refactor(auth): simplify login flow
```

### Pull Request Process

#### Template de PR
```markdown
## Descrição
Breve descrição da mudança

## Tipo de Mudança
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testes
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
```

## 🧪 Testes

### Estrutura de Testes
```
src/
├── __tests__/           # Testes unitários
├── components/          # Componentes com testes
│   └── Component.test.tsx
└── utils/              # Utilitários com testes
    └── util.test.ts
```

### Testes Unitários (Planejado)
```typescript
// __tests__/utils/calculoDiasUteis.test.ts
import { calcularDiasUteis, verificarAtraso } from '../utils/calculoDiasUteis';

describe('calculoDiasUteis', () => {
  test('deve calcular dias úteis corretamente', () => {
    const inicio = new Date('2024-01-01');
    const fim = new Date('2024-01-05');
    
    expect(calcularDiasUteis(inicio, fim)).toBe(4);
  });
});
```

### Testes de Componentes (Planejado)
```typescript
// components/Dashboard/Dashboard.test.tsx
import { render, screen } from '@testing-library/react';
import Dashboard from './Dashboard';

describe('Dashboard', () => {
  test('deve renderizar cards de estatísticas', () => {
    render(<Dashboard />);
    
    expect(screen.getByText('Aguardando Análise')).toBeInTheDocument();
    expect(screen.getByText('Em Análise')).toBeInTheDocument();
  });
});
```

## 🚀 Build e Deploy

### Scripts Disponíveis
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "typecheck": "tsc --noEmit -p tsconfig.app.json"
  }
}
```

### Build de Produção
```bash
# Verificar tipos
npm run typecheck

# Lint
npm run lint

# Build
npm run build

# Preview
npm run preview
```

### Otimização de Build
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
});
```

## 🔍 Debugging

### Ferramentas de Debug

#### React DevTools
- Instale extensão no navegador
- Inspecione componentes e estado
- Profile performance

#### Supabase Dashboard
- Monitor queries em tempo real
- Verifique logs de erro
- Analise performance do banco

#### Console Debugging
```typescript
// Debug de estado
console.log('Estado atual:', { items, loading, error });

// Debug de queries
console.log('Query Supabase:', { data, error });

// Debug de performance
console.time('loadData');
// ... operação
console.timeEnd('loadData');
```

### Problemas Comuns

#### Estado não atualizando
```typescript
// ❌ Problema - Mutação direta
items.push(newItem);

// ✅ Solução - Imutabilidade
setItems(prev => [...prev, newItem]);
```

#### Memory leaks
```typescript
// ❌ Problema - Cleanup não executado
useEffect(() => {
  const subscription = supabase.channel('changes').subscribe();
}, []);

// ✅ Solução - Cleanup function
useEffect(() => {
  const subscription = supabase.channel('changes').subscribe();
  
  return () => subscription.unsubscribe();
}, []);
```

## 📈 Performance

### Otimizações de Componentes
```typescript
// React.memo para componentes puros
export default React.memo(Component);

// useMemo para cálculos pesados
const expensiveValue = useMemo(() => {
  return heavyCalculation(data);
}, [data]);

// useCallback para funções
const handleClick = useCallback(() => {
  onItemClick(item);
}, [item, onItemClick]);
```

### Otimização de Imagens
```tsx
// Lazy loading
<img 
  src={imageUrl} 
  loading="lazy"
  alt="Description"
/>

// WebP support
<picture>
  <source srcSet={`${imageUrl}.webp`} type="image/webp" />
  <img src={imageUrl} alt="Description" />
</picture>
```

### Code Splitting
```typescript
// Route-based splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));

// Component-based splitting
const HeavyChart = lazy(() => import('./components/HeavyChart'));
```

## 📚 Recursos Adicionais

### Documentação
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Supabase Docs](https://supabase.com/docs)

### Ferramentas Úteis
- **React DevTools:** Debug de componentes
- **Tailwind IntelliSense:** Autocomplete CSS
- **ESLint:** Qualidade de código
- **Prettier:** Formatação automática

### Comunidade
- **GitHub Issues:** Reportar bugs e solicitar features
- **Discord:** Chat com outros desenvolvedores (planejado)
- **Stack Overflow:** Suporte técnico

---

**Última atualização:** 05 de Março de 2026  
**Versão:** 2.0.0  
**Maintainer:** Anderson de Souza Albino (@pituc988)
