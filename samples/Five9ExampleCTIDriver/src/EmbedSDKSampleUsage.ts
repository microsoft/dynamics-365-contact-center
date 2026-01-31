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
import { Five9AgentDesktopAPI, Five9InteractionData } from "./Five9ExampleCTIDriver";

type EmbedSDK = typeof Microsoft.CCaaS.EmbedSDK;

/**
 * Map CCaaS presence to Five9 agent states
 */
function mapPresenceToFive9State(presenceData: IPresence): string {
    const presenceId = presenceData.presenceId;

    // Map common presence states to Five9 states
    if (presenceId === 'available' || presenceId === 'online') {
        return 'READY';
    } else if (presenceId === 'busy' || presenceId === 'dnd') {
        return 'NOT_READY';
    } else if (presenceId === 'away' || presenceId === 'offline') {
        return 'NOT_READY';
    }

    return 'NOT_READY';
}

/**
 * Bind CCaaS SDK events and integrate with Five9 Agent Desktop
 */
export function embedSDKSampleUsage(
    agentDesktopApi: Five9AgentDesktopAPI | null,
    currentInteraction: Five9InteractionData | null
): void {
    const embedSDK: EmbedSDK | undefined = window.Microsoft?.CCaaS?.EmbedSDK;

    if (!embedSDK) {
        console.warn('CCaaS EmbedSDK not available');
        return;
    }

    // Conversation events
    embedSDK.conversation.onConversationLoaded(async (conversationData: IConversationLoadedEventData) => {
        console.log("Five9 CTI: Conversation Loaded", conversationData);

        // Log interaction details for integration
        if (currentInteraction) {
            console.log(`Five9 CTI: Handling interaction ${currentInteraction.interactionId}`);
        }
    });

    embedSDK.conversation.onStatusChange((conversationData: IConversationStatusChangeData) => {
        console.log("Five9 CTI: Conversation Status Changed", conversationData);

        if (conversationData.statusCode === OCLiveWorkItemStatus.Closed) {
            console.log("Five9 CTI: Conversation closed");
        }
    });

    embedSDK.conversation.onAccept((eventData) => {
        console.log("Five9 CTI: Conversation Accepted", eventData);
    });

    embedSDK.conversation.onReject((eventData) => {
        console.log("Five9 CTI: Conversation Rejected", eventData);
    });

    // Notification events
    embedSDK.notification.onNewConversationNotification((conversationData: INewConversationEventData) => {
        console.log("Five9 CTI: New Conversation Notification", conversationData);
    });

    embedSDK.notification.onNewNotification((notificationData: INotification) => {
        console.log("Five9 CTI: New Notification", notificationData);
    });

    // Presence events - sync with Five9 agent state
    embedSDK.presence.onPresenceChange(async (presenceData: IPresence) => {
        console.log("Five9 CTI: Presence Changed", presenceData);

        // Sync presence change to Five9
        if (agentDesktopApi) {
            try {
                const five9State = mapPresenceToFive9State(presenceData);
                await agentDesktopApi.setAgentState(five9State);
                console.log(`Five9 CTI: Agent state synced to ${five9State}`);
            } catch (error) {
                console.error('Five9 CTI: Failed to sync agent state', error);
            }
        }
    });

    // Sentiment events
    embedSDK.conversation.onCustomerSentimentChange((sentimentData: ISentimentObject) => {
        console.log("Five9 CTI: Customer Sentiment Changed", sentimentData);
    });

    // Panel events
    embedSDK.ctiDriver.onSoftPhonePanelHeightChange((height: number) => {
        console.log("Five9 CTI: Panel height changed to", height);
    });

    embedSDK.ctiDriver.onSoftPhonePanelWidthChange((width: number) => {
        console.log("Five9 CTI: Panel width changed to", width);
    });

    embedSDK.ctiDriver.onSoftPhonePanelVisibilityChange((visible: boolean) => {
        console.log("Five9 CTI: Panel visibility changed to", visible);
    });

    // Click-to-dial integration with Five9
    embedSDK.ctiDriver.onClickToDial(async (dialInfo: ClickDialPayloadInfo) => {
        console.log("Five9 CTI: Click-to-dial requested", dialInfo);

        if (agentDesktopApi && dialInfo.number) {
            try {
                await agentDesktopApi.makeCall(dialInfo.number);
                console.log(`Five9 CTI: Initiated call to ${dialInfo.number}`);
            } catch (error) {
                console.error('Five9 CTI: Failed to initiate call', error);
            }
        }
    });

    console.log("Five9 CTI: Event bindings complete");
}
