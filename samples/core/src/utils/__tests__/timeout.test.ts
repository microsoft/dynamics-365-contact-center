// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import {
    withTimeout,
    createTimeoutController,
    withAbortableTimeout,
    delay,
    cancellableDelay,
    raceWithTimeout,
    allWithTimeout,
    TimeoutError
} from '../timeout';

describe('Timeout Utilities', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('withTimeout', () => {
        describe('positive test cases', () => {
            it('should resolve with result if operation completes in time', async () => {
                const operation = new Promise<string>(resolve => {
                    setTimeout(() => resolve('success'), 100);
                });

                const resultPromise = withTimeout(operation, 500);
                jest.advanceTimersByTime(100);
                const result = await resultPromise;

                expect(result).toBe('success');
            });

            it('should pass through promise value', async () => {
                const resultPromise = withTimeout(Promise.resolve(42), 1000);
                const result = await resultPromise;
                expect(result).toBe(42);
            });

            it('should handle zero timeout by returning original promise', async () => {
                const resultPromise = withTimeout(Promise.resolve('ok'), 0);
                const result = await resultPromise;
                expect(result).toBe('ok');
            });
        });

        describe('negative test cases', () => {
            it('should reject with TimeoutError if operation takes too long', async () => {
                const operation = new Promise<string>(resolve => {
                    setTimeout(() => resolve('success'), 1000);
                });

                const resultPromise = withTimeout(operation, 500);
                jest.advanceTimersByTime(500);

                await expect(resultPromise).rejects.toThrow(TimeoutError);
            });

            it('should include timeout duration in error', async () => {
                const operation = new Promise(() => {}); // Never resolves

                const resultPromise = withTimeout(operation, 500);
                jest.advanceTimersByTime(500);

                await expect(resultPromise).rejects.toMatchObject({
                    timeoutMs: 500
                });
            });

            it('should use custom error message', async () => {
                const operation = new Promise(() => {});

                const resultPromise = withTimeout(operation, 500, 'Custom timeout message');
                jest.advanceTimersByTime(500);

                await expect(resultPromise).rejects.toThrow('Custom timeout message');
            });

            it('should pass through original error if operation fails', async () => {
                const operation = Promise.reject(new Error('original error'));

                await expect(withTimeout(operation, 500)).rejects.toThrow('original error');
            });
        });
    });

    describe('createTimeoutController', () => {
        it('should create controller with signal', () => {
            const controller = createTimeoutController(1000);

            expect(controller.signal).toBeInstanceOf(AbortSignal);
            expect(controller.isTimedOut()).toBe(false);
        });

        it('should abort signal after timeout', () => {
            const controller = createTimeoutController(1000);

            expect(controller.signal.aborted).toBe(false);

            jest.advanceTimersByTime(1000);

            expect(controller.signal.aborted).toBe(true);
            expect(controller.isTimedOut()).toBe(true);
        });

        it('should allow clearing timeout', () => {
            const controller = createTimeoutController(1000);

            controller.clear();
            jest.advanceTimersByTime(1000);

            expect(controller.signal.aborted).toBe(false);
            expect(controller.isTimedOut()).toBe(false);
        });

        it('should handle zero timeout', () => {
            const controller = createTimeoutController(0);
            expect(controller.signal.aborted).toBe(false);
        });
    });

    describe('withAbortableTimeout', () => {
        it('should pass AbortSignal to operation', async () => {
            const operation = jest.fn().mockResolvedValue('result');

            const resultPromise = withAbortableTimeout(operation, 1000);
            const result = await resultPromise;

            expect(result).toBe('result');
            expect(operation).toHaveBeenCalledWith(expect.any(AbortSignal));
        });

        it('should convert AbortError to TimeoutError when timed out', async () => {
            const operation = (signal: AbortSignal) => new Promise<string>((_, reject) => {
                signal.addEventListener('abort', () => {
                    const error = new Error('Aborted');
                    error.name = 'AbortError';
                    reject(error);
                });
            });

            const resultPromise = withAbortableTimeout(operation, 500);
            jest.advanceTimersByTime(500);

            await expect(resultPromise).rejects.toThrow(TimeoutError);
        });

        it('should clear timeout on success', async () => {
            const operation = jest.fn().mockResolvedValue('result');

            const resultPromise = withAbortableTimeout(operation, 1000);
            await resultPromise;

            // Timeout should be cleared - no TimeoutError should occur
            jest.advanceTimersByTime(1000);
        });
    });

    describe('delay', () => {
        it('should resolve after specified duration', async () => {
            const resolved = jest.fn();

            delay(1000).then(resolved);

            expect(resolved).not.toHaveBeenCalled();

            jest.advanceTimersByTime(1000);
            await Promise.resolve();

            expect(resolved).toHaveBeenCalled();
        });
    });

    describe('cancellableDelay', () => {
        it('should resolve after specified duration', async () => {
            const resolved = jest.fn();

            cancellableDelay(1000).then(resolved);
            jest.advanceTimersByTime(1000);
            await Promise.resolve();

            expect(resolved).toHaveBeenCalled();
        });

        it('should reject if signal is already aborted', async () => {
            const controller = new AbortController();
            controller.abort();

            await expect(cancellableDelay(1000, controller.signal))
                .rejects.toThrow('Delay aborted');
        });

        it('should reject if signal is aborted during delay', async () => {
            const controller = new AbortController();

            const delayPromise = cancellableDelay(1000, controller.signal);

            jest.advanceTimersByTime(500);
            controller.abort();

            await expect(delayPromise).rejects.toThrow('Delay aborted');
        });
    });

    describe('raceWithTimeout', () => {
        it('should resolve with first completed promise', async () => {
            const fast = new Promise<string>(resolve => {
                setTimeout(() => resolve('fast'), 100);
            });
            const slow = new Promise<string>(resolve => {
                setTimeout(() => resolve('slow'), 500);
            });

            const resultPromise = raceWithTimeout([fast, slow], 1000);
            jest.advanceTimersByTime(100);
            const result = await resultPromise;

            expect(result).toBe('fast');
        });

        it('should timeout if no promise completes in time', async () => {
            const slow1 = new Promise<string>(resolve => {
                setTimeout(() => resolve('slow1'), 1000);
            });
            const slow2 = new Promise<string>(resolve => {
                setTimeout(() => resolve('slow2'), 1000);
            });

            const resultPromise = raceWithTimeout([slow1, slow2], 500);
            jest.advanceTimersByTime(500);

            await expect(resultPromise).rejects.toThrow(TimeoutError);
        });
    });

    describe('allWithTimeout', () => {
        it('should resolve with all results if completed in time', async () => {
            const promise1 = new Promise<string>(resolve => {
                setTimeout(() => resolve('result1'), 100);
            });
            const promise2 = new Promise<number>(resolve => {
                setTimeout(() => resolve(42), 200);
            });

            const resultPromise = allWithTimeout([promise1, promise2], 1000);
            jest.advanceTimersByTime(200);
            const results = await resultPromise;

            expect(results).toEqual(['result1', 42]);
        });

        it('should timeout if any promise takes too long', async () => {
            const fast = new Promise<string>(resolve => {
                setTimeout(() => resolve('fast'), 100);
            });
            const slow = new Promise<string>(resolve => {
                setTimeout(() => resolve('slow'), 1000);
            });

            const resultPromise = allWithTimeout([fast, slow], 500);
            jest.advanceTimersByTime(500);

            await expect(resultPromise).rejects.toThrow(TimeoutError);
        });
    });

    describe('TimeoutError', () => {
        it('should have correct name property', () => {
            const error = new TimeoutError(1000);
            expect(error.name).toBe('TimeoutError');
        });

        it('should include timeout duration', () => {
            const error = new TimeoutError(5000);
            expect(error.timeoutMs).toBe(5000);
        });

        it('should use default message if not provided', () => {
            const error = new TimeoutError(5000);
            expect(error.message).toBe('Operation timed out after 5000ms');
        });

        it('should use custom message if provided', () => {
            const error = new TimeoutError(5000, 'Custom message');
            expect(error.message).toBe('Custom message');
        });
    });
});
