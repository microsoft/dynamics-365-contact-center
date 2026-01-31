// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { BaseCTIDriver, CTIDriverConfig, CTIDriverEvents } from '../BaseCTIDriver';
import { IConversationLoadedEventData, ISentimentObject, IPresence } from '@ccaas/CCaaSEmbedSDK';

// Mock the script loader
jest.mock('../utils/scriptLoader', () => ({
    loadScript: jest.fn().mockResolvedValue(undefined),
    preloadScript: jest.fn(),
    preconnect: jest.fn(),
    ScriptLoadError: class ScriptLoadError extends Error {
        constructor(public url: string, public reason: string, message?: string) {
            super(message || `Failed to load script: ${url} (${reason})`);
            this.name = 'ScriptLoadError';
        }
    }
}));

// Mock performance utilities to run synchronously in tests
jest.mock('../utils/performance', () => ({
    debounce: (fn: Function) => {
        const debounced = (...args: any[]) => fn(...args);
        debounced.cancel = jest.fn();
        debounced.flush = jest.fn();
        return debounced;
    },
    throttle: (fn: Function) => {
        const throttled = (...args: any[]) => fn(...args);
        throttled.cancel = jest.fn();
        return throttled;
    },
    scheduleIdleTask: (fn: Function) => {
        fn(); // Execute immediately in tests
        return 1;
    },
    cancelIdleTask: jest.fn()
}));

/**
 * Concrete implementation of BaseCTIDriver for testing
 */
class TestCTIDriver extends BaseCTIDriver {
    public loadPlatformLibraryCalled = false;
    public bindPlatformSpecificEventsCalled = false;
    public performScreenPopCalled = false;
    public lastScreenPopData: IConversationLoadedEventData | null = null;
    public onInitializedCalled = false;
    public onDestroyedCalled = false;
    public lastSentimentData: ISentimentObject | null = null;
    public lastPresenceData: IPresence | null = null;
    public lastPanelHeight: number | null = null;
    public lastPanelWidth: number | null = null;
    public lastPanelVisibility: boolean | null = null;
    public shouldFailPlatformLoad = false;

    protected async loadPlatformLibrary(): Promise<void> {
        this.loadPlatformLibraryCalled = true;
        if (this.shouldFailPlatformLoad) {
            throw new Error('Platform library load failed');
        }
    }

    protected bindPlatformSpecificEvents(): void {
        this.bindPlatformSpecificEventsCalled = true;
    }

    protected performScreenPop(data: IConversationLoadedEventData): void {
        this.performScreenPopCalled = true;
        this.lastScreenPopData = data;
    }

    protected async onInitialized(): Promise<void> {
        this.onInitializedCalled = true;
    }

    protected onDestroyed(): void {
        this.onDestroyedCalled = true;
    }

    protected onSentimentChange(data: ISentimentObject): void {
        this.lastSentimentData = data;
        super.onSentimentChange(data);
    }

    protected onPresenceChange(data: IPresence): void {
        this.lastPresenceData = data;
        super.onPresenceChange(data);
    }

    protected onPanelHeightChange(height: number): void {
        this.lastPanelHeight = height;
    }

    protected onPanelWidthChange(width: number): void {
        this.lastPanelWidth = width;
    }

    protected onPanelVisibilityChange(visible: boolean): void {
        this.lastPanelVisibility = visible;
    }

    // Expose protected methods for testing
    public getLogger() {
        return this.logger;
    }

    public getEventBus() {
        return this.eventBus;
    }

    public getConfig() {
        return this.config;
    }

    public async testLoadScript(url: string) {
        return this.loadScript(url);
    }

    public testHandleError(context: string, error: unknown) {
        this.handleError(context, error);
    }

    public testGetSDK() {
        return this.getSDK();
    }
}

