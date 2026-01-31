// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ICTIInterface } from "@ccaas/ictiinterface";
import { EmbedSDK, IConversationLoadedEventData, IPresence, ISentimentObject } from "@ccaas/CCaaSEmbedSDK";
import { loadScript, ScriptLoadError, preloadScript, preconnect } from "./utils/scriptLoader";
import { Logger, createLogger, LogLevel } from "./utils/logger";
import { EventBus, createEventBus, Subscription } from "./utils/eventBus";
import { debounce, throttle, scheduleIdleTask, cancelIdleTask } from "./utils/performance";

/**
 * Configuration options for CTI drivers
 */
export interface CTIDriverConfig {
    /** Driver name for logging */
    name: string;
    /** Enable debug logging */
    debug?: boolean;
    /** Script load timeout in milliseconds */
    scriptTimeout?: number;
    /** Feature flags */
    features?: {
        /** Enable sentiment tracking (default: true) */
        sentimentTracking?: boolean;
        /** Enable screen pop (default: true) */
        screenPop?: boolean;
        /** Enable click-to-dial (default: true) */
        clickToDial?: boolean;
        /** Enable presence sync (default: true) */
        presenceSync?: boolean;
    };
    /** Performance options */
    performance?: {
        /** Enable lazy event binding (default: true) */
        lazyEventBinding?: boolean;
        /** Debounce delay for sentiment changes in ms (default: 300) */
        sentimentDebounceMs?: number;
        /** Throttle delay for panel resize events in ms (default: 100) */
        panelResizeThrottleMs?: number;
    };
}

/**
 * Default configuration values
 */
const defaultConfig: Required<CTIDriverConfig> = {
    name: 'CTIDriver',
    debug: false,
    scriptTimeout: 30000,
    features: {
        sentimentTracking: true,
        screenPop: true,
        clickToDial: true,
        presenceSync: true
    },
    performance: {
        lazyEventBinding: true,
        sentimentDebounceMs: 300,
        panelResizeThrottleMs: 100
    }
};

/**
 * Events emitted by the CTI driver
 */
export interface CTIDriverEvents {
    'initialized': void;
    'error': { context: string; error: Error };
    'conversation:loaded': IConversationLoadedEventData;
    'sentiment:changed': ISentimentObject;
    'presence:changed': IPresence;
}

/**
 * Abstract base class for CTI drivers.
 * Provides common functionality and hooks for platform-specific implementations.
 *
 * Performance features:
 * - Lazy event binding: Non-critical events are bound during idle time
 * - Debounced sentiment updates: Prevents excessive updates from rapid sentiment changes
 * - Throttled panel resize: Limits DOM updates during panel resizing
 * - Script preloading: Optionally preload platform libraries early
 *
 * @example
 * ```typescript
 * class SalesforceDriver extends BaseCTIDriver {
 *     protected async loadPlatformLibrary(): Promise<void> {
 *         await this.loadScript('https://salesforce.com/opencti.js');
 *     }
 *
 *     protected performScreenPop(data: IConversationLoadedEventData): void {
 *         window.sforce.opencti.screenPop({ ... });
 *     }
 * }
 * ```
 */
export abstract class BaseCTIDriver implements ICTIInterface {
    /** The CCaaS Embed SDK instance */
    protected sdk!: EmbedSDK;

    /** Logger instance for this driver */
    protected logger: Logger;

    /** Internal event bus for driver events */
    protected eventBus: EventBus;

    /** Driver configuration */
    protected config: Required<CTIDriverConfig>;

    /** Active subscriptions for cleanup */
    private subscriptions: Subscription[] = [];

    /** Pending idle task IDs for cleanup */
    private pendingIdleTasks: number[] = [];

    /** Debounced/throttled handlers for cleanup */
    private debouncedHandlers: Array<{ cancel: () => void }> = [];

    /** Track if driver has been destroyed */
    private isDestroyed = false;

