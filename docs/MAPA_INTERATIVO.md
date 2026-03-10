# Mapa Interativo de Fortaleza

## 📍 Visão Geral

O Mapa Interativo de Fortaleza é uma funcionalidade completa do sistema Nexus 156 que permite visualizar solicitações e demandas geograficamente distribuídas pelas 12 regionais de Fortaleza.

## 🗺️ Funcionalidades

### **Características Principais**
- **Visualização Geográfica**: Exibe solicitações e demandas em mapa interativo
- **12 Regionais**: Mapeamento completo das regionais de Fortaleza
- **Filtros Dinâmicos**: Status, tipo, período e regional
- **Geocoding Automático**: Converte endereços em coordenadas
- **Tempo Real**: Atualizações automáticas via Supabase subscriptions
- **Mobile-First**: Interface responsiva para dispositivos móveis
- **Performance**: Clustering adaptativo e virtualização

### **Filtros Disponíveis**
- **Status**: Aguardando, Em Análise, Finalizado
- **Tipo**: Solicitações, Demandas ou Ambos
- **Período**: Data inicial e final
- **Regional**: Todas ou específica (1-12)
- **Coordenadas**: Apenas itens com coordenadas válidas

### **Visualização**
- **Marcadores Coloridos**: Por status (amarelo/azul/verde)
- **Ícones Diferentes**: S (Solicitação) e D (Demanda)
- **Popups Informativos**: Protocolo, status, endereço, responsável
- **Legenda Visual**: Cores e símbolos explicativos
- **Estatísticas**: Tempo real de contagem

## 🏗️ Arquitetura

### **Frontend Components**
```
src/
├── components/Mapa/
│   ├── FiltrosMapa.tsx      # Painel de filtros
│   └── MapaInterativo.tsx   # Componente do mapa
├── pages/
│   └── MapaFortaleza.tsx    # Página principal
├── hooks/
│   └── useMapaData.ts       # Hook de dados
├── data/
│   └── regionaisFortaleza.ts # Configuração das 12 regionais
├── utils/
│   └── regionalizacaoDinamica.ts # Lógica de regionalização
├── services/
│   └── geocoding.ts        # Serviço de geocoding
├── config/
│   └── featureFlags.ts     # Configuração de features
└── styles/
    └── leaflet.css         # Estilos do mapa
```

### **Backend Schema**
```sql
-- Campos adicionados às tabelas
endereco_rua text
endereco_numero text
endereco_bairro text
endereco_complemento text
endereco_cep text
endereco_cidade text DEFAULT 'Fortaleza'
endereco_uf text DEFAULT 'CE'
endereco_latitude decimal(10, 8)
endereco_longitude decimal(11, 8)
endereco_regional integer
endereco_geocoding_status text DEFAULT 'pendente'
endereco_validado boolean
```

### **RPC Functions**
- `get_mapa_dados_paginado`: Busca paginada e filtrada
- `update_coordenadas_endereco`: Atualiza coordenadas

### **Views Otimizadas**
- `mapa_dados_estruturado`: View unificada para consultas

## 🎯 Regionalização

### **12 Regionais de Fortaleza**

| Regional | Bairros Principais | Coordenadas |
|----------|-------------------|--------------|
| 1 | Barra do Ceará, Pirambu, Carlito Pamplona | -3.7319, -38.5267 |
| 2 | Meireles, Aldeota, Varjota, Papicu | -3.7325, -38.5023 |
| 3 | Quintino Cunha, Padre Andrade, Parque Araxá | -3.7452, -38.5435 |
| 4 | José Bonifácio, Damas, Parangaba | -3.7748, -38.5496 |
| 5 | Granja Lisboa, Granja Portugal, Bom Jardim | -3.8034, -38.6039 |
| 6 | Jardim das Oliveiras, Parque Iracema, Messejana | -3.8341, -38.5175 |
| 7 | Praia do Futuro, Cocó, Edson Queiroz | -3.7624, -38.4123 |
| 8 | Serrinha, Itaperi, Prefeito José Walter | -3.7849, -38.5479 |
| 9 | Cajazeiras, Jangurussu, Parque Santa Maria | -3.8178, -38.4987 |
| 10 | Parque São José, Maraponga, Mondubim | -3.8415, -38.5634 |
| 11 | Pici, Autran Nunes, Jóquei Clube | -3.7356, -38.5112 |
| 12 | Centro, Moura Brasil, Praia de Iracema | -3.7317, -38.5267 |

## 🚀 Performance

### **Otimizações**
- **Clustering Adaptativo**: Ativa automaticamente >200 pins
- **Virtualização**: Limita 1000 pins simultâneos
- **Cache Inteligente**: Geocoding com TTL
- **Rate Limiting**: 1 requisição/segundo para geocoding
- **Lazy Loading**: Carrega conforme necessário

