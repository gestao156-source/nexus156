# 🛡️ Guia de Segurança e Backup - Nexus156

## 🎯 Objetivo
Garantir que nunca mais percamos o trabalho e tenhamos um sistema robusto de versionamento e backup.

## 📋 Comandos Essenciais

### 🔄 Backup Diário
```bash
npm run backup
```
**Quando usar:** Ao final de cada dia de trabalho

### 📦 Versionamento
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

### ⚠️ Regras de Ouro

1. **NUNCA** trabalhe diretamente na `main`
   - Sempre crie uma branch para novas features
   - Use: `git checkout -b nome-da-feature`

2. **BACKUP** antes de qualquer grande alteração
   - Execute: `npm run backup`
   - Verifique se o backup foi criado em `backups/`

3. **COMMIT** com mensagens claras
   - Use o versionador: `npm run versionar`
   - Descreva o que fez

4. **TESTE** antes do deploy
   - Use: `npm run build` (test local)
   - Verifique se tudo funciona

5. **DEPLOY** apenas após testes
   - Use: `npm run safe-deploy`
   - Nunca faça deploy direto sem backup

## 📁 Estrutura de Pastas

```
nexus156-main/
├── backups/              # 🔄 Backups automáticos
├── scripts/             # 🛠️ Scripts de automação
├── docs/                # 📚 Documentação
├── src/                 # 💻 Código fonte
└── VERSION              # 📦 Controle de versão
```

## 🔄 Fluxo de Trabalho Seguro

### 1. Iniciar o Dia
```bash
npm run backup
npm run dev
```

### 2. Nova Funcionalidade
```bash
git checkout -b nova-feature
# Trabalhe normalmente...
npm run backup
npm run versionar
git checkout main
git merge nova-feature
npm run safe-deploy
```

### 3. Correção de Bug
```bash
git checkout -b fix/bug-descricao
# Corrija o bug...
npm run backup
npm run versionar
git checkout main
git merge fix/bug-descricao
npm run safe-deploy
```

## 🚨 Plano de Recuperação

### Se algo der errado:

1. **Não entre em pânico!**
2. **Verifique os backups:**
   ```bash
   ls -la backups/
   ```
3. **Restaure o último backup funcional:**
   ```bash
   tar -xzf backups/nexus156_backup_ULTIMO_FUNCIONAL_codigo.tar.gz
   ```
4. **Use o Git para voltar:**
   ```bash
   git log --oneline -10  # Ver últimos commits
   git checkout HASH_DO_COMMIT_FUNCIONAL
   ```

## 📱 Backup na Nuvem (Recomendado)

### GitHub como Backup
- ✅ Todo commit é um backup
- ✅ Use branches para experimentos
- ✅ Mantenha a `main` sempre funcional

### Backup Adicional
- Google Drive/Dropbox: Copie pasta `backups/`
- GitHub: Crie repositório separado só para backups

## ⚡ Comandos Rápidos

```bash
# Ver status atual
git status

# Ver último commit
git log -1

# Voltar para versão anterior
git checkout v1.0.0

# Comparar branches
git diff main..nova-feature

# Cancelar alterações
git checkout -- .
git reset --hard HEAD~1
```

## 📞 Contato de Emergência

Se perder tudo e não souber o que fazer:
1. **Mantenha a calma** - Temos backup no GitHub
2. **Verifique a data** - Último backup funcional
3. **Use o Git** - `git reflog` mostra todas as ações
4. **Peça ajuda** - Comunidade ou suporte técnico

---

**Lembre-se:** "Prevenir é melhor que remediar" 🛡️
