// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { useEffect, useCallback } from "react";
import {
    EmbedSDK,
    BasePresenceStatus,
    NotificationLevels,
    OCLiveWorkItemStatus,
} from "../types/EmbedSDKTypes";
import type {
    IConversationLoadedEventData,
    IConversationEventBase,
    IConversationStatusChangeData,
    IConversationTransferData,
    IMessageEventData,
    IConsultEventData,
    ISentimentObject,
    INotesAddedEvent,
    INewConversationEventData,
    INotification,
    IPresence,
    IHoldChangeEventData,
    IMuteChangeEventData,
    ITranscriptMessage,
    IAssignedConversationList,
    IConversationData,
    INotificationOptions,
    ClickDialPayloadInfo,
} from "../types/EmbedSDKTypes";

// ─── Log tag ─────────────────────────────────────────────────────────

type LogFn = (message: string, ...args: unknown[]) => void;

/**
 * Resolve the Embed SDK instance that the CCaaS widget places on
 * `window.Microsoft.CCaaS.EmbedSDK` once its iframe has loaded.
 */
function getEmbedSDK(): EmbedSDK | null {
    return (window as any).Microsoft?.CCaaS?.EmbedSDK ?? null;
}

/**
 * Hook – subscribes to every CCaaS Embed SDK event and calls the
 * provided `onEvent` callback so the host React app can render them.
 *
 * @param iframeLoaded  Pass `true` once the iframe's `onLoad` fires.
 * @param onEvent       Called for every SDK event with a human-readable
 *                      label and the raw event payload.
 */
