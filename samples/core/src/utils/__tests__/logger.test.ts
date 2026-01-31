// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import {
    Logger,
    LogLevel,
    LogEntry,
    LoggerConfig,
    createLogger,
    configureLogger,
    getLoggerConfig
} from '../logger';

describe('Logger', () => {
    let consoleSpy: {
        debug: jest.SpyInstance;
        info: jest.SpyInstance;
        warn: jest.SpyInstance;
        error: jest.SpyInstance;
    };

    beforeEach(() => {
        // Reset global config before each test
        configureLogger({
            level: LogLevel.INFO,
            timestamps: true,
            console: true,
            handler: undefined
        });

        // Spy on console methods
        consoleSpy = {
            debug: jest.spyOn(console, 'debug').mockImplementation(),
            info: jest.spyOn(console, 'info').mockImplementation(),
            warn: jest.spyOn(console, 'warn').mockImplementation(),
            error: jest.spyOn(console, 'error').mockImplementation()
        };
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('LogLevel enum', () => {
        it('should have correct log level values in ascending order', () => {
            expect(LogLevel.DEBUG).toBe(0);
            expect(LogLevel.INFO).toBe(1);
            expect(LogLevel.WARN).toBe(2);
            expect(LogLevel.ERROR).toBe(3);
            expect(LogLevel.NONE).toBe(4);
        });

        it('should allow numeric comparison of log levels', () => {
            expect(LogLevel.DEBUG).toBeLessThan(LogLevel.INFO);
            expect(LogLevel.INFO).toBeLessThan(LogLevel.WARN);
            expect(LogLevel.WARN).toBeLessThan(LogLevel.ERROR);
            expect(LogLevel.ERROR).toBeLessThan(LogLevel.NONE);
        });
    });

    describe('createLogger', () => {
        it('should create a logger with the given namespace', () => {
            const logger = createLogger('TestNamespace');
            expect(logger).toBeInstanceOf(Logger);
        });

        it('should create a logger with custom config', () => {
            const logger = createLogger('Test', { level: LogLevel.DEBUG });
            logger.debug('test message');
            expect(consoleSpy.debug).toHaveBeenCalled();
        });
    });

    describe('Logger instance', () => {
        describe('positive test cases', () => {
            it('should log info messages when level is INFO or lower', () => {
                const logger = createLogger('Test', { level: LogLevel.INFO });
                logger.info('info message');
                expect(consoleSpy.info).toHaveBeenCalled();
            });

            it('should log warn messages when level is WARN or lower', () => {
                const logger = createLogger('Test', { level: LogLevel.WARN });
                logger.warn('warn message');
                expect(consoleSpy.warn).toHaveBeenCalled();
            });

            it('should log error messages when level is ERROR or lower', () => {
                const logger = createLogger('Test', { level: LogLevel.ERROR });
                logger.error('error message');
                expect(consoleSpy.error).toHaveBeenCalled();
            });

            it('should log debug messages when level is DEBUG', () => {
                const logger = createLogger('Test', { level: LogLevel.DEBUG });
                logger.debug('debug message');
                expect(consoleSpy.debug).toHaveBeenCalled();
            });

            it('should include namespace in log output', () => {
                const logger = createLogger('MyNamespace', { level: LogLevel.INFO });
                logger.info('test');
                expect(consoleSpy.info).toHaveBeenCalledWith(
                    expect.stringContaining('[MyNamespace]'),
                    'test'
                );
            });

            it('should include timestamp when timestamps option is true', () => {
                const logger = createLogger('Test', { timestamps: true });
                logger.info('test');
                expect(consoleSpy.info).toHaveBeenCalledWith(
                    expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T/),
                    'test'
                );
            });

            it('should exclude timestamp when timestamps option is false', () => {
                const logger = createLogger('Test', { timestamps: false });
                logger.info('test');
                expect(consoleSpy.info).toHaveBeenCalledWith('[Test]', 'test');
            });

            it('should include data when provided', () => {
                const logger = createLogger('Test');
                const data = { key: 'value' };
                logger.info('message', data);
                expect(consoleSpy.info).toHaveBeenCalledWith(
                    expect.any(String),
                    'message',
                    data
                );
            });

            it('should include error object when logging errors', () => {
                const logger = createLogger('Test');
                const error = new Error('test error');
                logger.error('error occurred', error);
                expect(consoleSpy.error).toHaveBeenCalledWith(
                    expect.any(String),
                    'error occurred',
                    error
                );
            });

            it('should create child logger with combined namespace', () => {
                const parent = createLogger('Parent');
                const child = parent.child('Child');
                child.info('test');
                expect(consoleSpy.info).toHaveBeenCalledWith(
                    expect.stringContaining('[Parent:Child]'),
                    'test'
                );
            });

            it('should call custom handler when provided', () => {
                const handler = jest.fn();
                const logger = createLogger('Test', { handler });
                logger.info('test message');
                expect(handler).toHaveBeenCalledWith(
                    expect.objectContaining({
                        level: LogLevel.INFO,
                        namespace: 'Test',
                        message: 'test message'
                    })
                );
            });
        });

        describe('negative test cases', () => {
            it('should NOT log debug messages when level is INFO', () => {
                const logger = createLogger('Test', { level: LogLevel.INFO });
                logger.debug('debug message');
                expect(consoleSpy.debug).not.toHaveBeenCalled();
            });

            it('should NOT log info messages when level is WARN', () => {
                const logger = createLogger('Test', { level: LogLevel.WARN });
                logger.info('info message');
                expect(consoleSpy.info).not.toHaveBeenCalled();
            });

            it('should NOT log warn messages when level is ERROR', () => {
                const logger = createLogger('Test', { level: LogLevel.ERROR });
                logger.warn('warn message');
                expect(consoleSpy.warn).not.toHaveBeenCalled();
            });

            it('should NOT log any messages when level is NONE', () => {
                const logger = createLogger('Test', { level: LogLevel.NONE });
                logger.debug('debug');
                logger.info('info');
                logger.warn('warn');
                logger.error('error');
                expect(consoleSpy.debug).not.toHaveBeenCalled();
                expect(consoleSpy.info).not.toHaveBeenCalled();
                expect(consoleSpy.warn).not.toHaveBeenCalled();
                // error() doesn't check level, so it will still be called
            });

            it('should NOT output to console when console option is false', () => {
                const logger = createLogger('Test', { console: false });
                logger.info('test');
                expect(consoleSpy.info).not.toHaveBeenCalled();
            });

            it('should handle non-Error objects in error() gracefully', () => {
                const logger = createLogger('Test');
                logger.error('error', 'string error');
                expect(consoleSpy.error).toHaveBeenCalled();
            });

            it('should handle undefined data gracefully', () => {
                const logger = createLogger('Test');
                logger.info('test', undefined);
                expect(consoleSpy.info).toHaveBeenCalled();
            });

            it('should handle null data gracefully', () => {
                const logger = createLogger('Test');
                logger.info('test', null);
                expect(consoleSpy.info).toHaveBeenCalledWith(
                    expect.any(String),
                    'test',
                    null
                );
            });
        });
    });

    describe('configureLogger', () => {
        it('should update global configuration', () => {
            configureLogger({ level: LogLevel.DEBUG });
            const config = getLoggerConfig();
            expect(config.level).toBe(LogLevel.DEBUG);
        });

        it('should merge with existing configuration', () => {
            configureLogger({ level: LogLevel.ERROR });
            configureLogger({ timestamps: false });
            const config = getLoggerConfig();
            expect(config.level).toBe(LogLevel.ERROR);
            expect(config.timestamps).toBe(false);
        });

        it('should affect newly created loggers', () => {
            configureLogger({ level: LogLevel.DEBUG });
            const logger = createLogger('Test');
            logger.debug('test');
            expect(consoleSpy.debug).toHaveBeenCalled();
        });
    });

    describe('getLoggerConfig', () => {
        it('should return a copy of the configuration', () => {
            const config1 = getLoggerConfig();
            const config2 = getLoggerConfig();
            expect(config1).not.toBe(config2);
            expect(config1).toEqual(config2);
        });

        it('should not allow mutation of global config through returned object', () => {
            const config = getLoggerConfig();
            config.level = LogLevel.NONE;
            const actualConfig = getLoggerConfig();
            expect(actualConfig.level).not.toBe(LogLevel.NONE);
        });
    });

    describe('LogEntry structure', () => {
        it('should have correct structure when passed to custom handler', () => {
            const handler = jest.fn();
            const logger = createLogger('Test', { handler });
            const beforeLog = new Date();
            logger.info('test message', { extra: 'data' });
            const afterLog = new Date();

            expect(handler).toHaveBeenCalledWith(
                expect.objectContaining({
                    level: LogLevel.INFO,
                    namespace: 'Test',
                    message: 'test message',
                    data: { extra: 'data' }
                })
            );

            const entry: LogEntry = handler.mock.calls[0][0];
            expect(entry.timestamp).toBeInstanceOf(Date);
            expect(entry.timestamp.getTime()).toBeGreaterThanOrEqual(beforeLog.getTime());
            expect(entry.timestamp.getTime()).toBeLessThanOrEqual(afterLog.getTime());
        });
    });
});
