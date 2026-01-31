// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * Type-safe event handler function
 */
export type EventHandler<T = unknown> = (data: T) => void;

/**
 * Subscription returned when registering an event handler
 */
export interface Subscription {
    /** Unique identifier for this subscription */
    id: string;
    /** Unsubscribe from the event */
    unsubscribe: () => void;
}

/**
 * Event bus options
 */
export interface EventBusOptions {
    /** Maximum number of listeners per event (default: 100) */
    maxListeners?: number;
    /** Whether to warn when max listeners exceeded */
    warnOnMaxListeners?: boolean;
}

/**
 * Internal handler storage
 */
interface HandlerEntry<T = unknown> {
    id: string;
    handler: EventHandler<T>;
    once: boolean;
}

/**
 * EventBus provides a simple publish/subscribe mechanism for decoupled communication
 */
export class EventBus {
    private handlers = new Map<string, HandlerEntry[]>();
    private readonly maxListeners: number;
    private readonly warnOnMaxListeners: boolean;
    private idCounter = 0;

    constructor(options: EventBusOptions = {}) {
        this.maxListeners = options.maxListeners ?? 100;
        this.warnOnMaxListeners = options.warnOnMaxListeners ?? true;
    }

    /**
     * Subscribe to an event
     * @param event - Event name
     * @param handler - Handler function
     * @returns Subscription object with unsubscribe method
     */
    on<T = unknown>(event: string, handler: EventHandler<T>): Subscription {
        return this.addHandler(event, handler, false);
    }

    /**
     * Subscribe to an event for a single occurrence
     * @param event - Event name
     * @param handler - Handler function
     * @returns Subscription object with unsubscribe method
     */
    once<T = unknown>(event: string, handler: EventHandler<T>): Subscription {
        return this.addHandler(event, handler, true);
    }

    /**
     * Unsubscribe from an event by handler reference
     * @param event - Event name
     * @param handler - Handler function to remove
     */
    off<T = unknown>(event: string, handler: EventHandler<T>): void {
        const handlers = this.handlers.get(event);
        if (!handlers) return;

        const index = handlers.findIndex(h => h.handler === handler);
        if (index !== -1) {
            handlers.splice(index, 1);
        }

        if (handlers.length === 0) {
            this.handlers.delete(event);
        }
    }

    /**
     * Unsubscribe from an event by subscription ID
     * @param event - Event name
     * @param subscriptionId - Subscription ID to remove
     */
    offById(event: string, subscriptionId: string): void {
        const handlers = this.handlers.get(event);
        if (!handlers) return;

        const index = handlers.findIndex(h => h.id === subscriptionId);
        if (index !== -1) {
            handlers.splice(index, 1);
        }

        if (handlers.length === 0) {
            this.handlers.delete(event);
        }
    }

    /**
     * Emit an event to all subscribers
     * @param event - Event name
     * @param data - Event data
     */
    emit<T = unknown>(event: string, data: T): void {
        const handlers = this.handlers.get(event);
        if (!handlers || handlers.length === 0) return;

        // Copy handlers array to avoid issues if handlers modify subscriptions
        const handlersToCall = [...handlers];
        const toRemove: string[] = [];

        for (const entry of handlersToCall) {
            try {
                entry.handler(data);
                if (entry.once) {
                    toRemove.push(entry.id);
                }
            } catch (error) {
                console.error(`[EventBus] Error in handler for event "${event}":`, error);
            }
        }

        // Remove one-time handlers
        for (const id of toRemove) {
            this.offById(event, id);
        }
    }

    /**
     * Remove all handlers for an event
     * @param event - Event name (if omitted, removes all handlers)
     */
    removeAllListeners(event?: string): void {
        if (event) {
            this.handlers.delete(event);
        } else {
            this.handlers.clear();
        }
    }

    /**
     * Get the number of listeners for an event
     * @param event - Event name
     */
    listenerCount(event: string): number {
        return this.handlers.get(event)?.length ?? 0;
    }

    /**
     * Get all registered event names
     */
    eventNames(): string[] {
        return Array.from(this.handlers.keys());
    }

    private addHandler<T>(event: string, handler: EventHandler<T>, once: boolean): Subscription {
        if (!this.handlers.has(event)) {
            this.handlers.set(event, []);
        }

        const handlers = this.handlers.get(event)!;

        // Check max listeners
        if (handlers.length >= this.maxListeners && this.warnOnMaxListeners) {
            console.warn(
                `[EventBus] Max listeners (${this.maxListeners}) exceeded for event "${event}". ` +
                'This may indicate a memory leak.'
            );
        }

        const id = `${event}_${++this.idCounter}`;
        const entry: HandlerEntry<T> = { id, handler, once };
        handlers.push(entry as HandlerEntry);

        return {
            id,
            unsubscribe: () => this.offById(event, id)
        };
    }
}

/**
 * Create a new EventBus instance
 */
export function createEventBus(options?: EventBusOptions): EventBus {
    return new EventBus(options);
}

/**
 * Global event bus instance for application-wide events
 */
export const globalEventBus = new EventBus();