export function useEmbedSDK(
    iframeLoaded: boolean,
    onEvent: (label: string, data: unknown) => void,
) {
    const log: LogFn = useCallback(
        (msg, ...args) => {
            console.log(`[CRM:EmbedSDK] ${msg}`, ...args);
            onEvent(msg, args.length === 1 ? args[0] : args);
        },
        [onEvent],
    );

    const logError: LogFn = useCallback(
        (msg, ...args) => {
            console.error(`[CRM:EmbedSDK] ${msg}`, ...args);
            onEvent(`ERROR: ${msg}`, args.length === 1 ? args[0] : args);
        },
        [onEvent],
    );

    // ── Bind all SDK events once the iframe has loaded ───────────────

    useEffect(() => {
        if (!iframeLoaded) return;

        const sdk = getEmbedSDK();
        if (!sdk) {
            logError("EmbedSDK not found on window.Microsoft.CCaaS.EmbedSDK");
            return;
        }

        log("Binding Embed SDK events…");

        // ── Conversation events ──────────────────────────────────────

        sdk.conversation.onConversationLoaded((data: IConversationLoadedEventData) => {
            log("Conversation loaded", data);
            window.parent.postMessage(data, "*");
            fetchAndLogPresence(sdk);
            fetchFocusedConversation(sdk);
        });

        sdk.conversation.onAccept((data: IConversationEventBase) => {
            log("Conversation accepted", data);
            onConversationAccepted(sdk, data.liveWorkItemId);
        });

        sdk.conversation.onReject((data: IConversationEventBase) => {
            log("Conversation rejected", data);
        });

        sdk.conversation.onStatusChange((data: IConversationStatusChangeData) => {
            log("Conversation status changed", data);
            if (data.statusCode === OCLiveWorkItemStatus.Closed) {
                fetchTranscript(sdk, data.liveWorkItemId);
            }
        });

        sdk.conversation.onTransfer((data: IConversationTransferData) => {
            log("Conversation transferred", data);
        });

        sdk.conversation.onNewMessage((data: IMessageEventData) => {
            log("New message", data);
        });

        sdk.conversation.onConsultStart((data: IConsultEventData) => {
            log("Consult started", data);
        });

        sdk.conversation.onConsultEnd((data: IConsultEventData) => {
            log("Consult ended", data);
        });

        sdk.conversation.onCustomerSentimentChange((data: ISentimentObject) => {
            log("Customer sentiment changed", data);
        });

        sdk.conversation.onNotesAdded((data: INotesAddedEvent) => {
            log("Note created", data);
        });

        // ── Notification events ──────────────────────────────────────

        sdk.notification.onNewConversationNotification((data: INewConversationEventData) => {
            log("New conversation notification", data);
        });

        sdk.notification.onNewNotification((data: INotification) => {
            log("New notification", data);
        });

        // ── Presence events ──────────────────────────────────────────

        sdk.presence.onPresenceChange((data: IPresence) => {
            log("Agent presence changed", data);
        });

        // ── Voice / Video events ─────────────────────────────────────

        sdk.voiceOrVideoCalling.onHoldChange((data: IHoldChangeEventData) => {
            log("Call hold changed", data);
        });

        sdk.voiceOrVideoCalling.onMuteChange((data: IMuteChangeEventData) => {
            log("Call mute changed", data);
        });

        // ── CTI Driver events ────────────────────────────────────────

        sdk.ctiDriver.onSoftPhonePanelHeightChange((height: number) => {
            log("Softphone panel height requested", height);
        });

        sdk.ctiDriver.onSoftPhonePanelWidthChange((width: number) => {
            log("Softphone panel width requested", width);
        });

        sdk.ctiDriver.onSoftPhonePanelVisibilityChange((visible: boolean) => {
            log("Softphone panel visibility requested", visible);
        });

        // ── Click-to-dial listener ───────────────────────────────────

        const handleMessage = (event: MessageEvent) => {
            try {
                const parsed = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
                if (parsed?.messageType === "clickToDial") {
                    const payload: ClickDialPayloadInfo = { number: parsed.messageData.number };
                    sdk.ctiDriver.clickToDial(payload);
                    log("Click-to-dial forwarded", payload);
                }
            } catch {
                // Ignore non-JSON messages from other origins
            }
        };
        window.addEventListener("message", handleMessage);

        log("All Embed SDK events bound.");

        return () => {
            window.removeEventListener("message", handleMessage);
        };

        // ── Helper functions (same logic as EmbedSDKSampleUsage.ts) ──

        async function onConversationAccepted(s: EmbedSDK, liveWorkItemId: string) {
            pushCRMNotification(s, "New conversation assigned to you!");
            fetchAssignedConversations(s);
            fetchConversationData(s, liveWorkItemId);
            fetchConversationRecord(s, liveWorkItemId);
            fetchConversationRecordsBatch(s, liveWorkItemId);
        }

        async function fetchTranscript(s: EmbedSDK, liveWorkItemId: string) {
            try {
                const transcript: ITranscriptMessage[] = await s.conversation.getTranscript(liveWorkItemId);
                log("Transcript retrieved", transcript);
            } catch (error) {
                logError("Failed to retrieve transcript", error);
            }
        }

        async function fetchAssignedConversations(s: EmbedSDK) {
            try {
                const list: IAssignedConversationList =
                    await s.conversation.getAssignedConversationsList(OCLiveWorkItemStatus.Active);
                log("Assigned conversations", list);
            } catch (error) {
                logError("Failed to retrieve assigned conversations", error);
            }
        }

        async function fetchFocusedConversation(s: EmbedSDK) {
            try {
                const id: string = await s.conversation.getFocusedConversationId();
                log("Focused conversation ID", id);
            } catch (error) {
                logError("Failed to retrieve focused conversation ID", error);
            }
        }

        async function fetchConversationData(s: EmbedSDK, liveWorkItemId: string) {
            const columns = ["msdyn_ocliveworkitemid", "msdyn_channel", "statuscode", "msdyn_createdon"];
            try {
                const data: Partial<IConversationData> =
                    await s.conversation.getConversationData(liveWorkItemId, columns);
                log("Conversation data", data);
            } catch (error) {
                logError("Failed to retrieve conversation data", error);
            }
        }

        async function fetchAndLogPresence(s: EmbedSDK) {
            try {
                const current: IPresence = await s.presence.getPresence();
                log("Agent current presence", current);
            } catch (error) {
                logError("Failed to retrieve agent presence", error);
            }

            try {
                const options: IPresence[] = await s.presence.getPresenceOptions();
                log("Available presence options", options);

                const busyDND = options.find(
                    (o) => o.basePresenceStatus === BasePresenceStatus.BUSY_DO_NOT_DISTURB,
                );
                if (busyDND) {
                    await s.presence.setPresence(busyDND.presenceId);
                    log("Presence updated to Busy / Do Not Disturb");
                } else {
                    console.warn("[CRM:EmbedSDK] 'Busy / Do Not Disturb' presence option not found");
                }
            } catch (error) {
                logError("Failed to retrieve or set presence options", error);
            }
        }

        async function pushCRMNotification(s: EmbedSDK, message: string) {
            const opts: INotificationOptions = {
                level: NotificationLevels.Information,
                message,
            };
            try {
                const notificationId: string = await s.notification.addNewNotification(opts);
                log("Notification added, ID:", notificationId);
            } catch (error) {
                logError("Failed to add notification", error);
            }
        }

        async function fetchConversationRecord(s: EmbedSDK, liveWorkItemId: string) {
            try {
                const data = await s.dataverse.retrieveRecord(
                    "msdyn_ocliveworkitems",
                    liveWorkItemId,
                    "?$select=msdyn_createdon",
                );
                log("Dataverse retrieveRecord", data);
            } catch (error) {
                logError("Failed to retrieve Dataverse record", error);
            }
        }

        async function fetchConversationRecordsBatch(s: EmbedSDK, liveWorkItemId: string) {
            const fetchXml = [
                `<fetch top="50">`,
                `  <entity name="msdyn_ocliveworkitem">`,
                `    <attribute name="msdyn_ocliveworkitemid"/>`,
                `    <attribute name="msdyn_channel"/>`,
                `    <attribute name="statuscode"/>`,
                `    <attribute name="msdyn_createdon"/>`,
                `    <filter>`,
                `      <condition attribute="msdyn_ocliveworkitemid" operator="eq" value="${liveWorkItemId}"/>`,
                `    </filter>`,
                `  </entity>`,
                `</fetch>`,
            ].join("");

            try {
                const data = await s.dataverse.retrieveMultipleRecords(
                    "msdyn_ocliveworkitems",
                    `?fetchXml=${fetchXml}`,
                );
                log("Dataverse retrieveMultipleRecords", data);
            } catch (error) {
                logError("Failed to retrieve multiple Dataverse records", error);
            }
        }

    }, [iframeLoaded]);
}
