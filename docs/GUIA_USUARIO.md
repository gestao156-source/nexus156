# 📖 Guia do Usuário - Nexus156

## 🎯 Bem-vindo ao Nexus156

O Nexus156 é um sistema completo para gerenciamento de solicitações e demandas, desenvolvido para otimizar o fluxo de trabalho e proporcionar visibilidade total sobre o andamento das atividades.

## 🚀 Primeiros Passos

### Acesso ao Sistema
1. Abra seu navegador e acesse: `https://seu-dominio.com`
2. Faça login com seu email e senha
3. Após login, você será redirecionado para o Dashboard

### Tela Principal (Dashboard)
O Dashboard é sua central de comandos, onde você visualiza:
- **Estatísticas em tempo real** de todas as atividades
- **Gráficos interativos** para análise visual
- **Acesso rápido** às principais funcionalidades

## 📊 Dashboard Detalhado

### Cards de Estatísticas

#### 🟡 Aguardando Análise
- **O que mostra:** Quantidade de itens aguardando processamento
- **Como usar:** Clique no card para ver todos os itens aguardando
- **Status normal:** Itens recentes (menos de 1 dia útil)

#### 🔵 Em Análise
- **O que mostra:** Quantidade de itens em processamento
- **Como usar:** Clique para ver itens sendo analisados
- **Status normal:** Itens em andamento (até 3 dias úteis)

#### 🔴 Atrasados
- **O que mostra:** Itens que excederam o prazo normal
- **Como usar:** Clique para ver itens que precisam atenção urgente
- **Ação necessária:** Priorizar estes itens

#### 🟢 Finalizados
- **O que mostra:** Quantidade de itens concluídos
- **Como usar:** Clique para ver histórico de conclusões
- **Status normal:** Itens entregues no prazo

#### 📊 Total Geral
- **O que mostra:** Soma total de todos os itens
- **Como usar:** Clique para ir para a lista mais completa
- **Informação:** Visão geral do volume de trabalho

### Gráficos Interativos

#### Gráfico de Pizza
- **Função:** Mostra distribuição percentual por status
- **Cores:** 
  - Amarelo: Aguardando análise
  - Azul: Em análise
  - Verde: Finalizados
- **Uso:** Identificar rapidamente o balanceamento do trabalho

#### Gráfico de Barras
- **Função:** Compara volume entre Solicitações e Demandas
- **Cores:**
  - Azul: Solicitações
  - Roxo: Demandas
- **Uso:** Identificar qual tipo de item tem maior volume

### Modal Inteligente
Ao clicar nos cards de estatísticas, um modal é aberto mostrando:
- **Lista detalhada** dos itens daquele status
- **Informações relevantes** de cada item
- **Acesso direto** ao item no Kanban
- **Navegação rápida** entre itens

## 📋 Sistema Kanban

### Visão Geral
O Kanban é a ferramenta principal para gestão do fluxo de trabalho, organizado em três colunas:

#### 🟡 Coluna "Aguardando Análise"
- **Propósito:** Itens novos que precisam ser triados
- **Ações:** 
  - Analisar prioridade
  - Atribuir responsável
  - Definir ponto de contato
  - Mover para "Em Análise" quando iniciado

#### 🔵 Coluna "Em Análise"
- **Propósito:** Itens em andamento ativo
- **Ações:**
  - Atualizar progresso
  - Adicionar observações
  - Definir data de contato
  - Mover para "Finalizado" quando concluído

#### 🟢 Coluna "Finalizado"
- **Propósito:** Itens concluídos e entregues
- **Ações:**
  - Revisar finalização
  - Registrar data final
  - Arquivar documento
  - Itens ficam aqui para histórico

### Operações no Kanban

#### Adicionar Novo Item
1. Clique no botão **"+ Novo Item"**
2. Preencha o formulário:
   - **Assunto:** Descrição clara do item
   - **Responsável:** Pessoa responsável pelo item
   - **Ponto de Contato:** Contato principal
   - **Observações:** Detalhes adicionais
3. Clique em **"Salvar"**

#### Editar Item Existente
1. Clique no card que deseja editar
2. Modifique as informações necessárias
3. Clique em **"Atualizar"**

#### Mover Entre Colunas
1. **Arraste e solte** o card para a coluna desejada
2. Ou clique no card → use o menu de status
3. O sistema atualiza automaticamente

#### Visualizar Detalhes
1. Clique no card para expandir informações
2. Veja:
   - Protocolo único
   - Datas importantes
   - Histórico de alterações
   - Observações completas

### Tipos de Itens

#### 📄 Solicitações
- **Definição:** Requisições internas ou externas
- **Exemplos:** Pedidos de informação, solicitações de serviço
- **Fluxo:** Triagem → Análise → Resposta

#### 📋 Demandas
- **Definição:** Exigências ou obrigações
- **Exemplos:** Entregáveis, prazos contratuais
- **Fluxo:** Planejamento → Execução → Entrega

## ⚙️ Painel Administrativo (Acesso Admin)

### Gestão de Usuários

#### Criar Novo Usuário
1. Acesse **Painel Admin** → **Usuários**
2. Clique em **"+ Novo Usuário"**
3. Informe:
   - **Email:** Email corporativo
   - **Nome completo:** Nome para exibição
   - **Role:** Nível de acesso (user/admin)