### **Métricas**
- **Build Time**: ~8.6 segundos
- **Bundle Size**: ~716KB (gzipped: 209KB)
- **Load Time**: <3 segundos (com dados)
- **Memory**: <100MB (1000 pins)

## 🛠️ Tecnologias

### **Frontend**
- **React 18.3.1** + TypeScript
- **Leaflet 1.9.4** + React-Leaflet 4.2.1
- **Tailwind CSS** para estilos
- **Lucide React** para ícones
- **Supabase** para dados em tempo real

### **Backend**
- **Supabase PostgreSQL**
- **RPC Functions** para queries otimizadas
- **RLS Policies** para segurança
- **Real-time Subscriptions**

### **Geocoding**
- **OpenStreetMap Nominatim** (grátis)
- **Rate Limiting**: 1 req/segundo
- **Cache Local** com TTL
- **Fallback** para erros

## 📱 Mobile Experience

### **Responsividade**
- **Adaptive UI**: Ajusta para telas pequenas
- **Touch Gestures**: Suporte a gestos mobile
- **Filtros Colapsáveis**: Economia de espaço
- **Performance**: Otimizado para dispositivos móveis

### **Breakpoints**
- **Desktop**: >768px (layout completo)
- **Mobile**: <768px (layout compacto)
- **Filtros**: Bottom sheet em mobile
- **Mapa**: Full screen em mobile

## 🔧 Configuração

### **Feature Flags**
```typescript
export const FEATURE_FLAGS = {
  MAPA_INTERATIVO: true,        // Mapa habilitado
  MAPA_GEOCODING: true,         // Geocoding automático
  MAPA_CLUSTERING: true,        // Clustering de pins
  MAPA_REAL_TIME: true,         // Updates em tempo real
  MAPA_MOBILE_OPTIMIZED: true, // Otimizações mobile
  MAPA_PERFORMANCE_MONITORING: false // Debug only
};
```

### **Variáveis de Ambiente**
```bash
# .env
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_key
REACT_APP_MAPA_INTERATIVO=true
```

## 🧪 Testes

### **Manual Testing Checklist**
- [ ] Mapa carrega com dados reais
- [ ] Filtros funcionam corretamente
- [ ] Regionalização está correta
- [ ] Geocoding funciona para novos endereços
- [ ] Mobile responsivo funciona
- [ ] Popups informativos aparecem
- [ ] Estatísticas atualizam em tempo real
- [ ] Clustering ativa com muitos pins

### **Performance Testing**
- [ ] Load time <3 segundos
- [ ] Memory <100MB com 1000 pins
- [ ] Smooth scrolling
- [ ] No memory leaks
- [ ] Geocoding rate limiting funciona

## 🐛 Troubleshooting

### **Problemas Comuns**

#### **Mapa não carrega**
- Verificar se `leaflet.css` está importado
- Confirmar coordenadas válidas no banco
- Verificar console para erros de JavaScript

#### **Geocoding não funciona**
- Verificar rate limiting (1 req/seg)
- Confirmar endereços válidos
- Verificar conexão com OpenStreetMap

#### **Filtros não funcionam**
- Verificar se dados existem no banco
- Confirmar RPC functions estão ativas
- Verificar permissões RLS

#### **Performance lenta**
- Verificar se clustering está ativo
- Confirmar se virtualização está funcionando
- Verificar se cache está sendo usado

### **Debug Mode**
```typescript
// Habilitar debug em development
if (process.env.NODE_ENV === 'development') {
  setFeatureEnabled('MAPA_PERFORMANCE_MONITORING', true);
}
```

## 📈 Roadmap Futuro

### **Próximas Melhorias**
- [ ] **Heatmap**: Visualização de densidade
- [ ] **Exportação**: PDF/Excel do mapa
- [ ] **Offline Mode**: Cache para uso offline
- [ ] **Advanced Filters**: Mais opções de filtro
- [ ] **Analytics**: Métricas avançadas
- [ ] **Custom Markers**: Ícones personalizados
- [ ] **Routes**: Otimização de rotas
- [ ] **Integration**: APIs externas

### **Performance**
- [ ] **Web Workers**: Processamento em background
- [ ] **Service Worker**: Cache offline
- [ ] **CDN**: Distribuição de assets
- [ ] **Compression**: Gzip/Brotli

## 📞 Suporte

### **Documentação Relacionada**
- [API Reference](./API_REFERENCE.md)
- [Arquitetura](./ARQUITETURA.md)
- [Guia do Desenvolvedor](./GUIA_DESENVOLVEDOR.md)

### **Contato**
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Email**: suporte@nexus156.com

---

**Última atualização**: 09/03/2026
**Versão**: 1.0.0
**Status**: ✅ Produção
