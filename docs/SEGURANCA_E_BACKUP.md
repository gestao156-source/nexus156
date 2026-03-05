# 🛡️ Guia de Segurança e Backup - Nexus156 v2.0.0

## 🎯 Objetivo
Garantir a máxima segurança, integridade dos dados e disponibilidade do sistema Nexus156 através de práticas robustas de backup, monitoramento e recuperação de desastres.

## 📋 Comandos Essenciais

### 🔄 Backup Diário (Obrigatório)
```bash
# Windows
.\scripts\backup.bat

# Linux/Mac
./scripts/backup.sh
```
**Quando usar:** Ao final de cada dia de trabalho  
**O que faz:** Backup completo do código, configurações e dados

### 📦 Versionamento Automático
```bash
npm run versionar
```
**Quando usar:**
- Antes de cada grande alteração
- Ao final de cada sprint/semana
- Antes de fazer deploy

### 🚀 Deploy Seguro
```bash
npm run safe-deploy
```
**Quando usar:** Sempre! Faz backup + build + deploy automático

### 📊 Verificação de Backup
```bash
# Ver últimos backups
ls -la backups/

# Ver tamanho dos backups
du -sh backups/*

# Ver conteúdo do último backup
unzip -l backups/nexus156_backup_ULTIMO.zip
```

## ⚠️ Regras de Ouro de Segurança

### 1. Controle de Acesso
- **NUNCA** compartilhe credenciais
- **SEMPRE** use senhas fortes
- **MANTENHA** roles atualizadas
- **REVOGUE** acesso de ex-funcionários imediatamente

### 2. Desenvolvimento Seguro
- **NUNCA** trabalhe diretamente na `main`
- **SEMPRE** crie branches para features
- **JAMAIS** commit dados sensíveis
- **USE** variáveis de ambiente

### 3. Backup e Recuperação
- **BACKUP** antes de qualquer grande alteração
- **TESTE** restores regularmente
- **ARMAZENE** backups em múltiplos locais
- **MONITORE** integridade dos backups

### 4. Produção
- **TESTE** tudo antes do deploy
- **DEPLOY** apenas com backup prévio
- **MONITORE** logs pós-deploy
- **TENHA** plano de rollback

### 5. Auditoria
- **LOGUE** todas as ações administrativas
- **REVISE** logs regularmente
- **INVESTIGUE** atividades suspeitas
- **DOCUMENTE** incidentes

## 📁 Estrutura de Backup

### Tipos de Backup

#### 1. Backup de Código
```bash
# Local: backups/nexus156_backup_YYYYMMDD_HHMMSS_codigo.zip
Contém:
├── src/                    # Código fonte completo
├── public/                 # Assets públicos
├── package.json           # Dependências
├── tsconfig.json          # Config TypeScript
├── tailwind.config.js     # Config Tailwind
├── vite.config.ts         # Config Vite
└── .env.example          # Template de variáveis
```

#### 2. Backup de Configurações
```bash
# Local: backups/nexus156_backup_YYYYMMDD_HHMMSS_config.zip
Contém:
├── supabase/migrations/   # Migrações SQL
├── scripts/              # Scripts de automação
├── docs/                 # Documentação
├── .gitignore           # Regras Git
├── VERSION              # Versão atual
└── README.md           # Documentação principal
```

#### 3. Backup de Dados (via Supabase)
```sql
-- Backup completo das tabelas
CREATE TABLE backup_profiles_YYYYMMDD AS SELECT * FROM profiles;
CREATE TABLE backup_solicitacoes_YYYYMMDD AS SELECT * FROM solicitacoes;
CREATE TABLE backup_demandas_YYYYMMDD AS SELECT * FROM demandas;
CREATE TABLE backup_assuntos_padrao_YYYYMMDD AS SELECT * FROM assuntos_padrao;
CREATE TABLE backup_pontos_contato_YYYYMMDD AS SELECT * FROM pontos_contato;
```

### Localização dos Backups
```
backups/
├── nexus156_backup_20260305_154137_codigo.zip    # Código fonte
├── nexus156_backup_20260305_154137_config.zip    # Configurações
├── nexus156_backup_20260305_141441_codigo.zip   # Backup anterior
└── archive/                                       # Backups antigos (>30 dias)
    ├── 2024-12/
    ├── 2025-01/
    └── 2025-02/
```

## 🔒 Políticas de Segurança

### Autenticação e Autorização

