// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import {
    debounce,
    throttle,
    scheduleIdleTask,
    cancelIdleTask,
    batch,
    memoize
} from '../performance';

describe('Performance Utilities', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('debounce', () => {
        describe('positive test cases', () => {
            it('should delay function execution', () => {
                const fn = jest.fn();
                const debounced = debounce(fn, 100);

                debounced();
                expect(fn).not.toHaveBeenCalled();

                jest.advanceTimersByTime(100);
                expect(fn).toHaveBeenCalledTimes(1);
            });

            it('should only call once for multiple rapid calls', () => {
                const fn = jest.fn();
                const debounced = debounce(fn, 100);

                debounced();
                debounced();
                debounced();

                jest.advanceTimersByTime(100);
                expect(fn).toHaveBeenCalledTimes(1);
            });

            it('should pass arguments to the function', () => {
                const fn = jest.fn();
                const debounced = debounce(fn, 100);

                debounced('arg1', 'arg2');
                jest.advanceTimersByTime(100);

                expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
            });

            it('should use the last arguments when called multiple times', () => {
                const fn = jest.fn();
                const debounced = debounce(fn, 100);

                debounced('first');
                debounced('second');
                debounced('third');

                jest.advanceTimersByTime(100);
                expect(fn).toHaveBeenCalledWith('third');
            });

            it('should call immediately when immediate is true', () => {
                const fn = jest.fn();
                const debounced = debounce(fn, 100, true);

                debounced();
                expect(fn).toHaveBeenCalledTimes(1);

                // Should not call again during wait period
                debounced();
                expect(fn).toHaveBeenCalledTimes(1);
            });

            it('should have cancel method', () => {
                const fn = jest.fn();
                const debounced = debounce(fn, 100);

                debounced();
                debounced.cancel();
                jest.advanceTimersByTime(100);

                expect(fn).not.toHaveBeenCalled();
            });

            it('should have flush method', () => {
                const fn = jest.fn();
                const debounced = debounce(fn, 100);

                debounced('test');
                debounced.flush();

                expect(fn).toHaveBeenCalledWith('test');
            });

            it('should preserve this context', () => {
                const obj = {
                    value: 42,
                    fn: jest.fn(function(this: any) {
                        return this.value;
                    })
                };
                obj.fn = debounce(obj.fn, 100);

                obj.fn();
                jest.advanceTimersByTime(100);

                expect(obj.fn).toHaveProperty('cancel');
            });
        });

        describe('negative test cases', () => {
            it('should not call function if cancelled before wait', () => {
                const fn = jest.fn();
                const debounced = debounce(fn, 100);

                debounced();
                jest.advanceTimersByTime(50);
                debounced.cancel();
                jest.advanceTimersByTime(100);

                expect(fn).not.toHaveBeenCalled();
            });

            it('should not flush if no pending call', () => {
                const fn = jest.fn();
                const debounced = debounce(fn, 100);

                debounced.flush();
                expect(fn).not.toHaveBeenCalled();
            });
        });
    });

    describe('throttle', () => {
        describe('positive test cases', () => {
            it('should call function immediately by default', () => {
                const fn = jest.fn();
                const throttled = throttle(fn, 100);

                throttled();
                expect(fn).toHaveBeenCalledTimes(1);
            });

            it('should not call again within wait period', () => {
                const fn = jest.fn();
                const throttled = throttle(fn, 100);

                throttled();
                throttled();
                throttled();

                expect(fn).toHaveBeenCalledTimes(1);
            });

            it('should call trailing edge after wait', () => {
                const fn = jest.fn();
                const throttled = throttle(fn, 100);

                throttled('first');
                throttled('second');

                jest.advanceTimersByTime(100);
                expect(fn).toHaveBeenCalledTimes(2);
                expect(fn).toHaveBeenLastCalledWith('second');
            });

            it('should pass arguments to function', () => {
                const fn = jest.fn();
                const throttled = throttle(fn, 100);

                throttled('arg1', 'arg2');
                expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
            });

            it('should respect leading: false option', () => {
                const fn = jest.fn();
                const throttled = throttle(fn, 100, { leading: false });

                throttled();
                expect(fn).not.toHaveBeenCalled();

                jest.advanceTimersByTime(100);
                expect(fn).toHaveBeenCalledTimes(1);
            });

            it('should respect trailing: false option', () => {
                const fn = jest.fn();
                const throttled = throttle(fn, 100, { trailing: false });

                throttled('first');
                throttled('second');

                jest.advanceTimersByTime(100);
                expect(fn).toHaveBeenCalledTimes(1);
                expect(fn).toHaveBeenCalledWith('first');
            });

            it('should have cancel method', () => {
                const fn = jest.fn();
                const throttled = throttle(fn, 100);

                throttled();
                throttled();
                throttled.cancel();
                jest.advanceTimersByTime(100);

                expect(fn).toHaveBeenCalledTimes(1);
            });
        });

        describe('negative test cases', () => {
            it('should not call trailing if cancelled', () => {
                const fn = jest.fn();
                const throttled = throttle(fn, 100);

                throttled('first');
                throttled('second');
                throttled.cancel();
                jest.advanceTimersByTime(100);

                expect(fn).toHaveBeenCalledTimes(1);
            });
        });
    });

    describe('scheduleIdleTask / cancelIdleTask', () => {
        it('should schedule callback', () => {
            const fn = jest.fn();
            scheduleIdleTask(fn);

            jest.advanceTimersByTime(1);
            expect(fn).toHaveBeenCalled();
        });

        it('should cancel scheduled callback', () => {
            const fn = jest.fn();
            const id = scheduleIdleTask(fn);
            cancelIdleTask(id);

            jest.advanceTimersByTime(100);
            expect(fn).not.toHaveBeenCalled();
        });
    });

    describe('batch', () => {
        it('should batch multiple calls into one', async () => {
            jest.useRealTimers();
            const fn = jest.fn();
            const batched = batch(fn);

            batched('first');
            batched('second');
            batched('third');

            expect(fn).not.toHaveBeenCalled();

            // Wait for microtask
            await Promise.resolve();

            expect(fn).toHaveBeenCalledTimes(1);
            expect(fn).toHaveBeenCalledWith('third');
        });

        it('should use last arguments', async () => {
            jest.useRealTimers();
            const fn = jest.fn();
            const batched = batch(fn);

            batched(1);
            batched(2);
            batched(3);

            await Promise.resolve();

            expect(fn).toHaveBeenCalledWith(3);
        });
    });

    describe('memoize', () => {
        describe('positive test cases', () => {
            it('should cache function results', () => {
                const fn = jest.fn((x: number) => x * 2);
                const memoized = memoize(fn);

                expect(memoized(5)).toBe(10);
                expect(memoized(5)).toBe(10);
                expect(fn).toHaveBeenCalledTimes(1);
            });

            it('should return different results for different arguments', () => {
                const fn = jest.fn((x: number) => x * 2);
                const memoized = memoize(fn);

                expect(memoized(5)).toBe(10);
                expect(memoized(10)).toBe(20);
                expect(fn).toHaveBeenCalledTimes(2);
            });

            it('should use custom resolver', () => {
                const fn = jest.fn((obj: { id: number }) => obj.id * 2);
                const memoized = memoize(fn, (obj) => String(obj.id));

                expect(memoized({ id: 5 })).toBe(10);
                expect(memoized({ id: 5 })).toBe(10);
                expect(fn).toHaveBeenCalledTimes(1);
            });

            it('should expose cache', () => {
                const fn = jest.fn((x: number) => x * 2);
                const memoized = memoize(fn);

                memoized(5);
                expect(memoized.cache.size).toBe(1);
            });

            it('should have clear method', () => {
                const fn = jest.fn((x: number) => x * 2);
                const memoized = memoize(fn);

                memoized(5);
                memoized.clear();
                memoized(5);

                expect(fn).toHaveBeenCalledTimes(2);
            });
        });

        describe('negative test cases', () => {
            it('should not use cache for different arguments', () => {
                const fn = jest.fn((a: number, b: number) => a + b);
                const memoized = memoize(fn);

                memoized(1, 2);
                memoized(2, 1);

                expect(fn).toHaveBeenCalledTimes(2);
            });
        });
    });
});
