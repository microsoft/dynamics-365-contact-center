// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * Retry utility with exponential backoff
 *
 * Provides robust retry logic for async operations with configurable
 * backoff strategies, jitter, and conditional retry handling.
 *
 * @example
 * ```typescript
 * import { withRetry, createRetryableOperation } from '@ccaas/core';
 *
 * // Simple retry
 * const result = await withRetry(() => fetchData(), { maxRetries: 3 });
 *
 * // Create a retryable function
 * const retryableFetch = createRetryableOperation(fetchData, { maxRetries: 5 });
 * await retryableFetch();
 * ```
 */

/**
 * Configuration options for retry behavior
 */
export interface RetryOptions {
    /** Maximum number of retry attempts (default: 3) */
    maxRetries?: number;

    /** Initial delay in milliseconds before first retry (default: 1000) */
    initialDelayMs?: number;

    /** Maximum delay in milliseconds between retries (default: 30000) */
    maxDelayMs?: number;

    /** Multiplier for exponential backoff (default: 2) */
    backoffFactor?: number;

    /** Whether to add random jitter to delay (default: true) */
    jitter?: boolean;

    /** Custom function to determine if error should trigger retry */
    retryCondition?: (error: Error, attempt: number) => boolean;

    /** Callback invoked before each retry attempt */
    onRetry?: (error: Error, attempt: number, delayMs: number) => void;
}

/**
 * Result of a retry operation
 */
export interface RetryResult<T> {
    /** Whether the operation eventually succeeded */
    success: boolean;

    /** The result value if successful */
    result?: T;

    /** The final error if all retries failed */
    error?: Error;

    /** Total number of attempts made (including initial attempt) */
    attempts: number;

    /** Total time spent in milliseconds */
    totalTimeMs: number;
}

/**
 * Default retry options
 */
const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'retryCondition' | 'onRetry'>> = {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 30000,
    backoffFactor: 2,
    jitter: true
};

/**
 * Calculate delay with exponential backoff and optional jitter
 */
function calculateDelay(
    attempt: number,
    initialDelayMs: number,
    maxDelayMs: number,
    backoffFactor: number,
    jitter: boolean
): number {
    // Exponential backoff: initialDelay * (backoffFactor ^ attempt)
    let delay = initialDelayMs * Math.pow(backoffFactor, attempt);

    // Cap at maximum delay
    delay = Math.min(delay, maxDelayMs);

    // Add jitter (0-25% of delay)
    if (jitter) {
        const jitterAmount = delay * 0.25 * Math.random();
        delay += jitterAmount;
    }

    return Math.floor(delay);
}

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Default retry condition - retry on any error
 */
function defaultRetryCondition(_error: Error, _attempt: number): boolean {
    return true;
}

/**
 * Execute an async operation with retry logic
 *
 * @param operation - The async operation to execute
 * @param options - Retry configuration options
 * @returns Promise resolving to RetryResult with success status, result/error, and metadata
 *
 * @example
 * ```typescript
 * const result = await withRetry(
 *     () => fetch('/api/data'),
 *     {
 *         maxRetries: 5,
 *         initialDelayMs: 500,
 *         retryCondition: (error) => error.message.includes('timeout'),
 *         onRetry: (error, attempt) => console.log(`Retry ${attempt}: ${error.message}`)
 *     }
 * );
 *
 * if (result.success) {
 *     console.log('Data:', result.result);
 * } else {
 *     console.error('Failed after', result.attempts, 'attempts:', result.error);
 * }
 * ```
 */
export async function withRetry<T>(
    operation: () => Promise<T>,
    options?: RetryOptions
): Promise<RetryResult<T>> {
    const {
        maxRetries,
        initialDelayMs,
        maxDelayMs,
        backoffFactor,
        jitter
    } = { ...DEFAULT_OPTIONS, ...options };

    const retryCondition = options?.retryCondition ?? defaultRetryCondition;
    const onRetry = options?.onRetry;

    const startTime = performance.now();
    let lastError: Error | undefined;
    let attempts = 0;

    // Initial attempt + retries
    const totalAttempts = maxRetries + 1;

    for (let attempt = 0; attempt < totalAttempts; attempt++) {
        attempts = attempt + 1;

        try {
            const result = await operation();
            return {
                success: true,
                result,
                attempts,
                totalTimeMs: Math.floor(performance.now() - startTime)
            };
        } catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err));

            // Check if we should retry
            const isLastAttempt = attempt >= maxRetries;
            const shouldRetry = !isLastAttempt && retryCondition(lastError, attempt);

            if (!shouldRetry) {
                break;
            }

            // Calculate and wait for delay
            const delayMs = calculateDelay(attempt, initialDelayMs, maxDelayMs, backoffFactor, jitter);

            // Notify about retry
            if (onRetry) {
                onRetry(lastError, attempt + 1, delayMs);
            }

            await sleep(delayMs);
        }
    }

    return {
        success: false,
        error: lastError,
        attempts,
        totalTimeMs: Math.floor(performance.now() - startTime)
    };
}

