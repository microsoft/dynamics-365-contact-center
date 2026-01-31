// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ICTIInterface } from "@ccaas/ictiinterface";
import { EmbedSDK, IConversationLoadedEventData, IPresence, ISentimentObject } from "@ccaas/CCaaSEmbedSDK";
import { loadScript, ScriptLoadError } from "./utils/scriptLoader";
import { Logger, createLogger, LogLevel } from "./utils/logger";
import { EventBus, createEventBus, Subscription } from "./utils/eventBus";

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
     */
    bindEvents(): void {
        this.logger.debug('Binding events...');

        try {
            this.bindConversationEvents();
            this.bindPresenceEvents();
            this.bindNotificationEvents();
            this.bindVoiceEvents();
            this.bindCTIDriverEvents();
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
     * Cleanup resources and unsubscribe from events
     */
    destroy(): void {
        this.logger.debug('Destroying CTI driver...');

        for (const subscription of this.subscriptions) {
            subscription.unsubscribe();
        }
        this.subscriptions = [];

        this.eventBus.removeAllListeners();
        this.onDestroyed();

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
            }
        };
    }

    private bindConversationEvents(): void {
        this.sdk.conversation.onConversationLoaded((data) => {
            this.logger.debug('Conversation loaded', data);
            this.eventBus.emit('conversation:loaded', data);

            if (this.config.features.screenPop) {
                this.performScreenPop(data);
            }
        });

        this.sdk.conversation.onStatusChange((data) => {
            this.logger.debug('Conversation status changed', data);
        });

        this.sdk.conversation.onTransfer((data) => {
            this.logger.debug('Conversation transferred', data);
        });

        this.sdk.conversation.onNewMessage((data) => {
            this.logger.debug('New message', data);
        });

        this.sdk.conversation.onAccept((data) => {
            this.logger.debug('Conversation accepted', data);
        });

        this.sdk.conversation.onReject((data) => {
            this.logger.debug('Conversation rejected', data);
        });

        if (this.config.features.sentimentTracking) {
            this.sdk.conversation.onCustomerSentimentChange((data) => {
                this.eventBus.emit('sentiment:changed', data);
                this.onSentimentChange(data);
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
        this.sdk.ctiDriver.onSoftPhonePanelHeightChange((height) => {
            this.logger.debug('Panel height changed', { height });
            this.onPanelHeightChange(height);
        });

        this.sdk.ctiDriver.onSoftPhonePanelWidthChange((width) => {
            this.logger.debug('Panel width changed', { width });
            this.onPanelWidthChange(width);
        });

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
