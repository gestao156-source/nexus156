import { debounce } from 'lodash';

export interface EnderecoViaCEP {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export interface Coordenadas {
  lat: number;
  lng: number;
}

export interface EnderecoCompleto {
  cep: string;
  rua: string;
  numero: string;
  bairro: string;
  localidade: string;
  uf: string;
  complemento: string;
  latitude?: number;
  longitude?: number;
}

export class GeocodingService {
  // Cache para evitar requisições repetidas
  private static coordenadasCache = new Map<string, Coordenadas>();
  private static enderecoCache = new Map<string, EnderecoViaCEP>();

  /**
   * Busca endereço pelo CEP usando API ViaCEP
   */
  static async buscarPorCEP(cep: string): Promise<EnderecoViaCEP | null> {
    try {
      // Limpar CEP (remover caracteres não numéricos)
      const cepLimpo = cep.replace(/\D/g, '');
      
      if (cepLimpo.length !== 8) {
        throw new Error('CEP inválido');
      }

      // Verificar cache
      const cacheKey = `cep_${cepLimpo}`;
      if (this.enderecoCache.has(cacheKey)) {
        return this.enderecoCache.get(cacheKey)!;
      }

      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();

      if (data.erro) {
        return null;
      }

      // Salvar no cache
      this.enderecoCache.set(cacheKey, data);

      return data;
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      return null;
    }
  }

  /**
   * Busca coordenadas por endereço usando Nominatim (OpenStreetMap)
   */
  static async buscarCoordenadas(endereco: string): Promise<Coordenadas | null> {
    try {
      if (!endereco || endereco.trim().length < 5) {
        return null;
      }

      console.log('🔍 Buscando coordenadas para:', endereco);

      // Verificar cache
      const cacheKey = endereco.toLowerCase().trim();
      if (this.coordenadasCache.has(cacheKey)) {
        console.log('✅ Coordenadas encontradas no cache');
        return this.coordenadasCache.get(cacheKey)!;
      }

      // Estratégia de busca múltipla com fallback
      const buscas = this.gerarVariacoesBusca(endereco);
      
      for (const query of buscas) {
        console.log('🔍 Tentando busca com:', query);
        
        const coords = await this.buscarCoordenadasSingle(query);
        if (coords) {
          // Salvar no cache com a chave original
          this.coordenadasCache.set(cacheKey, coords);
          console.log('✅ Coordenadas encontradas:', coords);
          return coords;
        }
      }

      console.log('❌ Nenhuma variação encontrou coordenadas para:', endereco);
      return null;
    } catch (error) {
      console.error('❌ Erro ao buscar coordenadas:', error);
      return null;
    }
  }

  /**
   * Gera variações de busca para aumentar chances de sucesso
   */
  private static gerarVariacoesBusca(endereco: string): string[] {
    const partes = endereco.split(',').map(p => p.trim());
    const [rua, numero, bairro, cidade, uf, pais] = partes;
    
    const variacoes = [];
    
    // 1. Busca completa (prioridade máxima - mais precisa)
    variacoes.push(endereco);
    
    // 2. Sem número (se busca completa falhar)
    if (numero) {
      variacoes.push(`${rua}, ${bairro}, ${cidade}, ${uf}, ${pais}`);
    }
    
    // 3. Apenas rua + cidade
    variacoes.push(`${rua}, ${cidade}, ${uf}, ${pais}`);
    
    // 4. Rua + bairro + cidade
    if (bairro) {
      variacoes.push(`${rua}, ${bairro}, ${cidade}, ${uf}, ${pais}`);
    }
    
    // 5. Bairro + cidade (fallback)
    if (bairro) {
      variacoes.push(`${bairro}, ${cidade}, ${uf}, ${pais}`);
    }
    
    // 6. Apenas cidade (último recurso)
    variacoes.push(`${cidade}, ${uf}, ${pais}`);
    
    // Remover duplicatas e limitar a 6 tentativas
    return [...new Set(variacoes)].slice(0, 6);
  }

  /**
   * Busca coordenadas para uma única query
   */
  private static async buscarCoordenadasSingle(query: string): Promise<Coordenadas | null> {
    try {
      // Tentar apenas Nominatim (OpenCage removido para evitar erros 401)
      const coords = await this.buscarNominatim(query);
      if (coords) {
        return coords;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Busca usando Nominatim API
   */
  private static async buscarNominatim(query: string): Promise<Coordenadas | null> {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 segundos

      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Nexus156 Sistema Gerenciamento'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          return null;
        }

        const data = await response.json();

        if (data.length === 0) {
          return null;
        }

        const coords: Coordenadas = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };

        // Validar coordenadas
        if (isNaN(coords.lat) || isNaN(coords.lng) || 
            coords.lat < -90 || coords.lat > 90 || 
            coords.lng < -180 || coords.lng > 180) {
          return null;
        }

        return coords;
      } catch (fetchError) {
        clearTimeout(timeoutId);
        return null;
      }
    } catch (error) {
      return null;
    }
  }

