// Teste de Integração Completo - Nexus156
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://pbqfufcsxdpuudfhllge.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBicWZ1ZmNzeGRwdXVkZmhsbGdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0OTYzMTAsImV4cCI6MjA4NzA3MjMxMH0.6DOBQgfLR7qSDxzGv01CMWM3ZOhrYuNSUnhDGVA5DMo'
);

class IntegrationTest {
  constructor() {
    this.results = [];
  }

  log(test, success, message) {
    const result = {
      test,
      success,
      message,
      timestamp: new Date().toISOString()
    };
    this.results.push(result);
    
    const icon = success ? '✅' : '❌';
    console.log(`${icon} ${test}: ${message}`);
  }

  async testSupabaseConnection() {
    try {
      const { data, error } = await supabase
        .from('solicitacoes')
        .select('count')
        .limit(1);

      if (error) throw error;
      
      this.log('Conexão Supabase', true, `Conectado - ${data[0].count} registros`);
      return true;
    } catch (error) {
      this.log('Conexão Supabase', false, error.message);
      return false;
    }
  }

  async testTablesExist() {
    const tables = ['solicitacoes', 'demandas', 'profiles'];
    let allExist = true;

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (error) {
          this.log(`Tabela ${table}`, false, 'Não existe ou sem acesso');
          allExist = false;
        } else {
          this.log(`Tabela ${table}`, true, 'Acessível');
        }
      } catch (error) {
        this.log(`Tabela ${table}`, false, error.message);
        allExist = false;
      }
    }

    return allExist;
  }

  async testDataIntegrity() {
    try {
      // Testar se há dados nas tabelas
      const { data: solicitacoes, error: solError } = await supabase
        .from('solicitacoes')
        .select('*')
        .limit(5);

      const { data: demandas, error: demError } = await supabase
        .from('demandas')
        .select('*')
        .limit(5);

      if (solError) throw solError;
      if (demError) throw demError;

      this.log('Integridade de Dados', true, 
        `Solicitações: ${solicitacoes.length}, Demandas: ${demandas.length}`);
      
      return true;
    } catch (error) {
      this.log('Integridade de Dados', false, error.message);
      return false;
    }
  }

  async testAuthSystem() {
    try {
      // Testar se o sistema de autenticação está configurado
      const { data, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      
      this.log('Sistema de Autenticação', true, 'Configurado e acessível');
      return true;
    } catch (error) {
      this.log('Sistema de Autenticação', false, error.message);
      return false;
    }
  }

  async testDashboardData() {
    try {
      // Simular consulta do Dashboard
      const { data: solicitacoes, error: solError } = await supabase
        .from('solicitacoes')
        .select('status');

      const { data: demandas, error: demError } = await supabase
        .from('demandas')
        .select('status');

      if (solError) throw solError;
      if (demError) throw demError;

      // Calcular estatísticas
      const solStats = {
        aguardando: solicitacoes?.filter(s => s.status === 'aguardando').length || 0,
        em_analise: solicitacoes?.filter(s => s.status === 'em_analise').length || 0,
        finalizado: solicitacoes?.filter(s => s.status === 'finalizado').length || 0
      };

      const demStats = {
        aguardando: demandas?.filter(d => d.status === 'aguardando').length || 0,
        em_analise: demandas?.filter(d => d.status === 'em_analise').length || 0,
        finalizado: demandas?.filter(d => d.status === 'finalizado').length || 0
      };

      this.log('Dados Dashboard', true, 
        `Sol: ${solStats.aguardando}/${solStats.em_analise}/${solStats.finalizado}, ` +
        `Dem: ${demStats.aguardando}/${demStats.em_analise}/${demStats.finalizado}`);
      
      return true;
    } catch (error) {
      this.log('Dados Dashboard', false, error.message);
      return false;
    }
  }

  async runAllTests() {
    console.log('🚀 Iniciando Testes de Integração - Nexus156\n');

    const tests = [
      () => this.testSupabaseConnection(),
      () => this.testTablesExist(),
      () => this.testDataIntegrity(),
      () => this.testAuthSystem(),
      () => this.testDashboardData()
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      const success = await test();
      if (success) passed++;
      else failed++;
    }

    // Resumo final
    console.log('\n📊 RESUMO DOS TESTES');
    console.log('='.repeat(50));
    console.log(`✅ Passou: ${passed}`);
    console.log(`❌ Falhou: ${failed}`);
    console.log(`📈 Taxa de Sucesso: ${Math.round((passed / (passed + failed)) * 100)}%`);

    if (failed === 0) {
      console.log('\n🎉 TODOS OS TESTES PASSARAM! Sistema pronto para deploy.');
    } else {
      console.log('\n⚠️ Alguns testes falharam. Verificar antes do deploy.');
    }

    return failed === 0;
  }
}

// Executar testes
const tester = new IntegrationTest();
tester.runAllTests().then(success => {
  process.exit(success ? 0 : 1);
});
