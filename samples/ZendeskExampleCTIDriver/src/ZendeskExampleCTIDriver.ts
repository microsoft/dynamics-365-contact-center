// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ICTIInterface } from "@ccaas/ictiinterface";
import { embedSDKSampleUsage } from "./EmbedSDKSampleUsage";

/**
 * Zendesk App Framework Client type
 */
declare global {
    interface Window {
        ZAFClient?: {
            init: () => ZAFClientInstance;
        };
    }
}

export interface ZAFClientInstance {
    invoke(command: string, ...args: unknown[]): Promise<unknown>;
    on(event: string, callback: (...args: unknown[]) => void): void;
    off(event: string, callback: (...args: unknown[]) => void): void;
    get(path: string | string[]): Promise<Record<string, unknown>>;
    set(path: string, value: unknown): Promise<void>;
    request(options: ZAFRequestOptions): Promise<unknown>;
    context(): Promise<ZAFContext>;
    metadata(): Promise<ZAFMetadata>;
}

interface ZAFRequestOptions {
    url: string;
    type?: string;
    data?: unknown;
    contentType?: string;
    headers?: Record<string, string>;
}

interface ZAFContext {
    instanceGuid: string;
    product: string;
    account: {
        subdomain: string;
    };
    location: string;
}

interface ZAFMetadata {
    appId: number;
    installationId: number;
    name: string;
    version: string;
}

/**
 * Zendesk Talk CTI Driver for D365 Contact Center
 *
 * Integrates with Zendesk using the Zendesk App Framework (ZAF) SDK.
 * Provides screen pop, click-to-dial, and softphone panel management.
 *
 * @example
 * ```typescript
 * const driver = new ZendeskExampleCTIDriver();
 * await driver.initialize();
 * driver.bindEvents();
 * ```
 */
class ZendeskExampleCTIDriver implements ICTIInterface {
    private zafClient: ZAFClientInstance | null = null;
    private static readonly ZAF_SDK_URL = 'https://static.zdassets.com/zendesk_app_framework_sdk/2.0/zaf_sdk.min.js';

    /**
     * Initialize the Zendesk CTI driver
     *
     * Loads the Zendesk App Framework SDK and initializes the ZAF client.
     *
     * @returns Promise resolving to true on successful initialization
     */
    public async initialize(): Promise<boolean> {
        // Check if ZAF is already loaded
        if (window.ZAFClient) {
            this.zafClient = window.ZAFClient.init();
            return true;
        }

        // Load ZAF SDK
        await ZendeskExampleCTIDriver.loadScript(ZendeskExampleCTIDriver.ZAF_SDK_URL);

        // Initialize ZAF client
        if (window.ZAFClient) {
            this.zafClient = window.ZAFClient.init();
            return true;
        }

        throw new Error('Failed to initialize Zendesk App Framework client');
    }

    /**
     * Bind CCaaS SDK events
     */
    public bindEvents(): void {
        embedSDKSampleUsage(this.zafClient);
    }

    /**
     * Get the ZAF client instance
     */
    public getZAFClient(): ZAFClientInstance | null {
        return this.zafClient;
    }

    /**
     * Load a script dynamically
     */
    private static loadScript(source: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.async = true;
            script.src = source;

            script.onload = () => {
                resolve(true);
            };

            script.onerror = () => {
                reject(new Error(`Failed to load Zendesk SDK: ${source}`));
            };

            const head = document.getElementsByTagName('head')[0];
            if (head) {
                head.appendChild(script);
            } else {
                reject(new Error('No head element found'));
            }
        });
    }
}

// Register driver on window.CCaaS namespace
window.CCaaS = window.CCaaS ?? {};
if (!window.CCaaS.CTIDriver) {
    window.CCaaS.CTIDriver = ZendeskExampleCTIDriver;
}

export default ZendeskExampleCTIDriver;
export { ZendeskExampleCTIDriver };