/**
 * Create a retryable version of an async function
 *
 * Wraps any async function with retry logic that will be applied
 * automatically on each call.
 *
 * @param operation - The async function to wrap
 * @param options - Retry configuration options
 * @returns A new function with the same signature that includes retry logic
 *
 * @example
 * ```typescript
 * const fetchWithRetry = createRetryableOperation(
 *     async (url: string) => {
 *         const response = await fetch(url);
 *         return response.json();
 *     },
 *     { maxRetries: 3, initialDelayMs: 1000 }
 * );
 *
 * // Each call will automatically retry on failure
 * const data = await fetchWithRetry('/api/users');
 * ```
 */
export function createRetryableOperation<T extends (...args: any[]) => Promise<any>>(
    operation: T,
    options?: RetryOptions
): (...args: Parameters<T>) => Promise<RetryResult<Awaited<ReturnType<T>>>> {
    return async (...args: Parameters<T>): Promise<RetryResult<Awaited<ReturnType<T>>>> => {
        return withRetry(() => operation(...args), options);
    };
}

/**
 * Retry-specific error class for distinguishing retry failures
 */
export class RetryError extends Error {
    constructor(
        message: string,
        public readonly lastError: Error,
        public readonly attempts: number,
        public readonly totalTimeMs: number
    ) {
        super(message);
        this.name = 'RetryError';
    }
}

/**
 * Execute an operation with retry, throwing on failure
 *
 * Unlike `withRetry`, this function throws an error if all retries fail,
 * making it easier to use in try/catch blocks.
 *
 * @param operation - The async operation to execute
 * @param options - Retry configuration options
 * @returns Promise resolving to the operation result
 * @throws RetryError if all attempts fail
 *
 * @example
 * ```typescript
 * try {
 *     const data = await withRetryOrThrow(() => fetchData());
 * } catch (error) {
 *     if (error instanceof RetryError) {
 *         console.error(`Failed after ${error.attempts} attempts`);
 *     }
 * }
 * ```
 */
export async function withRetryOrThrow<T>(
    operation: () => Promise<T>,
    options?: RetryOptions
): Promise<T> {
    const result = await withRetry(operation, options);

    if (result.success && result.result !== undefined) {
        return result.result;
    }

    throw new RetryError(
        `Operation failed after ${result.attempts} attempts`,
        result.error ?? new Error('Unknown error'),
        result.attempts,
        result.totalTimeMs
    );
}

/**
 * Common retry conditions for typical scenarios
 */
export const RetryConditions = {
    /** Retry on network-related errors */
    networkErrors: (error: Error): boolean => {
        const networkErrorPatterns = [
            'network',
            'timeout',
            'ECONNRESET',
            'ECONNREFUSED',
            'ETIMEDOUT',
            'fetch failed',
            'Failed to fetch'
        ];
        const message = error.message.toLowerCase();
        return networkErrorPatterns.some(pattern => message.includes(pattern.toLowerCase()));
    },

    /** Retry on HTTP 5xx errors */
    serverErrors: (error: Error): boolean => {
        const message = error.message;
        return /\b5\d{2}\b/.test(message) || message.includes('Internal Server Error');
    },

    /** Retry on rate limiting (HTTP 429) */
    rateLimited: (error: Error): boolean => {
        return error.message.includes('429') || error.message.toLowerCase().includes('rate limit');
    },

    /** Combine multiple conditions with OR logic */
    any: (...conditions: Array<(error: Error, attempt: number) => boolean>) =>
        (error: Error, attempt: number): boolean =>
            conditions.some(condition => condition(error, attempt)),

    /** Combine multiple conditions with AND logic */
    all: (...conditions: Array<(error: Error, attempt: number) => boolean>) =>
        (error: Error, attempt: number): boolean =>
            conditions.every(condition => condition(error, attempt))
};
