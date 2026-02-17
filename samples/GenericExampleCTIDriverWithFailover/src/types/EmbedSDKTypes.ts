// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * EmbedSDK types used by this sample app.
 *
 * In a production CRM you would install the @ccaas/CCaaSEmbedSDK typings
 * package.  This file provides the minimal type surface so the React app
 * compiles standalone without that dependency.
 */

// ─── Enums ───────────────────────────────────────────────────────────

export enum BasePresenceStatus {
    AVAILABLE = "AVAILABLE",
    AWAY = "AWAY",
    BUSY = "BUSY",
    BUSY_DO_NOT_DISTURB = "BUSY_DO_NOT_DISTURB",
    OFFLINE = "OFFLINE",
}

export enum NotificationLevels {
    Success = 1,
    Error = 2,
    Warning = 3,
    Information = 4,
}

export enum OCLiveWorkItemStatus {
    Active = 2,
    WrapUp = 5,
    Closed = 4,
}

// ─── Interfaces ──────────────────────────────────────────────────────

export interface IConversationLoadedEventData {
    liveWorkItemId: string;
    conversationType: string;
    createdTimeStamp: string;
    liveWorkStreamId?: string;
    sessionId: string;
    customerName: string;
    customerPhoneNumber?: string;
}

export interface IConversationEventBase {
    liveWorkItemId: string;
}

export interface IConversationStatusChangeData {
    liveWorkItemId: string;
    statusCode: OCLiveWorkItemStatus;
}

export interface IConversationTransferData {
    liveWorkItemId: string;
    sessionId: string;
    transferDestination: string;
}

export interface IMessageEventData {
    liveWorkItemId: string;
    senderType: number;
    message: {
        content: string;
        contentType: number;
        id: string;
        timestamp: string;
        sender: { id: string; displayName: string };
        fileMetadata?: { id: string; name: string; type: string };
    };
}

export interface IParticipant {
    isPrimary: boolean;
    systemUserId: string;
}

export interface IConsultEventData {
    liveWorkItemId: string;
    activeParticipantList: IParticipant;
}

export interface ISentimentObject extends IConversationEventBase {
    sessionId: string;
    sentiment: number;
}

export interface INotesAddedEvent {
    text: string;
    entityId: string;
    entityName: string;
    liveWorkItemId: string;
}

export interface ITranscriptMessage {
    id: string;
    content: string;
    mode: "external" | "internal";
    createdOn: string;
    sender: { user: { displayName: string; id: string } };
    attachmentInfo: { annotationid: string; filename: string; contentType: string }[];
}

export interface IConversationData {
    msdyn_ocliveworkitemid: string;
    msdyn_channel: string;
    statuscode: number;
    msdyn_createdon: string;
    [key: string]: unknown;
}

export interface IAssignedConversationList {
    liveWorkItemId: string;
}

export interface IPresence {
    presenceId: string;
    presenceName: string;
    presenceText: string;
    basePresenceStatus: BasePresenceStatus;
    presenceColor: string | undefined;
    canUserSet: boolean;
}

export interface INotificationOptions {
    level: NotificationLevels;
    message: string;
}

export interface INotification {
    notificationId: string;
    notificationOptions: INotificationOptions;
}

export interface INewConversationEventData {
    liveworkItemId: string;
    title: string;
    msdyn_WorkstreamId: string;
    queueId: string;
    createdOn: string;
    customerName: string;
    visitorLanguage: string;
    visitorDevice: string;
}

export interface IHoldChangeEventData {
    liveWorkItemId: string;
    isAgentOnHold: boolean;
}

export interface IMuteChangeEventData {
    isAgentMuted: boolean;
    liveWorkItemId: string;
}

export interface ClickDialPayloadInfo {
    number: string;
}

// ─── EmbedSDK shape (what lives on window.Microsoft.CCaaS.EmbedSDK) ─

export interface EmbedSDK {
    conversation: {
        onConversationLoaded(cb: (d: IConversationLoadedEventData) => void): void;
        onAccept(cb: (d: IConversationEventBase) => void): void;
        onReject(cb: (d: IConversationEventBase) => void): void;
        onStatusChange(cb: (d: IConversationStatusChangeData) => void): void;
        onTransfer(cb: (d: IConversationTransferData) => void): void;
        onNewMessage(cb: (d: IMessageEventData) => void): void;
        onConsultStart(cb: (d: IConsultEventData) => void): void;
        onConsultEnd(cb: (d: IConsultEventData) => void): void;
        onCustomerSentimentChange(cb: (d: ISentimentObject) => void): void;
        onNotesAdded(cb: (d: INotesAddedEvent) => void): void;
        getTranscript(id: string): Promise<ITranscriptMessage[]>;
        getAssignedConversationsList(status: OCLiveWorkItemStatus): Promise<IAssignedConversationList>;
        getFocusedConversationId(): Promise<string>;
        getConversationData(id: string, cols: string[]): Promise<Partial<IConversationData>>;
    };
    notification: {
        onNewConversationNotification(cb: (d: INewConversationEventData) => void): void;
        onNewNotification(cb: (d: INotification) => void): void;
        addNewNotification(opts: INotificationOptions): Promise<string>;
    };
    presence: {
        getPresence(): Promise<IPresence>;
        setPresence(id: string): Promise<void>;
        getPresenceOptions(): Promise<IPresence[]>;
        onPresenceChange(cb: (d: IPresence) => void): void;
    };
    voiceOrVideoCalling: {
        onHoldChange(cb: (d: IHoldChangeEventData) => void): void;
        onMuteChange(cb: (d: IMuteChangeEventData) => void): void;
    };
    ctiDriver: {
        onSoftPhonePanelHeightChange(cb: (h: number) => void): void;
        onSoftPhonePanelWidthChange(cb: (w: number) => void): void;
        onSoftPhonePanelVisibilityChange(cb: (v: boolean) => void): void;
        clickToDial(payload: ClickDialPayloadInfo): void;
    };
    dataverse: {
        retrieveRecord(entity: string, id: string, opts: string): Promise<unknown>;
        retrieveMultipleRecords<T = unknown>(entity: string, opts: string): Promise<T>;
    };
}