4. Senha padrão: **123** (usuário deve alterar no primeiro acesso)

#### Alterar Permissões
1. Na lista de usuários, encontre o usuário desejado
2. Use o **seletor de role** para alterar entre:
   - **User:** Acesso básico ao sistema
   - **Admin:** Acesso completo ao painel administrativo
3. Confirme a alteração

#### Resetar Senha
1. Clique no ícone de **chave** ao lado do usuário
2. Confirme o reset
3. Senha será resetada para **123**
4. Notifique o usuário para alterar no próximo login

#### Excluir Usuário
1. Clique no ícone de **lixeira**
2. Confirme a exclusão
3. **Atenção:** Esta ação é permanente e remove todos os dados

### Gestão de Assuntos Padrão

#### Criar Novo Assunto
1. Acesse **Painel Admin** → **Assuntos**
2. Clique em **"+ Novo Assunto"**
3. Digite o nome do assunto
4. Confirme a criação

#### Excluir Assunto
1. Clique na lixeira ao lado do assunto
2. Confirme a exclusão
3. **Atenção:** Itens existentes não são afetados

### Gestão de Pontos de Contato

#### Adicionar Ponto de Contato
1. Acesse **Painel Admin** → **Pontos de Contato**
2. Clique em **"+ Novo Ponto"**
3. Digite o nome do contato
4. Confirme

#### Remover Ponto de Contato
1. Clique na lixeira ao lado do contato
2. Confirme a remoção

## 🔐 Segurança e Permissões

### Níveis de Acesso

#### User (Usuário Comum)
- ✅ Visualizar Dashboard
- ✅ Gerenciar próprios itens no Kanban
- ✅ Editar informações do perfil
- ❌ Acessar painel administrativo
- ❌ Gerenciar outros usuários

#### Admin (Administrador)
- ✅ Todas as permissões de User
- ✅ Acessar painel administrativo
- ✅ Gerenciar usuários
- ✅ Configurar assuntos e contatos
- ✅ Visualizar logs de auditoria

### Boas Práticas de Segurança
- **Senha forte:** Mínimo 8 caracteres, números e símbolos
- **Alteração regular:** Troque sua senha a cada 90 dias
- **Não compartilhe:** Nunca compartilhe suas credenciais
- **Logout:** Sempre faça logout ao terminar o uso

## 📱 Dicas e Truques

### Produtividade

#### Atalhos de Navegação
- **Dashboard:** `Ctrl + D` (planejado)
- **Solicitações:** `Ctrl + S` (planejado)
- **Demandas:** `Ctrl + Shift + D` (planejado)

#### Filtros Rápidos
- Use o campo de busca para filtrar itens
- Filtre por responsável ou ponto de contato
- Ordene por data ou status

#### Trabalho em Equipe
- **Atribua responsáveis** claros para cada item
- **Comunique-se** através das observações
- **Atualize status** regularmente

### Gestão de Tempo

#### Prazos Automáticos
- **Aguardando:** 1 dia útil para começar análise
- **Em Análise:** 3 dias úteis para conclusão
- **Atrasados:** Itens vermelhos precisam atenção

#### Priorização
1. **Urgente:** Itens atrasados (vermelho)
2. **Alta:** Itens em análise há mais de 2 dias
3. **Normal:** Itens dentro do prazo
4. **Baixa:** Itens novos aguardando análise

## 🚨 Resolução de Problemas

### Problemas Comuns

#### Não consigo fazer login
- **Verifique:** Email e senha corretos
- **Tente:** Resetar senha com o admin
- **Contate:** Suporte técnico

#### Item não aparece no Dashboard
- **Verifique:** Filtros aplicados
- **Atualize:** Página (F5)
- **Verifique:** Se você tem permissão para visualizar

#### Não consigo mover card no Kanban
- **Verifique:** Se você tem permissão para editar
- **Tente:** Clicar e arrastar novamente
- **Use:** Menu de status do card

#### Sistema lento
- **Verifique:** Conexão com internet
- **Limpe:** Cache do navegador
- **Tente:** Navegador diferente

### Contato de Suporte
- **Email:** suporte@nexus156.com
- **Telefone:** (XX) XXXXX-XXXX
- **Horário:** Seg-Sex, 8h-18h

## 📈 Melhores Práticas

### Uso Diário
1. **Inicie:** Verifique Dashboard pela manhã
2. **Priorize:** Itens atrasados primeiro
3. **Atualize:** Status dos itens em andamento
4. **Finalize:** Itens prontos durante o dia
5. **Revise:** Dashboard ao final do dia

### Trabalho em Equipe
- **Comunicação clara:** Use observações detalhadas
- **Responsabilidade:** Atribua dono para cada item
- **Colaboração:** Ajude colegas com itens sobrecarregados
- **Transparência:** Mantenha status sempre atualizados

### Qualidade
- **Informações completas:** Preencha todos os campos
- **Padronização:** Use assuntos e contatos padrão
- **Documentação:** Registre decisões importantes
- **Follow-up:** Verifique resultados após finalização

---

**Última atualização:** 05 de Março de 2026  
**Versão:** 2.0.0  
**Para dúvidas:** contato@nexus156.com