    constructor(config: Partial<CTIDriverConfig> = {}) {
        this.config = this.mergeConfig(config);
        this.logger = createLogger(this.config.name, {
            level: this.config.debug ? LogLevel.DEBUG : LogLevel.INFO
        });
        this.eventBus = createEventBus();
    }

    /**
     * Initialize the CTI driver.
     * Loads platform-specific library and sets up the SDK reference.
     */
    async initialize(): Promise<boolean> {
        this.logger.info('Initializing CTI driver...');

        try {
            // Yield to browser to keep UI responsive
            await Promise.resolve();

            // Get SDK reference
            this.sdk = this.getSDK();
            if (!this.sdk) {
                throw new Error('CCaaS EmbedSDK not available on window.Microsoft.CCaaS.EmbedSDK');
            }

            // Load platform-specific library
            await this.loadPlatformLibrary();

            // Call initialization hook
            await this.onInitialized();

            this.eventBus.emit('initialized', undefined);
            this.logger.info('CTI driver initialized successfully');
            return true;

        } catch (error) {
            this.handleError('initialize', error);
            return false;
        }
    }

    /**
     * Bind event handlers from the CCaaS SDK.
     * Sets up all standard event subscriptions.
     *
     * Uses lazy binding for non-critical events to improve startup performance.
     */
    bindEvents(): void {
        if (this.isDestroyed) {
            this.logger.warn('Cannot bind events - driver has been destroyed');
            return;
        }

        this.logger.debug('Binding events...');

        try {
            // Critical events - bind immediately
            this.bindCriticalConversationEvents();

            if (this.config.performance.lazyEventBinding) {
                // Non-critical events - bind during idle time
                this.scheduleIdleBinding(() => {
                    this.bindNonCriticalConversationEvents();
                    this.bindPresenceEvents();
                });

                this.scheduleIdleBinding(() => {
                    this.bindNotificationEvents();
                    this.bindVoiceEvents();
                    this.bindCTIDriverEvents();
                });
            } else {
                // Bind everything immediately
                this.bindNonCriticalConversationEvents();
                this.bindPresenceEvents();
                this.bindNotificationEvents();
                this.bindVoiceEvents();
                this.bindCTIDriverEvents();
            }

            this.bindPlatformSpecificEvents();

            this.logger.info('Events bound successfully');
        } catch (error) {
            this.handleError('bindEvents', error);
        }
    }

    /**
     * Subscribe to internal driver events
     */
    on<K extends keyof CTIDriverEvents>(
        event: K,
        handler: (data: CTIDriverEvents[K]) => void
    ): Subscription {
        return this.eventBus.on(event, handler);
    }

    /**
     * Cleanup resources and unsubscribe from events.
     * Properly releases all references to prevent memory leaks.
     */
    destroy(): void {
        if (this.isDestroyed) {
            return;
        }

        this.logger.debug('Destroying CTI driver...');
        this.isDestroyed = true;

        // Cancel pending idle tasks
        for (const taskId of this.pendingIdleTasks) {
            cancelIdleTask(taskId);
        }
        this.pendingIdleTasks = [];

        // Cancel debounced/throttled handlers
        for (const handler of this.debouncedHandlers) {
            handler.cancel();
        }
        this.debouncedHandlers = [];

        // Unsubscribe from all events
        for (const subscription of this.subscriptions) {
            subscription.unsubscribe();
        }
        this.subscriptions = [];

        // Clear event bus
        this.eventBus.removeAllListeners();

        // Call cleanup hook
        this.onDestroyed();

        // Nullify references
        this.sdk = null!;

        this.logger.info('CTI driver destroyed');
    }

    // ==================== Abstract Methods ====================
    // These must be implemented by platform-specific drivers

    /**
     * Load the platform-specific CTI library.
     * Called during initialization.
     *
     * @example
     * ```typescript
     * protected async loadPlatformLibrary(): Promise<void> {
     *     const url = `https://salesforce.com/api/${this.config.openCTIVersion}/opencti.js`;
     *     await this.loadScript(url);
     * }
     * ```
     */
    protected abstract loadPlatformLibrary(): Promise<void>;

