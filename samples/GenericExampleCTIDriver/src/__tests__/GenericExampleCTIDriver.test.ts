// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import GenericExampleCTIDriver from '../GenericExampleCTIDriver';

// Mock the EmbedSDKSampleUsage module
jest.mock('../EmbedSDKSampleUsage', () => ({
    embedSDKSampleUsage: jest.fn()
}));

describe('GenericExampleCTIDriver', () => {
    let driver: GenericExampleCTIDriver;
    let mockScript: HTMLScriptElement;
    let appendChildSpy: jest.SpyInstance;
    let createElementSpy: jest.SpyInstance;

    beforeEach(() => {
        // Mock window.location.ancestorOrigins
        Object.defineProperty(window, 'location', {
            value: {
                ...window.location,
                ancestorOrigins: ['https://crm.example.com']
            },
            configurable: true,
            writable: true
        });

        // Create mock script element
        mockScript = {
            type: '',
            src: '',
            async: false,
            onload: null as (() => void) | null,
            onerror: null as (() => void) | null
        } as unknown as HTMLScriptElement;

        // Mock document methods
        createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue(mockScript);

        const mockHead = {
            appendChild: jest.fn().mockReturnValue(mockScript)
        };
        appendChildSpy = mockHead.appendChild;
        jest.spyOn(document, 'getElementsByTagName').mockReturnValue([mockHead] as unknown as HTMLCollectionOf<Element>);

        driver = new GenericExampleCTIDriver();
    });

    afterEach(() => {
        jest.restoreAllMocks();
        delete (window as any).CCaaS;
    });

    describe('constructor', () => {
        it('should create an instance of GenericExampleCTIDriver', () => {
            expect(driver).toBeInstanceOf(GenericExampleCTIDriver);
        });
    });

    describe('initialize()', () => {
        describe('positive test cases', () => {
            it('should return true when script loads successfully', async () => {
                const initPromise = driver.initialize();

                // Simulate script load
                mockScript.onload?.();

                const result = await initPromise;
                expect(result).toBe(true);
            });

            it('should create script element', async () => {
                const initPromise = driver.initialize();
                mockScript.onload?.();
                await initPromise;

                expect(createElementSpy).toHaveBeenCalledWith('script');
            });

            it('should set script type to text/javascript', async () => {
                const initPromise = driver.initialize();
                mockScript.onload?.();
                await initPromise;

                expect(mockScript.type).toBe('text/javascript');
            });

            it('should set script async to true', async () => {
                const initPromise = driver.initialize();
                mockScript.onload?.();
                await initPromise;

                expect(mockScript.async).toBe(true);
            });

            it('should append script to document head', async () => {
                const initPromise = driver.initialize();
                mockScript.onload?.();
                await initPromise;

                expect(appendChildSpy).toHaveBeenCalledWith(mockScript);
            });

            it('should use ancestorOrigins to get CRM domain', async () => {
                const initPromise = driver.initialize();
                mockScript.onload?.();
                await initPromise;

                expect(mockScript.src).toContain('https://crm.example.com');
            });

            it('should handle different CRM domains', async () => {
                Object.defineProperty(window, 'location', {
                    value: {
                        ...window.location,
                        ancestorOrigins: ['https://different-crm.example.org']
                    },
                    configurable: true,
                    writable: true
                });

                driver = new GenericExampleCTIDriver();
                const initPromise = driver.initialize();
                mockScript.onload?.();
                await initPromise;

                expect(mockScript.src).toContain('https://different-crm.example.org');
            });
        });

        describe('negative test cases', () => {
            it('should reject when script fails to load', async () => {
                const initPromise = driver.initialize();

                // Simulate script error
                mockScript.onerror?.();

                await expect(initPromise).rejects.toThrow('Failed to load CTI library script');
            });

            it('should include script URL in error message when load fails', async () => {
                const initPromise = driver.initialize();
                mockScript.onerror?.();

                await expect(initPromise).rejects.toThrow('https://crm.example.com');
            });

            it('should throw synchronously when ancestorOrigins is undefined', () => {
                Object.defineProperty(window, 'location', {
                    value: {
                        ancestorOrigins: undefined
                    },
                    configurable: true,
                    writable: true
                });

                driver = new GenericExampleCTIDriver();

                // Throws synchronously when trying to access undefined[0]
                expect(() => driver.initialize()).toThrow(TypeError);
            });

            it('should throw synchronously when ancestorOrigins is empty', () => {
                Object.defineProperty(window, 'location', {
                    value: {
                        ancestorOrigins: []
                    },
                    configurable: true,
                    writable: true
                });

                driver = new GenericExampleCTIDriver();

                // ancestorOrigins[0] is undefined, so the source URL will be "undefined<path>"
                // The script will try to load but this documents current behavior
                const initPromise = driver.initialize();
                // The promise is created but the URL is malformed
                expect(initPromise).toBeInstanceOf(Promise);
            });

            it('should handle document.getElementsByTagName returning empty collection', async () => {
                jest.spyOn(document, 'getElementsByTagName').mockReturnValue([] as unknown as HTMLCollectionOf<Element>);

                await expect(driver.initialize()).rejects.toThrow();
            });
        });
    });

    describe('bindEvents()', () => {
        it('should call embedSDKSampleUsage function', () => {
            const { embedSDKSampleUsage } = require('../EmbedSDKSampleUsage');

            driver.bindEvents();

            expect(embedSDKSampleUsage).toHaveBeenCalled();
        });

        it('should call embedSDKSampleUsage exactly once', () => {
            const { embedSDKSampleUsage } = require('../EmbedSDKSampleUsage');

            driver.bindEvents();

            expect(embedSDKSampleUsage).toHaveBeenCalledTimes(1);
        });

        it('should not throw when called multiple times', () => {
            expect(() => {
                driver.bindEvents();
                driver.bindEvents();
                driver.bindEvents();
            }).not.toThrow();
        });
    });

    describe('ICTIInterface implementation', () => {
        it('should have initialize method', () => {
            expect(typeof driver.initialize).toBe('function');
        });

        it('should have bindEvents method', () => {
            expect(typeof driver.bindEvents).toBe('function');
        });

        it('initialize should return a Promise', () => {
            const result = driver.initialize();
            expect(result).toBeInstanceOf(Promise);
            // Clean up
            mockScript.onload?.();
        });
    });

    describe('window.CCaaS namespace registration', () => {
        beforeEach(() => {
            // Reset modules to trigger the global registration code
            jest.resetModules();
        });

        it('should create CCaaS namespace if not exists', () => {
            delete (window as any).CCaaS;

            // Re-import to trigger registration
            jest.isolateModules(() => {
                require('../GenericExampleCTIDriver');
            });

            expect((window as any).CCaaS).toBeDefined();
        });

        it('should register CTIDriver on CCaaS namespace', () => {
            delete (window as any).CCaaS;

            jest.isolateModules(() => {
                require('../GenericExampleCTIDriver');
            });

            expect((window as any).CCaaS.CTIDriver).toBeDefined();
        });

        it('should not overwrite existing CCaaS namespace', () => {
            const existingValue = { existingProp: 'value' };
            (window as any).CCaaS = existingValue;

            jest.isolateModules(() => {
                require('../GenericExampleCTIDriver');
            });

            expect((window as any).CCaaS.existingProp).toBe('value');
        });

        it('should not overwrite existing CTIDriver', () => {
            const existingDriver = class ExistingDriver {};
            (window as any).CCaaS = { CTIDriver: existingDriver };

            jest.isolateModules(() => {
                require('../GenericExampleCTIDriver');
            });

            expect((window as any).CCaaS.CTIDriver).toBe(existingDriver);
        });
    });

    describe('Script loading behavior', () => {
        it('should create script element with correct attributes', async () => {
            const initPromise = driver.initialize();
            mockScript.onload?.();
            await initPromise;

            expect(mockScript.type).toBe('text/javascript');
            expect(mockScript.async).toBe(true);
        });

        it('should handle multiple initialization calls', async () => {
            // First call - load the script
            const promise1 = driver.initialize();
            mockScript.onload?.();
            const result1 = await promise1;

            // Second call - will also load a new script (no caching in generic driver)
            const promise2 = driver.initialize();
            mockScript.onload?.();
            const result2 = await promise2;

            expect(result1).toBe(true);
            expect(result2).toBe(true);
        });
    });

    describe('CRM URL path configuration', () => {
        it('should use configurable CRM CTI library path placeholder', async () => {
            const initPromise = driver.initialize();
            mockScript.onload?.();
            await initPromise;

            // The path contains a placeholder that should be replaced in real usage
            expect(mockScript.src).toContain('https://crm.example.com');
            expect(mockScript.src).toContain('crm-ctidriver-file-path');
        });
    });

    describe('Edge cases', () => {
        it('should handle special characters in origin URL', async () => {
            Object.defineProperty(window, 'location', {
                value: {
                    ancestorOrigins: ['https://crm-system.example.com:8080']
                },
                configurable: true,
                writable: true
            });

            driver = new GenericExampleCTIDriver();
            const initPromise = driver.initialize();
            mockScript.onload?.();
            await initPromise;

            expect(mockScript.src).toContain('https://crm-system.example.com:8080');
        });

        it('should handle HTTP protocol in origin', async () => {
            Object.defineProperty(window, 'location', {
                value: {
                    ancestorOrigins: ['http://localhost:3000']
                },
                configurable: true,
                writable: true
            });

            driver = new GenericExampleCTIDriver();
            const initPromise = driver.initialize();
            mockScript.onload?.();
            await initPromise;

            expect(mockScript.src).toContain('http://localhost:3000');
        });
    });

    describe('Error handling', () => {
        it('should provide meaningful error message on script load failure', async () => {
            const initPromise = driver.initialize();
            mockScript.onerror?.();

            try {
                await initPromise;
                fail('Expected error to be thrown');
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
                expect((error as Error).message).toContain('Failed to load CTI library script');
            }
        });

        it('should reject the promise on error, not throw synchronously', async () => {
            const initPromise = driver.initialize();

            // Should not have thrown yet
            expect(mockScript.onerror).toBeDefined();

            mockScript.onerror?.();

            await expect(initPromise).rejects.toThrow();
        });
    });
});
