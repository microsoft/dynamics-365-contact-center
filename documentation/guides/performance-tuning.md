# Performance Tuning Guide

This guide covers performance optimization techniques for CTI drivers.

## Bundle Size Optimization

### Tree Shaking

Import only what you need:

```typescript
// Good: Named imports enable tree shaking
import { withRetry, CircuitBreaker } from '@ccaas/core';

// Avoid: Importing entire module
import * as core from '@ccaas/core';
```

### Production Builds

Always use production mode for deployment:

```bash
npm run build:prod
```

Production builds include:
- Minification with Terser
- Dead code elimination
- Content hashing for cache busting

### Analyze Bundle Size

Use the analyze script to inspect bundle composition:

```bash
npm run build:analyze
```

This opens an interactive visualization showing:
- Module sizes
- Duplicate dependencies
- Optimization opportunities

## Lazy Loading

### Event Binding

Bind events only when needed:

```typescript
class MyDriver {
    private eventsInitialized = false;

    async initialize(): Promise<boolean> {
        // Don't bind all events immediately
        return true;
    }

    ensureEventsInitialized(): void {
        if (this.eventsInitialized) return;

        const embedSDK = window.Microsoft?.CCaaS?.EmbedSDK;
        if (!embedSDK) return;

        // Bind events only when first needed
        embedSDK.conversation.onConversationLoaded(this.handleConversation);
        this.eventsInitialized = true;
    }

    private handleConversation = (data: any) => {
        console.log('Conversation loaded:', data);
    };
}
```

### Dynamic Imports

Load optional features on demand:

```typescript
async function loadAdvancedFeatures() {
    // Only load when user needs feature
    const { AdvancedAnalytics } = await import('./advancedAnalytics');
    return new AdvancedAnalytics();
}
```

## Debouncing and Throttling

### Debounce High-Frequency Events

```typescript
function debounce<T extends (...args: any[]) => void>(
    fn: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timeoutId: number | undefined;

    return (...args: Parameters<T>) => {
        clearTimeout(timeoutId);
        timeoutId = window.setTimeout(() => fn(...args), delay);
    };
}

// Usage
const embedSDK = window.Microsoft?.CCaaS?.EmbedSDK;

// Debounce panel size changes
const handleHeightChange = debounce((height: number) => {
    updateLayout(height);
}, 100);

embedSDK?.ctiDriver.onSoftPhonePanelHeightChange(handleHeightChange);
```

### Throttle API Calls

```typescript
function throttle<T extends (...args: any[]) => void>(
    fn: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle = false;

    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            fn(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Usage: Limit presence sync to once per second
const syncPresence = throttle((presence: IPresence) => {
    externalApi.updatePresence(presence);
}, 1000);
```

## Memory Management

### Event Listener Cleanup

Always clean up listeners when done:

```typescript
class MyDriver {
    private listeners: Array<() => void> = [];

    bindEvents(): void {
        const embedSDK = window.Microsoft?.CCaaS?.EmbedSDK;
        if (!embedSDK) return;

        // Store cleanup functions
        const unsubConversation = embedSDK.conversation.onConversationLoaded(
            this.handleConversation
        );
        this.listeners.push(unsubConversation);

        const unsubPresence = embedSDK.presence.onPresenceChange(
            this.handlePresence
        );
        this.listeners.push(unsubPresence);
    }

    dispose(): void {
        // Clean up all listeners
        this.listeners.forEach(unsubscribe => unsubscribe());
        this.listeners = [];
    }
}
```

### Avoid Memory Leaks

Common leak patterns and fixes:

```typescript
// BAD: Creates new function on each call
element.addEventListener('click', () => this.handleClick());

// GOOD: Use bound method
private handleClick = () => { /* ... */ };
element.addEventListener('click', this.handleClick);

// BAD: Never cleared interval
setInterval(() => this.poll(), 1000);

// GOOD: Store and clear reference
private pollInterval?: number;

startPolling(): void {
    this.pollInterval = window.setInterval(() => this.poll(), 1000);
}

stopPolling(): void {
    if (this.pollInterval) {
        clearInterval(this.pollInterval);
        this.pollInterval = undefined;
    }
}
```

### Object Pooling

Reuse objects for frequent operations:

```typescript
class ObjectPool<T> {
    private pool: T[] = [];
    private factory: () => T;
    private reset: (obj: T) => void;

    constructor(factory: () => T, reset: (obj: T) => void, initialSize = 10) {
        this.factory = factory;
        this.reset = reset;

        // Pre-allocate objects
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(factory());
        }
    }

    acquire(): T {
        return this.pool.pop() ?? this.factory();
    }

    release(obj: T): void {
        this.reset(obj);
        this.pool.push(obj);
    }
}

// Usage for frequently created objects
const eventPool = new ObjectPool(
    () => ({ type: '', data: null, timestamp: 0 }),
    (obj) => { obj.type = ''; obj.data = null; obj.timestamp = 0; }
);

function logEvent(type: string, data: any): void {
    const event = eventPool.acquire();
    event.type = type;
    event.data = data;
    event.timestamp = Date.now();

    processEvent(event);

    eventPool.release(event);
}
```

