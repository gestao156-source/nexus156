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

      // Verificar cache
      const cacheKey = endereco.toLowerCase().trim();
      if (this.coordenadasCache.has(cacheKey)) {
        return this.coordenadasCache.get(cacheKey)!;
      }

      const query = `${endereco}, Brasil`;
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Nexus156 Sistema Gerenciamento'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
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

      // Salvar no cache
      this.coordenadasCache.set(cacheKey, coords);

      return coords;
    } catch (error) {
      console.error('Erro ao buscar coordenadas:', error);
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

      // 2. Montar endereço para buscar coordenadas
      const enderecoParaBusca = `${dadosCEP.logradouro}, ${numero || ''}, ${dadosCEP.bairro}, ${dadosCEP.localidade}, ${dadosCEP.uf}`;

      // 3. Buscar coordenadas
      const coords = await this.buscarCoordenadas(enderecoParaBusca);

      const enderecoCompleto: EnderecoCompleto = {
        cep: dadosCEP.cep,
        rua: dadosCEP.logradouro,
        numero: numero || '',
        bairro: dadosCEP.bairro,
        localidade: dadosCEP.localidade,
        complemento: dadosCEP.complemento || '',
        latitude: coords?.lat,
        longitude: coords?.lng
      };

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
