import { REGIONAIS_FORTALEZA, RegionalConfig } from '../data/regionaisFortaleza';

/**
 * Encontra a regional baseada no bairro
 */
export function encontrarRegionalPorBairro(bairro: string): number {
  if (!bairro) return 0;
  
  const bairroNormalizado = bairro.trim().toLowerCase();
  
  for (const regional of REGIONAIS_FORTALEZA) {
    // Verificar se o bairro está na lista de bairros da regional
    if (regional.bairros.some(b => 
      b.toLowerCase().trim() === bairroNormalizado ||
      b.toLowerCase().includes(bairroNormalizado) ||
      bairroNormalizado.includes(b.toLowerCase())
    )) {
      return regional.id;
    }
    
    // Verificar se o bairro está nos territórios
    for (const territorios of Object.values(regional.territorios)) {
      if (territorios.some(b => 
        b.toLowerCase().trim() === bairroNormalizado ||
        b.toLowerCase().includes(bairroNormalizado) ||
        bairroNormalizado.includes(b.toLowerCase())
      )) {
        return regional.id;
      }
    }
  }
  
  return 0; // Não encontrou
}

/**
 * Retorna informações completas da regional por ID
 */
export function getRegionalPorId(id: number): RegionalConfig | null {
  return REGIONAIS_FORTALEZA.find(r => r.id === id) || null;
}

/**
 * Lista todos os bairros de uma regional
 */
export function getBairrosPorRegional(id: number): string[] {
  const regional = getRegionalPorId(id);
  if (!regional) return [];
  
  const bairros = new Set<string>();
  
  // Adicionar bairros da lista principal
  regional.bairros.forEach(b => bairros.add(b));
  
  // Adicionar bairros dos territórios
  Object.values(regional.territorios).forEach(territorios => {
    territorios.forEach(b => bairros.add(b));
  });
  
  return Array.from(bairros);
}

/**
 * Verifica se um bairro pertence a uma regional
 */
export function bairroPertenceRegional(bairro: string, regionalId: number): boolean {
  const regionalDaBairro = encontrarRegionalPorBairro(bairro);
  return regionalDaBairro === regionalId;
}
