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
import { GenesysUser } from "./GenesysCloudExampleCTIDriver";

type EmbedSDK = typeof Microsoft.CCaaS.EmbedSDK;

interface GenesysConversationsApi {
    getConversation(conversationId: string): Promise<unknown>;
}

/**
 * Bind CCaaS SDK events and integrate with Genesys Cloud
 */
export function embedSDKSampleUsage(
    conversationsApi: GenesysConversationsApi | null,
    currentUser: GenesysUser | null
): void {
    const embedSDK: EmbedSDK | undefined = window.Microsoft?.CCaaS?.EmbedSDK;

    if (!embedSDK) {
        console.warn('CCaaS EmbedSDK not available');
        return;
    }

    // Conversation events
    embedSDK.conversation.onConversationLoaded(async (conversationData: IConversationLoadedEventData) => {
        console.log("Genesys Cloud CTI: Conversation Loaded", conversationData);

        // Log conversation details for integration
        if (currentUser) {
            console.log(`Genesys Cloud CTI: Agent ${currentUser.name} handling conversation`);
        }
    });

    embedSDK.conversation.onStatusChange((conversationData: IConversationStatusChangeData) => {
        console.log("Genesys Cloud CTI: Conversation Status Changed", conversationData);

        if (conversationData.statusCode === OCLiveWorkItemStatus.Closed) {
            console.log("Genesys Cloud CTI: Conversation closed");
        }
    });

    embedSDK.conversation.onAccept((eventData) => {
        console.log("Genesys Cloud CTI: Conversation Accepted", eventData);
    });

    embedSDK.conversation.onReject((eventData) => {
        console.log("Genesys Cloud CTI: Conversation Rejected", eventData);
    });

    // Notification events
    embedSDK.notification.onNewConversationNotification((conversationData: INewConversationEventData) => {
        console.log("Genesys Cloud CTI: New Conversation Notification", conversationData);
    });

    embedSDK.notification.onNewNotification((notificationData: INotification) => {
        console.log("Genesys Cloud CTI: New Notification", notificationData);
    });

    // Presence events
    embedSDK.presence.onPresenceChange((presenceData: IPresence) => {
        console.log("Genesys Cloud CTI: Presence Changed", presenceData);
        // Could sync with Genesys Cloud presence here
    });

    // Sentiment events
    embedSDK.conversation.onCustomerSentimentChange((sentimentData: ISentimentObject) => {
        console.log("Genesys Cloud CTI: Customer Sentiment Changed", sentimentData);
    });

    // Panel events
    embedSDK.ctiDriver.onSoftPhonePanelHeightChange((height: number) => {
        console.log("Genesys Cloud CTI: Panel height changed to", height);
    });

    embedSDK.ctiDriver.onSoftPhonePanelWidthChange((width: number) => {
        console.log("Genesys Cloud CTI: Panel width changed to", width);
    });

    embedSDK.ctiDriver.onSoftPhonePanelVisibilityChange((visible: boolean) => {
        console.log("Genesys Cloud CTI: Panel visibility changed to", visible);
    });

    // Note: Click-to-dial in Genesys Cloud is typically handled through
    // Genesys Cloud's own softphone or integration, not through the web SDK
    console.log("Genesys Cloud CTI: Event bindings complete");
}
