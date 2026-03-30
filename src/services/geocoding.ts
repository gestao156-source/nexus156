// Função debounce manual para evitar dependência externa
import Logger from '../utils/logger';

function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

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
  regional: string;
  latitude?: number;
  longitude?: number;
}

export class GeocodingService {
  // Cache para evitar requisições repetidas
  private static coordenadasCache = new Map<string, Coordenadas>();
  private static enderecoCache = new Map<string, EnderecoViaCEP>();

  // Mapeamento de bairros para regionais
  private static bairrosParaRegional: { [key: string]: string } = {
    // Regional 1
    'Vila Velha': 'Regional 1',
    'Jardim Guanabara': 'Regional 1',
    'Barra do Ceará': 'Regional 1',
    'Cristo Redentor': 'Regional 1',
    'Pirambu': 'Regional 1',
    'Carlito Pamplona': 'Regional 1',
    'Jacarecanga': 'Regional 1',
    'Jardim Iracema': 'Regional 1',
    'Floresta': 'Regional 1',
    'Álvaro Weyne': 'Regional 1',
    
    // Regional 2
    'Meireles': 'Regional 2',
    'Aldeota': 'Regional 2',
    'Varjota': 'Regional 2',
    'Papicu': 'Regional 2',
    'De Lourdes': 'Regional 2',
    'Cais do Porto': 'Regional 2',
    'Mucuripe': 'Regional 2',
    'Vicente Pinzón': 'Regional 2',
    'Joaquim Távora': 'Regional 2',
    'Dionísio Torres': 'Regional 2',
    'São João do Tauape': 'Regional 2',
    
    // Regional 3
    'Quintino Cunha': 'Regional 3',
    'Olavo Oliveira': 'Regional 3',
    'Antônio Bezerra': 'Regional 3',
    'Padre Andrade': 'Regional 3',
    'Presidente Kennedy': 'Regional 3',
    'Vila Ellery': 'Regional 3',
    'Monte Castelo': 'Regional 3',
    'São Gerardo': 'Regional 3',
    'Farias Brito': 'Regional 3',
    'Parque Araxá': 'Regional 3',
    'Parquelândia': 'Regional 3',
    'Amadeu Furtado': 'Regional 3',
    'Rodolfo Teófilo': 'Regional 3',
    
    // Regional 4
    'José Bonifácio': 'Regional 4',
    'Benfica': 'Regional 4',
    'Fátima': 'Regional 4',
    'Damas': 'Regional 4',
    'Jardim América': 'Regional 4',
    'Bom Futuro': 'Regional 4',
    'Montese': 'Regional 4',
    'Itaoca': 'Regional 4',
    'Parangaba': 'Regional 4',
    'Vila Peri': 'Regional 4',
    'Parreão': 'Regional 4',
    'Vila União': 'Regional 4',
    'Aeroporto': 'Regional 4',
    
    // Regional 5
    'Granja Lisboa': 'Regional 5',
    'Granja Portugal': 'Regional 5',
    'Bom Jardim': 'Regional 5',
    'Siqueira': 'Regional 5',
    'Bonsucesso': 'Regional 5',
    
    // Regional 6
    'Alto da Balança': 'Regional 6',
    'Aerolândia': 'Regional 6',
    'Jardim das Oliveiras': 'Regional 6',
    'Cidade dos Funcionários': 'Regional 6',
    'Parque Manibura': 'Regional 6',
    'Parque Iracema': 'Regional 6',
    'Cambeba': 'Regional 6',
    'Messejana': 'Regional 6',
    'José de Alencar': 'Regional 6',
    'Curió': 'Regional 6',
    'Guajeru': 'Regional 6',
    'Lagoa Redonda': 'Regional 6',
    'Coaçu': 'Regional 6',
    'São Bento': 'Regional 6',
    'Paupina': 'Regional 6',
    
    // Regional 7
    'Praia do Futuro': 'Regional 7',
    'Cocó': 'Regional 7',
    'Cidade 2000': 'Regional 7',
    'Manuel Dias Branco': 'Regional 7',
    'Salinas': 'Regional 7',
    'Guararapes': 'Regional 7',
    'Luciano Cavalcante': 'Regional 7',
    'Edson Queiroz': 'Regional 7',
    'Sapiranga': 'Regional 7',
    'Coité': 'Regional 7',
    'Sabiaguaba': 'Regional 7',
    
    // Regional 8
    'Serrinha': 'Regional 8',
    'Itaperi': 'Regional 8',
    'Dendê': 'Regional 8',
    'Dias Macêdo': 'Regional 8',
    'Boa Vista': 'Regional 8',
    'Parque Dois Irmãos': 'Regional 8',
    'Passaré': 'Regional 8',
    'Planalto Ayrton Senna': 'Regional 8',
    'Prefeito José Walter': 'Regional 8',
    
    // Regional 9
    'Cajazeiras': 'Regional 9',
    'Barroso': 'Regional 9',
    'Conjunto Palmeiras': 'Regional 9',
    'Jangurussu': 'Regional 9',
    'Parque Santa Maria': 'Regional 9',
    'Ancuri': 'Regional 9',
    'Pedras': 'Regional 9',
    
    // Regional 10
    'Parque São José': 'Regional 10',
    'Novo Mondubim': 'Regional 10',
    'Canindezinho': 'Regional 10',
    'Conjunto Esperança': 'Regional 10',
    'Parque Santa Rosa': 'Regional 10',
    'Parque Presidente Vargas': 'Regional 10',
    'Aracapé': 'Regional 10',
    'Maraponga': 'Regional 10',
    'Jardim Cearense': 'Regional 10',
    'Mondubim': 'Regional 10',
    'Vila Manoel Sátiro': 'Regional 10',
    
    // Regional 11
    'Pici': 'Regional 11',
    'Bela Vista': 'Regional 11',
    'Panamericano': 'Regional 11',
    'Couto Fernandes': 'Regional 11',
    'Demócrito Rocha': 'Regional 11',
    'Autran Nunes': 'Regional 11',
    'Dom Lustosa': 'Regional 11',
    'Henrique Jorge': 'Regional 11',
    'Jóquei Clube': 'Regional 11',
    'João XXIII': 'Regional 11',
    'Genibaú': 'Regional 11',
    'Conjunto Ceará': 'Regional 11',
    
    // Regional 12
    'Centro': 'Regional 12',
    'Moura Brasil': 'Regional 12',
    'Praia de Iracema': 'Regional 12'
  };

