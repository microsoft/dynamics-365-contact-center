// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import {
    Telemetry,
    getTelemetry,
    configureTelemetry,
    createTelemetry,
    createConsoleProvider,
    createNoopProvider,
    createBufferedProvider,
    createCompositeProvider,
    TelemetryProvider
} from '../telemetry';

describe('Telemetry', () => {
    let telemetry: Telemetry;
    let mockProvider: TelemetryProvider;

    beforeEach(() => {
        mockProvider = {
            trackEvent: jest.fn(),
            trackException: jest.fn(),
            trackMetric: jest.fn(),
            flush: jest.fn().mockResolvedValue(undefined)
        };

        telemetry = new Telemetry({
            enabled: true,
            provider: mockProvider,
            batchSize: 10,
            flushInterval: 0 // Disable auto-flush for tests
        });
    });

    afterEach(() => {
        telemetry.destroy();
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('should create telemetry with default config (disabled)', () => {
            const t = new Telemetry({ enabled: false });
            expect(t.isEnabled()).toBe(false);
            t.destroy();
        });

        it('should create telemetry with custom config', () => {
            expect(telemetry.isEnabled()).toBe(true);
        });
    });

    describe('trackEvent', () => {
        it('should track event when enabled', async () => {
            telemetry.trackEvent({
                name: 'test:event',
                timestamp: new Date(),
                properties: { key: 'value' }
            });

            await telemetry.flush();

            expect(mockProvider.trackEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: 'test:event',
                    properties: { key: 'value' }
                })
            );
        });

        it('should NOT track event when disabled', async () => {
            telemetry.disable();

            telemetry.trackEvent({
                name: 'test:event',
                timestamp: new Date()
            });

            await telemetry.flush();

            expect(mockProvider.trackEvent).not.toHaveBeenCalled();
        });

        it('should batch events and flush when batch size reached', () => {
            const batchTelemetry = new Telemetry({
                enabled: true,
                provider: mockProvider,
                batchSize: 3,
                flushInterval: 0
            });

            batchTelemetry.trackEvent({ name: 'event1', timestamp: new Date() });
            batchTelemetry.trackEvent({ name: 'event2', timestamp: new Date() });
            expect(mockProvider.trackEvent).not.toHaveBeenCalled();

            batchTelemetry.trackEvent({ name: 'event3', timestamp: new Date() });
            expect(mockProvider.trackEvent).toHaveBeenCalledTimes(3);

            batchTelemetry.destroy();
        });

        it('should respect sampling rate', () => {
            const sampledTelemetry = new Telemetry({
                enabled: true,
                provider: mockProvider,
                samplingRate: 0, // 0% sampling = no events
                flushInterval: 0
            });

            for (let i = 0; i < 100; i++) {
                sampledTelemetry.trackEvent({ name: 'event', timestamp: new Date() });
            }

            expect(mockProvider.trackEvent).not.toHaveBeenCalled();
            sampledTelemetry.destroy();
        });
    });

    describe('trackDriverInitialized', () => {
        it('should track driver initialization', async () => {
            telemetry.trackDriverInitialized('TestDriver', true, 150);
            await telemetry.flush();

            expect(mockProvider.trackEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: 'driver:initialized',
                    properties: {
                        driverName: 'TestDriver',
                        success: true
                    },
                    measurements: {
                        durationMs: 150
                    }
                })
            );
        });
    });

    describe('trackError', () => {
        it('should track error with context', () => {
            const error = new Error('Test error');
            telemetry.trackError('initialize', error);

            expect(mockProvider.trackException).toHaveBeenCalledWith(
                error,
                expect.objectContaining({
                    context: 'initialize',
                    errorName: 'Error',
                    errorMessage: 'Test error'
                })
            );
        });
    });

    describe('trackPerformance', () => {
        it('should track performance metric', () => {
            telemetry.trackPerformance('scriptLoad', 250, { url: 'test.js' });

            expect(mockProvider.trackMetric).toHaveBeenCalledWith(
                'performance:scriptLoad',
                250,
                { url: 'test.js' }
            );
        });
    });

    describe('trackConversationEvent', () => {
        it('should track conversation events', async () => {
            telemetry.trackConversationEvent('loaded', 'conv-123', { channel: 'voice' });
            await telemetry.flush();

            expect(mockProvider.trackEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: 'conversation:loaded',
                    properties: expect.objectContaining({
                        channel: 'voice'
                    })
                })
            );
        });
    });

    describe('trackApiCall', () => {
        it('should track API call success', async () => {
            telemetry.trackApiCall('getConversation', true, 100);
            await telemetry.flush();

            expect(mockProvider.trackEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: 'api:call',
                    properties: {
                        apiName: 'getConversation',
                        success: true,
                        errorMessage: undefined
                    },
                    measurements: { durationMs: 100 }
                })
            );
        });

        it('should track API call failure with error message', async () => {
            telemetry.trackApiCall('getConversation', false, 50, 'Network error');
            await telemetry.flush();

            expect(mockProvider.trackEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    properties: expect.objectContaining({
                        success: false,
                        errorMessage: 'Network error'
                    })
                })
            );
        });
    });

    describe('trackFeatureUsage', () => {
        it('should track feature usage', async () => {
            telemetry.trackFeatureUsage('screenPop', { source: 'conversation' });
            await telemetry.flush();

            expect(mockProvider.trackEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: 'feature:screenPop',
                    properties: { source: 'conversation' }
                })
            );
        });
    });

    describe('PII redaction', () => {
        it('should redact email addresses', async () => {
            telemetry.trackEvent({
                name: 'test',
                timestamp: new Date(),
                properties: { email: 'user@example.com' }
            });
            await telemetry.flush();

            expect(mockProvider.trackEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    properties: { email: '[REDACTED]' }
                })
            );
        });

        it('should redact phone numbers', async () => {
            telemetry.trackEvent({
                name: 'test',
                timestamp: new Date(),
                properties: { phone: '123-456-7890' }
            });
            await telemetry.flush();

            expect(mockProvider.trackEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    properties: { phone: '[REDACTED]' }
                })
            );
        });

        it('should NOT redact when redactPII is false', async () => {
            const noRedactTelemetry = new Telemetry({
                enabled: true,
                provider: mockProvider,
                redactPII: false,
                flushInterval: 0
            });

            noRedactTelemetry.trackEvent({
                name: 'test',
                timestamp: new Date(),
                properties: { email: 'user@example.com' }
            });
            await noRedactTelemetry.flush();

            expect(mockProvider.trackEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    properties: { email: 'user@example.com' }
                })
            );

            noRedactTelemetry.destroy();
        });
    });

    describe('enable/disable', () => {
        it('should enable telemetry', () => {
            telemetry.disable();
            expect(telemetry.isEnabled()).toBe(false);

            telemetry.enable();
            expect(telemetry.isEnabled()).toBe(true);
        });

        it('should disable telemetry', () => {
            expect(telemetry.isEnabled()).toBe(true);

            telemetry.disable();
            expect(telemetry.isEnabled()).toBe(false);
        });
    });

    describe('configure', () => {
        it('should update configuration', () => {
            telemetry.configure({
                enabled: false,
                samplingRate: 0.5
            });

            expect(telemetry.isEnabled()).toBe(false);
            expect(telemetry.getConfig().samplingRate).toBe(0.5);
        });

        it('should update provider', () => {
            const newProvider = createNoopProvider();
            telemetry.configure({ provider: newProvider });

            expect(telemetry.getConfig().provider).toBe(newProvider);
        });
    });

    describe('flush', () => {
        it('should flush buffered events', async () => {
            telemetry.trackEvent({ name: 'event1', timestamp: new Date() });
            telemetry.trackEvent({ name: 'event2', timestamp: new Date() });

            await telemetry.flush();

            expect(mockProvider.trackEvent).toHaveBeenCalledTimes(2);
            expect(mockProvider.flush).toHaveBeenCalled();
        });

        it('should clear buffer after flush', async () => {
            telemetry.trackEvent({ name: 'event1', timestamp: new Date() });
            await telemetry.flush();

            expect(mockProvider.trackEvent).toHaveBeenCalledTimes(1);

            await telemetry.flush();
            expect(mockProvider.trackEvent).toHaveBeenCalledTimes(1); // No new calls
        });
    });
});

