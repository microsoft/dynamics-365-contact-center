// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * Telemetry and Analytics Module
 *
 * Provides opt-in telemetry for tracking SDK usage, performance metrics,
 * and error reporting. Supports pluggable providers for different backends.
 *
 * @example
 * ```typescript
 * import { configureTelemetry, getTelemetry } from '@ccaas/core';
 *
 * // Enable telemetry with console provider (development)
 * configureTelemetry({
 *     enabled: true,
 *     provider: createConsoleProvider()
 * });
 *
 * // Track events
 * getTelemetry().trackEvent('conversation:loaded', { channel: 'voice' });
 * ```
 */

/**
 * Telemetry event structure
 */
export interface TelemetryEvent {
    /** Event name */
    name: string;
    /** Event timestamp */
    timestamp: Date;
    /** String/number/boolean properties */
    properties?: Record<string, string | number | boolean | undefined>;
    /** Numeric measurements */
    measurements?: Record<string, number>;
}

/**
 * Telemetry provider interface for custom backends
 */
export interface TelemetryProvider {
    /** Track a custom event */
    trackEvent(event: TelemetryEvent): void;
    /** Track an exception/error */
    trackException(error: Error, properties?: Record<string, string>): void;
    /** Track a metric value */
    trackMetric(name: string, value: number, properties?: Record<string, string>): void;
    /** Flush pending telemetry */
    flush(): Promise<void>;
}

/**
 * Telemetry configuration options
 */
export interface TelemetryConfig {
    /** Whether telemetry is enabled (default: false - opt-in) */
    enabled: boolean;
    /** Sampling rate from 0.0 to 1.0 (default: 1.0 = 100%) */
    samplingRate?: number;
    /** Number of events to batch before sending (default: 10) */
    batchSize?: number;
    /** Interval in ms to flush batched events (default: 30000) */
    flushInterval?: number;
    /** Custom telemetry provider */
    provider?: TelemetryProvider;
    /** Whether to redact potentially sensitive data (default: true) */
    redactPII?: boolean;
    /** Custom PII patterns to redact */
    piiPatterns?: RegExp[];
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<Omit<TelemetryConfig, 'provider' | 'piiPatterns'>> = {
    enabled: false,
    samplingRate: 1.0,
    batchSize: 10,
    flushInterval: 30000,
    redactPII: true
};

/**
 * Default PII patterns to redact
 */
const DEFAULT_PII_PATTERNS: RegExp[] = [
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email
    /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, // Phone numbers
    /\b\d{3}[-]?\d{2}[-]?\d{4}\b/g, // SSN
    /\b\d{16}\b/g, // Credit card (basic)
];

/**
 * Telemetry class for tracking SDK usage
 */
export class Telemetry {
    private config: Required<Omit<TelemetryConfig, 'provider' | 'piiPatterns'>>;
    private provider?: TelemetryProvider;
    private eventBuffer: TelemetryEvent[] = [];
    private flushTimerId?: ReturnType<typeof setInterval>;
    private piiPatterns: RegExp[];

    constructor(config: TelemetryConfig) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.provider = config.provider;
        this.piiPatterns = config.piiPatterns ?? DEFAULT_PII_PATTERNS;

        if (this.config.enabled && this.config.flushInterval > 0) {
            this.startFlushTimer();
        }
    }

    /**
     * Track driver initialization
     */
    trackDriverInitialized(
        driverName: string,
        success: boolean,
        durationMs: number
    ): void {
        this.trackEvent({
            name: 'driver:initialized',
            timestamp: new Date(),
            properties: {
                driverName,
                success
            },
            measurements: {
                durationMs
            }
        });
    }

    /**
     * Track an error occurrence
     */
    trackError(context: string, error: Error): void {
        if (!this.shouldTrack()) return;

        this.provider?.trackException(error, {
            context,
            errorName: error.name,
            errorMessage: this.redactIfNeeded(error.message)
        });
    }

    /**
     * Track performance metrics
     */
    trackPerformance(operation: string, durationMs: number, properties?: Record<string, string>): void {
        if (!this.shouldTrack()) return;

        this.provider?.trackMetric(`performance:${operation}`, durationMs, properties);
    }

    /**
     * Track a custom event
     */
    trackEvent(event: TelemetryEvent): void {
        if (!this.shouldTrack()) return;

        const processedEvent = this.processEvent(event);

        if (this.provider) {
            this.eventBuffer.push(processedEvent);

            if (this.eventBuffer.length >= this.config.batchSize) {
                this.flushSync();
            }
        }
    }

