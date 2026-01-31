// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import SFExampleCTIDriver from '../SFExampleCTIDriver';

// Mock the EmbedSDKSampleUsage module
jest.mock('../EmbedSDKSampleUsage', () => ({
    embedSDKSampleUsage: jest.fn()
}));

describe('SFExampleCTIDriver', () => {
    let driver: SFExampleCTIDriver;
    let mockScript: HTMLScriptElement;
    let appendChildSpy: jest.SpyInstance;
    let createElementSpy: jest.SpyInstance;
    let originalReferrer: PropertyDescriptor | undefined;

    beforeEach(() => {
        // Store original document.referrer
        originalReferrer = Object.getOwnPropertyDescriptor(document, 'referrer');

        // Mock document.referrer
        Object.defineProperty(document, 'referrer', {
            value: 'https://myorg.salesforce.com/some/page',
            configurable: true
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

        // Clear window.sforce
        delete (window as any).sforce;

        driver = new SFExampleCTIDriver();
    });

    afterEach(() => {
        jest.restoreAllMocks();

        // Restore document.referrer
        if (originalReferrer) {
            Object.defineProperty(document, 'referrer', originalReferrer);
        }

        // Clean up window globals
        delete (window as any).sforce;
        delete (window as any).CCaaS;
    });

    describe('constructor', () => {
        it('should create an instance of SFExampleCTIDriver', () => {
            expect(driver).toBeInstanceOf(SFExampleCTIDriver);
        });
    });

    describe('initialize()', () => {
        describe('positive test cases', () => {
            it('should return true immediately when sforce.opencti is already present', async () => {
                // Setup sforce as already loaded
                (window as any).sforce = {
                    opencti: {}
                };

                const result = await driver.initialize();

                expect(result).toBe(true);
                expect(createElementSpy).not.toHaveBeenCalled();
            });

            it('should load OpenCTI script when sforce is not present', async () => {
                const initPromise = driver.initialize();

                // Simulate script load
                mockScript.onload?.();

                const result = await initPromise;

                expect(result).toBe(true);
                expect(createElementSpy).toHaveBeenCalledWith('script');
            });

            it('should construct correct Salesforce OpenCTI URL', async () => {
                const initPromise = driver.initialize();
                mockScript.onload?.();
                await initPromise;

                expect(mockScript.src).toBe('https://myorg.salesforce.com/support/api/54.0/lightning/opencti.js');
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

            it('should handle different Salesforce domains', async () => {
                Object.defineProperty(document, 'referrer', {
                    value: 'https://customdomain.lightning.force.com/page',
                    configurable: true
                });

                driver = new SFExampleCTIDriver();
                const initPromise = driver.initialize();
                mockScript.onload?.();
                await initPromise;

                expect(mockScript.src).toBe('https://customdomain.lightning.force.com/support/api/54.0/lightning/opencti.js');
            });

            it('should use OpenCTI version 54.0', async () => {
                const initPromise = driver.initialize();
                mockScript.onload?.();
                await initPromise;

                expect(mockScript.src).toContain('/54.0/');
            });
        });

        describe('negative test cases', () => {
            it('should reject when script fails to load', async () => {
                const initPromise = driver.initialize();

                // Simulate script error
                mockScript.onerror?.();

                await expect(initPromise).rejects.toThrow('Error in loading');
            });

            it('should include script URL in error message when load fails', async () => {
                const initPromise = driver.initialize();
                mockScript.onerror?.();

                await expect(initPromise).rejects.toThrow(
                    'https://myorg.salesforce.com/support/api/54.0/lightning/opencti.js'
                );
            });

            it('should throw when document.referrer is empty', () => {
                Object.defineProperty(document, 'referrer', {
                    value: '',
                    configurable: true
                });

                driver = new SFExampleCTIDriver();

                // URL constructor throws on empty string synchronously
                expect(() => driver.initialize()).toThrow();
            });

            it('should throw synchronously when document.referrer is invalid URL', () => {
                Object.defineProperty(document, 'referrer', {
                    value: 'not-a-valid-url',
                    configurable: true
                });

                driver = new SFExampleCTIDriver();

                // URL constructor throws synchronously on invalid URL
                expect(() => driver.initialize()).toThrow();
            });

            it('should load script when sforce exists but opencti is undefined', async () => {
                (window as any).sforce = {};

                const initPromise = driver.initialize();
                mockScript.onload?.();
                await initPromise;

                expect(createElementSpy).toHaveBeenCalled();
            });

            it('should load script when window.sforce is undefined', async () => {
                delete (window as any).sforce;

                const initPromise = driver.initialize();
                mockScript.onload?.();
                await initPromise;

                expect(createElementSpy).toHaveBeenCalled();
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
                require('../SFExampleCTIDriver');
            });

            expect((window as any).CCaaS).toBeDefined();
        });

        it('should register CTIDriver on CCaaS namespace', () => {
            delete (window as any).CCaaS;

            jest.isolateModules(() => {
                require('../SFExampleCTIDriver');
            });

            expect((window as any).CCaaS.CTIDriver).toBeDefined();
        });

        it('should not overwrite existing CCaaS namespace', () => {
            const existingValue = { existingProp: 'value' };
            (window as any).CCaaS = existingValue;

            jest.isolateModules(() => {
                require('../SFExampleCTIDriver');
            });

            expect((window as any).CCaaS.existingProp).toBe('value');
        });

        it('should not overwrite existing CTIDriver', () => {
            const existingDriver = class ExistingDriver {};
            (window as any).CCaaS = { CTIDriver: existingDriver };

            jest.isolateModules(() => {
                require('../SFExampleCTIDriver');
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
            expect(mockScript.src).toMatch(/^https:\/\/.+\/support\/api\/\d+\.\d+\/lightning\/opencti\.js$/);
        });

        it('should handle concurrent initialization calls when sforce present', async () => {
            // Setup sforce as already loaded
            (window as any).sforce = { opencti: {} };

            // First call
            const promise1 = driver.initialize();

            // Second call
            const promise2 = driver.initialize();

            const [result1, result2] = await Promise.all([promise1, promise2]);

            // Both should resolve immediately since sforce is present
            expect(result1).toBe(true);
            expect(result2).toBe(true);
        });
    });

    describe('Edge cases', () => {
        it('should throw synchronously when sforce is null (accessing null.opencti)', () => {
            // This test documents current behavior - sforce being null causes a TypeError
            // Production code uses typeof checks but accessing .opencti on null throws
            (window as any).sforce = null;

            // Current code throws synchronously when trying to access null.opencti
            expect(() => driver.initialize()).toThrow(TypeError);
        });

        it('should return true when sforce.opencti is null (typeof null !== undefined)', async () => {
            // Setting sforce to an object with null opencti
            // typeof null === 'object', so typeof null !== 'undefined' is true
            // This means isSforcePresent = true and it returns Promise.resolve(true)
            (window as any).sforce = { opencti: null };

            const result = await driver.initialize();

            // Current behavior: null is considered "present" because typeof null !== 'undefined'
            expect(result).toBe(true);
            expect(createElementSpy).not.toHaveBeenCalled();
        });

        it('should handle document.getElementsByTagName returning empty collection', async () => {
            jest.spyOn(document, 'getElementsByTagName').mockReturnValue([] as unknown as HTMLCollectionOf<Element>);

            await expect(driver.initialize()).rejects.toThrow();
        });
    });
});
