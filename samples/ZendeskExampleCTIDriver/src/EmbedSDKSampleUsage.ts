// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import Microsoft, {
    IConversationLoadedEventData,
    IConversationStatusChangeData,
    INewConversationEventData,
    INotification,
    IPresence,
    ISentimentObject,
    ClickDialPayloadInfo
} from "@ccaas/CCaaSEmbedSDK";
import { OCLiveWorkItemStatus } from "@ccaas/CCaaSEmbedSDK/enums";
import { ZAFClientInstance } from "./ZendeskExampleCTIDriver";

type EmbedSDK = typeof Microsoft.CCaaS.EmbedSDK;

/**
 * Bind CCaaS SDK events and integrate with Zendesk
 */
export function embedSDKSampleUsage(zafClient: ZAFClientInstance | null): void {
    const embedSDK: EmbedSDK | undefined = window.Microsoft?.CCaaS?.EmbedSDK;

    if (!embedSDK) {
        console.warn('CCaaS EmbedSDK not available');
        return;
    }

    // Conversation events
    embedSDK.conversation.onConversationLoaded(async (conversationData: IConversationLoadedEventData) => {
        console.log("Zendesk CTI: Conversation Loaded", conversationData);

        // Perform screen pop in Zendesk
        if (zafClient && conversationData.customerPhoneNumber) {
            await screenPopByPhone(zafClient, conversationData.customerPhoneNumber);
        }
    });

    embedSDK.conversation.onStatusChange((conversationData: IConversationStatusChangeData) => {
        console.log("Zendesk CTI: Conversation Status Changed", conversationData);

        if (conversationData.statusCode === OCLiveWorkItemStatus.Closed) {
            // Handle conversation close
            console.log("Zendesk CTI: Conversation closed");
        }
    });

    embedSDK.conversation.onAccept((eventData) => {
        console.log("Zendesk CTI: Conversation Accepted", eventData);
    });

    embedSDK.conversation.onReject((eventData) => {
        console.log("Zendesk CTI: Conversation Rejected", eventData);
    });

    // Notification events
    embedSDK.notification.onNewConversationNotification((conversationData: INewConversationEventData) => {
        console.log("Zendesk CTI: New Conversation Notification", conversationData);
    });

    embedSDK.notification.onNewNotification((notificationData: INotification) => {
        console.log("Zendesk CTI: New Notification", notificationData);
    });

    // Presence events
    embedSDK.presence.onPresenceChange((presenceData: IPresence) => {
        console.log("Zendesk CTI: Presence Changed", presenceData);
    });

    // Sentiment events
    embedSDK.conversation.onCustomerSentimentChange((sentimentData: ISentimentObject) => {
        console.log("Zendesk CTI: Customer Sentiment Changed", sentimentData);
    });

    // Panel events
    embedSDK.ctiDriver.onSoftPhonePanelHeightChange((height: number) => {
        if (zafClient) {
            zafClient.invoke('resize', { width: '100%', height: `${height}px` });
        }
    });

    embedSDK.ctiDriver.onSoftPhonePanelWidthChange((width: number) => {
        if (zafClient) {
            zafClient.invoke('resize', { width: `${width}px`, height: '100%' });
        }
    });

    // Click-to-dial from Zendesk
    if (zafClient) {
        setupClickToDial(zafClient, embedSDK);
    }
}

/**
 * Screen pop to find user by phone number in Zendesk
 */
async function screenPopByPhone(zafClient: ZAFClientInstance, phoneNumber: string): Promise<void> {
    try {
        // Search for users with this phone number
        const response = await zafClient.request({
            url: `/api/v2/users/search.json?query=phone:${encodeURIComponent(phoneNumber)}`,
            type: 'GET'
        }) as { users?: Array<{ id: number }> };

        if (response.users && response.users.length > 0) {
            const userId = response.users[0].id;
            // Navigate to user profile
            await zafClient.invoke('routeTo', 'user', userId);
            console.log(`Zendesk CTI: Screen popped to user ${userId}`);
        } else {
            console.log('Zendesk CTI: No user found for phone number', phoneNumber);
        }
    } catch (error) {
        console.error('Zendesk CTI: Screen pop failed', error);
    }
}

/**
 * Setup click-to-dial integration with Zendesk Talk
 */
function setupClickToDial(zafClient: ZAFClientInstance, embedSDK: EmbedSDK): void {
    // Listen for click-to-dial events from Zendesk
    zafClient.on('voice.dialout', (data: unknown) => {
        const dialData = data as { number?: string };
        if (dialData.number) {
            const clickDialPayload: ClickDialPayloadInfo = {
                number: dialData.number
            };
            embedSDK.ctiDriver.clickToDial(clickDialPayload);
            console.log('Zendesk CTI: Click-to-dial triggered', dialData.number);
        }
    });

    // Also listen for ticket phone clicks
    zafClient.on('ticket.call', (data: unknown) => {
        const callData = data as { phone?: string };
        if (callData.phone) {
            const clickDialPayload: ClickDialPayloadInfo = {
                number: callData.phone
            };
            embedSDK.ctiDriver.clickToDial(clickDialPayload);
        }
    });
}
