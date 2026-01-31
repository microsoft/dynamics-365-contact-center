// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import ZendeskExampleCTIDriver from '../ZendeskExampleCTIDriver';

// Mock embedSDKSampleUsage
jest.mock('../EmbedSDKSampleUsage', () => ({
    embedSDKSampleUsage: jest.fn()
}));

import { embedSDKSampleUsage } from '../EmbedSDKSampleUsage';

describe('ZendeskExampleCTIDriver', () => {
    let mockZAFClient: any;
    let mockScript: HTMLScriptElement;
    let appendChildSpy: jest.SpyInstance;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Mock ZAF client
        mockZAFClient = {
            invoke: jest.fn().mockResolvedValue(undefined),
            on: jest.fn(),
            off: jest.fn(),
            get: jest.fn().mockResolvedValue({}),
            set: jest.fn().mockResolvedValue(undefined),
            request: jest.fn().mockResolvedValue({}),
            context: jest.fn().mockResolvedValue({ instanceGuid: 'test' }),
            metadata: jest.fn().mockResolvedValue({ appId: 1 })
        };

        // Mock script element
        mockScript = document.createElement('script');
        jest.spyOn(document, 'createElement').mockReturnValue(mockScript);

        // Mock appendChild
        appendChildSpy = jest.spyOn(document.head, 'appendChild').mockImplementation((script: Node) => {
            setTimeout(() => {
                (script as HTMLScriptElement).onload?.(new Event('load'));
            }, 0);
            return script;
        });

        // Clear window.ZAFClient
        delete (window as any).ZAFClient;
        delete (window as any).CCaaS;
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('constructor', () => {
        it('should create an instance of ZendeskExampleCTIDriver', () => {
            const driver = new ZendeskExampleCTIDriver();
            expect(driver).toBeInstanceOf(ZendeskExampleCTIDriver);
        });
    });

    describe('initialize()', () => {
        describe('positive test cases', () => {
            it('should return true when ZAFClient is already present', async () => {
                (window as any).ZAFClient = {
                    init: jest.fn().mockReturnValue(mockZAFClient)
                };

                const driver = new ZendeskExampleCTIDriver();
                const result = await driver.initialize();

                expect(result).toBe(true);
                expect((window as any).ZAFClient.init).toHaveBeenCalled();
            });

            it('should load ZAF SDK when not present', async () => {
                // Setup: ZAFClient not present initially, but available after script loads
                (window as any).ZAFClient = undefined;

                appendChildSpy.mockImplementation((script: Node) => {
                    setTimeout(() => {
                        (window as any).ZAFClient = {
                            init: jest.fn().mockReturnValue(mockZAFClient)
                        };
                        (script as HTMLScriptElement).onload?.(new Event('load'));
                    }, 0);
                    return script;
                });

                const driver = new ZendeskExampleCTIDriver();
                const result = await driver.initialize();

                expect(result).toBe(true);
                expect(appendChildSpy).toHaveBeenCalled();
            });

            it('should set script type to text/javascript', async () => {
                (window as any).ZAFClient = undefined;

                appendChildSpy.mockImplementation((script: Node) => {
                    setTimeout(() => {
                        (window as any).ZAFClient = {
                            init: jest.fn().mockReturnValue(mockZAFClient)
                        };
                        (script as HTMLScriptElement).onload?.(new Event('load'));
                    }, 0);
                    return script;
                });

                const driver = new ZendeskExampleCTIDriver();
                await driver.initialize();

                expect(mockScript.type).toBe('text/javascript');
            });

            it('should set script async to true', async () => {
                (window as any).ZAFClient = undefined;

                appendChildSpy.mockImplementation((script: Node) => {
                    setTimeout(() => {
                        (window as any).ZAFClient = {
                            init: jest.fn().mockReturnValue(mockZAFClient)
                        };
                        (script as HTMLScriptElement).onload?.(new Event('load'));
                    }, 0);
                    return script;
                });

                const driver = new ZendeskExampleCTIDriver();
                await driver.initialize();

                expect(mockScript.async).toBe(true);
            });

            it('should use correct ZAF SDK URL', async () => {
                (window as any).ZAFClient = undefined;

                appendChildSpy.mockImplementation((script: Node) => {
                    setTimeout(() => {
                        (window as any).ZAFClient = {
                            init: jest.fn().mockReturnValue(mockZAFClient)
                        };
                        (script as HTMLScriptElement).onload?.(new Event('load'));
                    }, 0);
                    return script;
                });

                const driver = new ZendeskExampleCTIDriver();
                await driver.initialize();

                expect(mockScript.src).toContain('zdassets.com');
                expect(mockScript.src).toContain('zaf_sdk');
            });
        });

        describe('negative test cases', () => {
            it('should reject when script fails to load', async () => {
                (window as any).ZAFClient = undefined;

                appendChildSpy.mockImplementation((script: Node) => {
                    setTimeout(() => {
                        (script as HTMLScriptElement).onerror?.(new Event('error'));
                    }, 0);
                    return script;
                });

                const driver = new ZendeskExampleCTIDriver();

                await expect(driver.initialize()).rejects.toThrow('Failed to load Zendesk SDK');
            });

            it('should reject when ZAFClient not available after script load', async () => {
                (window as any).ZAFClient = undefined;

                appendChildSpy.mockImplementation((script: Node) => {
                    setTimeout(() => {
                        // Don't set ZAFClient
                        (script as HTMLScriptElement).onload?.(new Event('load'));
                    }, 0);
                    return script;
                });

                const driver = new ZendeskExampleCTIDriver();

                await expect(driver.initialize()).rejects.toThrow('Failed to initialize Zendesk App Framework client');
            });
        });
    });

    describe('bindEvents()', () => {
        it('should call embedSDKSampleUsage with ZAF client', async () => {
            (window as any).ZAFClient = {
                init: jest.fn().mockReturnValue(mockZAFClient)
            };

            const driver = new ZendeskExampleCTIDriver();
            await driver.initialize();
            driver.bindEvents();

            expect(embedSDKSampleUsage).toHaveBeenCalledWith(mockZAFClient);
        });

        it('should call embedSDKSampleUsage with null if not initialized', () => {
            const driver = new ZendeskExampleCTIDriver();
            driver.bindEvents();

            expect(embedSDKSampleUsage).toHaveBeenCalledWith(null);
        });
    });

    describe('getZAFClient()', () => {
        it('should return null before initialization', () => {
            const driver = new ZendeskExampleCTIDriver();
            expect(driver.getZAFClient()).toBeNull();
        });

        it('should return ZAF client after initialization', async () => {
            (window as any).ZAFClient = {
                init: jest.fn().mockReturnValue(mockZAFClient)
            };

            const driver = new ZendeskExampleCTIDriver();
            await driver.initialize();

            expect(driver.getZAFClient()).toBe(mockZAFClient);
        });
    });

    describe('ICTIInterface implementation', () => {
        it('should have initialize method', () => {
            const driver = new ZendeskExampleCTIDriver();
            expect(typeof driver.initialize).toBe('function');
        });

        it('should have bindEvents method', () => {
            const driver = new ZendeskExampleCTIDriver();
            expect(typeof driver.bindEvents).toBe('function');
        });

        it('initialize should return a Promise', () => {
            (window as any).ZAFClient = {
                init: jest.fn().mockReturnValue(mockZAFClient)
            };

            const driver = new ZendeskExampleCTIDriver();
            const result = driver.initialize();
            expect(result).toBeInstanceOf(Promise);
        });
    });

    describe('window.CCaaS namespace registration', () => {
        beforeEach(() => {
            // Re-import the module to trigger registration
            jest.resetModules();
            delete (window as any).CCaaS;
        });

        it('should create CCaaS namespace if not exists', async () => {
            delete (window as any).CCaaS;

            // Dynamic import to trigger module execution
            await import('../ZendeskExampleCTIDriver');

            expect((window as any).CCaaS).toBeDefined();
        });

        it('should register CTIDriver on CCaaS namespace', async () => {
            delete (window as any).CCaaS;

            const module = await import('../ZendeskExampleCTIDriver');

            expect((window as any).CCaaS.CTIDriver).toBe(module.default);
        });
    });
});