    /**
     * Bind platform-specific event handlers.
     * Called after standard events are bound.
     */
    protected abstract bindPlatformSpecificEvents(): void;

    /**
     * Perform a screen pop in the CRM.
     * Called when a new conversation is loaded.
     */
    protected abstract performScreenPop(data: IConversationLoadedEventData): void;

    // ==================== Protected Hooks ====================
    // These can be overridden by subclasses

    /**
     * Hook called after successful initialization.
     * Override to perform additional setup.
     */
    protected async onInitialized(): Promise<void> {
        // Default implementation - override in subclass
    }

    /**
     * Hook called when driver is destroyed.
     * Override to perform additional cleanup.
     */
    protected onDestroyed(): void {
        // Default implementation - override in subclass
    }

    /**
     * Hook called when customer sentiment changes.
     * Override to handle sentiment updates.
     */
    protected onSentimentChange(data: ISentimentObject): void {
        this.logger.debug('Sentiment changed', data);
    }

    /**
     * Hook called when agent presence changes.
     * Override to sync presence with CRM.
     */
    protected onPresenceChange(data: IPresence): void {
        this.logger.debug('Presence changed', data);
    }

    // ==================== Protected Utilities ====================

    /**
     * Load an external script with error handling
     */
    protected async loadScript(url: string): Promise<void> {
        this.logger.debug(`Loading script: ${url}`);

        try {
            await loadScript({
                url,
                timeout: this.config.scriptTimeout
            });
            this.logger.debug(`Script loaded: ${url}`);
        } catch (error) {
            if (error instanceof ScriptLoadError) {
                throw error;
            }
            throw new ScriptLoadError(url, 'error', String(error));
        }
    }

    /**
     * Preload a script for faster loading later.
     * Call this early (e.g., in constructor) to hint the browser to fetch the script.
     */
    protected preloadScript(url: string): void {
        this.logger.debug(`Preloading script: ${url}`);
        preloadScript(url);
    }

    /**
     * Preconnect to a domain for faster subsequent requests.
     * Call this early to establish connection to third-party domains.
     */
    protected preconnectToDomain(origin: string): void {
        this.logger.debug(`Preconnecting to: ${origin}`);
        preconnect(origin);
    }

    /**
     * Handle errors with logging and event emission
     */
    protected handleError(context: string, error: unknown): void {
        const err = error instanceof Error ? error : new Error(String(error));
        this.logger.error(`Error in ${context}`, err);
        this.eventBus.emit('error', { context, error: err });
    }

    /**
     * Get the SDK instance from the window object
     */
    protected getSDK(): EmbedSDK {
        const win = window as Window & {
            Microsoft?: { CCaaS?: { EmbedSDK?: EmbedSDK } }
        };
        return win.Microsoft?.CCaaS?.EmbedSDK as EmbedSDK;
    }

    // ==================== Private Methods ====================

    private mergeConfig(config: Partial<CTIDriverConfig>): Required<CTIDriverConfig> {
        return {
            ...defaultConfig,
            ...config,
            features: {
                ...defaultConfig.features,
                ...config.features
            },
            performance: {
                ...defaultConfig.performance,
                ...config.performance
            }
        };
    }

    /**
     * Schedule a function to run during browser idle time
     */
    private scheduleIdleBinding(fn: () => void): void {
        if (this.isDestroyed) return;

        const taskId = scheduleIdleTask(() => {
            if (!this.isDestroyed) {
                fn();
            }
        }, { timeout: 2000 }); // Ensure it runs within 2 seconds

        this.pendingIdleTasks.push(taskId);
    }

