// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import {
    loadScript,
    loadScriptsSequential,
    loadScriptsParallel,
    ScriptLoadError,
    ScriptLoadOptions,
    preloadResource,
    preloadScript,
    prefetchResource,
    preconnect,
    dnsPrefetch,
    removeResourceHint
} from '../scriptLoader';

describe('ScriptLoader', () => {
    let mockScript: HTMLScriptElement;
    let appendChildSpy: jest.SpyInstance;
    let querySelectorSpy: jest.SpyInstance;
    let createElementSpy: jest.SpyInstance;

    beforeEach(() => {
        // Create mock script element
        mockScript = {
            type: '',
            src: '',
            async: false,
            defer: false,
            onload: null as (() => void) | null,
            onerror: null as (() => void) | null,
            remove: jest.fn(),
            setAttribute: jest.fn()
        } as unknown as HTMLScriptElement;

        // Mock document methods
        createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue(mockScript);
        appendChildSpy = jest.spyOn(document.head, 'appendChild').mockReturnValue(mockScript);
        querySelectorSpy = jest.spyOn(document, 'querySelector').mockReturnValue(null);

        // Mock timers
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.useRealTimers();
    });

    describe('ScriptLoadError', () => {
        describe('positive test cases', () => {
            it('should create error with url and reason', () => {
                const error = new ScriptLoadError('http://test.com/script.js', 'error');
                expect(error).toBeInstanceOf(Error);
                expect(error).toBeInstanceOf(ScriptLoadError);
                expect(error.url).toBe('http://test.com/script.js');
                expect(error.reason).toBe('error');
                expect(error.name).toBe('ScriptLoadError');
            });

            it('should create error with custom message', () => {
                const error = new ScriptLoadError('http://test.com/script.js', 'timeout', 'Custom message');
                expect(error.message).toBe('Custom message');
            });

            it('should create default message when not provided', () => {
                const error = new ScriptLoadError('http://test.com/script.js', 'error');
                expect(error.message).toContain('http://test.com/script.js');
                expect(error.message).toContain('error');
            });

            it('should support all reason types', () => {
                const timeoutError = new ScriptLoadError('url', 'timeout');
                const loadError = new ScriptLoadError('url', 'error');
                const abortedError = new ScriptLoadError('url', 'aborted');

                expect(timeoutError.reason).toBe('timeout');
                expect(loadError.reason).toBe('error');
                expect(abortedError.reason).toBe('aborted');
            });
        });
    });

    describe('loadScript', () => {
        describe('positive test cases', () => {
            it('should load a script successfully', async () => {
                const loadPromise = loadScript({ url: 'http://test.com/script.js' });

                // Simulate script load
                mockScript.onload?.();

                await expect(loadPromise).resolves.toBeUndefined();
            });

            it('should create script element with correct properties', async () => {
                const loadPromise = loadScript({ url: 'http://test.com/script.js' });
                mockScript.onload?.();
                await loadPromise;

                expect(createElementSpy).toHaveBeenCalledWith('script');
                expect(mockScript.type).toBe('text/javascript');
                expect(mockScript.src).toBe('http://test.com/script.js');
            });

            it('should set async to true by default', async () => {
                const loadPromise = loadScript({ url: 'http://test.com/script.js' });
                mockScript.onload?.();
                await loadPromise;

                expect(mockScript.async).toBe(true);
            });

            it('should set defer to false by default', async () => {
                const loadPromise = loadScript({ url: 'http://test.com/script.js' });
                mockScript.onload?.();
                await loadPromise;

                expect(mockScript.defer).toBe(false);
            });

            it('should respect async option', async () => {
                const loadPromise = loadScript({ url: 'http://test.com/script.js', async: false });
                mockScript.onload?.();
                await loadPromise;

                expect(mockScript.async).toBe(false);
            });

            it('should respect defer option', async () => {
                const loadPromise = loadScript({ url: 'http://test.com/script.js', defer: true });
                mockScript.onload?.();
                await loadPromise;

                expect(mockScript.defer).toBe(true);
            });

            it('should set custom attributes', async () => {
                const loadPromise = loadScript({
                    url: 'http://test.com/script.js',
                    attributes: {
                        'data-custom': 'value',
                        'crossorigin': 'anonymous'
                    }
                });
                mockScript.onload?.();
                await loadPromise;

                expect(mockScript.setAttribute).toHaveBeenCalledWith('data-custom', 'value');
                expect(mockScript.setAttribute).toHaveBeenCalledWith('crossorigin', 'anonymous');
            });

            it('should append script to document head', async () => {
                const loadPromise = loadScript({ url: 'http://test.com/script.js' });
                mockScript.onload?.();
                await loadPromise;

                expect(appendChildSpy).toHaveBeenCalledWith(mockScript);
            });

            it('should resolve immediately if script already exists', async () => {
                // Setup fresh mocks for this specific test
                jest.restoreAllMocks();

                const existingScript = document.createElement('script');
                jest.spyOn(document, 'querySelector').mockReturnValue(existingScript);
                const createSpy = jest.spyOn(document, 'createElement');

                const loadPromise = loadScript({ url: 'http://test.com/already-loaded.js' });
                await expect(loadPromise).resolves.toBeUndefined();

                // createElement should not be called for already existing script
                expect(createSpy).not.toHaveBeenCalled();
            });
        });

        describe('negative test cases', () => {
            it('should reject with ScriptLoadError on load error', async () => {
                const loadPromise = loadScript({ url: 'http://test.com/script.js' });

                // Simulate script error
                mockScript.onerror?.();

                await expect(loadPromise).rejects.toBeInstanceOf(ScriptLoadError);
                await expect(loadPromise).rejects.toMatchObject({
                    url: 'http://test.com/script.js',
                    reason: 'error'
                });
            });

            it('should remove script element on error', async () => {
                const loadPromise = loadScript({ url: 'http://test.com/script.js' });
                mockScript.onerror?.();

                try { await loadPromise; } catch { /* expected */ }

                expect(mockScript.remove).toHaveBeenCalled();
            });

            it('should reject with timeout error after timeout period', async () => {
                const loadPromise = loadScript({ url: 'http://test.com/script.js', timeout: 1000 });

                // Advance timers past timeout
                jest.advanceTimersByTime(1001);

                await expect(loadPromise).rejects.toBeInstanceOf(ScriptLoadError);
                await expect(loadPromise).rejects.toMatchObject({
                    url: 'http://test.com/script.js',
                    reason: 'timeout'
                });
            });

            it('should use default timeout of 30000ms', async () => {
                const loadPromise = loadScript({ url: 'http://test.com/script.js' });

                // Advance timers to just before default timeout
                jest.advanceTimersByTime(29999);
                // Should not have rejected yet

                // Advance past timeout
                jest.advanceTimersByTime(2);

                await expect(loadPromise).rejects.toMatchObject({ reason: 'timeout' });
            });

            it('should remove script element on timeout', async () => {
                const loadPromise = loadScript({ url: 'http://test.com/script.js', timeout: 100 });
                jest.advanceTimersByTime(101);

                try { await loadPromise; } catch { /* expected */ }

                expect(mockScript.remove).toHaveBeenCalled();
            });

            it('should clear timeout on successful load', async () => {
                const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
                const loadPromise = loadScript({ url: 'http://test.com/script.js' });

                mockScript.onload?.();
                await loadPromise;

                expect(clearTimeoutSpy).toHaveBeenCalled();
            });

            it('should clear timeout on error', async () => {
                const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
                const loadPromise = loadScript({ url: 'http://test.com/script.js' });

                mockScript.onerror?.();

                try { await loadPromise; } catch { /* expected */ }

                expect(clearTimeoutSpy).toHaveBeenCalled();
            });
        });
    });

    describe('loadScriptsSequential', () => {
        describe('positive test cases', () => {
            it('should load multiple scripts in sequence', async () => {
                const urls = [
                    'http://test.com/script1.js',
                    'http://test.com/script2.js'
                ];

                // All scripts already exist, so they resolve immediately
                querySelectorSpy.mockReturnValue(document.createElement('script'));

                await expect(loadScriptsSequential(urls)).resolves.toBeUndefined();
            });

            it('should resolve with empty array', async () => {
                await expect(loadScriptsSequential([])).resolves.toBeUndefined();
            });

            it('should call loadScript for each URL in sequence', async () => {
                // Mock all scripts as already loaded for simplicity
                querySelectorSpy.mockReturnValue(document.createElement('script'));

                const urls = ['http://test.com/a.js', 'http://test.com/b.js', 'http://test.com/c.js'];
                await loadScriptsSequential(urls);

                // Should have checked for each script
                expect(querySelectorSpy).toHaveBeenCalledTimes(3);
            });
        });

        describe('negative test cases', () => {
            it('should stop loading on first error', async () => {
                querySelectorSpy.mockReturnValue(null);

                appendChildSpy.mockImplementation(() => {
                    // Trigger error immediately after append
                    Promise.resolve().then(() => mockScript.onerror?.());
                    return mockScript;
                });

                const loadPromise = loadScriptsSequential([
                    'http://test.com/script1.js',
                    'http://test.com/script2.js'
                ]);

                await expect(loadPromise).rejects.toBeInstanceOf(ScriptLoadError);
            });
        });
    });

    describe('loadScriptsParallel', () => {
        describe('positive test cases', () => {
            it('should load multiple scripts in parallel', async () => {
                const urls = [
                    'http://test.com/script1.js',
                    'http://test.com/script2.js'
                ];

                // All scripts already exist
                querySelectorSpy.mockReturnValue(document.createElement('script'));

                await expect(loadScriptsParallel(urls)).resolves.toBeUndefined();
            });

            it('should resolve with empty array', async () => {
                await expect(loadScriptsParallel([])).resolves.toBeUndefined();
            });

            it('should call loadScript for all URLs simultaneously', async () => {
                // Mock all scripts as already loaded for simplicity
                querySelectorSpy.mockReturnValue(document.createElement('script'));

                const urls = ['http://test.com/a.js', 'http://test.com/b.js', 'http://test.com/c.js'];
                await loadScriptsParallel(urls);

                // Should have checked for each script
                expect(querySelectorSpy).toHaveBeenCalledTimes(3);
            });
        });

        describe('negative test cases', () => {
            it('should reject if any script fails to load', async () => {
                querySelectorSpy.mockReturnValue(null);

                appendChildSpy.mockImplementation(() => {
                    // Trigger error
                    Promise.resolve().then(() => mockScript.onerror?.());
                    return mockScript;
                });

                const loadPromise = loadScriptsParallel([
                    'http://test.com/script1.js',
                    'http://test.com/script2.js'
                ]);

                await expect(loadPromise).rejects.toBeInstanceOf(ScriptLoadError);
            });
        });
    });

    describe('ScriptLoadOptions interface', () => {
        it('should accept minimal options', async () => {
            const options: ScriptLoadOptions = { url: 'http://test.com/script.js' };
            const loadPromise = loadScript(options);
            mockScript.onload?.();
            await expect(loadPromise).resolves.toBeUndefined();
        });

        it('should accept all options', async () => {
            const options: ScriptLoadOptions = {
                url: 'http://test.com/script.js',
                timeout: 5000,
                async: false,
                defer: true,
                attributes: { 'data-test': 'value' }
            };
            const loadPromise = loadScript(options);
            mockScript.onload?.();
            await expect(loadPromise).resolves.toBeUndefined();
        });
    });

    describe('preloadResource', () => {
        let mockLink: HTMLLinkElement;

        beforeEach(() => {
            mockLink = {
                rel: '',
                href: '',
                as: '',
                crossOrigin: '',
                integrity: ''
            } as unknown as HTMLLinkElement;

            jest.spyOn(document, 'createElement').mockReturnValue(mockLink);
            jest.spyOn(document, 'querySelector').mockReturnValue(null);
            jest.spyOn(document.head, 'appendChild').mockReturnValue(mockLink);
        });

        it('should create preload link element', () => {
            const link = preloadResource({ url: 'http://test.com/script.js', as: 'script' });

            expect(mockLink.rel).toBe('preload');
            expect(mockLink.href).toBe('http://test.com/script.js');
            expect(mockLink.as).toBe('script');
            expect(link).toBe(mockLink);
        });

        it('should set crossOrigin when provided', () => {
            preloadResource({ url: 'http://test.com/script.js', as: 'script', crossOrigin: 'anonymous' });
            expect(mockLink.crossOrigin).toBe('anonymous');
        });

        it('should set integrity when provided', () => {
            preloadResource({ url: 'http://test.com/script.js', as: 'script', integrity: 'sha384-abc' });
            expect(mockLink.integrity).toBe('sha384-abc');
        });

        it('should return existing link if already preloaded', () => {
            const existingLink = document.createElement('link');
            jest.spyOn(document, 'querySelector').mockReturnValue(existingLink);

            const result = preloadResource({ url: 'http://test.com/script.js', as: 'script' });
            expect(result).toBe(existingLink);
        });
    });

    describe('preloadScript', () => {
        beforeEach(() => {
            const mockLink = { rel: '', href: '', as: '', crossOrigin: '', integrity: '' } as unknown as HTMLLinkElement;
            jest.spyOn(document, 'createElement').mockReturnValue(mockLink);
            jest.spyOn(document, 'querySelector').mockReturnValue(null);
            jest.spyOn(document.head, 'appendChild').mockReturnValue(mockLink);
        });

        it('should preload script with as="script"', () => {
            const link = preloadScript('http://test.com/script.js');
            expect(link.as).toBe('script');
        });
    });

    describe('prefetchResource', () => {
        let mockLink: HTMLLinkElement;

        beforeEach(() => {
            mockLink = { rel: '', href: '' } as unknown as HTMLLinkElement;
            jest.spyOn(document, 'createElement').mockReturnValue(mockLink);
            jest.spyOn(document, 'querySelector').mockReturnValue(null);
            jest.spyOn(document.head, 'appendChild').mockReturnValue(mockLink);
        });

        it('should create prefetch link element', () => {
            prefetchResource('http://test.com/next-page.js');

            expect(mockLink.rel).toBe('prefetch');
            expect(mockLink.href).toBe('http://test.com/next-page.js');
        });

        it('should return existing link if already prefetched', () => {
            const existingLink = document.createElement('link');
            jest.spyOn(document, 'querySelector').mockReturnValue(existingLink);

            const result = prefetchResource('http://test.com/script.js');
            expect(result).toBe(existingLink);
        });
    });

    describe('preconnect', () => {
        let mockLink: HTMLLinkElement;

        beforeEach(() => {
            mockLink = { rel: '', href: '', crossOrigin: '' } as unknown as HTMLLinkElement;
            jest.spyOn(document, 'createElement').mockReturnValue(mockLink);
            jest.spyOn(document, 'querySelector').mockReturnValue(null);
            jest.spyOn(document.head, 'appendChild').mockReturnValue(mockLink);
        });

        it('should create preconnect link element', () => {
            preconnect('https://api.example.com');

            expect(mockLink.rel).toBe('preconnect');
            expect(mockLink.href).toBe('https://api.example.com');
        });

        it('should set crossOrigin when provided', () => {
            preconnect('https://api.example.com', { crossOrigin: 'anonymous' });
            expect(mockLink.crossOrigin).toBe('anonymous');
        });

        it('should return existing link if already preconnected', () => {
            const existingLink = document.createElement('link');
            jest.spyOn(document, 'querySelector').mockReturnValue(existingLink);

            const result = preconnect('https://api.example.com');
            expect(result).toBe(existingLink);
        });
    });

    describe('dnsPrefetch', () => {
        let mockLink: HTMLLinkElement;

        beforeEach(() => {
            mockLink = { rel: '', href: '' } as unknown as HTMLLinkElement;
            jest.spyOn(document, 'createElement').mockReturnValue(mockLink);
            jest.spyOn(document, 'querySelector').mockReturnValue(null);
            jest.spyOn(document.head, 'appendChild').mockReturnValue(mockLink);
        });

        it('should create dns-prefetch link element', () => {
            dnsPrefetch('https://api.example.com');

            expect(mockLink.rel).toBe('dns-prefetch');
            expect(mockLink.href).toBe('https://api.example.com');
        });

        it('should return existing link if already prefetched', () => {
            const existingLink = document.createElement('link');
            jest.spyOn(document, 'querySelector').mockReturnValue(existingLink);

            const result = dnsPrefetch('https://api.example.com');
            expect(result).toBe(existingLink);
        });
    });

    describe('removeResourceHint', () => {
        it('should remove all resource hints for URL', () => {
            const mockElement = { remove: jest.fn() };
            jest.spyOn(document, 'querySelector').mockReturnValue(mockElement as unknown as Element);

            removeResourceHint('http://test.com/script.js');

            // Should be called for each hint type
            expect(document.querySelector).toHaveBeenCalledWith(expect.stringContaining('preload'));
            expect(mockElement.remove).toHaveBeenCalled();
        });

        it('should handle non-existent hints gracefully', () => {
            jest.spyOn(document, 'querySelector').mockReturnValue(null);

            expect(() => removeResourceHint('http://test.com/script.js')).not.toThrow();
        });
    });
});
