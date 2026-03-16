import Logger from '../utils/logger';

interface ErrorContext {
  component: string;
  action: string;
  userId?: string;
}

class ErrorService {
  static handleError(error: any, context: ErrorContext, allowInProduction: boolean = false) {
    const errorInfo = {
      message: error?.message || error?.toString() || 'Erro desconhecido',
      context: context.component,
      action: context.action,
      timestamp: new Date().toISOString(),
      stack: error?.stack
    };

    // Log estruturado
    Logger.error(errorInfo.message, error, context.component, allowInProduction);
  }

  static handleApiError(error: any, context: ErrorContext) {
    // Erros de API sempre aparecem em produção (são críticos)
    Logger.critical(error?.message || 'Erro de API', error, `${context.component}:API`);
  }

  static handleValidationError(message: string, context: ErrorContext) {
    // Erros de validação sempre aparecem em produção (são críticos)
    Logger.critical(message, null, `${context.component}:Validation`);
  }

  static handleCriticalError(error: any, context: ErrorContext) {
    // Erros críticos sempre aparecem em produção
    Logger.critical(error?.message || 'Erro crítico', error, `${context.component}:Critical`);
  }

  static handleAuthError(error: any, context: ErrorContext) {
    // Erros de autenticação sempre aparecem em produção (são críticos)
    Logger.critical(error?.message || 'Erro de autenticação', error, `${context.component}:Auth`);
  }
}

export default ErrorService;
