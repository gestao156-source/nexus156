// Script para testar conexão com Supabase
// Execute: node test-connection.js

const { createClient } = require('@supabase/supabase-js');

// Teste com diferentes chaves
const testConfigs = [
  {
    name: 'Chave ANON atual',
    url: 'https://pbqfufcsxdpuudfhllge.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBicWZ1ZmNzeGRwdXVkZmhsbGdlIiwicm9sZSI6ImFub24iLCJpYXQiO'
  },
  {
    name: 'Chave ANON nova (placeholder)',
    url: 'https://pbqfufcsxdpuudfhllge.supabase.co',
    key: 'SUA_CHAVE_ANON_AQUI'
  }
];

async function testConnection(config) {
  console.log(`\n🔍 Testando com: ${config.name}`);
  
  const supabase = createClient(config.url, config.key);
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, role')
      .limit(3);
    
    if (error) {
      console.error(`❌ Erro: ${error.message}`);
      console.error(`Code: ${error.code}`);
      return false;
    }
    
    console.log(`✅ Sucesso! Encontrados ${data.length} perfis:`);
    data.forEach(profile => {
      console.log(`  - ${profile.email} (${profile.role})`);
    });
    
    return true;
  } catch (error) {
    console.error(`❌ Erro inesperado: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Testando conexões com Supabase...\n');
  
  for (const config of testConfigs) {
    const success = await testConnection(config);
    
    if (success) {
      console.log(`\n✅ ${config.name} está FUNCIONANDO!`);
      console.log('\n📋 Use esta configuração no seu .env:');
      console.log(`VITE_SUPABASE_URL=${config.url}`);
      console.log(`VITE_SUPABASE_ANON_KEY=${config.key}`);
      break;
    } else {
      console.log(`\n❌ ${config.name} FALHOU!`);
    }
  }
}

main().catch(console.error);
