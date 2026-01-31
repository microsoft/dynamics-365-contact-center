// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ICTIInterface } from "@ccaas/ictiinterface";
import { embedSDKSampleUsage } from "./EmbedSDKSampleUsage";

/**
 * Five9 Agent Desktop API types
 */
export interface Five9InteractionData {
    interactionId: string;
    campaignId?: string;
    callType?: 'INBOUND' | 'OUTBOUND' | 'MANUAL';
    ani?: string;
    dnis?: string;
    callVariables?: Record<string, string>;
}

export interface Five9AgentState {
    state: 'READY' | 'NOT_READY' | 'BUSY' | 'WRAP_UP';
    reasonCode?: string;
    reasonCodeId?: string;
}

export interface Five9CallData {
    callId: string;
    sessionId: string;
    ani: string;
    dnis: string;
    callType: string;
    campaignName?: string;
    queueName?: string;
}

export interface Five9AgentDesktopAPI {
    registerCallback(event: string, callback: (data: unknown) => void): void;
    unregisterCallback(event: string, callback: (data: unknown) => void): void;
    setAgentState(state: string, reasonCodeId?: string): Promise<void>;
    getAgentState(): Promise<Five9AgentState>;
    getInteractionData(): Promise<Five9InteractionData | null>;
    makeCall(phoneNumber: string, campaignId?: string): Promise<void>;
    endCall(callId: string): Promise<void>;
    holdCall(callId: string): Promise<void>;
    retrieveCall(callId: string): Promise<void>;
    transferCall(callId: string, destination: string): Promise<void>;
    conferenceCall(callId: string, destination: string): Promise<void>;
}

declare global {
    interface Window {
        Five9?: {
            AgentDesktop?: Five9AgentDesktopAPI;
        };
    }
}

/**
 * Five9 CTI Driver for D365 Contact Center
 *
 * Integrates with Five9 Agent Desktop Toolkit API
 *
 * @example
 * ```typescript
 * const driver = new Five9ExampleCTIDriver();
 * await driver.initialize();
 * ```
 */
export class Five9ExampleCTIDriver implements ICTIInterface {
    private agentDesktop: Five9AgentDesktopAPI | null = null;
    private currentInteraction: Five9InteractionData | null = null;
    private eventCallbacks: Map<string, (data: unknown) => void> = new Map();

    /**
     * Initialize the Five9 CTI driver
     * @returns Promise resolving to true on success
     */
    async initialize(): Promise<boolean> {
        return new Promise((resolve) => {
            if (window.Five9?.AgentDesktop) {
                this.agentDesktop = window.Five9.AgentDesktop;
                console.log('Five9 CTI: Agent Desktop API available');
                this.bindEvents();
                resolve(true);
            } else {
                // Wait for Five9 Agent Desktop to load
                const checkInterval = setInterval(() => {
                    if (window.Five9?.AgentDesktop) {
                        clearInterval(checkInterval);
                        this.agentDesktop = window.Five9.AgentDesktop;
                        console.log('Five9 CTI: Agent Desktop API loaded');
                        this.bindEvents();
                        resolve(true);
                    }
                }, 100);

                // Timeout after 30 seconds
                setTimeout(() => {
                    clearInterval(checkInterval);
                    if (!this.agentDesktop) {
                        console.warn('Five9 CTI: Agent Desktop API not available after timeout');
                        resolve(false);
                    }
                }, 30000);
            }
        });
    }

    /**
     * Bind Five9 events to CCaaS EmbedSDK
     */
    bindEvents(): void {
        if (!this.agentDesktop) {
            console.warn('Five9 CTI: Cannot bind events - Agent Desktop API not available');
            return;
        }

        // Register Five9 event callbacks
        this.registerFive9Callback('onCallStarted', (data) => {
            console.log('Five9 CTI: Call Started', data);
            this.currentInteraction = data as Five9InteractionData;
        });

        this.registerFive9Callback('onCallEnded', (data) => {
            console.log('Five9 CTI: Call Ended', data);
            this.currentInteraction = null;
        });

        this.registerFive9Callback('onAgentStateChange', (data) => {
            console.log('Five9 CTI: Agent State Changed', data);
        });

        this.registerFive9Callback('onCallHeld', (data) => {
            console.log('Five9 CTI: Call Held', data);
        });

        this.registerFive9Callback('onCallRetrieved', (data) => {
            console.log('Five9 CTI: Call Retrieved', data);
        });

        this.registerFive9Callback('onTransferInitiated', (data) => {
            console.log('Five9 CTI: Transfer Initiated', data);
        });

        this.registerFive9Callback('onConferenceInitiated', (data) => {
            console.log('Five9 CTI: Conference Initiated', data);
        });

        // Bind CCaaS EmbedSDK events
        embedSDKSampleUsage(this.agentDesktop, this.currentInteraction);

        console.log('Five9 CTI: Event bindings complete');
    }

