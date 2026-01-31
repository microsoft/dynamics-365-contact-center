// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ICTIInterface } from "@ccaas/ictiinterface";
import { embedSDKSampleUsage } from "./EmbedSDKSampleUsage";

/**
 * Genesys Cloud Platform Client types
 */
declare global {
    interface Window {
        platformClient?: GenesysCloudPlatformClient;
    }
}

export interface GenesysCloudPlatformClient {
    ApiClient: {
        instance: GenesysApiClient;
    };
    UsersApi: new () => GenesysUsersApi;
    ConversationsApi: new () => GenesysConversationsApi;
    NotificationsApi: new () => GenesysNotificationsApi;
}

interface GenesysApiClient {
    setEnvironment(environment: string): void;
    setAccessToken(token: string): void;
    authentications: Record<string, { accessToken?: string }>;
}

interface GenesysUsersApi {
    getUser(userId: string): Promise<GenesysUser>;
    getUsersMe(): Promise<GenesysUser>;
}

interface GenesysConversationsApi {
    getConversation(conversationId: string): Promise<GenesysConversation>;
    postConversationParticipantCallbacks(
        conversationId: string,
        participantId: string,
        body: unknown
    ): Promise<unknown>;
}

interface GenesysNotificationsApi {
    postNotificationsChannels(): Promise<{ id: string; connectUri: string }>;
}

export interface GenesysUser {
    id: string;
    name: string;
    email: string;
    state: string;
    presence?: {
        presenceDefinition?: {
            id: string;
            systemPresence: string;
        };
    };
}

export interface GenesysConversation {
    id: string;
    startTime: string;
    endTime?: string;
    participants: GenesysParticipant[];
}

interface GenesysParticipant {
    id: string;
    name?: string;
    address?: string;
    purpose: string;
    state: string;
    direction: string;
}

/**
 * Genesys Cloud CTI Driver for D365 Contact Center
 *
 * Integrates with Genesys Cloud using the PureCloud Platform Client SDK.
 *
 * @example
 * ```typescript
 * const driver = new GenesysCloudExampleCTIDriver();
 * await driver.initialize();
 * driver.bindEvents();
 * ```
 */
class GenesysCloudExampleCTIDriver implements ICTIInterface {
    private usersApi: GenesysUsersApi | null = null;
    private conversationsApi: GenesysConversationsApi | null = null;
    private currentUser: GenesysUser | null = null;

    private static readonly GENESYS_SDK_URL = 'https://sdk-cdn.mypurecloud.com/javascript/latest/purecloud-platform-client-v2.min.js';

    /**
     * Initialize the Genesys Cloud CTI driver
     *
     * @returns Promise resolving to true on successful initialization
     */
    public async initialize(): Promise<boolean> {
        // Check if Genesys SDK is already loaded
        if (!window.platformClient) {
            await GenesysCloudExampleCTIDriver.loadScript(GenesysCloudExampleCTIDriver.GENESYS_SDK_URL);
        }

        if (!window.platformClient) {
            throw new Error('Failed to load Genesys Cloud Platform Client SDK');
        }

        // Initialize APIs
        this.usersApi = new window.platformClient.UsersApi();
        this.conversationsApi = new window.platformClient.ConversationsApi();

        // Get current user (requires authentication to be set up externally)
        try {
            this.currentUser = await this.usersApi.getUsersMe();
            console.log('Genesys Cloud CTI: Authenticated as', this.currentUser.name);
        } catch (error) {
            console.warn('Genesys Cloud CTI: Not authenticated or unable to get current user');
        }

        return true;
    }

    /**
     * Bind CCaaS SDK events
     */
    public bindEvents(): void {
        embedSDKSampleUsage(this.conversationsApi, this.currentUser);
    }

    /**
     * Get the Users API instance
     */
    public getUsersApi(): GenesysUsersApi | null {
        return this.usersApi;
    }

    /**
     * Get the Conversations API instance
     */
    public getConversationsApi(): GenesysConversationsApi | null {
        return this.conversationsApi;
    }

    /**
     * Get the current authenticated user
     */
    public getCurrentUser(): GenesysUser | null {
        return this.currentUser;
    }

    /**
     * Configure API client authentication
     */
    public static configureAuth(accessToken: string, environment: string = 'mypurecloud.com'): void {
        if (window.platformClient) {
            const client = window.platformClient.ApiClient.instance;
            client.setEnvironment(environment);
            client.setAccessToken(accessToken);
        }
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
                reject(new Error(`Failed to load Genesys Cloud SDK: ${source}`));
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
    window.CCaaS.CTIDriver = GenesysCloudExampleCTIDriver;
}

export default GenesysCloudExampleCTIDriver;
export { GenesysCloudExampleCTIDriver };
