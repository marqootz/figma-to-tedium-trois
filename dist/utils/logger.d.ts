export declare enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}
export declare class Logger {
    private static instance;
    private logLevel;
    private constructor();
    static getInstance(): Logger;
    setLogLevel(level: LogLevel): void;
    debug(message: string, ...args: any[]): void;
    info(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
    group(label: string): void;
    groupEnd(): void;
    time(label: string): void;
    timeEnd(label: string): void;
}
export declare const logger: Logger;
//# sourceMappingURL=logger.d.ts.map