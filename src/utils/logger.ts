export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

export interface LogConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableDebugMode: boolean;
}

export class Logger {
  private static config: LogConfig = {
    level: LogLevel.INFO,
    enableConsole: true,
    enableDebugMode: false
  };

  static configure(config: Partial<LogConfig>): void {
    this.config = { ...this.config, ...config };
  }

  static setLogLevel(level: LogLevel): void {
    this.config.level = level;
  }

  static enableDebugMode(enabled: boolean = true): void {
    this.config.enableDebugMode = enabled;
    this.config.level = enabled ? LogLevel.DEBUG : LogLevel.INFO;
  }

  static error(message: string, ...args: any[]): void {
    if (this.config.level >= LogLevel.ERROR && this.config.enableConsole) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }

  static warn(message: string, ...args: any[]): void {
    if (this.config.level >= LogLevel.WARN && this.config.enableConsole) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  static info(message: string, ...args: any[]): void {
    if (this.config.level >= LogLevel.INFO && this.config.enableConsole) {
      console.log(`[INFO] ${message}`, ...args);
    }
  }

  static debug(message: string, ...args: any[]): void {
    if (this.config.level >= LogLevel.DEBUG && this.config.enableConsole && this.config.enableDebugMode) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }

  // Specialized logging methods for different components
  static layout(message: string, ...args: any[]): void {
    this.debug(`[LAYOUT] ${message}`, ...args);
  }

  static animation(message: string, ...args: any[]): void {
    this.debug(`[ANIMATION] ${message}`, ...args);
  }

  static variant(message: string, ...args: any[]): void {
    this.debug(`[VARIANT] ${message}`, ...args);
  }

  static dom(message: string, ...args: any[]): void {
    this.debug(`[DOM] ${message}`, ...args);
  }

  // Performance logging
  static time(label: string): void {
    if (this.config.enableDebugMode) {
      console.time(`[PERF] ${label}`);
    }
  }

  static timeEnd(label: string): void {
    if (this.config.enableDebugMode) {
      console.timeEnd(`[PERF] ${label}`);
    }
  }

  // Group logging for better organization
  static group(label: string): void {
    if (this.config.enableDebugMode) {
      console.group(`[GROUP] ${label}`);
    }
  }

  static groupEnd(): void {
    if (this.config.enableDebugMode) {
      console.groupEnd();
    }
  }
}



