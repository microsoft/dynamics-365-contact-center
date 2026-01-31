// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * Timeout utilities for async operations
 *
 * Provides mechanisms to add timeout protection to promises and
 * create abort controllers for cancellable operations.
 *
 * @example
 * ```typescript
 * import { withTimeout, TimeoutError } from '@ccaas/core';
 *
 * try {
 *     const result = await withTimeout(fetchData(), 5000);
 * } catch (error) {
 *     if (error instanceof TimeoutError) {
 *         console.log('Operation timed out');
 *     }
 * }
 * ```
 */

/**
 * Error thrown when an operation times out
 */
export class TimeoutError extends Error {
    constructor(
        public readonly timeoutMs: number,
        message?: string
    ) {
        super(message ?? `Operation timed out after ${timeoutMs}ms`);
        this.name = 'TimeoutError';
    }
}

/**
 * Timeout controller for managing cancellable timeouts
 */
export interface TimeoutController {
    /** AbortSignal that can be used with fetch and other APIs */
    signal: AbortSignal;
    /** Clear the timeout to prevent it from firing */
    clear: () => void;
    /** Check if timeout has been reached */
    isTimedOut: () => boolean;
}

/**
 * Wrap a promise with a timeout
 *
 * @param promise - The promise to wrap
 * @param timeoutMs - Timeout in milliseconds
 * @param message - Custom error message for timeout
 * @returns Promise that rejects with TimeoutError if timeout is reached
 *
 * @example
 * ```typescript
 * // Basic usage
 * const result = await withTimeout(fetch('/api/data'), 5000);
 *
 * // With custom message
 * const result = await withTimeout(
 *     fetch('/api/data'),
 *     5000,
 *     'Failed to fetch data within time limit'
 * );
 * ```
 */
export function withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    message?: string
): Promise<T> {
    if (timeoutMs <= 0) {
        return promise;
    }

    let timeoutId: ReturnType<typeof setTimeout>;

    const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
            reject(new TimeoutError(timeoutMs, message));
        }, timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]).finally(() => {
        clearTimeout(timeoutId);
    });
}

/**
 * Create a timeout controller for use with AbortController-compatible APIs
 *
 * @param timeoutMs - Timeout in milliseconds
 * @returns TimeoutController with signal and clear function
 *
 * @example
 * ```typescript
 * const controller = createTimeoutController(5000);
 *
 * try {
 *     const response = await fetch('/api/data', { signal: controller.signal });
 *     controller.clear(); // Clear timeout on success
 *     return response.json();
 * } catch (error) {
 *     if (error.name === 'AbortError') {
 *         throw new TimeoutError(5000);
 *     }
 *     throw error;
 * }
 * ```
 */
export function createTimeoutController(timeoutMs: number): TimeoutController {
    const controller = new AbortController();
    let timedOut = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    if (timeoutMs > 0) {
        timeoutId = setTimeout(() => {
            timedOut = true;
            controller.abort();
        }, timeoutMs);
    }

    return {
        signal: controller.signal,
        clear: () => {
            if (timeoutId !== undefined) {
                clearTimeout(timeoutId);
                timeoutId = undefined;
            }
        },
        isTimedOut: () => timedOut
    };
}

/**
 * Execute an operation with a timeout, using AbortController
 *
 * This version is useful for operations that support cancellation
 * via AbortSignal (like fetch).
 *
 * @param operation - Function that receives AbortSignal and returns a promise
 * @param timeoutMs - Timeout in milliseconds
 * @param message - Custom error message for timeout
 * @returns Promise that rejects with TimeoutError if timeout is reached
 *
 * @example
 * ```typescript
 * const result = await withAbortableTimeout(
 *     (signal) => fetch('/api/data', { signal }),
 *     5000
 * );
 * ```
 */
export async function withAbortableTimeout<T>(
    operation: (signal: AbortSignal) => Promise<T>,
    timeoutMs: number,
    message?: string
): Promise<T> {
    const controller = createTimeoutController(timeoutMs);

    try {
        const result = await operation(controller.signal);
        controller.clear();
        return result;
    } catch (error) {
        controller.clear();

        // Convert AbortError to TimeoutError if we timed out
        if (controller.isTimedOut() && error instanceof Error && error.name === 'AbortError') {
            throw new TimeoutError(timeoutMs, message);
        }

        throw error;
    }
}

/**
 * Create a promise that resolves after a delay
 *
 * @param ms - Delay in milliseconds
 * @returns Promise that resolves after the delay
 *
 * @example
 * ```typescript
 * await delay(1000); // Wait 1 second
 * ```
 */
export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a promise that resolves after a delay, with cancellation support
 *
 * @param ms - Delay in milliseconds
 * @param signal - Optional AbortSignal for cancellation
 * @returns Promise that resolves after the delay or rejects if aborted
 *
 * @example
 * ```typescript
 * const controller = new AbortController();
 *
 * // Cancel after 500ms
 * setTimeout(() => controller.abort(), 500);
 *
 * try {
 *     await cancellableDelay(1000, controller.signal);
 * } catch (error) {
 *     console.log('Delay was cancelled');
 * }
 * ```
 */
export function cancellableDelay(ms: number, signal?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
        if (signal?.aborted) {
            reject(new Error('Delay aborted'));
            return;
        }

        const timeoutId = setTimeout(resolve, ms);

        signal?.addEventListener('abort', () => {
            clearTimeout(timeoutId);
            reject(new Error('Delay aborted'));
        }, { once: true });
    });
}

/**
 * Race multiple promises with a timeout
 *
 * @param promises - Array of promises to race
 * @param timeoutMs - Timeout in milliseconds
 * @param message - Custom error message for timeout
 * @returns Promise that resolves with the first completed promise or rejects on timeout
 *
 * @example
 * ```typescript
 * const result = await raceWithTimeout([
 *     fetch('/api/server1'),
 *     fetch('/api/server2')
 * ], 5000);
 * ```
 */
export function raceWithTimeout<T>(
    promises: Promise<T>[],
    timeoutMs: number,
    message?: string
): Promise<T> {
    return withTimeout(Promise.race(promises), timeoutMs, message);
}

/**
 * Wait for all promises with a timeout
 *
 * @param promises - Array of promises to wait for
 * @param timeoutMs - Timeout in milliseconds
 * @param message - Custom error message for timeout
 * @returns Promise that resolves with all results or rejects on timeout
 *
 * @example
 * ```typescript
 * const [users, posts] = await allWithTimeout([
 *     fetchUsers(),
 *     fetchPosts()
 * ], 10000);
 * ```
 */
export function allWithTimeout<T extends readonly unknown[] | []>(
    promises: T,
    timeoutMs: number,
    message?: string
): Promise<{ -readonly [P in keyof T]: Awaited<T[P]> }> {
    return withTimeout(
        Promise.all(promises) as Promise<{ -readonly [P in keyof T]: Awaited<T[P]> }>,
        timeoutMs,
        message
    );
}