    /**
     * Track conversation events
     */
    trackConversationEvent(
        eventName: string,
        conversationId: string,
        properties?: Record<string, string | number | boolean>
    ): void {
        this.trackEvent({
            name: `conversation:${eventName}`,
            timestamp: new Date(),
            properties: {
                conversationId: this.redactIfNeeded(conversationId),
                ...properties
            }
        });
    }

    /**
     * Track SDK API calls
     */
    trackApiCall(
        apiName: string,
        success: boolean,
        durationMs: number,
        errorMessage?: string
    ): void {
        this.trackEvent({
            name: 'api:call',
            timestamp: new Date(),
            properties: {
                apiName,
                success,
                errorMessage: errorMessage ? this.redactIfNeeded(errorMessage) : undefined
            },
            measurements: {
                durationMs
            }
        });
    }

    /**
     * Track feature usage
     */
    trackFeatureUsage(featureName: string, properties?: Record<string, string | number | boolean>): void {
        this.trackEvent({
            name: `feature:${featureName}`,
            timestamp: new Date(),
            properties
        });
    }

    /**
     * Enable telemetry
     */
    enable(): void {
        this.config.enabled = true;
        if (this.config.flushInterval > 0 && !this.flushTimerId) {
            this.startFlushTimer();
        }
    }

    /**
     * Disable telemetry
     */
    disable(): void {
        this.config.enabled = false;
        this.stopFlushTimer();
    }

    /**
     * Check if telemetry is enabled
     */
    isEnabled(): boolean {
        return this.config.enabled;
    }

    /**
     * Flush pending events
     */
    async flush(): Promise<void> {
        if (!this.provider || this.eventBuffer.length === 0) return;

        const events = [...this.eventBuffer];
        this.eventBuffer = [];

        for (const event of events) {
            this.provider.trackEvent(event);
        }

        await this.provider.flush();
    }

    /**
     * Update configuration
     */
    configure(config: Partial<TelemetryConfig>): void {
        if (config.enabled !== undefined) {
            this.config.enabled = config.enabled;
        }
        if (config.samplingRate !== undefined) {
            this.config.samplingRate = config.samplingRate;
        }
        if (config.batchSize !== undefined) {
            this.config.batchSize = config.batchSize;
        }
        if (config.flushInterval !== undefined) {
            this.config.flushInterval = config.flushInterval;
            this.stopFlushTimer();
            if (this.config.enabled && this.config.flushInterval > 0) {
                this.startFlushTimer();
            }
        }
        if (config.provider !== undefined) {
            this.provider = config.provider;
        }
        if (config.redactPII !== undefined) {
            this.config.redactPII = config.redactPII;
        }
        if (config.piiPatterns !== undefined) {
            this.piiPatterns = config.piiPatterns;
        }
    }

    /**
     * Get current configuration
     */
    getConfig(): TelemetryConfig {
        return {
            ...this.config,
            provider: this.provider,
            piiPatterns: this.piiPatterns
        };
    }

    /**
     * Destroy telemetry instance
     */
    destroy(): void {
        this.stopFlushTimer();
        this.eventBuffer = [];
    }

    private shouldTrack(): boolean {
        if (!this.config.enabled) return false;
        if (this.config.samplingRate < 1.0) {
            return Math.random() < this.config.samplingRate;
        }
        return true;
    }

    private processEvent(event: TelemetryEvent): TelemetryEvent {
        if (!this.config.redactPII) return event;

        const processedProperties: Record<string, string | number | boolean | undefined> = {};

        if (event.properties) {
            for (const [key, value] of Object.entries(event.properties)) {
                if (typeof value === 'string') {
                    processedProperties[key] = this.redactIfNeeded(value);
                } else {
                    processedProperties[key] = value;
                }
            }
        }

        return {
            ...event,
            properties: Object.keys(processedProperties).length > 0 ? processedProperties : undefined
        };
    }

    private redactIfNeeded(value: string): string {
        if (!this.config.redactPII) return value;

        let result = value;
        for (const pattern of this.piiPatterns) {
            result = result.replace(pattern, '[REDACTED]');
        }
        return result;
    }

    private flushSync(): void {
        if (!this.provider || this.eventBuffer.length === 0) return;

        const events = [...this.eventBuffer];
        this.eventBuffer = [];

        for (const event of events) {
            this.provider.trackEvent(event);
        }
    }