#### Supabase Auth
- **JWT Tokens:** Expiram em 1 hora
- **Refresh Tokens:** Expiram em 30 dias
- **Row Level Security:** Ativado em todas as tabelas
- **MFA:** Planejado para v2.1.0

#### Roles e Permissões
```typescript
// Níveis de acesso
enum UserRole {
  USER = 'user',      // Acesso básico ao sistema
  ADMIN = 'admin'     // Acesso administrativo completo
}

// Permissões por role
const permissions = {
  user: [
    'dashboard:read',
    'solicitacoes:read',
    'solicitacoes:create',
    'solicitacoes:update:own',
    'demandas:read',
    'demandas:create',
    'demandas:update:own',
    'profile:update:own'
  ],
  admin: [
    ...permissions.user,
    'users:read',
    'users:create',
    'users:update',
    'users:delete',
    'admin:read',
    'system:backup',
    'system:deploy'
  ]
};
```

### Row Level Security (RLS)

#### Políticas de profiles
```sql
-- Usuários podem ver próprio perfil
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

-- Usuários podem atualizar próprio perfil
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admins podem atualizar todos os perfis
CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (
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

-- Usuários podem inserir itens
CREATE POLICY "Users can insert items" ON solicitacoes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Usuários podem atualizar próprios itens
CREATE POLICY "Users can update own items" ON solicitacoes
  FOR UPDATE USING (user_id = auth.uid());

-- Admins podem atualizar todos os itens
CREATE POLICY "Admins can update all items" ON solicitacoes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
```

### RPC Functions Seguras

#### update_user_role
```sql
CREATE OR REPLACE FUNCTION update_user_role(user_id uuid, new_role text)
RETURNS boolean 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
    current_user_role text;
    admin_count integer;
BEGIN
    -- Verificar se usuário atual é admin
    SELECT role INTO current_user_role 
    FROM profiles 
    WHERE id = auth.uid();
    
    IF current_user_role != 'admin' THEN
        RAISE EXCEPTION 'Apenas admin pode alterar roles';
    END IF;
    
    -- Impedir auto-alteração
    IF user_id = auth.uid() THEN
        RAISE EXCEPTION 'Não pode alterar próprio role';
    END IF;
    
    -- Verificar se role é válido
    IF new_role NOT IN ('admin', 'user') THEN
        RAISE EXCEPTION 'Role inválido';
    END IF;
    
    -- Verificar mínimo de admins
    IF new_role = 'user' THEN
        SELECT COUNT(*) INTO admin_count
        FROM profiles 
        WHERE role = 'admin';
        
        IF admin_count <= 1 THEN
            RAISE EXCEPTION 'Não pode remover o último admin';
        END IF;
    END IF;
    
    -- Atualizar role com log
    UPDATE profiles 
    SET role = new_role, updated_at = now()
    WHERE id = user_id;
    
    -- Log da operação
    INSERT INTO admin_logs (operation, target_user_id, old_value, new_value, created_by, created_at)
    VALUES ('role_update', user_id, current_user_role, new_role, auth.uid(), now());
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;
```

## 🔄 Fluxo de Trabalho Seguro

### 1. Iniciar o Dia
```bash
# Verificar status atual
git status

# Backup diário
npm run backup

# Iniciar desenvolvimento
npm run dev
```

### 2. Nova Funcionalidade
```bash
# Criar branch
git checkout -b feature/nova-funcionalidade

# Desenvolver...
# Commit com mensagem clara
git add .
git commit -m "feat: adicionar nova funcionalidade X"

# Backup antes de merge
npm run backup

# Versionar
npm run versionar

# Merge para main
git checkout main
git merge feature/nova-funcionalidade

# Deploy seguro
npm run safe-deploy
```

### 3. Correção de Bug
```bash
# Criar branch de fix
git checkout -b fix/correction-descricao

# Corrigir bug...
git add .
git commit -m "fix: corrigir problema de validação X"

# Testar e deploy
npm run backup
npm run versionar
git checkout main
git merge fix/correction-descricao
npm run safe-deploy
```

### 4. Emergência (Hotfix)
```bash
# Branch direto da main
git checkout main
git checkout -b hotfix/emergency-fix

# Correção rápida
git add .
git commit -m "hotfix: correção crítica de segurança"

# Deploy imediato
npm run backup
npm run versionar
git checkout main
git merge hotfix/emergency-fix
npm run safe-deploy
```

## 🚨 Plano de Recuperação de Desastres

### Cenários de Falha

