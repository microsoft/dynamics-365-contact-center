// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import {
    CircuitBreaker,
    CircuitState,
    CircuitOpenError,
    createCircuitBreaker,
    withCircuitBreaker
} from '../circuitBreaker';

describe('CircuitBreaker', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('constructor', () => {
        it('should create circuit breaker with default options', () => {
            const breaker = new CircuitBreaker();
            expect(breaker.getState()).toBe(CircuitState.CLOSED);
        });

        it('should create circuit breaker with custom options', () => {
            const breaker = new CircuitBreaker({
                failureThreshold: 3,
                successThreshold: 1,
                timeout: 5000
            });
            expect(breaker.getState()).toBe(CircuitState.CLOSED);
        });
    });

    describe('execute', () => {
        describe('positive test cases', () => {
            it('should execute operation successfully when circuit is closed', async () => {
                const breaker = new CircuitBreaker();
                const operation = jest.fn().mockResolvedValue('success');

                const result = await breaker.execute(operation);

                expect(result).toBe('success');
                expect(operation).toHaveBeenCalledTimes(1);
                expect(breaker.getState()).toBe(CircuitState.CLOSED);
            });

            it('should reset failure count on success', async () => {
                const breaker = new CircuitBreaker({ failureThreshold: 3 });

                // Cause some failures
                for (let i = 0; i < 2; i++) {
                    try {
                        await breaker.execute(() => Promise.reject(new Error('fail')));
                    } catch {}
                }

                // Success should reset failures
                await breaker.execute(() => Promise.resolve('ok'));
                expect(breaker.getState()).toBe(CircuitState.CLOSED);

                // Should be able to fail 2 more times without opening
                for (let i = 0; i < 2; i++) {
                    try {
                        await breaker.execute(() => Promise.reject(new Error('fail')));
                    } catch {}
                }
                expect(breaker.getState()).toBe(CircuitState.CLOSED);
            });

            it('should close circuit after success threshold in half-open state', async () => {
                const breaker = new CircuitBreaker({
                    failureThreshold: 2,
                    successThreshold: 2,
                    timeout: 1000
                });

                // Open the circuit
                for (let i = 0; i < 2; i++) {
                    try {
                        await breaker.execute(() => Promise.reject(new Error('fail')));
                    } catch {}
                }
                expect(breaker.getState()).toBe(CircuitState.OPEN);

                // Wait for timeout
                jest.advanceTimersByTime(1000);
                expect(breaker.getState()).toBe(CircuitState.HALF_OPEN);

                // Two successes should close the circuit
                await breaker.execute(() => Promise.resolve('ok'));
                expect(breaker.getState()).toBe(CircuitState.HALF_OPEN);

                await breaker.execute(() => Promise.resolve('ok'));
                expect(breaker.getState()).toBe(CircuitState.CLOSED);
            });
        });

        describe('negative test cases', () => {
            it('should open circuit after failure threshold', async () => {
                const breaker = new CircuitBreaker({ failureThreshold: 3 });

                for (let i = 0; i < 3; i++) {
                    try {
                        await breaker.execute(() => Promise.reject(new Error('fail')));
                    } catch {}
                }

                expect(breaker.getState()).toBe(CircuitState.OPEN);
            });

            it('should throw CircuitOpenError when circuit is open', async () => {
                const breaker = new CircuitBreaker({ failureThreshold: 1, timeout: 5000 });

                // Open the circuit
                try {
                    await breaker.execute(() => Promise.reject(new Error('fail')));
                } catch {}

                // Next call should fail immediately
                await expect(breaker.execute(() => Promise.resolve('ok')))
                    .rejects.toThrow(CircuitOpenError);
            });

            it('should reopen circuit on failure in half-open state', async () => {
                const breaker = new CircuitBreaker({
                    failureThreshold: 1,
                    timeout: 1000
                });

                // Open the circuit
                try {
                    await breaker.execute(() => Promise.reject(new Error('fail')));
                } catch {}
                expect(breaker.getState()).toBe(CircuitState.OPEN);

                // Wait for timeout
                jest.advanceTimersByTime(1000);
                expect(breaker.getState()).toBe(CircuitState.HALF_OPEN);

                // Failure in half-open should reopen
                try {
                    await breaker.execute(() => Promise.reject(new Error('fail')));
                } catch {}
                expect(breaker.getState()).toBe(CircuitState.OPEN);
            });

            it('should include remaining timeout in CircuitOpenError', async () => {
                const breaker = new CircuitBreaker({ failureThreshold: 1, timeout: 5000 });

                // Open the circuit
                try {
                    await breaker.execute(() => Promise.reject(new Error('fail')));
                } catch {}

                // Advance time partially
                jest.advanceTimersByTime(2000);

                try {
                    await breaker.execute(() => Promise.resolve('ok'));
                } catch (error) {
                    expect(error).toBeInstanceOf(CircuitOpenError);
                    expect((error as CircuitOpenError).remainingTimeMs).toBeCloseTo(3000, -2);
                }
            });
        });
    });

    describe('getStats', () => {
        it('should track statistics correctly', async () => {
            const breaker = new CircuitBreaker({ failureThreshold: 5 });

            // Execute some operations
            await breaker.execute(() => Promise.resolve('ok'));
            try {
                await breaker.execute(() => Promise.reject(new Error('fail')));
            } catch {}
            await breaker.execute(() => Promise.resolve('ok'));

            const stats = breaker.getStats();
            expect(stats.totalRequests).toBe(3);
            expect(stats.totalSuccesses).toBe(2);
            expect(stats.totalFailures).toBe(1);
            expect(stats.state).toBe(CircuitState.CLOSED);
        });

        it('should track last success and failure times', async () => {
            const breaker = new CircuitBreaker();

            await breaker.execute(() => Promise.resolve('ok'));
            const statsAfterSuccess = breaker.getStats();
            expect(statsAfterSuccess.lastSuccess).toBeInstanceOf(Date);

            try {
                await breaker.execute(() => Promise.reject(new Error('fail')));
            } catch {}
            const statsAfterFailure = breaker.getStats();
            expect(statsAfterFailure.lastFailure).toBeInstanceOf(Date);
        });
    });

    describe('reset', () => {
        it('should reset circuit to closed state', async () => {
            const breaker = new CircuitBreaker({ failureThreshold: 1 });

            // Open the circuit
            try {
                await breaker.execute(() => Promise.reject(new Error('fail')));
            } catch {}
            expect(breaker.getState()).toBe(CircuitState.OPEN);

            // Reset
            breaker.reset();
            expect(breaker.getState()).toBe(CircuitState.CLOSED);
        });
    });

    describe('trip', () => {
        it('should manually open the circuit', () => {
            const breaker = new CircuitBreaker();
            expect(breaker.getState()).toBe(CircuitState.CLOSED);

            breaker.trip();
            expect(breaker.getState()).toBe(CircuitState.OPEN);
        });
    });

    describe('isAllowingRequests', () => {
        it('should return true when circuit is closed', () => {
            const breaker = new CircuitBreaker();
            expect(breaker.isAllowingRequests()).toBe(true);
        });

        it('should return false when circuit is open', async () => {
            const breaker = new CircuitBreaker({ failureThreshold: 1 });

            try {
                await breaker.execute(() => Promise.reject(new Error('fail')));
            } catch {}

            expect(breaker.isAllowingRequests()).toBe(false);
        });

        it('should return true when circuit is half-open', async () => {
            const breaker = new CircuitBreaker({ failureThreshold: 1, timeout: 1000 });

            try {
                await breaker.execute(() => Promise.reject(new Error('fail')));
            } catch {}

            jest.advanceTimersByTime(1000);
            expect(breaker.isAllowingRequests()).toBe(true);
        });
    });

    describe('callbacks', () => {
        it('should call onStateChange on state transitions', async () => {
            const onStateChange = jest.fn();
            const breaker = new CircuitBreaker({
                failureThreshold: 1,
                timeout: 1000,
                onStateChange
            });

            // Open circuit
            try {
                await breaker.execute(() => Promise.reject(new Error('fail')));
            } catch {}
            expect(onStateChange).toHaveBeenCalledWith(CircuitState.CLOSED, CircuitState.OPEN);

            // Transition to half-open
            jest.advanceTimersByTime(1000);
            breaker.getState(); // Trigger state check
            expect(onStateChange).toHaveBeenCalledWith(CircuitState.OPEN, CircuitState.HALF_OPEN);
        });

        it('should call onOpen when circuit opens', async () => {
            const onOpen = jest.fn();
            const breaker = new CircuitBreaker({ failureThreshold: 1, onOpen });

            try {
                await breaker.execute(() => Promise.reject(new Error('fail')));
            } catch {}

            expect(onOpen).toHaveBeenCalledWith(expect.any(Error), 1);
        });

        it('should call onHalfOpen when transitioning to half-open', async () => {
            const onHalfOpen = jest.fn();
            const breaker = new CircuitBreaker({
                failureThreshold: 1,
                timeout: 1000,
                onHalfOpen
            });

            try {
                await breaker.execute(() => Promise.reject(new Error('fail')));
            } catch {}

            jest.advanceTimersByTime(1000);
            breaker.getState();

            expect(onHalfOpen).toHaveBeenCalled();
        });

        it('should call onClose when circuit closes', async () => {
            const onClose = jest.fn();
            const breaker = new CircuitBreaker({
                failureThreshold: 1,
                successThreshold: 1,
                timeout: 1000,
                onClose
            });

            try {
                await breaker.execute(() => Promise.reject(new Error('fail')));
            } catch {}

            jest.advanceTimersByTime(1000);
            await breaker.execute(() => Promise.resolve('ok'));

            expect(onClose).toHaveBeenCalled();
        });
    });

    describe('createCircuitBreaker', () => {
        it('should create a new CircuitBreaker instance', () => {
            const breaker = createCircuitBreaker({ failureThreshold: 10 });
            expect(breaker).toBeInstanceOf(CircuitBreaker);
        });
    });

    describe('withCircuitBreaker', () => {
        it('should wrap function with circuit breaker', async () => {
            const operation = jest.fn().mockResolvedValue('result');
            const wrapped = withCircuitBreaker(operation, { failureThreshold: 3 });

            const result = await wrapped('arg1', 'arg2');
            expect(result).toBe('result');
            expect(operation).toHaveBeenCalledWith('arg1', 'arg2');
        });

        it('should expose getCircuitBreaker method', () => {
            const operation = jest.fn().mockResolvedValue('result');
            const wrapped = withCircuitBreaker(operation);

            expect(wrapped.getCircuitBreaker()).toBeInstanceOf(CircuitBreaker);
        });
    });
});