    private startFlushTimer(): void {
        this.flushTimerId = setInterval(() => {
            this.flush().catch(console.error);
        }, this.config.flushInterval);
    }

    private stopFlushTimer(): void {
        if (this.flushTimerId) {
            clearInterval(this.flushTimerId);
            this.flushTimerId = undefined;
        }
    }
}

// Singleton instance
let globalTelemetry: Telemetry | null = null;

/**
 * Get the global telemetry instance
 */
export function getTelemetry(): Telemetry {
    if (!globalTelemetry) {
        globalTelemetry = new Telemetry({ enabled: false });
    }
    return globalTelemetry;
}

/**
 * Configure the global telemetry instance
 */
export function configureTelemetry(config: Partial<TelemetryConfig>): void {
    if (!globalTelemetry) {
        globalTelemetry = new Telemetry({ enabled: false, ...config });
    } else {
        globalTelemetry.configure(config);
    }
}

/**
 * Create a new Telemetry instance
 */
export function createTelemetry(config: TelemetryConfig): Telemetry {
    return new Telemetry(config);
}

// ==================== Built-in Providers ====================

/**
 * Console telemetry provider for development/debugging
 */
export function createConsoleProvider(options?: { verbose?: boolean }): TelemetryProvider {
    const verbose = options?.verbose ?? false;

    return {
        trackEvent(event: TelemetryEvent): void {
            if (verbose) {
                console.log('[Telemetry Event]', JSON.stringify(event, null, 2));
            } else {
                console.log(`[Telemetry] ${event.name}`, event.properties ?? '');
            }
        },

        trackException(error: Error, properties?: Record<string, string>): void {
            console.error('[Telemetry Exception]', error.message, properties ?? '');
        },

        trackMetric(name: string, value: number, properties?: Record<string, string>): void {
            console.log(`[Telemetry Metric] ${name}: ${value}`, properties ?? '');
        },

        async flush(): Promise<void> {
            // No-op for console provider
        }
    };
}

/**
 * No-op telemetry provider (for testing or disabled telemetry)
 */
export function createNoopProvider(): TelemetryProvider {
    return {
        trackEvent(): void {},
        trackException(): void {},
        trackMetric(): void {},
        async flush(): Promise<void> {}
    };
}

/**
 * Buffered telemetry provider that collects events for later retrieval
 */
export interface BufferedProvider extends TelemetryProvider {
    getEvents(): TelemetryEvent[];
    getExceptions(): Array<{ error: Error; properties?: Record<string, string> }>;
    getMetrics(): Array<{ name: string; value: number; properties?: Record<string, string> }>;
    clear(): void;
}

export function createBufferedProvider(): BufferedProvider {
    const events: TelemetryEvent[] = [];
    const exceptions: Array<{ error: Error; properties?: Record<string, string> }> = [];
    const metrics: Array<{ name: string; value: number; properties?: Record<string, string> }> = [];

    return {
        trackEvent(event: TelemetryEvent): void {
            events.push(event);
        },

        trackException(error: Error, properties?: Record<string, string>): void {
            exceptions.push({ error, properties });
        },

        trackMetric(name: string, value: number, properties?: Record<string, string>): void {
            metrics.push({ name, value, properties });
        },

        async flush(): Promise<void> {},

        getEvents(): TelemetryEvent[] {
            return [...events];
        },

        getExceptions(): Array<{ error: Error; properties?: Record<string, string> }> {
            return [...exceptions];
        },

        getMetrics(): Array<{ name: string; value: number; properties?: Record<string, string> }> {
            return [...metrics];
        },

        clear(): void {
            events.length = 0;
            exceptions.length = 0;
            metrics.length = 0;
        }
    };
}

/**
 * Composite provider that sends to multiple providers
 */
export function createCompositeProvider(...providers: TelemetryProvider[]): TelemetryProvider {
    return {
        trackEvent(event: TelemetryEvent): void {
            providers.forEach(p => p.trackEvent(event));
        },

        trackException(error: Error, properties?: Record<string, string>): void {
            providers.forEach(p => p.trackException(error, properties));
        },

        trackMetric(name: string, value: number, properties?: Record<string, string>): void {
            providers.forEach(p => p.trackMetric(name, value, properties));
        },

        async flush(): Promise<void> {
            await Promise.all(providers.map(p => p.flush()));
        }
    };
}
