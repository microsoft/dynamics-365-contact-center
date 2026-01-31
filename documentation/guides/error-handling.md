# Error Handling Guide

This guide covers error handling patterns and best practices for CTI drivers.

## Error Types

### CTI Driver Errors

```typescript
// Base error class for CTI operations
class CTIError extends Error {
    constructor(
        message: string,
        public code: string,
        public retryable: boolean = false
    ) {
        super(message);
        this.name = 'CTIError';
    }
}

// Specific error types
class InitializationError extends CTIError {
    constructor(message: string) {
        super(message, 'INIT_FAILED', true);
    }
}

class ConnectionError extends CTIError {
    constructor(message: string) {
        super(message, 'CONNECTION_FAILED', true);
    }
}

class AuthenticationError extends CTIError {
    constructor(message: string) {
        super(message, 'AUTH_FAILED', false);
    }
}

class TimeoutError extends CTIError {
    constructor(operation: string, timeoutMs: number) {
        super(`${operation} timed out after ${timeoutMs}ms`, 'TIMEOUT', true);
    }
}
```

## Retry Pattern

Use the retry utility for transient failures:

### Basic Usage

```typescript
import { withRetry } from '@ccaas/core';

// Simple retry with defaults (3 retries, exponential backoff)
const result = await withRetry(() => fetchUserData(userId));

if (result.success) {
    console.log('Data:', result.result);
} else {
    console.error('Failed after retries:', result.error);
}
```

### Advanced Configuration

```typescript
import { withRetry, RetryConditions } from '@ccaas/core';

const result = await withRetry(
    () => callExternalApi(),
    {
        maxRetries: 5,
        initialDelayMs: 500,
        maxDelayMs: 10000,
        backoffFactor: 2,
        jitter: true,
        retryCondition: RetryConditions.any(
            RetryConditions.networkErrors,
            RetryConditions.serverErrors
        ),
        onRetry: (error, attempt, delay) => {
            console.log(`Retry ${attempt} after ${delay}ms: ${error.message}`);
        }
    }
);
```

### Retry Conditions

Built-in retry conditions:

```typescript
import { RetryConditions } from '@ccaas/core';

// Retry on network errors
RetryConditions.networkErrors

// Retry on 5xx server errors
RetryConditions.serverErrors

// Retry on rate limiting (429)
RetryConditions.rateLimited

// Combine conditions
RetryConditions.any(condition1, condition2)
RetryConditions.all(condition1, condition2)
```

### Throwing on Failure

Use `withRetryOrThrow` when you want exceptions:

```typescript
import { withRetryOrThrow, RetryError } from '@ccaas/core';

try {
    const data = await withRetryOrThrow(
        () => fetchData(),
        { maxRetries: 3 }
    );
    console.log('Success:', data);
} catch (error) {
    if (error instanceof RetryError) {
        console.error(`Failed after ${error.attempts} attempts`);
        console.error('Last error:', error.lastError);
    }
}
```

## Circuit Breaker Pattern

Prevent cascading failures with circuit breaker:

### Basic Usage

```typescript
import { CircuitBreaker } from '@ccaas/core';

const breaker = new CircuitBreaker({
    failureThreshold: 5,   // Open after 5 failures
    successThreshold: 2,   // Close after 2 successes in half-open
    timeout: 30000         // Try half-open after 30 seconds
});

try {
    const result = await breaker.execute(() => callService());
    console.log('Result:', result);
} catch (error) {
    if (error.message.includes('Circuit breaker is open')) {
        console.log('Service temporarily unavailable');
    } else {
        console.error('Service error:', error);
    }
}
```

### Monitoring Circuit State

```typescript
// Check current state
const state = breaker.getState(); // 'closed', 'open', or 'half_open'

// Get statistics
const stats = breaker.getStats();
console.log(`Failures: ${stats.failures}, Successes: ${stats.successes}`);

// Manual control
breaker.reset();  // Reset to closed state
breaker.trip();   // Force open

// Check if requests allowed
if (breaker.isAllowingRequests()) {
    await breaker.execute(() => operation());
}
```

### Multiple Circuit Breakers

Use separate breakers for different services:

