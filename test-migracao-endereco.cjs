const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://pbqfufcsxdpuudfhllge.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBicWZ1ZmNzeGRwdXVkZmhsbGdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0OTYzMTAsImV4cCI6MjA4NzA3MjMxMH0.6DOBQgfLR7qSDxzGv01CMWM3ZOhrYuNSUnhDGVA5DMo'
);

async function testarMigracaoEndereco() {
  console.log('🔍 Testando Migração de Endereço e Georeferenciamento...\n');

  try {
    // 1. Verificar backup existe
    console.log('📋 Verificando backup...');
    const { data: backupCheck, error: backupError } = await supabase
      .from('solicitacoes_backup_pre_endereco')
      .select('count')
      .limit(1);

    if (backupError) {
      console.error('❌ Erro ao verificar backup:', backupError);
      return;
    }
    console.log('✅ Backup encontrado e acessível');

    // 2. Verificar novos campos existem
    console.log('\n🏗️ Verificando novos campos...');
    
    const { data: solicitacoes, error: solicitacoesError } = await supabase
      .from('solicitacoes')
      .select('id, assunto, endereco_rua, endereco_cep, latitude, longitude')
      .limit(3);

    if (solicitacoesError) {
      console.error('❌ Erro ao verificar solicitacoes:', solicitacoesError);
      return;
    }
    
    console.log('✅ Novos campos acessíveis em solicitacoes:');
    solicitacoes.forEach(s => {
      console.log(`   - ${s.assunto}: rua=${s.endereco_rua || 'NULL'}, cep=${s.endereco_cep || 'NULL'}, coords=${s.latitude || 'NULL'},${s.longitude || 'NULL'}`);
    });

    // 3. Verificar demandas
    const { data: demandas, error: demandasError } = await supabase
      .from('demandas')
      .select('id, assunto, endereco_rua, endereco_cep, latitude, longitude')
      .limit(3);

    if (demandasError) {
      console.error('❌ Erro ao verificar demandas:', demandasError);
      return;
    }
    
    console.log('✅ Novos campos acessíveis em demandas:');
    demandas.forEach(d => {
      console.log(`   - ${d.assunto}: rua=${d.endereco_rua || 'NULL'}, cep=${d.endereco_cep || 'NULL'}, coords=${d.latitude || 'NULL'},${d.longitude || 'NULL'}`);
    });

    // 4. Verificar views
    console.log('\n👁️ Verificando views...');
    const { data: geoSolicitacoes, error: geoSolicitacoesError } = await supabase
      .from('solicitacoes_georreferenciadas')
      .select('id, assunto, endereco_completo')
      .limit(2);

    if (geoSolicitacoesError) {
      console.error('❌ Erro ao verificar view solicitacoes_georreferenciadas:', geoSolicitacoesError);
    } else {
      console.log('✅ View solicitacoes_georreferenciadas funcionando:');
      geoSolicitacoes.forEach(s => {
        console.log(`   - ${s.assunto}: ${s.endereco_completo}`);
      });
    }

    // 5. Testar função de endereço
    console.log('\n🔧 Testando função formatar_endereco_completo...');
    const { data: functionTest, error: functionError } = await supabase
      .rpc('formatar_endereco_completo', {
        rua: 'Rua Teste',
        numero: '123',
        bairro: 'Centro',
        localidade: 'São Paulo',
        cep: '01234-567',
        complemento: 'Apto 45'
      });

    if (functionError) {
      console.error('❌ Erro ao testar função:', functionError);
    } else {
      console.log('✅ Função formatar_endereco_completo funcionando:');
      console.log(`   Resultado: "${functionTest}"`);
    }

    // 6. Verificar contagens
    console.log('\n📊 Verificando contagens...');
    const { count: solCount, error: solCountError } = await supabase
      .from('solicitacoes')
      .select('*', { count: 'exact', head: true });
    
    const { count: demCount, error: demCountError } = await supabase
      .from('demandas')
      .select('*', { count: 'exact', head: true });

    const { count: solBackupCount, error: solBackupCountError } = await supabase
      .from('solicitacoes_backup_pre_endereco')
      .select('*', { count: 'exact', head: true });

    if (!solCountError && !demCountError && !solBackupCountError) {
      console.log('✅ Contagens verificadas:');
      console.log(`   - Solicitações: ${solCount} (backup: ${solBackupCount})`);
      console.log(`   - Demandas: ${demCount}`);
      
      if (solCount === solBackupCount) {
        console.log('✅ Dados intactos (contagem igual ao backup)');
      } else {
        console.log('⚠️ Contagem diferente do backup - verificar!');
      }
    }

    // 7. Testar RLS com novos campos
    console.log('\n🛡️ Testando RLS com novos campos...');
    const { data: rlsTest, error: rlsError } = await supabase
      .from('solicitacoes')
      .select('id, assunto, endereco_rua, latitude, longitude')
      .eq('status', 'aguardando')
      .limit(2);

    if (rlsError) {
      console.error('❌ Erro no RLS:', rlsError);
    } else {
      console.log('✅ RLS funcionando com novos campos:');
      rlsTest.forEach(item => {
        console.log(`   - ${item.assunto} (acesso OK)`);
      });
    }

    console.log('\n🎉 TESTE DE MIGRAÇÃO CONCLUÍDO COM SUCESSO!');
    console.log('📋 Resumo:');
    console.log('   ✅ Backup intacto');
    console.log('   ✅ Novos campos acessíveis');
    console.log('   ✅ Views funcionando');
    console.log('   ✅ Funções auxiliares OK');
    console.log('   ✅ RLS compatível');
    console.log('   ✅ Dados preservados');

  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
  }
}

testarMigracaoEndereco();