describe('Global Telemetry Functions', () => {
    beforeEach(() => {
        // Reset global telemetry
        configureTelemetry({ enabled: false });
    });

    describe('getTelemetry', () => {
        it('should return global telemetry instance', () => {
            const t1 = getTelemetry();
            const t2 = getTelemetry();
            expect(t1).toBe(t2);
        });
    });

    describe('configureTelemetry', () => {
        it('should configure global telemetry', () => {
            configureTelemetry({ enabled: true, samplingRate: 0.5 });

            const t = getTelemetry();
            expect(t.isEnabled()).toBe(true);
            expect(t.getConfig().samplingRate).toBe(0.5);
        });
    });

    describe('createTelemetry', () => {
        it('should create new telemetry instance', () => {
            const t = createTelemetry({ enabled: true });
            expect(t).toBeInstanceOf(Telemetry);
            expect(t).not.toBe(getTelemetry());
            t.destroy();
        });
    });
});

describe('Telemetry Providers', () => {
    describe('createConsoleProvider', () => {
        it('should create console provider', () => {
            const provider = createConsoleProvider();

            expect(provider.trackEvent).toBeDefined();
            expect(provider.trackException).toBeDefined();
            expect(provider.trackMetric).toBeDefined();
            expect(provider.flush).toBeDefined();
        });

        it('should log events to console', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            const provider = createConsoleProvider();

            provider.trackEvent({ name: 'test', timestamp: new Date() });

            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        it('should log verbose output when verbose option is true', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            const provider = createConsoleProvider({ verbose: true });

            provider.trackEvent({ name: 'test', timestamp: new Date(), properties: { key: 'value' } });

            expect(consoleSpy).toHaveBeenCalledWith(
                '[Telemetry Event]',
                expect.stringContaining('"name": "test"')
            );
            consoleSpy.mockRestore();
        });
    });

    describe('createNoopProvider', () => {
        it('should create noop provider that does nothing', async () => {
            const provider = createNoopProvider();

            // Should not throw
            provider.trackEvent({ name: 'test', timestamp: new Date() });
            provider.trackException(new Error('test'));
            provider.trackMetric('test', 1);
            await provider.flush();
        });
    });

    describe('createBufferedProvider', () => {
        it('should buffer events for later retrieval', () => {
            const provider = createBufferedProvider();

            provider.trackEvent({ name: 'event1', timestamp: new Date() });
            provider.trackEvent({ name: 'event2', timestamp: new Date() });

            const events = provider.getEvents();
            expect(events).toHaveLength(2);
            expect(events[0].name).toBe('event1');
            expect(events[1].name).toBe('event2');
        });

        it('should buffer exceptions', () => {
            const provider = createBufferedProvider();
            const error = new Error('test');

            provider.trackException(error, { context: 'test' });

            const exceptions = provider.getExceptions();
            expect(exceptions).toHaveLength(1);
            expect(exceptions[0].error).toBe(error);
            expect(exceptions[0].properties).toEqual({ context: 'test' });
        });

        it('should buffer metrics', () => {
            const provider = createBufferedProvider();

            provider.trackMetric('metric1', 100);
            provider.trackMetric('metric2', 200, { tag: 'test' });

            const metrics = provider.getMetrics();
            expect(metrics).toHaveLength(2);
            expect(metrics[0]).toEqual({ name: 'metric1', value: 100, properties: undefined });
            expect(metrics[1]).toEqual({ name: 'metric2', value: 200, properties: { tag: 'test' } });
        });

        it('should clear all buffers', () => {
            const provider = createBufferedProvider();

            provider.trackEvent({ name: 'event', timestamp: new Date() });
            provider.trackException(new Error('test'));
            provider.trackMetric('metric', 1);

            provider.clear();

            expect(provider.getEvents()).toHaveLength(0);
            expect(provider.getExceptions()).toHaveLength(0);
            expect(provider.getMetrics()).toHaveLength(0);
        });
    });

    describe('createCompositeProvider', () => {
        it('should send to multiple providers', () => {
            const provider1: TelemetryProvider = {
                trackEvent: jest.fn(),
                trackException: jest.fn(),
                trackMetric: jest.fn(),
                flush: jest.fn().mockResolvedValue(undefined)
            };
            const provider2: TelemetryProvider = {
                trackEvent: jest.fn(),
                trackException: jest.fn(),
                trackMetric: jest.fn(),
                flush: jest.fn().mockResolvedValue(undefined)
            };

            const composite = createCompositeProvider(provider1, provider2);
            const event = { name: 'test', timestamp: new Date() };

            composite.trackEvent(event);

            expect(provider1.trackEvent).toHaveBeenCalledWith(event);
            expect(provider2.trackEvent).toHaveBeenCalledWith(event);
        });

        it('should flush all providers', async () => {
            const provider1: TelemetryProvider = {
                trackEvent: jest.fn(),
                trackException: jest.fn(),
                trackMetric: jest.fn(),
                flush: jest.fn().mockResolvedValue(undefined)
            };
            const provider2: TelemetryProvider = {
                trackEvent: jest.fn(),
                trackException: jest.fn(),
                trackMetric: jest.fn(),
                flush: jest.fn().mockResolvedValue(undefined)
            };

            const composite = createCompositeProvider(provider1, provider2);

            await composite.flush();

            expect(provider1.flush).toHaveBeenCalled();
            expect(provider2.flush).toHaveBeenCalled();
        });
    });
});
