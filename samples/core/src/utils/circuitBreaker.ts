// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * Circuit Breaker pattern implementation
 *
 * Prevents cascading failures by failing fast when a service is unhealthy.
 * The circuit breaker has three states:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Service is unhealthy, requests fail immediately
 * - HALF_OPEN: Testing if service has recovered
 *
 * @example
 * ```typescript
 * import { CircuitBreaker } from '@ccaas/core';
 *
 * const breaker = new CircuitBreaker({
 *     failureThreshold: 5,
 *     successThreshold: 2,
 *     timeout: 30000
 * });
 *
 * try {
 *     const result = await breaker.execute(() => fetchData());
 * } catch (error) {
 *     if (error instanceof CircuitOpenError) {
 *         console.log('Service is unavailable, try again later');
 *     }
 * }
 * ```
 */

/**
 * Circuit breaker states
 */
export enum CircuitState {
    /** Normal operation - requests pass through */
    CLOSED = 'closed',
    /** Service unhealthy - requests fail immediately */
    OPEN = 'open',
    /** Testing recovery - limited requests allowed */
    HALF_OPEN = 'half_open'
}

/**
 * Configuration options for circuit breaker
 */
export interface CircuitBreakerOptions {
    /** Number of failures before opening circuit (default: 5) */
    failureThreshold?: number;

    /** Number of successes in half-open state to close circuit (default: 2) */
    successThreshold?: number;

    /** Time in ms before attempting recovery (default: 30000) */
    timeout?: number;

    /** Callback when state changes */
    onStateChange?: (from: CircuitState, to: CircuitState) => void;

    /** Callback when circuit opens */
    onOpen?: (error: Error, failures: number) => void;

    /** Callback when circuit closes */
    onClose?: (successes: number) => void;

    /** Callback when circuit enters half-open state */
    onHalfOpen?: () => void;
}

/**
 * Circuit breaker statistics
 */
export interface CircuitBreakerStats {
    /** Current state */
    state: CircuitState;
    /** Consecutive failures in current period */
    failures: number;
    /** Consecutive successes in half-open state */
    successes: number;
    /** Total requests made */
    totalRequests: number;
    /** Total failures */
    totalFailures: number;
    /** Total successes */
    totalSuccesses: number;
    /** Time of last failure */
    lastFailure?: Date;
    /** Time of last success */
    lastSuccess?: Date;
    /** Time when circuit was opened */
    openedAt?: Date;
}

/**
 * Error thrown when circuit is open
 */
export class CircuitOpenError extends Error {
    constructor(
        message: string = 'Circuit breaker is open',
        public readonly state: CircuitState,
        public readonly remainingTimeMs?: number
    ) {
        super(message);
        this.name = 'CircuitOpenError';
    }
}

/**
 * Default configuration values
 */
const DEFAULT_OPTIONS: Required<Omit<CircuitBreakerOptions, 'onStateChange' | 'onOpen' | 'onClose' | 'onHalfOpen'>> = {
    failureThreshold: 5,
    successThreshold: 2,
    timeout: 30000
};

/**
 * Circuit Breaker implementation
 *
 * Monitors the health of an external service and prevents requests
 * when the service is unhealthy, allowing it time to recover.
 */
export class CircuitBreaker {
    private state: CircuitState = CircuitState.CLOSED;
    private failures: number = 0;
    private successes: number = 0;
    private lastFailure?: Date;
    private lastSuccess?: Date;
    private openedAt?: Date;
    private totalRequests: number = 0;
    private totalFailures: number = 0;
    private totalSuccesses: number = 0;

    private readonly failureThreshold: number;
    private readonly successThreshold: number;
    private readonly timeout: number;
    private readonly onStateChange?: (from: CircuitState, to: CircuitState) => void;
    private readonly onOpen?: (error: Error, failures: number) => void;
    private readonly onClose?: (successes: number) => void;
    private readonly onHalfOpen?: () => void;

    constructor(options?: CircuitBreakerOptions) {
        const opts = { ...DEFAULT_OPTIONS, ...options };
        this.failureThreshold = opts.failureThreshold;
        this.successThreshold = opts.successThreshold;
        this.timeout = opts.timeout;
        this.onStateChange = options?.onStateChange;
        this.onOpen = options?.onOpen;
        this.onClose = options?.onClose;
        this.onHalfOpen = options?.onHalfOpen;
    }

