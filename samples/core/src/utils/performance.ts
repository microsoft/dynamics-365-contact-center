// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * Performance utilities for optimizing high-frequency operations
 */

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 *
 * @param fn - The function to debounce
 * @param wait - The number of milliseconds to delay
 * @param immediate - If true, trigger the function on the leading edge instead of trailing
 * @returns Debounced function with cancel method
 *
 * @example
 * ```typescript
 * const debouncedSearch = debounce((query: string) => {
 *     api.search(query);
 * }, 300);
 *
 * input.addEventListener('input', (e) => debouncedSearch(e.target.value));
 * ```
 */
export function debounce<T extends (...args: any[]) => any>(
    fn: T,
    wait: number,
    immediate: boolean = false
): T & { cancel: () => void; flush: () => void } {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let lastArgs: Parameters<T> | null = null;
    let lastThis: any = null;
    let result: ReturnType<T>;

    function cancel(): void {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
        lastArgs = null;
        lastThis = null;
    }

    function flush(): void {
        if (timeoutId !== null && lastArgs !== null) {
            result = fn.apply(lastThis, lastArgs);
            cancel();
        }
    }

    function debounced(this: any, ...args: Parameters<T>): ReturnType<T> {
        lastArgs = args;
        lastThis = this;

        const callNow = immediate && timeoutId === null;

        if (timeoutId !== null) {
            clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(() => {
            timeoutId = null;
            if (!immediate && lastArgs !== null) {
                result = fn.apply(lastThis, lastArgs);
                lastArgs = null;
                lastThis = null;
            }
        }, wait);

        if (callNow) {
            result = fn.apply(this, args);
        }

        return result;
    }

    debounced.cancel = cancel;
    debounced.flush = flush;

    return debounced as T & { cancel: () => void; flush: () => void };
}

/**
 * Creates a throttled function that only invokes func at most once per every wait milliseconds.
 *
 * @param fn - The function to throttle
 * @param wait - The number of milliseconds to throttle invocations to
 * @param options - Options for leading/trailing edge execution
 * @returns Throttled function with cancel method
 *
 * @example
 * ```typescript
 * const throttledScroll = throttle(() => {
 *     updateScrollPosition();
 * }, 100);
 *
 * window.addEventListener('scroll', throttledScroll);
 * ```
 */
export function throttle<T extends (...args: any[]) => any>(
    fn: T,
    wait: number,
    options: { leading?: boolean; trailing?: boolean } = {}
): T & { cancel: () => void } {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let lastArgs: Parameters<T> | null = null;
    let lastThis: any = null;
    let lastCallTime: number | null = null;
    let result: ReturnType<T>;

    const leading = options.leading !== false;
    const trailing = options.trailing !== false;

    function cancel(): void {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
        lastArgs = null;
        lastThis = null;
        lastCallTime = null;
    }

    function invokeFunc(): void {
        if (lastArgs !== null) {
            result = fn.apply(lastThis, lastArgs);
            lastArgs = null;
            lastThis = null;
        }
    }

    function shouldInvoke(time: number): boolean {
        if (lastCallTime === null) {
            return true;
        }
        const timeSinceLastCall = time - lastCallTime;
        return timeSinceLastCall >= wait;
    }

    function remainingWait(time: number): number {
        if (lastCallTime === null) {
            return 0;
        }
        const timeSinceLastCall = time - lastCallTime;
        return Math.max(0, wait - timeSinceLastCall);
    }

    function trailingEdge(): void {
        timeoutId = null;
        if (trailing && lastArgs !== null) {
            invokeFunc();
        }
    }

    function throttled(this: any, ...args: Parameters<T>): ReturnType<T> {
        const now = Date.now();
        const isInvoking = shouldInvoke(now);

        lastArgs = args;
        lastThis = this;

        if (isInvoking) {
            if (timeoutId === null) {
                // Leading edge
                lastCallTime = now;
                if (leading) {
                    invokeFunc();
                }
                // Schedule trailing edge
                if (trailing) {
                    timeoutId = setTimeout(trailingEdge, wait);
                }
            }
        } else if (timeoutId === null && trailing) {
            // Schedule trailing edge
            timeoutId = setTimeout(trailingEdge, remainingWait(now));
        }

        return result;
    }

    throttled.cancel = cancel;

    return throttled as T & { cancel: () => void };
}

/**
 * Schedules a callback to run during browser idle time.
 * Falls back to setTimeout if requestIdleCallback is not available.
 *
 * @param callback - Function to execute during idle time
 * @param options - Options including timeout
 * @returns ID that can be used to cancel the callback
 */
export function scheduleIdleTask(
    callback: () => void,
    options: { timeout?: number } = {}
): number {
    if (typeof requestIdleCallback === 'function') {
        return requestIdleCallback(callback, options);
    }
    // Fallback for environments without requestIdleCallback
    return setTimeout(callback, 1) as unknown as number;
}

/**
 * Cancels a scheduled idle task
 *
 * @param id - The ID returned by scheduleIdleTask
 */
export function cancelIdleTask(id: number): void {
    if (typeof cancelIdleCallback === 'function') {
        cancelIdleCallback(id);
    } else {
        clearTimeout(id);
    }
}

/**
 * Batches multiple calls into a single execution on the next microtask.
 * Useful for batching DOM updates or state changes.
 *
 * @param fn - The function to batch
 * @returns Batched function
 *
 * @example
 * ```typescript
 * const batchedUpdate = batch((items: Item[]) => {
 *     renderItems(items);
 * });
 *
 * // These will all be batched into one call
 * batchedUpdate([item1]);
 * batchedUpdate([item2]);
 * batchedUpdate([item3]);
 * ```
 */
export function batch<T extends (...args: any[]) => void>(
    fn: T
): (...args: Parameters<T>) => void {
    let scheduled = false;
    let lastArgs: Parameters<T> | null = null;

    return function batched(...args: Parameters<T>): void {
        lastArgs = args;

        if (!scheduled) {
            scheduled = true;
            queueMicrotask(() => {
                scheduled = false;
                if (lastArgs !== null) {
                    fn(...lastArgs);
                    lastArgs = null;
                }
            });
        }
    };
}

/**
 * Creates a function that memoizes the result of func.
 *
 * @param fn - The function to memoize
 * @param resolver - Optional function to resolve the cache key
 * @returns Memoized function with cache property
 */
export function memoize<T extends (...args: any[]) => any>(
    fn: T,
    resolver?: (...args: Parameters<T>) => string
): T & { cache: Map<string, ReturnType<T>>; clear: () => void } {
    const cache = new Map<string, ReturnType<T>>();

    function memoized(this: any, ...args: Parameters<T>): ReturnType<T> {
        const key = resolver ? resolver(...args) : JSON.stringify(args);

        if (cache.has(key)) {
            return cache.get(key)!;
        }

        const result = fn.apply(this, args);
        cache.set(key, result);
        return result;
    }

    memoized.cache = cache;
    memoized.clear = () => cache.clear();

    return memoized as T & { cache: Map<string, ReturnType<T>>; clear: () => void };
}