#### 1. Perda de Código Fonte
```bash
# Restaurar do backup mais recente
unzip backups/nexus156_backup_ULTIMO_codigo.zip -d temp_restore/

# Verificar integridade
cd temp_restore
npm install
npm run build

# Restaurar para projeto principal
cp -r * ../
cd ..
rm -rf temp_restore

# Verificar no Git
git status
git log --oneline -5
```

#### 2. Corrupção de Banco de Dados
```sql
-- Identificar último backup funcional
SELECT table_name, 
       to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') as backup_time
FROM information_schema.tables 
WHERE table_name LIKE 'backup_%' 
ORDER BY backup_time DESC;

-- Restaurar tabelas
DROP TABLE solicitacoes;
CREATE TABLE solicitacoes AS SELECT * FROM backup_solicitacoes_YYYYMMDD;

-- Restaurar outras tabelas...
DROP TABLE demandas;
CREATE TABLE demandas AS SELECT * FROM backup_demandas_YYYYMMDD;

-- Verificar integridade
SELECT COUNT(*) FROM solicitacoes;
SELECT COUNT(*) FROM demandas;
SELECT COUNT(*) FROM profiles;
```

#### 3. Comprometimento de Segurança
```bash
# 1. Isolar sistema
npm run backup  # Backup do estado comprometido

# 2. Resetar todas as senhas
# Via Supabase Dashboard ou RPC functions

# 3. Revogar todos os tokens
# Via Supabase Auth settings

# 4. Forçar logout global
# Implementar função de logout forçado

# 5. Auditar logs
SELECT * FROM admin_logs 
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

# 6. Notificar usuários
# Enviar email sobre reset de senhas
```

#### 4. Falha de Produção
```bash
# 1. Identificar problema
git log --oneline -10
git diff HEAD~1 HEAD

# 2. Rollback para versão estável
git checkout HASH_ULTIMA_VERSAO_ESTAVEL
npm run build
npm run deploy

# 3. Verificar funcionamento
npm run test  # Se existirem testes

# 4. Comunicar stakeholders
# Notificar sobre rollback e investigação
```

### Procedimento de Restore Completo

#### 1. Preparação
```bash
# Criar diretório de restore
mkdir restore_$(date +%Y%m%d_%H%M%S)
cd restore_$(date +%Y%m%d_%H%M%S)

# Backup do estado atual (se possível)
cp -r ../backups ./
```

#### 2. Restore do Código
```bash
# Descompactar backup mais recente
unzip ../backups/nexus156_backup_YYYYMMDD_HHMMSS_codigo.zip

# Verificar estrutura
ls -la

# Instalar dependências
npm install

# Verificar build
npm run build
```

#### 3. Restore do Banco
```sql
-- Conectar ao Supabase SQL Editor

-- Restaurar tabelas principais
DROP TABLE IF EXISTS solicitacoes CASCADE;
CREATE TABLE solicitacoes AS SELECT * FROM backup_solicitacoes_YYYYMMDD;

DROP TABLE IF EXISTS demandas CASCADE;
CREATE TABLE demandas AS SELECT * FROM backup_demandas_YYYYMMDD;

DROP TABLE IF EXISTS profiles CASCADE;
CREATE TABLE profiles AS SELECT * FROM backup_profiles_YYYYMMDD;

-- Restaurar tabelas auxiliares
DROP TABLE IF EXISTS assuntos_padrao CASCADE;
CREATE TABLE assuntos_padrao AS SELECT * FROM backup_assuntos_padrao_YYYYMMDD;

DROP TABLE IF EXISTS pontos_contato CASCADE;
CREATE TABLE pontos_contato AS SELECT * FROM backup_pontos_contato_YYYYMMDD;

-- Recriar índices e constraints
-- (Executar scripts de migração se necessário)
```

#### 4. Verificação Pós-Restore
```bash
# Testar aplicação
npm run dev

# Verificar funcionalidades principais
- Login funciona?
- Dashboard carrega?
- Kanban opera?
- Painel admin acessível?

# Verificar dados
SELECT COUNT(*) FROM profiles;
SELECT COUNT(*) FROM solicitacoes;
SELECT COUNT(*) FROM demandas;
```

## 📊 Monitoramento e Auditoria

### Logs de Auditoria

