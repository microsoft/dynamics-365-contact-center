// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * Options for loading external scripts
 */
export interface ScriptLoadOptions {
    /** Script URL to load */
    url: string;
    /** Optional timeout in milliseconds (default: 30000) */
    timeout?: number;
    /** Whether to load asynchronously (default: true) */
    async?: boolean;
    /** Whether to defer loading (default: false) */
    defer?: boolean;
    /** Optional attributes to set on the script element */
    attributes?: Record<string, string>;
}

/**
 * Error thrown when script loading fails
 */
export class ScriptLoadError extends Error {
    constructor(
        public readonly url: string,
        public readonly reason: 'timeout' | 'error' | 'aborted',
        message?: string
    ) {
        super(message || `Failed to load script: ${url} (${reason})`);
        this.name = 'ScriptLoadError';
    }
}

/**
 * Loads an external script dynamically
 * @param options - Script load options
 * @returns Promise that resolves when script is loaded
 * @throws ScriptLoadError if loading fails
 */
export async function loadScript(options: ScriptLoadOptions): Promise<void> {
    const {
        url,
        timeout = 30000,
        async = true,
        defer = false,
        attributes = {}
    } = options;

    return new Promise((resolve, reject) => {
        // Check if script is already loaded
        const existingScript = document.querySelector(`script[src="${url}"]`);
        if (existingScript) {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = url;
        script.async = async;
        script.defer = defer;

        // Set custom attributes
        Object.entries(attributes).forEach(([key, value]) => {
            script.setAttribute(key, value);
        });

        // Timeout handling
        const timeoutId = setTimeout(() => {
            script.remove();
            reject(new ScriptLoadError(url, 'timeout', `Script load timed out after ${timeout}ms`));
        }, timeout);

        script.onload = () => {
            clearTimeout(timeoutId);
            resolve();
        };

        script.onerror = () => {
            clearTimeout(timeoutId);
            script.remove();
            reject(new ScriptLoadError(url, 'error'));
        };

        document.head.appendChild(script);
    });
}

/**
 * Loads multiple scripts in sequence
 * @param urls - Array of script URLs to load
 * @returns Promise that resolves when all scripts are loaded
 */
export async function loadScriptsSequential(urls: string[]): Promise<void> {
    for (const url of urls) {
        await loadScript({ url });
    }
}

/**
 * Loads multiple scripts in parallel
 * @param urls - Array of script URLs to load
 * @returns Promise that resolves when all scripts are loaded
 */
export async function loadScriptsParallel(urls: string[]): Promise<void> {
    await Promise.all(urls.map(url => loadScript({ url })));
}