    /**
     * Bind critical conversation events immediately
     */
    private bindCriticalConversationEvents(): void {
        this.sdk.conversation.onConversationLoaded((data) => {
            this.logger.debug('Conversation loaded', data);
            this.eventBus.emit('conversation:loaded', data);

            if (this.config.features.screenPop) {
                this.performScreenPop(data);
            }
        });

        this.sdk.conversation.onAccept((data) => {
            this.logger.debug('Conversation accepted', data);
        });

        this.sdk.conversation.onReject((data) => {
            this.logger.debug('Conversation rejected', data);
        });
    }

    /**
     * Bind non-critical conversation events (can be deferred)
     */
    private bindNonCriticalConversationEvents(): void {
        this.sdk.conversation.onStatusChange((data) => {
            this.logger.debug('Conversation status changed', data);
        });

        this.sdk.conversation.onTransfer((data) => {
            this.logger.debug('Conversation transferred', data);
        });

        this.sdk.conversation.onNewMessage((data) => {
            this.logger.debug('New message', data);
        });

        // Debounce sentiment changes to avoid excessive updates
        if (this.config.features.sentimentTracking) {
            const debouncedSentimentHandler = debounce(
                (data: ISentimentObject) => {
                    this.eventBus.emit('sentiment:changed', data);
                    this.onSentimentChange(data);
                },
                this.config.performance.sentimentDebounceMs
            );

            this.debouncedHandlers.push(debouncedSentimentHandler);

            this.sdk.conversation.onCustomerSentimentChange((data) => {
                debouncedSentimentHandler(data);
            });
        }
    }

    private bindPresenceEvents(): void {
        if (this.config.features.presenceSync) {
            this.sdk.presence.onPresenceChange((data) => {
                this.eventBus.emit('presence:changed', data);
                this.onPresenceChange(data);
            });
        }
    }

    private bindNotificationEvents(): void {
        this.sdk.notification.onNewConversationNotification((data) => {
            this.logger.debug('New conversation notification', data);
        });

        this.sdk.notification.onNewNotification((data) => {
            this.logger.debug('New notification', data);
        });
    }

    private bindVoiceEvents(): void {
        this.sdk.voiceOrVideoCalling.onHoldChange((data) => {
            this.logger.debug('Hold state changed', data);
        });

        this.sdk.voiceOrVideoCalling.onMuteChange((data) => {
            this.logger.debug('Mute state changed', data);
        });
    }

    private bindCTIDriverEvents(): void {
        // Throttle panel resize events to prevent excessive updates
        const throttleMs = this.config.performance.panelResizeThrottleMs;

        const throttledHeightHandler = throttle(
            (height: number) => {
                this.logger.debug('Panel height changed', { height });
                this.onPanelHeightChange(height);
            },
            throttleMs
        );
        this.debouncedHandlers.push(throttledHeightHandler);

        const throttledWidthHandler = throttle(
            (width: number) => {
                this.logger.debug('Panel width changed', { width });
                this.onPanelWidthChange(width);
            },
            throttleMs
        );
        this.debouncedHandlers.push(throttledWidthHandler);

        this.sdk.ctiDriver.onSoftPhonePanelHeightChange(throttledHeightHandler);
        this.sdk.ctiDriver.onSoftPhonePanelWidthChange(throttledWidthHandler);

        this.sdk.ctiDriver.onSoftPhonePanelVisibilityChange((visible) => {
            this.logger.debug('Panel visibility changed', { visible });
            this.onPanelVisibilityChange(visible);
        });
    }

    /**
     * Hook for panel height changes.
     * Override in subclass to handle CRM-specific panel resizing.
     */
    protected onPanelHeightChange(height: number): void {
        // Override in subclass
    }

    /**
     * Hook for panel width changes.
     * Override in subclass to handle CRM-specific panel resizing.
     */
    protected onPanelWidthChange(width: number): void {
        // Override in subclass
    }

    /**
     * Hook for panel visibility changes.
     * Override in subclass to handle CRM-specific panel visibility.
     */
    protected onPanelVisibilityChange(visible: boolean): void {
        // Override in subclass
    }
}
