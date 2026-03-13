# Histórico de Procedimentos

## Visão Geral

O sistema de histórico de procedimentos substituiu o campo de texto livre "observações" por um sistema completo de auditoria e rastreamento de atividades.

## Características

### ✅ Funcionalidades Principais
- **Registro imutável**: Procedimentos não podem ser editados ou excluídos após criação
- **Rastreabilidade completa**: Data, hora e usuário registrados automaticamente
- **Histórico cronológico**: Visualização ordenada por data/hora (mais recente primeiro)
- **Controle de acesso**: Apenas responsáveis e admins podem adicionar procedimentos
- **Migração preservada**: Observações existentes migradas como primeiro registro

### 🔐 Segurança e Permissões

#### Quem pode visualizar procedimentos:
- **Admin**: Todos os itens
- **Criador do item**: Itens que criou
- **Responsável pelo item**: Itens onde é responsável

#### Quem pode adicionar procedimentos:
- **Admin**: Todos os itens
- **Responsável pelo item**: Apenas itens onde é responsável
- **Criador do item**: Apenas itens que criou (se não for responsável)

## Estrutura de Dados

### Tabela `historico_procedimentos`

```sql
CREATE TABLE historico_procedimentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL,                    -- ID da solicitação ou demanda
  item_tipo text NOT NULL CHECK (item_tipo IN ('solicitacao', 'demanda')),
  procedimento text NOT NULL,               -- Descrição do procedimento
  usuario_id uuid NOT NULL,                 -- Quem registrou
  usuario_nome text NOT NULL,               -- Nome do usuário (denormalizado)
  usuario_email text NOT NULL,              -- Email do usuário (denormalizado)
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
```

## Componentes

### 1. Hook `useHistoricoProcedimentos`

Gerencia o estado e operações do histórico:

```typescript
const {
  historico,
  loading,
  error,
  adicionando,
  adicionarProcedimento,
  podeAdicionarProcedimento,
  formatarData,
  getUltimoProcedimento
} = useHistoricoProcedimentos({ itemId, itemTipo });
```

#### Principais funções:
- `carregarHistorico()`: Busca procedimentos do item
- `adicionarProcedimento(texto)`: Adiciona novo procedimento
- `podeAdicionarProcedimento()`: Verifica permissões do usuário
- `formatarData(data)`: Formata data para exibição
- `getUltimoProcedimento()`: Retorna procedimento mais recente

### 2. Componente `HistoricoProcedimentos`

Interface completa para visualização e adição de procedimentos:

```tsx
<HistoricoProcedimentos
  itemId={item.id}
  itemTipo="solicitacao"
  disabled={isViewMode}
/>
```

#### Características da interface:
- **Lista cronológica** com avatar do usuário
- **Formulário de adição** com validação
- **Indicadores visuais** para registros migrados
- **Contador de registros** no header
- **Mensagens informativas** para estados vazios

## Migração de Dados

### Processo Executado

1. **Preservação**: Todas as observações existentes foram preservadas
2. **Migração**: Convertidas em primeiro registro do histórico
3. **Identificação**: Prefixadas com "Observação original:"
4. **Atribuição**: Usuário criador ou responsável como autor
5. **Remoção**: Campo `observacoes` removido das tabelas originais

### Scripts de Migração

- `20260313120000_migrar_observacoes_para_historico.sql`
- `20260313130000_remover_campo_observacoes.sql`

## Uso na Interface

### No ItemModal
O campo de observações foi substituído pelo componente completo:

```tsx
<div className="md:col-span-2">
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Histórico de Procedimentos
  </label>
  <HistoricoProcedimentos
    itemId={item?.id || ''}
    itemTipo={type === 'solicitacoes' ? 'solicitacao' : 'demanda'}
    disabled={isViewMode}
  />
</div>
```

### No DashboardItemModal
Exibe o último procedimento em vez das observações:

```tsx
{(() => {
  const { getUltimoProcedimento, formatarData } = useHistoricoProcedimentos({
    itemId: item.id,
    itemTipo: item.tipo === 'solicitacao' ? 'solicitacao' : 'demanda'
  });
  const ultimoProcedimento = getUltimoProcedimento();
  
  return ultimoProcedimento ? (
    <div className="mt-3 pt-3 border-t border-gray-100">
      {/* Exibe último procedimento com usuário e data */}
    </div>
  ) : null;
})()}
```

## RPC Functions

### `adicionar_procedimento(item_id, item_tipo, procedimento)`
Adiciona novo procedimento com validação de permissões.

### `obter_historico_procedimentos(item_id, item_tipo)`
Retorna histórico completo ordenado por data.

### `verificar_permissao_historico(item_id, item_tipo, usuario_id)`
Verifica se usuário tem permissão para o item.

## Políticas RLS

### Visualização
- Admins veem todos os procedimentos
- Criadores veem procedimentos dos seus itens
- Responsáveis veem procedimentos dos itens atribuídos

### Inserção
- Admins podem adicionar em qualquer item
- Criadores podem adicionar nos seus itens
- Responsáveis podem adicionar nos itens atribuídos

## Benefícios Alcançados

### 🎯 Para o Negócio
- **Auditoria completa**: Tudo registrado com quem, quando e o quê
- **Conformidade**: Registros imutáveis garantem integridade
- **Rastreabilidade**: Histórico completo do ciclo de vida

### 👥 Para os Usuários
- **Clareza**: Visualização cronológica clara
- **Segurança**: Controle de acesso granular
- **Facilidade**: Interface intuitiva para adicionar procedimentos

### 🔧 Para o Sistema
- **Performance**: Índices otimizados para consultas
- **Escalabilidade**: Estrutura preparada para crescimento
- **Manutenibilidade**: Código organizado e documentado

## Exemplo de Uso

### Adicionando um procedimento
```typescript
const handleAdicionar = async () => {
  const sucesso = await adicionarProcedimento(
    "Documento enviado ao setor X para análise"
  );
  
  if (sucesso) {
    // Procedimento adicionado com sucesso
    // Histórico recarregado automaticamente
  }
};
```

### Visualizando o histórico
O componente exibe automaticamente:
1. **Data e hora** formatadas (ex: "13/03/2026 14:30")
2. **Nome e email** do usuário que registrou
3. **Descrição** do procedimento
4. **Indicadores** para registros migrados

## Considerações Técnicas

### Performance
- Índices em `(item_id, item_tipo)` para consultas rápidas
- Índice em `created_at DESC` para ordenação
- Denormalização de dados do usuário para evitar joins

### Segurança
- RLS ativado em todas as operações
- Validação de permissões no servidor
- Logs de auditoria automáticos

### Compatibilidade
- Funciona com solicitações e demandas
- Preserva dados existentes
- Interface responsiva e acessível
