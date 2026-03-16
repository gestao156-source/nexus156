import { REGIONAIS_FORTALEZA } from '../data/regionaisFortaleza';
import Logger from './logger';

export class RegionalizacaoService {
  private static cache = new Map<string, number>();
  private static bairrosNaoMapeados = new Set<string>();

  /**
   * Determina a regional de um bairro com fallback para regional padrão
   * @param bairro Nome do bairro
   * @returns Número da regional (0 = não definida/padrão)
   */
  static determinarRegional(bairro: string): number {
    if (!bairro || bairro.trim().length === 0) {
      Logger.warn(`Bairro vazio -> Regional padrão (0)`, 'RegionalizacaoDinamica');
      return 0; // Regional padrão
    }

    const bairroNormalizado = bairro.toLowerCase().trim();
    
    // Verificar cache primeiro
    if (this.cache.has(bairroNormalizado)) {
      return this.cache.get(bairroNormalizado)!;
    }

    // Buscar em regionais
    for (const regional of REGIONAIS_FORTALEZA) {
      if (regional.bairros.some(b => 
        b.toLowerCase().trim() === bairroNormalizado ||
        b.toLowerCase().includes(bairroNormalizado) ||
        bairroNormalizado.includes(b.toLowerCase())
      )) {
        this.cache.set(bairroNormalizado, regional.id);
        return regional.id;
      }
    }
    
    // Fallback para regional padrão
    Logger.warn(`Bairro não mapeado: "${bairro}" -> Regional padrão (0)`, 'RegionalizacaoDinamica');
    this.bairrosNaoMapeados.add(bairroNormalizado);
    this.cache.set(bairroNormalizado, 0);
    return 0; // Regional padrão
  }

  /**
   * Obtém todas as regionais disponíveis
   * @returns Array com todas as regionais
   */
  static getRegionais() {
    return REGIONAIS_FORTALEZA;
  }

  /**
   * Obtém uma regional específica pelo ID
   * @param id ID da regional
   * @returns Configuração da regional ou null se não encontrada
   */
  static getRegional(id: number) {
    return REGIONAIS_FORTALEZA.find(r => r.id === id);
  }

  /**
   * Lista todos os bairros não mapeados (para análise futura)
   * @returns Array com bairros não encontrados
   */
  static getBairrosNaoMapeados(): string[] {
    return Array.from(this.bairrosNaoMapeados).sort();
  }

  /**
   * Limpa o cache (útil para desenvolvimento)
   */
  static limparCache(): void {
    this.cache.clear();
    this.bairrosNaoMapeados.clear();
  }

  /**
   * Obtém estatísticas da regionalização
   * @returns Estatísticas de uso
   */
  static getEstatisticas() {
    return {
      cacheSize: this.cache.size,
      bairrosNaoMapeados: this.bairrosNaoMapeados.size,
      regionaisMapeadas: this.cache.size - this.bairrosNaoMapeados.size
    };
  }

  /**
   * Testa a regionalização com exemplos
   * @returns Resultados do teste
   */
  static testarRegionalizacao() {
    const exemplos = [
      'Aldeota',
      'Centro',
      'Pirambu',
      'Bairro que não existe',
      '',
      'Meireles'
    ];

    return exemplos.map(bairro => ({
      bairro,
      regional: this.determinarRegional(bairro),
      nomeRegional: this.getRegional(this.determinarRegional(bairro))?.nome || 'Não definida'
    }));
  }
}