```typescript
class MyDriver {
    private authBreaker = new CircuitBreaker({ failureThreshold: 3 });
    private apiBreaker = new CircuitBreaker({ failureThreshold: 5 });

    async authenticate() {
        return this.authBreaker.execute(() => this.authService.login());
    }

    async fetchData() {
        return this.apiBreaker.execute(() => this.api.getData());
    }
}
```

## Timeout Handling

### Basic Timeout

```typescript
import { withTimeout, TimeoutError } from '@ccaas/core';

try {
    const result = await withTimeout(
        longRunningOperation(),
        5000 // 5 second timeout
    );
} catch (error) {
    if (error instanceof TimeoutError) {
        console.log(`Operation timed out after ${error.timeoutMs}ms`);
    }
}
```

### Abortable Operations

For operations that support cancellation:

```typescript
import { withAbortableTimeout } from '@ccaas/core';

const result = await withAbortableTimeout(
    async (signal) => {
        const response = await fetch(url, { signal });
        return response.json();
    },
    5000
);
```

### Racing Multiple Promises

```typescript
import { raceWithTimeout } from '@ccaas/core';

// First promise to resolve wins, with overall timeout
const fastest = await raceWithTimeout(
    [
        fetchFromServer1(),
        fetchFromServer2(),
        fetchFromServer3()
    ],
    10000 // 10 second timeout
);
```

## Combining Patterns

### Retry with Circuit Breaker

```typescript
import { withRetry, CircuitBreaker } from '@ccaas/core';

const breaker = new CircuitBreaker();

async function resilientCall() {
    const result = await withRetry(
        () => breaker.execute(() => callService()),
        {
            maxRetries: 3,
            retryCondition: (error) => {
                // Don't retry if circuit is open
                if (error.message.includes('Circuit breaker is open')) {
                    return false;
                }
                return true;
            }
        }
    );
    return result;
}
```

### Timeout with Retry

```typescript
import { withRetry, withTimeout } from '@ccaas/core';

const result = await withRetry(
    () => withTimeout(
        callSlowService(),
        5000
    ),
    { maxRetries: 3 }
);
```

## Error Logging and Telemetry

### Using Telemetry

```typescript
import { getTelemetry } from '@ccaas/core';

const telemetry = getTelemetry();

try {
    const result = await operation();
    telemetry.trackApiCall('operation', true, duration);
} catch (error) {
    telemetry.trackError('operation', error);
    telemetry.trackApiCall('operation', false, duration, error.message);
}
```

### Structured Error Logging

```typescript
function logError(context: string, error: Error, metadata?: object) {
    console.error(JSON.stringify({
        timestamp: new Date().toISOString(),
        context,
        error: {
            name: error.name,
            message: error.message,
            stack: error.stack
        },
        ...metadata
    }));
}
```

## Best Practices

### 1. Categorize Errors

```typescript
function isRetryable(error: Error): boolean {
    // Network errors are retryable
    if (error.name === 'NetworkError') return true;

    // Check HTTP status codes
    if ('status' in error) {
        const status = (error as any).status;
        return status >= 500 || status === 429;
    }

    return false;
}
```

### 2. Set Appropriate Timeouts

| Operation Type | Recommended Timeout |
|----------------|---------------------|
| Authentication | 10 seconds |
| API calls | 30 seconds |
| File uploads | 60 seconds |
| Batch operations | 120 seconds |

### 3. Graceful Degradation

```typescript
async function getData() {
    try {
        return await primarySource.fetch();
    } catch (error) {
        console.warn('Primary source failed, using fallback');
        return await fallbackSource.fetch();
    }
}
```

### 4. User-Friendly Messages

```typescript
function getDisplayMessage(error: Error): string {
    if (error instanceof TimeoutError) {
        return 'The operation is taking longer than expected. Please try again.';
    }
    if (error instanceof AuthenticationError) {
        return 'Your session has expired. Please sign in again.';
    }
    if (error instanceof ConnectionError) {
        return 'Unable to connect to the service. Check your network connection.';
    }
    return 'An unexpected error occurred. Please try again later.';
}
```

## See Also

- [Retry Utility API](../../samples/core/src/utils/retry.ts)
- [Circuit Breaker API](../../samples/core/src/utils/circuitBreaker.ts)
- [Timeout Utility API](../../samples/core/src/utils/timeout.ts)
- [Telemetry Guide](./telemetry.md)
