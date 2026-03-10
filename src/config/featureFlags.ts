export const FEATURE_FLAGS = {
  MAPA_INTERATIVO: true, // Habilitar mapa interativo
  MAPA_GEOCODING: true, // Habilitar geocoding automático
  MAPA_CLUSTERING: true, // Habilitar clustering de pins
  MAPA_REAL_TIME: true, // Habilitar atualizações em tempo real
  MAPA_MOBILE_OPTIMIZED: true, // Otimizações para mobile
  MAPA_PERFORMANCE_MONITORING: false // Monitoramento de performance (dev only)
};

// Função para verificar se uma feature está habilitada
export function isFeatureEnabled(feature: keyof typeof FEATURE_FLAGS): boolean {
  return FEATURE_FLAGS[feature];
}

// Função para habilitar/desabilitar features (útil para debug)
export function setFeatureEnabled(feature: keyof typeof FEATURE_FLAGS, enabled: boolean): void {
  if (process.env.NODE_ENV === 'development') {
    (FEATURE_FLAGS as any)[feature] = enabled;
    console.log(`Feature ${feature} ${enabled ? 'enabled' : 'disabled'}`);
  }
}
