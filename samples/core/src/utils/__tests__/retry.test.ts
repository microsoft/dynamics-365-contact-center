// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import {
    withRetry,
    createRetryableOperation,
    withRetryOrThrow,
    RetryError,
    RetryConditions
} from '../retry';

describe('Retry Utility', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('withRetry', () => {
        describe('positive test cases', () => {
            it('should return result on first successful attempt', async () => {
                const operation = jest.fn().mockResolvedValue('success');

                const resultPromise = withRetry(operation);
                await jest.runAllTimersAsync();
                const result = await resultPromise;

                expect(result.success).toBe(true);
                expect(result.result).toBe('success');
                expect(result.attempts).toBe(1);
                expect(operation).toHaveBeenCalledTimes(1);
            });

            it('should retry on failure and eventually succeed', async () => {
                const operation = jest.fn()
                    .mockRejectedValueOnce(new Error('fail 1'))
                    .mockRejectedValueOnce(new Error('fail 2'))
                    .mockResolvedValueOnce('success');

                const resultPromise = withRetry(operation, { maxRetries: 3, initialDelayMs: 100 });
                await jest.runAllTimersAsync();
                const result = await resultPromise;

                expect(result.success).toBe(true);
                expect(result.result).toBe('success');
                expect(result.attempts).toBe(3);
                expect(operation).toHaveBeenCalledTimes(3);
            });

            it('should use exponential backoff for delays', async () => {
                const operation = jest.fn()
                    .mockRejectedValueOnce(new Error('fail'))
                    .mockRejectedValueOnce(new Error('fail'))
                    .mockResolvedValue('success');

                const resultPromise = withRetry(operation, {
                    maxRetries: 3,
                    initialDelayMs: 1000,
                    backoffFactor: 2,
                    jitter: false
                });

                // First attempt fails immediately
                await jest.advanceTimersByTimeAsync(0);
                expect(operation).toHaveBeenCalledTimes(1);

                // After 1000ms (1000 * 2^0), second attempt
                await jest.advanceTimersByTimeAsync(1000);
                expect(operation).toHaveBeenCalledTimes(2);

                // After 2000ms (1000 * 2^1), third attempt
                await jest.advanceTimersByTimeAsync(2000);
                expect(operation).toHaveBeenCalledTimes(3);

                const result = await resultPromise;
                expect(result.success).toBe(true);
            });

            it('should call onRetry callback before each retry', async () => {
                const onRetry = jest.fn();
                const operation = jest.fn()
                    .mockRejectedValueOnce(new Error('fail'))
                    .mockResolvedValue('success');

                const resultPromise = withRetry(operation, {
                    maxRetries: 2,
                    initialDelayMs: 100,
                    onRetry
                });
                await jest.runAllTimersAsync();
                await resultPromise;

                expect(onRetry).toHaveBeenCalledTimes(1);
                expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 1, expect.any(Number));
            });

            it('should track total time spent', async () => {
                const operation = jest.fn().mockResolvedValue('success');

                const resultPromise = withRetry(operation);
                await jest.runAllTimersAsync();
                const result = await resultPromise;

                expect(result.totalTimeMs).toBeGreaterThanOrEqual(0);
            });
        });

        describe('negative test cases', () => {
            it('should return failure after max retries', async () => {
                const operation = jest.fn().mockRejectedValue(new Error('always fails'));

                const resultPromise = withRetry(operation, { maxRetries: 3, initialDelayMs: 100 });
                await jest.runAllTimersAsync();
                const result = await resultPromise;

                expect(result.success).toBe(false);
                expect(result.error).toBeInstanceOf(Error);
                expect(result.error?.message).toBe('always fails');
                expect(result.attempts).toBe(4); // 1 initial + 3 retries
            });

            it('should stop retrying when retryCondition returns false', async () => {
                const operation = jest.fn().mockRejectedValue(new Error('do not retry'));

                const resultPromise = withRetry(operation, {
                    maxRetries: 5,
                    initialDelayMs: 100,
                    retryCondition: () => false
                });
                await jest.runAllTimersAsync();
                const result = await resultPromise;

                expect(result.success).toBe(false);
                expect(result.attempts).toBe(1);
                expect(operation).toHaveBeenCalledTimes(1);
            });

            it('should respect maxDelayMs cap', async () => {
                const onRetry = jest.fn();
                const operation = jest.fn().mockRejectedValue(new Error('fail'));

                const resultPromise = withRetry(operation, {
                    maxRetries: 5,
                    initialDelayMs: 10000,
                    maxDelayMs: 5000,
                    backoffFactor: 2,
                    jitter: false,
                    onRetry
                });
                await jest.runAllTimersAsync();
                await resultPromise;

                // All delays should be capped at 5000ms
                onRetry.mock.calls.forEach(call => {
                    expect(call[2]).toBeLessThanOrEqual(5000);
                });
            });

            it('should convert non-Error exceptions to Error', async () => {
                const operation = jest.fn().mockRejectedValue('string error');

                const resultPromise = withRetry(operation, { maxRetries: 0 });
                await jest.runAllTimersAsync();
                const result = await resultPromise;

                expect(result.error).toBeInstanceOf(Error);
                expect(result.error?.message).toBe('string error');
            });
        });
    });

    describe('createRetryableOperation', () => {
        it('should create a function that retries on failure', async () => {
            let callCount = 0;
            const operation = async (value: number): Promise<number> => {
                callCount++;
                if (callCount < 3) throw new Error('not yet');
                return value * 2;
            };

            const retryable = createRetryableOperation(operation, {
                maxRetries: 5,
                initialDelayMs: 100
            });

            const resultPromise = retryable(5);
            await jest.runAllTimersAsync();
            const result = await resultPromise;

            expect(result.success).toBe(true);
            expect(result.result).toBe(10);
            expect(result.attempts).toBe(3);
        });

        it('should preserve function arguments', async () => {
            const operation = jest.fn().mockResolvedValue('result');
            const retryable = createRetryableOperation(operation);

            const resultPromise = retryable('arg1', 'arg2', 123);
            await jest.runAllTimersAsync();
            await resultPromise;

            expect(operation).toHaveBeenCalledWith('arg1', 'arg2', 123);
        });
    });

    describe('withRetryOrThrow', () => {
        it('should return result on success', async () => {
            const operation = jest.fn().mockResolvedValue('success');

            const resultPromise = withRetryOrThrow(operation);
            await jest.runAllTimersAsync();
            const result = await resultPromise;

            expect(result).toBe('success');
        });

        it('should throw RetryError on failure', async () => {
            jest.useRealTimers(); // Use real timers for this test
            const operation = jest.fn().mockRejectedValue(new Error('fail'));

            await expect(
                withRetryOrThrow(operation, { maxRetries: 2, initialDelayMs: 10 })
            ).rejects.toThrow(RetryError);

            expect(operation).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
            jest.useFakeTimers(); // Restore fake timers
        });
    });

    describe('RetryConditions', () => {
        describe('networkErrors', () => {
            it('should return true for network-related errors', () => {
                expect(RetryConditions.networkErrors(new Error('network error'))).toBe(true);
                expect(RetryConditions.networkErrors(new Error('timeout'))).toBe(true);
                expect(RetryConditions.networkErrors(new Error('ECONNRESET'))).toBe(true);
                expect(RetryConditions.networkErrors(new Error('Failed to fetch'))).toBe(true);
            });

            it('should return false for non-network errors', () => {
                expect(RetryConditions.networkErrors(new Error('validation error'))).toBe(false);
                expect(RetryConditions.networkErrors(new Error('not found'))).toBe(false);
            });
        });

        describe('serverErrors', () => {
            it('should return true for 5xx errors', () => {
                expect(RetryConditions.serverErrors(new Error('500 Internal Server Error'))).toBe(true);
                expect(RetryConditions.serverErrors(new Error('503 Service Unavailable'))).toBe(true);
            });

            it('should return false for 4xx errors', () => {
                expect(RetryConditions.serverErrors(new Error('404 Not Found'))).toBe(false);
                expect(RetryConditions.serverErrors(new Error('400 Bad Request'))).toBe(false);
            });
        });

        describe('rateLimited', () => {
            it('should return true for rate limit errors', () => {
                expect(RetryConditions.rateLimited(new Error('429 Too Many Requests'))).toBe(true);
                expect(RetryConditions.rateLimited(new Error('Rate limit exceeded'))).toBe(true);
            });
        });

        describe('any', () => {
            it('should return true if any condition is true', () => {
                const combined = RetryConditions.any(
                    () => false,
                    () => true,
                    () => false
                );
                expect(combined(new Error('test'), 0)).toBe(true);
            });
        });

        describe('all', () => {
            it('should return true only if all conditions are true', () => {
                const allTrue = RetryConditions.all(
                    () => true,
                    () => true
                );
                const someFalse = RetryConditions.all(
                    () => true,
                    () => false
                );

                expect(allTrue(new Error('test'), 0)).toBe(true);
                expect(someFalse(new Error('test'), 0)).toBe(false);
            });
        });
    });
});
