type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
  data?: any;
  requestId?: string;
  userId?: string;
}

export class Logger {
  private serviceName: string;
  private requestId?: string;
  private userId?: string;
  private static logLevel: LogLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug';

  constructor(serviceName: string, requestId?: string, userId?: string) {
    this.serviceName = serviceName;
    this.requestId = requestId;
    this.userId = userId;
  }

  static setLogLevel(level: LogLevel): void {
    Logger.logLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(Logger.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  private formatLogEntry(level: LogLevel, message: string, data?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      message,
      data,
      requestId: this.requestId,
      userId: this.userId
    };
  }

  private writeLog(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return;

    const logString = JSON.stringify(entry);
    
    switch (entry.level) {
      case 'debug':
        console.debug(logString);
        break;
      case 'info':
        console.info(logString);
        break;
      case 'warn':
        console.warn(logString);
        break;
      case 'error':
        console.error(logString);
        break;
    }
  }

  debug(message: string, data?: any): void {
    const entry = this.formatLogEntry('debug', message, data);
    this.writeLog(entry);
  }

  info(message: string, data?: any): void {
    const entry = this.formatLogEntry('info', message, data);
    this.writeLog(entry);
  }

  warn(message: string, data?: any): void {
    const entry = this.formatLogEntry('warn', message, data);
    this.writeLog(entry);
  }

  error(message: string, error?: any): void {
    const entry = this.formatLogEntry('error', message, error);
    this.writeLog(entry);
  }

  withContext(requestId: string, userId?: string): Logger {
    return new Logger(this.serviceName, requestId, userId);
  }
}