#### admin_logs
```sql
-- Estrutura da tabela
CREATE TABLE admin_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    operation text NOT NULL,           -- Tipo de operação
    target_user_id uuid,               -- Usuário alvo
    old_value text,                     -- Valor anterior
    new_value text,                     -- Novo valor
    created_by uuid REFERENCES profiles(id), -- Quem executou
    created_at timestamptz DEFAULT now() -- Quando executou
);

-- Consultar logs recentes
SELECT 
    al.operation,
    al.old_value,
    al.new_value,
    p1.full_name as target_user,
    p2.full_name as created_by_user,
    al.created_at
FROM admin_logs al
LEFT JOIN profiles p1 ON al.target_user_id = p1.id
LEFT JOIN profiles p2 ON al.created_by = p2.id
WHERE al.created_at >= NOW() - INTERVAL '7 days'
ORDER BY al.created_at DESC;
```

#### Tipos de Operações Logadas
- `user_create`: Criação de usuário
- `user_delete`: Exclusão de usuário
- `role_update`: Alteração de role
- `password_reset`: Reset de senha
- `admin_access`: Acesso ao painel admin

### Monitoramento de Sistema

#### Métricas a Monitorar
- **Uptime:** Disponibilidade do sistema
- **Response Time:** Tempo de resposta das APIs
- **Error Rate:** Taxa de erros 4xx/5xx
- **Database Performance:** Tempo de queries
- **Auth Failures:** Tentativas de login falhas
- **Backup Success:** Taxa de sucesso de backups

#### Alertas Configuráveis
```typescript
// Exemplo de configuração de alertas
const alerts = {
  database: {
    connectionPool: { threshold: 80, unit: '%' },
    queryTime: { threshold: 5000, unit: 'ms' }
  },
  auth: {
    failedLogins: { threshold: 10, unit: 'count', window: '5m' },
    suspiciousActivity: { threshold: 5, unit: 'count', window: '1h' }
  },
  backup: {
    failure: { threshold: 1, unit: 'count', window: '24h' },
    size: { threshold: 100, unit: 'MB' }
  }
};
```

## 📱 Backup na Nuvem

### GitHub como Backup Principal
- ✅ **Automático:** Todo commit é um backup
- ✅ **Versionado:** Histórico completo de mudanças
- ✅ **Distribuído:** Múltiplos mirrors
- ✅ **Seguro:** Criptografia em trânsito

### Backup Supabase
- ✅ **Automático:** Backup diário automático
- ✅ **Point-in-time:** Restore para qualquer momento
- ✅ **Geográfico:** Múltiplas regiões
- ✅ **Criptografado:** Dados criptografados em repouso

### Backup Adicional (Recomendado)
```bash
# Google Drive
rclone sync backups/ gdrive:nexus156-backups/

# AWS S3
aws s3 sync backups/ s3://nexus156-backups/

# Dropbox
rclone sync backups/ dropbox:nexus156-backups/
```

## ⚡ Comandos Rápidos de Emergência

### Verificação Rápida
```bash
# Status do sistema
git status
npm run build
npm run test

# Verificar backups
ls -la backups/ | tail -5
du -sh backups/

# Verificar logs
tail -50 logs/application.log
```

### Ações de Emergência
```bash
# Backup imediato
npm run backup

# Parar sistema (se necessário)
pkill -f "npm run dev"

# Restore rápido
unzip backups/nexus156_backup_ULTIMO_codigo.zip
npm install
npm run build

# Notificar equipe
# Enviar mensagem no Slack/Teams
```

### Comandos de Diagnóstico
```bash
# Verificar integridade do Git
git fsck --full

# Limpar cache do npm
npm cache clean --force

# Verificar dependências vulneráveis
npm audit

# Verificar tamanho do projeto
du -sh . --exclude=node_modules --exclude=.git
```

## 📞 Contato de Emergência

### Equipe de Resposta
- **DevOps Lead:** +55 (XX) XXXXX-XXXX
- **Security Lead:** +55 (XX) XXXXX-XXXX
- **Database Admin:** +55 (XX) XXXXX-XXXX

### Canais de Comunicação
- **Slack:** #nexus156-emergencies
- **Email:** emergency@nexus156.com
- **Phone:** +55 (XX) XXXXX-XXXX (24/7)

### Procedimento de Notificação
1. **Identificar** gravidade do incidente
2. **Notificar** equipe de resposta imediatamente
3. **Documentar** início do incidente
4. **Executar** plano de recuperação
5. **Comunicar** stakeholders
6. **Analisar** causas raiz pós-incidente

---

**Lembre-se:** "Prevenir é melhor que remediar" 🛡️  
**Última atualização:** 05 de Março de 2026  
**Versão:** 2.0.0  
**Status:** Produção segura com backup automático
