export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

class Logger {
  private static isDevelopment = import.meta.env.DEV;
  private static isProduction = import.meta.env.PROD;

  static error(message: string, error?: any, context?: string, allowInProduction: boolean = false) {
    if (this.isDevelopment) {
      console.error(`[ERROR] ${context ? `[${context}] ` : ''}${message}`, error);
    }
    // Em produção, enviar apenas se explicitamente permitido
    if (this.isProduction && allowInProduction) {
      console.error(`[ERROR] ${context ? `[${context}] ` : ''}${message}`, error);
      // TODO: Enviar para serviço de logging (Sentry/DataDog)
    }
  }

  static critical(message: string, error?: any, context?: string) {
    if (this.isDevelopment) {
      console.error(`[CRITICAL] ${context ? `[${context}] ` : ''}${message}`, error);
    }
    // Erros críticos sempre aparecem em produção
    if (this.isProduction) {
      console.error(`[CRITICAL] ${context ? `[${context}] ` : ''}${message}`, error);
      // TODO: Enviar para serviço de monitoramento urgente
    }
  }

  static warn(message: string, context?: string) {
    if (this.isDevelopment) {
      console.warn(`[WARN] ${context ? `[${context}] ` : ''}${message}`);
    }
    // Warnings NUNCA aparecem em produção
  }

  static info(message: string, context?: string) {
    if (this.isDevelopment) {
      console.info(`[INFO] ${context ? `[${context}] ` : ''}${message}`);
    }
    // Infos NUNCA aparecem em produção
  }

  static debug(message: string, data?: any, context?: string) {
    if (this.isDevelopment) {
      console.log(`[DEBUG] ${context ? `[${context}] ` : ''}${message}`, data);
    }
    // Debug NUNCA aparece em produção
  }
}

export default Logger;
