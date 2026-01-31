// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import {
    ObjectPool,
    createObjectPool,
    createSimpleObjectPool,
    createArrayPool
} from '../objectPool';

describe('ObjectPool', () => {
    describe('constructor', () => {
        it('should create empty pool by default', () => {
            const pool = new ObjectPool({
                factory: () => ({ value: 0 })
            });
            expect(pool.size).toBe(0);
        });

        it('should pre-populate pool with initialSize', () => {
            const pool = new ObjectPool({
                factory: () => ({ value: 0 }),
                initialSize: 5
            });
            expect(pool.size).toBe(5);
        });

        it('should respect maxSize during initialization', () => {
            const pool = new ObjectPool({
                factory: () => ({ value: 0 }),
                initialSize: 100,
                maxSize: 10
            });
            expect(pool.size).toBe(10);
        });

        it('should use default maxSize of 100', () => {
            const pool = new ObjectPool({
                factory: () => ({ value: 0 })
            });
            expect(pool.capacity).toBe(100);
        });
    });

    describe('acquire', () => {
        it('should create new object when pool is empty', () => {
            const factory = jest.fn(() => ({ value: 42 }));
            const pool = new ObjectPool({ factory });

            const obj = pool.acquire();

            expect(obj).toEqual({ value: 42 });
            expect(factory).toHaveBeenCalledTimes(1);
        });

        it('should reuse object from pool when available', () => {
            const factory = jest.fn(() => ({ value: 0 }));
            const pool = new ObjectPool({ factory, initialSize: 1 });

            const obj1 = pool.acquire();
            expect(factory).toHaveBeenCalledTimes(1); // Only called during init

            pool.release(obj1);
            const obj2 = pool.acquire();

            expect(obj2).toBe(obj1); // Same object reused
            expect(factory).toHaveBeenCalledTimes(1); // No new creation
        });

        it('should track acquire count', () => {
            const pool = new ObjectPool({
                factory: () => ({ value: 0 }),
                initialSize: 5
            });

            pool.acquire();
            pool.acquire();
            pool.acquire();

            const stats = pool.getStats();
            expect(stats.acquireCount).toBe(3);
        });
    });

    describe('release', () => {
        it('should return object to pool', () => {
            const pool = new ObjectPool({
                factory: () => ({ value: 0 })
            });

            const obj = pool.acquire();
            expect(pool.size).toBe(0);

            pool.release(obj);
            expect(pool.size).toBe(1);
        });

        it('should call reset function when releasing', () => {
            const reset = jest.fn();
            const pool = new ObjectPool({
                factory: () => ({ value: 0 }),
                reset
            });

            const obj = pool.acquire();
            obj.value = 42;
            pool.release(obj);

            expect(reset).toHaveBeenCalledWith(obj);
        });

        it('should not exceed maxSize', () => {
            const pool = new ObjectPool({
                factory: () => ({ value: 0 }),
                maxSize: 2
            });

            const obj1 = pool.acquire();
            const obj2 = pool.acquire();
            const obj3 = pool.acquire();

            pool.release(obj1);
            pool.release(obj2);
            pool.release(obj3);

            expect(pool.size).toBe(2); // Only 2 kept, obj3 discarded
        });
    });

    describe('clear', () => {
        it('should remove all objects from pool', () => {
            const pool = new ObjectPool({
                factory: () => ({ value: 0 }),
                initialSize: 5
            });

            expect(pool.size).toBe(5);
            pool.clear();
            expect(pool.size).toBe(0);
        });
    });

    describe('prewarm', () => {
        it('should pre-populate pool to specified count', () => {
            const pool = new ObjectPool({
                factory: () => ({ value: 0 })
            });

            pool.prewarm(10);
            expect(pool.size).toBe(10);
        });

        it('should not exceed maxSize', () => {
            const pool = new ObjectPool({
                factory: () => ({ value: 0 }),
                maxSize: 5
            });

            pool.prewarm(100);
            expect(pool.size).toBe(5);
        });

        it('should not reduce existing pool size', () => {
            const pool = new ObjectPool({
                factory: () => ({ value: 0 }),
                initialSize: 10
            });

            pool.prewarm(5);
            expect(pool.size).toBe(10);
        });
    });

    describe('getStats', () => {
        it('should track pool statistics', () => {
            const pool = new ObjectPool({
                factory: () => ({ value: 0 }),
                maxSize: 10
            });

            // Acquire 3 objects (all new)
            const obj1 = pool.acquire();
            const obj2 = pool.acquire();
            const obj3 = pool.acquire();

            // Release 2
            pool.release(obj1);
            pool.release(obj2);

            // Acquire 2 more (reused)
            pool.acquire();
            pool.acquire();

            const stats = pool.getStats();
            expect(stats.acquireCount).toBe(5);
            expect(stats.createCount).toBe(3);
            expect(stats.reuseCount).toBe(2);
            expect(stats.hitRate).toBe(0.4); // 2/5
        });

        it('should return 0 hitRate when no acquires', () => {
            const pool = new ObjectPool({
                factory: () => ({ value: 0 })
            });

            const stats = pool.getStats();
            expect(stats.hitRate).toBe(0);
        });
    });

    describe('resetStats', () => {
        it('should reset all counters', () => {
            const pool = new ObjectPool({
                factory: () => ({ value: 0 })
            });

            pool.acquire();
            pool.acquire();

            pool.resetStats();

            const stats = pool.getStats();
            expect(stats.acquireCount).toBe(0);
            expect(stats.createCount).toBe(0);
            expect(stats.reuseCount).toBe(0);
        });
    });
});

describe('createObjectPool', () => {
    it('should create ObjectPool instance', () => {
        const pool = createObjectPool({
            factory: () => ({ value: 0 })
        });
        expect(pool).toBeInstanceOf(ObjectPool);
    });
});

describe('createSimpleObjectPool', () => {
    it('should create pool with template object', () => {
        const pool = createSimpleObjectPool({ a: 1, b: 'test', c: true });

        const obj = pool.acquire();
        expect(obj).toEqual({ a: 1, b: 'test', c: true });
    });

    it('should reset object to template values', () => {
        const pool = createSimpleObjectPool({ value: 0 });

        const obj = pool.acquire();
        obj.value = 42;
        pool.release(obj);

        const obj2 = pool.acquire();
        expect(obj2.value).toBe(0);
    });

    it('should use custom maxSize', () => {
        const pool = createSimpleObjectPool({ value: 0 }, 5);
        expect(pool.capacity).toBe(5);
    });
});

describe('createArrayPool', () => {
    it('should create pool of arrays', () => {
        const pool = createArrayPool(0, 5);

        const arr = pool.acquire();
        expect(arr).toEqual([0, 0, 0, 0, 0]);
        expect(arr.length).toBe(5);
    });

    it('should reset array values on release', () => {
        const pool = createArrayPool(0, 3);

        const arr = pool.acquire();
        arr[0] = 1;
        arr[1] = 2;
        arr[2] = 3;
        pool.release(arr);

        const arr2 = pool.acquire();
        expect(arr2).toEqual([0, 0, 0]);
    });

    it('should use custom maxPoolSize', () => {
        const pool = createArrayPool(0, 5, 10);
        expect(pool.capacity).toBe(10);
    });
});
