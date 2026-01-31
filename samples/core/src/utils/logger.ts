// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * Log levels for the logger
 */
export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
    NONE = 4
}

/**
 * Log entry structure
 */
export interface LogEntry {
    timestamp: Date;
    level: LogLevel;
    namespace: string;
    message: string;
    data?: unknown;
    error?: Error;
}

/**
 * Logger configuration options
 */
export interface LoggerConfig {
    /** Minimum log level to output */
    level: LogLevel;
    /** Whether to include timestamps */
    timestamps: boolean;
    /** Whether to output to console */
    console: boolean;
    /** Optional custom log handler */
    handler?: (entry: LogEntry) => void;
}

const defaultConfig: LoggerConfig = {
    level: LogLevel.INFO,
    timestamps: true,
    console: true
};

let globalConfig: LoggerConfig = { ...defaultConfig };

/**
 * Configure the global logger settings
 */
export function configureLogger(config: Partial<LoggerConfig>): void {
    globalConfig = { ...globalConfig, ...config };
}

/**
 * Get the current logger configuration
 */
export function getLoggerConfig(): LoggerConfig {
    return { ...globalConfig };
}

/**
 * Logger class for structured logging
 */
export class Logger {
    private readonly namespace: string;
    private config: LoggerConfig;

    constructor(namespace: string, config?: Partial<LoggerConfig>) {
        this.namespace = namespace;
        this.config = { ...globalConfig, ...config };
    }

    /**
     * Log a debug message
     */
    debug(message: string, data?: unknown): void {
        this.log(LogLevel.DEBUG, message, data);
    }

    /**
     * Log an info message
     */
    info(message: string, data?: unknown): void {
        this.log(LogLevel.INFO, message, data);
    }

    /**
     * Log a warning message
     */
    warn(message: string, data?: unknown): void {
        this.log(LogLevel.WARN, message, data);
    }

    /**
     * Log an error message
     */
    error(message: string, error?: Error | unknown, data?: unknown): void {
        const entry: LogEntry = {
            timestamp: new Date(),
            level: LogLevel.ERROR,
            namespace: this.namespace,
            message,
            data,
            error: error instanceof Error ? error : undefined
        };

        this.outputEntry(entry);
    }

    /**
     * Create a child logger with a sub-namespace
     */
    child(subNamespace: string): Logger {
        return new Logger(`${this.namespace}:${subNamespace}`, this.config);
    }

    private log(level: LogLevel, message: string, data?: unknown): void {
        if (level < this.config.level) {
            return;
        }

        const entry: LogEntry = {
            timestamp: new Date(),
            level,
            namespace: this.namespace,
            message,
            data
        };

        this.outputEntry(entry);
    }

    private outputEntry(entry: LogEntry): void {
        // Custom handler
        if (this.config.handler) {
            this.config.handler(entry);
        }

        // Console output
        if (this.config.console) {
            this.consoleOutput(entry);
        }
    }

    private consoleOutput(entry: LogEntry): void {
        const prefix = this.config.timestamps
            ? `[${entry.timestamp.toISOString()}] [${this.namespace}]`
            : `[${this.namespace}]`;

        const args: unknown[] = [prefix, entry.message];
        if (entry.data !== undefined) {
            args.push(entry.data);
        }
        if (entry.error) {
            args.push(entry.error);
        }

        switch (entry.level) {
            case LogLevel.DEBUG:
                console.debug(...args);
                break;
            case LogLevel.INFO:
                console.info(...args);
                break;
            case LogLevel.WARN:
                console.warn(...args);
                break;
            case LogLevel.ERROR:
                console.error(...args);
                break;
        }
    }
}

/**
 * Create a logger instance for a namespace
 */
export function createLogger(namespace: string, config?: Partial<LoggerConfig>): Logger {
    return new Logger(namespace, config);
}
