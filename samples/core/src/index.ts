// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * @ccaas/core - Shared library for D365 Contact Center CTI Drivers
 *
 * This package provides:
 * - BaseCTIDriver: Abstract base class for CTI driver implementations
 * - Utilities: Script loading, logging, event bus
 *
 * @example
 * ```typescript
 * import { BaseCTIDriver, createLogger } from '@ccaas/core';
 *
 * class MyDriver extends BaseCTIDriver {
 *     protected async loadPlatformLibrary() { ... }
 *     protected performScreenPop(data) { ... }
 *     protected bindPlatformSpecificEvents() { ... }
 * }
 * ```
 */

// Base class
export { BaseCTIDriver, CTIDriverConfig, CTIDriverEvents } from './BaseCTIDriver';

// Utilities
export {
    loadScript,
    loadScriptsSequential,
    loadScriptsParallel,
    ScriptLoadError,
    ScriptLoadOptions,
    preloadResource,
    preloadScript,
    prefetchResource,
    preconnect,
    dnsPrefetch,
    removeResourceHint,
    PreloadOptions,
    PreloadAs
} from './utils/scriptLoader';

export {
    Logger,
    LogLevel,
    LogEntry,
    LoggerConfig,
    createLogger,
    configureLogger,
    getLoggerConfig
} from './utils/logger';

export {
    EventBus,
    EventBusOptions,
    EventHandler,
    Subscription,
    createEventBus,
    globalEventBus
} from './utils/eventBus';

export {
    debounce,
    throttle,
    scheduleIdleTask,
    cancelIdleTask,
    batch,
    memoize
} from './utils/performance';

export {
    ObjectPool,
    ObjectPoolOptions,
    ObjectFactory,
    ObjectReset,
    createObjectPool,
    createSimpleObjectPool,
    createArrayPool
} from './utils/objectPool';
