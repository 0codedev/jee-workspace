type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private isProduction = Boolean((import.meta as any).env?.PROD);

  private formatMessage(level: LogLevel, message: string, namespace?: string): string {
    const timestamp = new Date().toISOString().substring(11, 19);
    const ns = namespace ? `[${namespace}]` : '';
    return `${timestamp} ${level.toUpperCase()} ${ns} ${message}`;
  }

  debug(message: string, data?: any, namespace?: string): void {
    if (this.isProduction) return;
    const formatted = this.formatMessage('debug', message, namespace);
    if (data !== undefined) {
      console.debug(formatted, data);
    } else {
      console.debug(formatted);
    }
  }

  info(message: string, data?: any, namespace?: string): void {
    const formatted = this.formatMessage('info', message, namespace);
    if (data !== undefined) {
      console.info(formatted, data);
    } else {
      console.info(formatted);
    }
  }

  warn(message: string, data?: any, namespace?: string): void {
    const formatted = this.formatMessage('warn', message, namespace);
    if (data !== undefined) {
      console.warn(formatted, data);
    } else {
      console.warn(formatted);
    }
  }

  error(message: string, error?: any, namespace?: string): void {
    const formatted = this.formatMessage('error', message, namespace);
    if (error !== undefined) {
      console.error(formatted, error);
    } else {
      console.error(formatted);
    }
  }
}

export const logger = new Logger();