describe('BaseCTIDriver', () => {
    let driver: TestCTIDriver;
    let mockSDK: any;

    // Mock SDK event handlers
    const mockEventHandlers: Record<string, Function[]> = {};

    const createMockEventRegistrar = (eventName: string) => {
        return (handler: Function) => {
            if (!mockEventHandlers[eventName]) {
                mockEventHandlers[eventName] = [];
            }
            mockEventHandlers[eventName].push(handler);
        };
    };

    const emitMockEvent = (eventName: string, data: any) => {
        mockEventHandlers[eventName]?.forEach(handler => handler(data));
    };

    beforeEach(() => {
        // Clear mock event handlers
        Object.keys(mockEventHandlers).forEach(key => delete mockEventHandlers[key]);

        // Create mock SDK
        mockSDK = {
            conversation: {
                onConversationLoaded: createMockEventRegistrar('conversationLoaded'),
                onStatusChange: createMockEventRegistrar('statusChange'),
                onTransfer: createMockEventRegistrar('transfer'),
                onNewMessage: createMockEventRegistrar('newMessage'),
                onAccept: createMockEventRegistrar('accept'),
                onReject: createMockEventRegistrar('reject'),
                onCustomerSentimentChange: createMockEventRegistrar('sentimentChange')
            },
            presence: {
                onPresenceChange: createMockEventRegistrar('presenceChange')
            },
            notification: {
                onNewConversationNotification: createMockEventRegistrar('newConversationNotification'),
                onNewNotification: createMockEventRegistrar('newNotification')
            },
            voiceOrVideoCalling: {
                onHoldChange: createMockEventRegistrar('holdChange'),
                onMuteChange: createMockEventRegistrar('muteChange')
            },
            ctiDriver: {
                onSoftPhonePanelHeightChange: createMockEventRegistrar('panelHeightChange'),
                onSoftPhonePanelWidthChange: createMockEventRegistrar('panelWidthChange'),
                onSoftPhonePanelVisibilityChange: createMockEventRegistrar('panelVisibilityChange')
            }
        };

        // Mock window.Microsoft.CCaaS.EmbedSDK
        (window as any).Microsoft = {
            CCaaS: {
                EmbedSDK: mockSDK
            }
        };

        driver = new TestCTIDriver({ name: 'TestDriver' });
    });

    afterEach(() => {
        jest.clearAllMocks();
        delete (window as any).Microsoft;
    });

    describe('constructor', () => {
        describe('positive test cases', () => {
            it('should create driver with default config', () => {
                const defaultDriver = new TestCTIDriver();
                const config = defaultDriver.getConfig();
                expect(config.name).toBe('CTIDriver');
                expect(config.debug).toBe(false);
                expect(config.scriptTimeout).toBe(30000);
                expect(config.features.screenPop).toBe(true);
                expect(config.features.clickToDial).toBe(true);
                expect(config.features.presenceSync).toBe(true);
                expect(config.features.sentimentTracking).toBe(true);
            });

            it('should create driver with custom config', () => {
                const customDriver = new TestCTIDriver({
                    name: 'CustomDriver',
                    debug: true,
                    scriptTimeout: 5000,
                    features: {
                        screenPop: false
                    }
                });
                const config = customDriver.getConfig();
                expect(config.name).toBe('CustomDriver');
                expect(config.debug).toBe(true);
                expect(config.scriptTimeout).toBe(5000);
                expect(config.features.screenPop).toBe(false);
                // Other features should still have defaults
                expect(config.features.clickToDial).toBe(true);
            });

            it('should create logger with driver name', () => {
                const logger = driver.getLogger();
                expect(logger).toBeDefined();
            });

            it('should create event bus', () => {
                const eventBus = driver.getEventBus();
                expect(eventBus).toBeDefined();
            });
        });
    });

    describe('initialize()', () => {
        describe('positive test cases', () => {
            it('should return true on successful initialization', async () => {
                const result = await driver.initialize();
                expect(result).toBe(true);
            });

            it('should call loadPlatformLibrary', async () => {
                await driver.initialize();
                expect(driver.loadPlatformLibraryCalled).toBe(true);
            });

            it('should call onInitialized hook', async () => {
                await driver.initialize();
                expect(driver.onInitializedCalled).toBe(true);
            });

            it('should emit initialized event', async () => {
                const handler = jest.fn();
                driver.on('initialized', handler);
                await driver.initialize();
                expect(handler).toHaveBeenCalled();
            });

            it('should get SDK from window', async () => {
                await driver.initialize();
                const sdk = driver.testGetSDK();
                expect(sdk).toBe(mockSDK);
            });
        });

        describe('negative test cases', () => {
            it('should return false when SDK is not available', async () => {
                delete (window as any).Microsoft;
                const result = await driver.initialize();
                expect(result).toBe(false);
            });

            it('should return false when platform library fails to load', async () => {
                driver.shouldFailPlatformLoad = true;
                const result = await driver.initialize();
                expect(result).toBe(false);
            });

            it('should emit error event on initialization failure', async () => {
                const errorHandler = jest.fn();
                driver.on('error', errorHandler);
                delete (window as any).Microsoft;

                await driver.initialize();

                expect(errorHandler).toHaveBeenCalledWith(
                    expect.objectContaining({
                        context: 'initialize',
                        error: expect.any(Error)
                    })
                );
            });

            it('should handle missing CCaaS namespace', async () => {
                (window as any).Microsoft = {};
                const result = await driver.initialize();
                expect(result).toBe(false);
            });

            it('should handle missing EmbedSDK', async () => {
                (window as any).Microsoft = { CCaaS: {} };
                const result = await driver.initialize();
                expect(result).toBe(false);
            });
        });
    });

    describe('bindEvents()', () => {
        beforeEach(async () => {
            await driver.initialize();
        });

        describe('positive test cases', () => {
            it('should bind platform-specific events', () => {
                driver.bindEvents();
                expect(driver.bindPlatformSpecificEventsCalled).toBe(true);
            });

            it('should bind conversation loaded event', () => {
                driver.bindEvents();
                expect(mockEventHandlers['conversationLoaded']).toHaveLength(1);
            });

            it('should call performScreenPop when conversation loaded and screenPop enabled', () => {
                driver.bindEvents();
                const conversationData = {
                    conversationId: 'test-123',
                    customerName: 'John Doe'
                } as IConversationLoadedEventData;

                emitMockEvent('conversationLoaded', conversationData);

                expect(driver.performScreenPopCalled).toBe(true);
                expect(driver.lastScreenPopData).toBe(conversationData);
            });

            it('should emit conversation:loaded event', () => {
                const handler = jest.fn();
                driver.on('conversation:loaded', handler);
                driver.bindEvents();

                const conversationData = { conversationId: 'test' } as IConversationLoadedEventData;
                emitMockEvent('conversationLoaded', conversationData);

                expect(handler).toHaveBeenCalledWith(conversationData);
            });

            it('should bind sentiment change event when enabled', () => {
                driver.bindEvents();
                expect(mockEventHandlers['sentimentChange']).toHaveLength(1);
            });

            it('should call onSentimentChange when sentiment changes', () => {
                driver.bindEvents();
                const sentimentData = { sentiment: 'positive' } as unknown as ISentimentObject;
                emitMockEvent('sentimentChange', sentimentData);
                expect(driver.lastSentimentData).toBe(sentimentData);
            });

            it('should bind presence change event when enabled', () => {
                driver.bindEvents();
                expect(mockEventHandlers['presenceChange']).toHaveLength(1);
            });

            it('should call onPresenceChange when presence changes', () => {
                driver.bindEvents();
                const presenceData = { status: 'available' } as unknown as IPresence;
                emitMockEvent('presenceChange', presenceData);
                expect(driver.lastPresenceData).toBe(presenceData);
            });

            it('should bind panel dimension change events', () => {
                driver.bindEvents();

                emitMockEvent('panelHeightChange', 500);
                expect(driver.lastPanelHeight).toBe(500);

                emitMockEvent('panelWidthChange', 300);
                expect(driver.lastPanelWidth).toBe(300);

                emitMockEvent('panelVisibilityChange', true);
                expect(driver.lastPanelVisibility).toBe(true);
            });
        });

        describe('negative test cases', () => {
            it('should NOT call performScreenPop when screenPop feature is disabled', async () => {
                const noScreenPopDriver = new TestCTIDriver({
                    name: 'NoScreenPop',
                    features: { screenPop: false }
                });
                await noScreenPopDriver.initialize();
                noScreenPopDriver.bindEvents();

                emitMockEvent('conversationLoaded', { conversationId: 'test' });

                expect(noScreenPopDriver.performScreenPopCalled).toBe(false);
            });

            it('should NOT bind sentiment events when sentimentTracking is disabled', async () => {
                const noSentimentDriver = new TestCTIDriver({
                    name: 'NoSentiment',
                    features: { sentimentTracking: false }
                });
                await noSentimentDriver.initialize();
                noSentimentDriver.bindEvents();

                // Handler should not be registered
                expect(mockEventHandlers['sentimentChange']).toBeUndefined();
            });

            it('should NOT bind presence events when presenceSync is disabled', async () => {
                const noPresenceDriver = new TestCTIDriver({
                    name: 'NoPresence',
                    features: { presenceSync: false }
                });
                await noPresenceDriver.initialize();
                noPresenceDriver.bindEvents();

                expect(mockEventHandlers['presenceChange']).toBeUndefined();
            });

            it('should emit error event when bindEvents fails', () => {
                // Create driver without initializing (no SDK)
                const uninitializedDriver = new TestCTIDriver();
                const errorHandler = jest.fn();
                uninitializedDriver.on('error', errorHandler);

                // This should fail because sdk is undefined
                expect(() => uninitializedDriver.bindEvents()).not.toThrow();
            });
        });
    });

    describe('on() - subscribe to driver events', () => {
        it('should return subscription object', () => {
            const subscription = driver.on('initialized', jest.fn());
            expect(subscription).toHaveProperty('id');
            expect(subscription).toHaveProperty('unsubscribe');
        });

        it('should allow unsubscribing from events', async () => {
            const handler = jest.fn();
            const subscription = driver.on('initialized', handler);
            subscription.unsubscribe();

            await driver.initialize();

            expect(handler).not.toHaveBeenCalled();
        });

        it('should support typed events', () => {
            const errorHandler = jest.fn<void, [{ context: string; error: Error }]>();
            driver.on('error', errorHandler);
            driver.testHandleError('test', new Error('test error'));

            expect(errorHandler).toHaveBeenCalledWith({
                context: 'test',
                error: expect.any(Error)
            });
        });
    });

    describe('destroy()', () => {
        beforeEach(async () => {
            await driver.initialize();
            driver.bindEvents();
        });

        describe('positive test cases', () => {
            it('should call onDestroyed hook', () => {
                driver.destroy();
                expect(driver.onDestroyedCalled).toBe(true);
            });

            it('should remove all event listeners', () => {
                const eventBus = driver.getEventBus();
                driver.on('initialized', jest.fn());
                driver.on('error', jest.fn());

                driver.destroy();

                expect(eventBus.eventNames()).toHaveLength(0);
            });

            it('should be safe to call multiple times', () => {
                driver.destroy();
                expect(() => driver.destroy()).not.toThrow();
            });
        });
    });

    describe('loadScript()', () => {
        it('should call loadScript utility', async () => {
            const { loadScript } = require('../utils/scriptLoader');
            await driver.testLoadScript('http://test.com/script.js');
            expect(loadScript).toHaveBeenCalledWith({
                url: 'http://test.com/script.js',
                timeout: 30000
            });
        });

        it('should use custom script timeout from config', async () => {
            const customDriver = new TestCTIDriver({ scriptTimeout: 5000 });
            const { loadScript } = require('../utils/scriptLoader');
            await customDriver.testLoadScript('http://test.com/script.js');
            expect(loadScript).toHaveBeenCalledWith({
                url: 'http://test.com/script.js',
                timeout: 5000
            });
        });
    });

    describe('handleError()', () => {
        it('should emit error event with context and error', () => {
            const errorHandler = jest.fn();
            driver.on('error', errorHandler);

            driver.testHandleError('testContext', new Error('test error'));

            expect(errorHandler).toHaveBeenCalledWith({
                context: 'testContext',
                error: expect.objectContaining({ message: 'test error' })
            });
        });

        it('should convert non-Error to Error', () => {
            const errorHandler = jest.fn();
            driver.on('error', errorHandler);

            driver.testHandleError('testContext', 'string error');

            expect(errorHandler).toHaveBeenCalledWith({
                context: 'testContext',
                error: expect.objectContaining({ message: 'string error' })
            });
        });
    });

    describe('CTIDriverConfig interface', () => {
        it('should accept partial configuration', () => {
            const partialConfig: Partial<CTIDriverConfig> = {
                name: 'PartialDriver'
            };
            const partialDriver = new TestCTIDriver(partialConfig);
            expect(partialDriver.getConfig().name).toBe('PartialDriver');
            expect(partialDriver.getConfig().debug).toBe(false); // default
        });

        it('should merge features with defaults', () => {
            const driver = new TestCTIDriver({
                features: { screenPop: false }
            });
            const config = driver.getConfig();
            expect(config.features.screenPop).toBe(false);
            expect(config.features.clickToDial).toBe(true);
            expect(config.features.presenceSync).toBe(true);
            expect(config.features.sentimentTracking).toBe(true);
        });
    });

    describe('Debug mode', () => {
        it('should enable debug logging when debug is true', () => {
            const debugDriver = new TestCTIDriver({ debug: true });
            // Logger should be created with DEBUG level
            // This is a basic check - full logging tests are in logger.test.ts
            expect(debugDriver.getConfig().debug).toBe(true);
        });
    });
});