  /**
   * Busca endereço por coordenadas (reverse geocoding)
   */
  static async buscarPorCoordenadas(lat: number, lng: number): Promise<EnderecoViaCEP | null> {
    try {
      // Validar coordenadas
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        throw new Error('Coordenadas inválidas');
      }

      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=pt-BR`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Nexus156 Sistema Gerenciamento'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!data.address) {
        return null;
      }

      const endereco: EnderecoViaCEP = {
        cep: data.address.postcode || '',
        logradouro: data.address.road || data.address.pedestrian || '',
        complemento: '',
        bairro: data.address.suburb || data.address.district || '',
        localidade: data.address.city || data.address.town || data.address.village || '',
        uf: data.address.state || ''
      };

      return endereco;
    } catch (error) {
      console.error('Erro ao buscar endereço por coordenadas:', error);
      return null;
    }
  }

  /**
   * Formata endereço completo para busca
   */
  static formatarEnderecoParaBusca(endereco: Partial<EnderecoCompleto>): string {
    const partes = [];

    if (endereco.rua) partes.push(endereco.rua);
    if (endereco.numero) partes.push(endereco.numero);
    if (endereco.bairro) partes.push(endereco.bairro);
    if (endereco.localidade) partes.push(endereco.localidade);
    if (endereco.uf) partes.push(endereco.uf);

    // Adicionar "Brasil" para melhor precisão
    partes.push('Brasil');

    return partes.join(', ');
  }

  /**
   * Validação de CEP
   */
  static validarCEP(cep: string): boolean {
    const cepLimpo = cep.replace(/\D/g, '');
    return cepLimpo.length === 8;
  }

  /**
   * Máscara de CEP
   */
  static mascararCEP(cep: string): string {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length <= 5) {
      return cepLimpo;
    }
    return `${cepLimpo.slice(0, 5)}-${cepLimpo.slice(5, 8)}`;
  }

  /**
   * Formata endereço completo para exibição
   */
  static formatarEnderecoCompleto(endereco: Partial<EnderecoCompleto>): string {
    const partes = [];

    if (endereco.rua) {
      partes.push(endereco.rua);
      if (endereco.numero) partes.push(endereco.numero);
    }

    if (endereco.bairro) partes.push(`- ${endereco.bairro}`);
    if (endereco.localidade) partes.push(`, ${endereco.localidade}`);
    if (endereco.cep) partes.push(`- CEP: ${this.mascararCEP(endereco.cep)}`);

    return partes.join(' ');
  }

  /**
   * Busca coordenadas com debounce para evitar muitas requisições
   */
  static buscarCoordenadasDebounced = debounce(async (
    endereco: string, 
    callback: (coords: Coordenadas | null) => void
  ) => {
    const coords = await this.buscarCoordenadas(endereco);
    callback(coords);
  }, 1000);

  /**
   * Processa endereço completo: busca CEP + coordenadas
   */
  static async processarEnderecoCompleto(
    cep: string, 
    numero?: string
  ): Promise<EnderecoCompleto | null> {
    try {
      // 1. Buscar CEP
      const dadosCEP = await this.buscarPorCEP(cep);
      if (!dadosCEP || dadosCEP.erro) {
        return null;
      }

      // 2. Montar endereço completo
      const enderecoCompleto: EnderecoCompleto = {
        cep: dadosCEP.cep,
        rua: dadosCEP.logradouro,
        numero: numero || '',
        bairro: dadosCEP.bairro,
        localidade: dadosCEP.localidade,
        uf: dadosCEP.uf || 'CE', // Default para CE se não especificado
        complemento: ''
      };

      // 3. Buscar coordenadas
      const enderecoParaBusca = this.formatarEnderecoParaBusca(enderecoCompleto);
      const coords = await this.buscarCoordenadas(enderecoParaBusca);

      // 4. Adicionar coordenadas ao endereço
      enderecoCompleto.latitude = coords?.lat;
      enderecoCompleto.longitude = coords?.lng;

      return enderecoCompleto;
    } catch (error) {
      console.error('Erro ao processar endereço completo:', error);
      return null;
    }
  }

  /**
   * Limpar cache
   */
  static limparCache(): void {
    this.coordenadasCache.clear();
    this.enderecoCache.clear();
    console.log('🗑️ Cache de geocoding limpo');
  }

  /**
   * Limpar cache de coordenadas específicas
   */
  static limparCacheCoordenadas(endereco: string): void {
    const cacheKey = endereco.toLowerCase().trim();
    this.coordenadasCache.delete(cacheKey);
    console.log('🗑️ Cache removido para:', endereco);
  }

  /**
   * Estatísticas do cache
   */
  static getCacheStats(): { coordenadas: number; enderecos: number } {
    return {
      coordenadas: this.coordenadasCache.size,
      enderecos: this.enderecoCache.size
    };
  }
}