    /**
     * Register a callback for Five9 events
     */
    private registerFive9Callback(event: string, callback: (data: unknown) => void): void {
        if (this.agentDesktop) {
            this.agentDesktop.registerCallback(event, callback);
            this.eventCallbacks.set(event, callback);
        }
    }

    /**
     * Unregister all Five9 callbacks
     */
    private unregisterAllCallbacks(): void {
        if (this.agentDesktop) {
            this.eventCallbacks.forEach((callback, event) => {
                this.agentDesktop?.unregisterCallback(event, callback);
            });
            this.eventCallbacks.clear();
        }
    }

    /**
     * Get the Five9 Agent Desktop API instance
     */
    getAgentDesktopApi(): Five9AgentDesktopAPI | null {
        return this.agentDesktop;
    }

    /**
     * Get the current interaction data
     */
    getCurrentInteraction(): Five9InteractionData | null {
        return this.currentInteraction;
    }

    /**
     * Set agent state in Five9
     * @param state - The state to set (READY, NOT_READY, etc.)
     * @param reasonCodeId - Optional reason code ID
     */
    async setAgentState(state: string, reasonCodeId?: string): Promise<void> {
        if (!this.agentDesktop) {
            throw new Error('Five9 Agent Desktop API not available');
        }
        await this.agentDesktop.setAgentState(state, reasonCodeId);
    }

    /**
     * Make an outbound call
     * @param phoneNumber - The phone number to call
     * @param campaignId - Optional campaign ID
     */
    async makeCall(phoneNumber: string, campaignId?: string): Promise<void> {
        if (!this.agentDesktop) {
            throw new Error('Five9 Agent Desktop API not available');
        }
        await this.agentDesktop.makeCall(phoneNumber, campaignId);
    }

    /**
     * End the current call
     * @param callId - The call ID to end
     */
    async endCall(callId: string): Promise<void> {
        if (!this.agentDesktop) {
            throw new Error('Five9 Agent Desktop API not available');
        }
        await this.agentDesktop.endCall(callId);
    }

    /**
     * Hold the current call
     * @param callId - The call ID to hold
     */
    async holdCall(callId: string): Promise<void> {
        if (!this.agentDesktop) {
            throw new Error('Five9 Agent Desktop API not available');
        }
        await this.agentDesktop.holdCall(callId);
    }

    /**
     * Retrieve a held call
     * @param callId - The call ID to retrieve
     */
    async retrieveCall(callId: string): Promise<void> {
        if (!this.agentDesktop) {
            throw new Error('Five9 Agent Desktop API not available');
        }
        await this.agentDesktop.retrieveCall(callId);
    }

    /**
     * Transfer a call to another destination
     * @param callId - The call ID to transfer
     * @param destination - The transfer destination
     */
    async transferCall(callId: string, destination: string): Promise<void> {
        if (!this.agentDesktop) {
            throw new Error('Five9 Agent Desktop API not available');
        }
        await this.agentDesktop.transferCall(callId, destination);
    }

    /**
     * Clean up resources
     */
    dispose(): void {
        this.unregisterAllCallbacks();
        this.agentDesktop = null;
        this.currentInteraction = null;
    }
}

// Export driver as default
export default Five9ExampleCTIDriver;

// Make available globally for non-module usage
if (typeof window !== 'undefined') {
    (window as unknown as Record<string, unknown>).Five9ExampleCTIDriver = Five9ExampleCTIDriver;
}
