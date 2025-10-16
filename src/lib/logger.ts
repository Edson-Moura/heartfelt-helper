/**
 * Sistema de Logging Estruturado
 * Facilita debugging e monitoramento em produção
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  [key: string]: any;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  event: string;
  context: LogContext;
  sessionId: string;
  userId?: string;
  environment: 'development' | 'production';
}

class StructuredLogger {
  private sessionId: string;
  private userId?: string;
  private environment: 'development' | 'production';

  constructor() {
    this.sessionId = this.generateSessionId();
    this.environment = import.meta.env.DEV ? 'development' : 'production';
    
    // Load userId from localStorage if available
    this.loadUserId();
  }

  /**
   * Gera um ID único para a sessão
   */
  private generateSessionId(): string {
    const existingSessionId = sessionStorage.getItem('log-session-id');
    if (existingSessionId) return existingSessionId;

    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('log-session-id', newSessionId);
    return newSessionId;
  }

  /**
   * Carrega userId do localStorage
   */
  private loadUserId(): void {
    try {
      const authData = localStorage.getItem('supabase.auth.token');
      if (authData) {
        const parsed = JSON.parse(authData);
        this.userId = parsed?.currentSession?.user?.id;
      }
    } catch (error) {
      // Silently fail
    }
  }

  /**
   * Define o userId manualmente
   */
  setUserId(userId: string): void {
    this.userId = userId;
  }

  /**
   * Cria uma entrada de log estruturada
   */
  private createLogEntry(
    level: LogLevel,
    event: string,
    context: LogContext = {}
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      event,
      context,
      sessionId: this.sessionId,
      userId: this.userId,
      environment: this.environment,
    };
  }

  /**
   * Formata e envia o log
   */
  private send(entry: LogEntry): void {
    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.sessionId.slice(0, 12)}]`;
    
    // Em desenvolvimento, usa console colorido
    if (this.environment === 'development') {
      const style = this.getConsoleStyle(entry.level);
      console.log(`%c${prefix}`, style, entry.event, entry.context);
    } else {
      // Em produção, envia para serviço de logging (Sentry, Datadog, etc)
      // Por enquanto, apenas console.log estruturado
      console.log(JSON.stringify(entry));
      
      // TODO: Integrar com serviço de analytics/logging externo
      // this.sendToExternalService(entry);
    }

    // Armazena logs recentes no localStorage para debug
    this.storeRecentLog(entry);
  }

  /**
   * Estilo do console por nível
   */
  private getConsoleStyle(level: LogLevel): string {
    const styles = {
      info: 'color: #3b82f6; font-weight: bold',
      warn: 'color: #f59e0b; font-weight: bold',
      error: 'color: #ef4444; font-weight: bold',
      debug: 'color: #8b5cf6; font-weight: bold',
    };
    return styles[level];
  }

  /**
   * Armazena logs recentes no localStorage
   */
  private storeRecentLog(entry: LogEntry): void {
    try {
      const key = 'recent-logs';
      const stored = localStorage.getItem(key);
      const logs: LogEntry[] = stored ? JSON.parse(stored) : [];
      
      // Mantém apenas últimos 100 logs
      logs.push(entry);
      if (logs.length > 100) {
        logs.shift();
      }
      
      localStorage.setItem(key, JSON.stringify(logs));
    } catch (error) {
      // Silently fail if localStorage is full
    }
  }

  /**
   * Log de informação
   */
  info(event: string, context?: LogContext, component?: string, userId?: string): void {
    const enrichedContext = { 
      ...context, 
      ...(component && { component }),
      ...(userId && { userId })
    };
    this.send(this.createLogEntry('info', event, enrichedContext));
  }

  /**
   * Log de aviso
   */
  warn(event: string, context?: LogContext, component?: string, userId?: string): void {
    const enrichedContext = { 
      ...context, 
      ...(component && { component }),
      ...(userId && { userId })
    };
    this.send(this.createLogEntry('warn', event, enrichedContext));
  }

  /**
   * Log de erro
   */
  error(event: string, context?: LogContext, component?: string, userId?: string): void {
    const enrichedContext = { 
      ...context, 
      ...(component && { component }),
      ...(userId && { userId })
    };
    this.send(this.createLogEntry('error', event, enrichedContext));
  }

  /**
   * Log de debug
   */
  debug(event: string, context?: LogContext, component?: string, userId?: string): void {
    if (this.environment === 'development') {
      const enrichedContext = { 
        ...context, 
        ...(component && { component }),
        ...(userId && { userId })
      };
      this.send(this.createLogEntry('debug', event, enrichedContext));
    }
  }

  /**
   * Log de ação do usuário (compatibilidade)
   */
  userAction(action: string, userId?: string, metadata?: LogContext): void {
    const context = {
      ...metadata,
      userId: userId || this.userId,
      type: 'user_action',
    };
    this.info(action, context, 'USER_ACTION');
  }

  /**
   * Obtém logs recentes do localStorage
   */
  getRecentLogs(): LogEntry[] {
    try {
      const stored = localStorage.getItem('recent-logs');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Limpa logs armazenados
   */
  clearLogs(): void {
    localStorage.removeItem('recent-logs');
  }

  /**
   * Exporta logs como JSON
   */
  exportLogs(): string {
    const logs = this.getRecentLogs();
    return JSON.stringify(logs, null, 2);
  }
}

// Instância singleton
export const logger = new StructuredLogger();