## Network Optimization

### Batch API Calls

```typescript
class BatchedApiClient {
    private queue: Array<{
        request: () => Promise<any>;
        resolve: (value: any) => void;
        reject: (error: any) => void;
    }> = [];
    private flushTimeout?: number;

    enqueue<T>(request: () => Promise<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            this.queue.push({ request, resolve, reject });

            if (!this.flushTimeout) {
                this.flushTimeout = window.setTimeout(() => this.flush(), 50);
            }
        });
    }

    private async flush(): Promise<void> {
        this.flushTimeout = undefined;
        const batch = this.queue.splice(0);

        // Execute all requests in parallel
        await Promise.allSettled(
            batch.map(async ({ request, resolve, reject }) => {
                try {
                    resolve(await request());
                } catch (error) {
                    reject(error);
                }
            })
        );
    }
}
```

### Connection Keep-Alive

```typescript
// Reuse connections for multiple requests
const client = {
    baseUrl: 'https://api.example.com',

    async fetch(endpoint: string, options?: RequestInit): Promise<Response> {
        return fetch(`${this.baseUrl}${endpoint}`, {
            ...options,
            keepalive: true,
            headers: {
                'Connection': 'keep-alive',
                ...options?.headers
            }
        });
    }
};
```

## Caching Strategies

### In-Memory Cache

```typescript
class Cache<K, V> {
    private cache = new Map<K, { value: V; expires: number }>();
    private defaultTtl: number;

    constructor(defaultTtlMs = 60000) {
        this.defaultTtl = defaultTtlMs;
    }

    set(key: K, value: V, ttlMs?: number): void {
        this.cache.set(key, {
            value,
            expires: Date.now() + (ttlMs ?? this.defaultTtl)
        });
    }

    get(key: K): V | undefined {
        const entry = this.cache.get(key);
        if (!entry) return undefined;

        if (Date.now() > entry.expires) {
            this.cache.delete(key);
            return undefined;
        }

        return entry.value;
    }

    clear(): void {
        this.cache.clear();
    }
}

// Usage
const userCache = new Cache<string, User>(300000); // 5 minute TTL

async function getUser(userId: string): Promise<User> {
    const cached = userCache.get(userId);
    if (cached) return cached;

    const user = await fetchUser(userId);
    userCache.set(userId, user);
    return user;
}
```

### Cache with Stale-While-Revalidate

```typescript
async function getWithRevalidate<T>(
    key: string,
    fetcher: () => Promise<T>,
    cache: Cache<string, T>,
    ttlMs: number
): Promise<T> {
    const cached = cache.get(key);

    // Return stale data immediately, refresh in background
    if (cached !== undefined) {
        // Revalidate in background
        fetcher().then(fresh => cache.set(key, fresh, ttlMs));
        return cached;
    }

    // No cache, wait for fresh data
    const fresh = await fetcher();
    cache.set(key, fresh, ttlMs);
    return fresh;
}
```

## Profiling and Monitoring

### Performance Marks

```typescript
function measureOperation(name: string) {
    performance.mark(`${name}-start`);

    return {
        end(): number {
            performance.mark(`${name}-end`);
            performance.measure(name, `${name}-start`, `${name}-end`);

            const measure = performance.getEntriesByName(name)[0];
            performance.clearMarks(`${name}-start`);
            performance.clearMarks(`${name}-end`);
            performance.clearMeasures(name);

            return measure.duration;
        }
    };
}

// Usage
const timer = measureOperation('api-call');
const result = await fetchData();
const duration = timer.end();
console.log(`API call took ${duration}ms`);
```

### Telemetry Integration

```typescript
import { getTelemetry } from '@ccaas/core';

const telemetry = getTelemetry();

async function trackedOperation<T>(
    name: string,
    operation: () => Promise<T>
): Promise<T> {
    const start = performance.now();
    try {
        const result = await operation();
        telemetry.trackPerformance(name, performance.now() - start);
        return result;
    } catch (error) {
        telemetry.trackError(name, error as Error);
        throw error;
    }
}
```

## Performance Checklist

- [ ] Use production builds for deployment
- [ ] Enable tree shaking with named imports
- [ ] Debounce high-frequency UI events
- [ ] Throttle API calls to external services
- [ ] Clean up event listeners on dispose
- [ ] Cache frequently accessed data
- [ ] Batch multiple API calls when possible
- [ ] Lazy load optional features
- [ ] Profile and measure critical paths
- [ ] Monitor bundle size with analyzer

## See Also

- [Error Handling Guide](./error-handling.md) - Includes retry patterns that affect performance
- [Telemetry Guide](./telemetry.md) - Performance monitoring
- [CTI Driver Development](./cti-driver-development.md) - Architecture best practices