  /**
   * Busca regional com base no bairro
   */
  static buscarRegionalPorBairro(bairro: string): string {
    if (!bairro) return '';
    
    // Normalizar nome do bairro para busca
    const bairroNormalizado = bairro.trim().toLowerCase();
    
    // Buscar exata primeiro
    const regionalExata = this.bairrosParaRegional[bairro];
    if (regionalExata) return regionalExata;
    
    // Buscar case-insensitive
    for (const [bairroChave, regional] of Object.entries(this.bairrosParaRegional)) {
      if (bairroChave.toLowerCase() === bairroNormalizado) {
        return regional;
      }
    }
    
    // Buscar por contém (para bairros com nomes similares)
    for (const [bairroChave, regional] of Object.entries(this.bairrosParaRegional)) {
      if (bairroChave.toLowerCase().includes(bairroNormalizado) || 
          bairroNormalizado.includes(bairroChave.toLowerCase())) {
        return regional;
      }
    }
    
    return '';
  }

  /**
   * Extrai número da regional (ex: "Regional 4" -> 4)
   */
  static extrairNumeroRegional(regional: string): number {
    if (!regional) return 0;
    
    // Extrair número da regional (ex: "Regional 4" -> 4)
    const match = regional.match(/Regional (\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

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
      Logger.error('Erro ao buscar CEP', { error }, 'GeocodingService');
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

      Logger.debug('Buscando coordenadas para', { endereco }, 'GeocodingService');

      // Verificar cache
      const cacheKey = endereco.toLowerCase().trim();
      if (this.coordenadasCache.has(cacheKey)) {
        Logger.debug('Coordenadas encontradas no cache', {}, 'GeocodingService');
        return this.coordenadasCache.get(cacheKey)!;
      }

      // Estratégia de busca múltipla com fallback
      const buscas = this.gerarVariacoesBusca(endereco);
      
      for (const query of buscas) {
        Logger.debug('Tentando busca com', { query }, 'GeocodingService');
        
        const coords = await this.buscarCoordenadasSingle(query);
        if (coords) {
          // Salvar no cache com a chave original
          this.coordenadasCache.set(cacheKey, coords);
          Logger.debug('Coordenadas encontradas', { coords }, 'GeocodingService');
          return coords;
        }
      }

      Logger.warn('Nenhuma variação encontrou coordenadas', 'GeocodingService');
      return null;
    } catch (error) {
      Logger.error('Erro ao buscar coordenadas', { error }, 'GeocodingService');
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
    } catch {
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
      } catch {
        clearTimeout(timeoutId);
        return null;
      }
    } catch {
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
      Logger.error('Erro ao buscar endereço por coordenadas', { error }, 'GeocodingService');
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
    
    // Sempre incluir Fortaleza, CE, Brasil para garantir localização correta
    if (endereco.localidade && endereco.localidade.toLowerCase() !== 'fortaleza') {
      partes.push(endereco.localidade);
    }
    partes.push('Fortaleza');
    partes.push('CE');
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
        complemento: '',
        regional: this.buscarRegionalPorBairro(dadosCEP.bairro || '')
      };

      // 3. Buscar coordenadas
      const enderecoParaBusca = this.formatarEnderecoParaBusca(enderecoCompleto);
      const coords = await this.buscarCoordenadas(enderecoParaBusca);

      // 4. Adicionar coordenadas ao endereço
      enderecoCompleto.latitude = coords?.lat;
      enderecoCompleto.longitude = coords?.lng;

      return enderecoCompleto;
    } catch (error) {
      Logger.error('Erro ao processar endereço completo', { error }, 'GeocodingService');
      return null;
    }
  }

  /**
   * Limpar cache
   */
  static limparCache(): void {
    this.coordenadasCache.clear();
    this.enderecoCache.clear();
    Logger.debug('Cache de geocoding limpo', {}, 'GeocodingService');
  }

  /**
   * Limpar cache de coordenadas específicas
   */
  static limparCacheCoordenadas(endereco: string): void {
    const cacheKey = endereco.toLowerCase().trim();
    this.coordenadasCache.delete(cacheKey);
    Logger.debug('Cache removido para', { endereco }, 'GeocodingService');
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
