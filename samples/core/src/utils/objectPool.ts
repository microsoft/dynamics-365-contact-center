// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * Factory function to create new objects
 */
export type ObjectFactory<T> = () => T;

/**
 * Reset function to clean object before reuse
 */
export type ObjectReset<T> = (obj: T) => void;

/**
 * Configuration options for ObjectPool
 */
export interface ObjectPoolOptions<T> {
    /** Factory function to create new objects */
    factory: ObjectFactory<T>;
    /** Optional reset function called when object is released back to pool */
    reset?: ObjectReset<T>;
    /** Maximum pool size (default: 100) */
    maxSize?: number;
    /** Initial pool size - pre-populate with objects (default: 0) */
    initialSize?: number;
}

/**
 * Object pool for reusing frequently created objects.
 * Reduces garbage collection pressure for high-frequency operations.
 *
 * @example
 * ```typescript
 * // Create a pool for log entries
 * const logEntryPool = new ObjectPool({
 *     factory: () => ({ timestamp: null, level: 0, message: '' }),
 *     reset: (entry) => {
 *         entry.timestamp = null;
 *         entry.level = 0;
 *         entry.message = '';
 *     },
 *     maxSize: 50
 * });
 *
 * // Acquire an object from the pool
 * const entry = logEntryPool.acquire();
 * entry.timestamp = new Date();
 * entry.level = 1;
 * entry.message = 'Hello';
 *
 * // Release back to pool when done
 * logEntryPool.release(entry);
 * ```
 */
export class ObjectPool<T> {
    private pool: T[] = [];
    private readonly factory: ObjectFactory<T>;
    private readonly reset?: ObjectReset<T>;
    private readonly maxSize: number;

    /** Number of times acquire was called */
    private acquireCount = 0;
    /** Number of times a new object was created (cache miss) */
    private createCount = 0;
    /** Number of times an object was reused (cache hit) */
    private reuseCount = 0;

    constructor(options: ObjectPoolOptions<T>) {
        this.factory = options.factory;
        this.reset = options.reset;
        this.maxSize = options.maxSize ?? 100;

        // Pre-populate pool if initialSize specified
        const initialSize = options.initialSize ?? 0;
        for (let i = 0; i < initialSize && i < this.maxSize; i++) {
            this.pool.push(this.factory());
        }
    }

    /**
     * Acquire an object from the pool.
     * Returns a pooled object if available, otherwise creates a new one.
     */
    acquire(): T {
        this.acquireCount++;

        if (this.pool.length > 0) {
            this.reuseCount++;
            return this.pool.pop()!;
        }

        this.createCount++;
        return this.factory();
    }

    /**
     * Release an object back to the pool.
     * If the pool is full, the object is discarded.
     */
    release(obj: T): void {
        if (this.pool.length < this.maxSize) {
            if (this.reset) {
                this.reset(obj);
            }
            this.pool.push(obj);
        }
        // If pool is full, object is left for garbage collection
    }

    /**
     * Get the current number of objects in the pool
     */
    get size(): number {
        return this.pool.length;
    }

    /**
     * Get the maximum pool size
     */
    get capacity(): number {
        return this.maxSize;
    }

    /**
     * Clear all objects from the pool
     */
    clear(): void {
        this.pool = [];
    }

    /**
     * Pre-warm the pool by creating objects up to the specified count
     */
    prewarm(count: number): void {
        const targetSize = Math.min(count, this.maxSize);
        while (this.pool.length < targetSize) {
            this.pool.push(this.factory());
        }
    }

    /**
     * Get pool statistics for monitoring
     */
    getStats(): {
        poolSize: number;
        maxSize: number;
        acquireCount: number;
        createCount: number;
        reuseCount: number;
        hitRate: number;
    } {
        const hitRate = this.acquireCount > 0
            ? this.reuseCount / this.acquireCount
            : 0;

        return {
            poolSize: this.pool.length,
            maxSize: this.maxSize,
            acquireCount: this.acquireCount,
            createCount: this.createCount,
            reuseCount: this.reuseCount,
            hitRate: Math.round(hitRate * 100) / 100
        };
    }

    /**
     * Reset statistics
     */
    resetStats(): void {
        this.acquireCount = 0;
        this.createCount = 0;
        this.reuseCount = 0;
    }
}

/**
 * Create an object pool with the given configuration
 */
export function createObjectPool<T>(options: ObjectPoolOptions<T>): ObjectPool<T> {
    return new ObjectPool(options);
}

/**
 * Pre-configured pool for simple objects (plain objects with known properties)
 */
export function createSimpleObjectPool<T extends Record<string, unknown>>(
    template: T,
    maxSize = 100
): ObjectPool<T> {
    const keys = Object.keys(template);
    const defaultValues = { ...template };

    return new ObjectPool<T>({
        factory: () => ({ ...template }),
        reset: (obj) => {
            for (const key of keys) {
                (obj as Record<string, unknown>)[key] = defaultValues[key];
            }
        },
        maxSize
    });
}

/**
 * Pool for array buffers (useful for binary data processing)
 */
export function createArrayPool<T>(
    initialValue: T,
    arraySize: number,
    maxPoolSize = 50
): ObjectPool<T[]> {
    return new ObjectPool<T[]>({
        factory: () => new Array(arraySize).fill(initialValue),
        reset: (arr) => arr.fill(initialValue),
        maxSize: maxPoolSize
    });
}