    /**
     * Execute an operation through the circuit breaker
     *
     * @param operation - The async operation to execute
     * @returns Promise resolving to the operation result
     * @throws CircuitOpenError if circuit is open
     * @throws The operation's error if it fails
     */
    async execute<T>(operation: () => Promise<T>): Promise<T> {
        this.totalRequests++;

        // Check if we should transition from OPEN to HALF_OPEN
        if (this.state === CircuitState.OPEN) {
            if (this.shouldAttemptRecovery()) {
                this.transitionTo(CircuitState.HALF_OPEN);
            } else {
                const remainingTime = this.getRemainingTimeout();
                throw new CircuitOpenError(
                    `Circuit breaker is open. Retry after ${remainingTime}ms`,
                    this.state,
                    remainingTime
                );
            }
        }

        try {
            const result = await operation();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure(error instanceof Error ? error : new Error(String(error)));
            throw error;
        }
    }

    /**
     * Get current circuit state
     */
    getState(): CircuitState {
        // Auto-transition to half-open if timeout has passed
        if (this.state === CircuitState.OPEN && this.shouldAttemptRecovery()) {
            this.transitionTo(CircuitState.HALF_OPEN);
        }
        return this.state;
    }

    /**
     * Get circuit breaker statistics
     */
    getStats(): CircuitBreakerStats {
        return {
            state: this.getState(),
            failures: this.failures,
            successes: this.successes,
            totalRequests: this.totalRequests,
            totalFailures: this.totalFailures,
            totalSuccesses: this.totalSuccesses,
            lastFailure: this.lastFailure,
            lastSuccess: this.lastSuccess,
            openedAt: this.openedAt
        };
    }

    /**
     * Manually reset the circuit breaker to closed state
     */
    reset(): void {
        this.transitionTo(CircuitState.CLOSED);
        this.failures = 0;
        this.successes = 0;
        this.openedAt = undefined;
    }

    /**
     * Force the circuit to open
     */
    trip(): void {
        if (this.state !== CircuitState.OPEN) {
            this.transitionTo(CircuitState.OPEN);
        }
    }

    /**
     * Check if circuit is allowing requests
     */
    isAllowingRequests(): boolean {
        const state = this.getState();
        return state === CircuitState.CLOSED || state === CircuitState.HALF_OPEN;
    }

    private onSuccess(): void {
        this.lastSuccess = new Date();
        this.totalSuccesses++;

        switch (this.state) {
            case CircuitState.HALF_OPEN:
                this.successes++;
                if (this.successes >= this.successThreshold) {
                    this.transitionTo(CircuitState.CLOSED);
                }
                break;

            case CircuitState.CLOSED:
                // Reset failure count on success
                this.failures = 0;
                break;
        }
    }

    private onFailure(error: Error): void {
        this.lastFailure = new Date();
        this.totalFailures++;

        switch (this.state) {
            case CircuitState.HALF_OPEN:
                // Any failure in half-open state reopens the circuit
                this.transitionTo(CircuitState.OPEN);
                this.onOpen?.(error, this.failures);
                break;

            case CircuitState.CLOSED:
                this.failures++;
                if (this.failures >= this.failureThreshold) {
                    this.transitionTo(CircuitState.OPEN);
                    this.onOpen?.(error, this.failures);
                }
                break;
        }
    }

    private transitionTo(newState: CircuitState): void {
        if (this.state === newState) {
            return;
        }

        const previousState = this.state;
        this.state = newState;

        // Reset counters on state transition
        switch (newState) {
            case CircuitState.OPEN:
                this.openedAt = new Date();
                this.successes = 0;
                break;

            case CircuitState.HALF_OPEN:
                this.successes = 0;
                this.failures = 0;
                this.onHalfOpen?.();
                break;

            case CircuitState.CLOSED:
                this.failures = 0;
                this.successes = 0;
                this.openedAt = undefined;
                this.onClose?.(this.totalSuccesses);
                break;
        }

        this.onStateChange?.(previousState, newState);
    }

    private shouldAttemptRecovery(): boolean {
        if (!this.openedAt) {
            return true;
        }
        return Date.now() - this.openedAt.getTime() >= this.timeout;
    }

    private getRemainingTimeout(): number {
        if (!this.openedAt) {
            return 0;
        }
        const elapsed = Date.now() - this.openedAt.getTime();
        return Math.max(0, this.timeout - elapsed);
    }
}

/**
 * Create a circuit breaker instance with the given options
 */
export function createCircuitBreaker(options?: CircuitBreakerOptions): CircuitBreaker {
    return new CircuitBreaker(options);
}

/**
 * Wrap a function with circuit breaker protection
 *
 * @param operation - The async function to wrap
 * @param options - Circuit breaker options
 * @returns A wrapped function that uses the circuit breaker
 */
export function withCircuitBreaker<T extends (...args: any[]) => Promise<any>>(
    operation: T,
    options?: CircuitBreakerOptions
): T & { getCircuitBreaker: () => CircuitBreaker } {
    const breaker = new CircuitBreaker(options);

    const wrapped = (async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
        return breaker.execute(() => operation(...args));
    }) as T & { getCircuitBreaker: () => CircuitBreaker };

    wrapped.getCircuitBreaker = () => breaker;

    return wrapped;
}
