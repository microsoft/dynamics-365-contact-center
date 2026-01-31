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

/**
 * Preload hint types for resource loading
 */
export type PreloadAs = 'script' | 'style' | 'font' | 'image' | 'fetch';

/**
 * Options for preloading resources
 */
export interface PreloadOptions {
    /** Resource URL to preload */
    url: string;
    /** Resource type */
    as: PreloadAs;
    /** CORS setting */
    crossOrigin?: 'anonymous' | 'use-credentials';
    /** Resource integrity hash */
    integrity?: string;
}

/**
 * Preloads a resource using link rel="preload".
 * This hints to the browser to fetch the resource early.
 *
 * @param options - Preload options
 * @returns The created link element
 *
 * @example
 * ```typescript
 * // Preload a script early in page load
 * preloadResource({ url: 'https://example.com/script.js', as: 'script' });
 *
 * // Later, when needed, load it
 * await loadScript({ url: 'https://example.com/script.js' });
 * ```
 */
export function preloadResource(options: PreloadOptions): HTMLLinkElement {
    const { url, as, crossOrigin, integrity } = options;

    // Check if already preloaded
    const existing = document.querySelector(`link[rel="preload"][href="${url}"]`);
    if (existing) {
        return existing as HTMLLinkElement;
    }

    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    link.as = as;

    if (crossOrigin) {
        link.crossOrigin = crossOrigin;
    }

    if (integrity) {
        link.integrity = integrity;
    }

    document.head.appendChild(link);
    return link;
}

/**
 * Preloads a script resource.
 * Convenience wrapper for preloadResource with as='script'.
 *
 * @param url - Script URL to preload
 * @param options - Optional settings
 * @returns The created link element
 */
export function preloadScript(
    url: string,
    options: Omit<PreloadOptions, 'url' | 'as'> = {}
): HTMLLinkElement {
    return preloadResource({ ...options, url, as: 'script' });
}

/**
 * Prefetches a resource for future navigation.
 * Lower priority than preload, for resources needed on next page.
 *
 * @param url - Resource URL to prefetch
 * @returns The created link element
 */
export function prefetchResource(url: string): HTMLLinkElement {
    // Check if already prefetched
    const existing = document.querySelector(`link[rel="prefetch"][href="${url}"]`);
    if (existing) {
        return existing as HTMLLinkElement;
    }

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);
    return link;
}

/**
 * Preconnects to a domain to speed up future requests.
 * Useful for third-party scripts or APIs.
 *
 * @param origin - Domain origin to preconnect to (e.g., 'https://api.example.com')
 * @param options - Optional settings
 * @returns The created link element
 *
 * @example
 * ```typescript
 * // Preconnect to Salesforce
 * preconnect('https://salesforce.com');
 * ```
 */
export function preconnect(
    origin: string,
    options: { crossOrigin?: 'anonymous' | 'use-credentials' } = {}
): HTMLLinkElement {
    // Check if already preconnected
    const existing = document.querySelector(`link[rel="preconnect"][href="${origin}"]`);
    if (existing) {
        return existing as HTMLLinkElement;
    }

    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = origin;

    if (options.crossOrigin) {
        link.crossOrigin = options.crossOrigin;
    }

    document.head.appendChild(link);
    return link;
}

/**
 * DNS prefetch for a domain.
 * Lighter weight than preconnect, just resolves DNS.
 *
 * @param origin - Domain to prefetch DNS for
 * @returns The created link element
 */
export function dnsPrefetch(origin: string): HTMLLinkElement {
    // Check if already prefetched
    const existing = document.querySelector(`link[rel="dns-prefetch"][href="${origin}"]`);
    if (existing) {
        return existing as HTMLLinkElement;
    }

    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = origin;
    document.head.appendChild(link);
    return link;
}

/**
 * Removes a preload/prefetch/preconnect hint.
 *
 * @param url - The URL of the resource hint to remove
 */
export function removeResourceHint(url: string): void {
    const selectors = [
        `link[rel="preload"][href="${url}"]`,
        `link[rel="prefetch"][href="${url}"]`,
        `link[rel="preconnect"][href="${url}"]`,
        `link[rel="dns-prefetch"][href="${url}"]`
    ];

    selectors.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
            element.remove();
        }
    });
}
