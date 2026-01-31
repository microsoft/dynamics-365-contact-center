// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * Shared enums for CCaaS Embed SDK
 * These enums are exported for runtime use in CTI drivers
 */

/**
 * Base presence status options for agents
 */
export enum BasePresenceStatus {
    AVAILABLE = "AVAILABLE",
    AWAY = "AWAY",
    BUSY = "BUSY",
    BUSY_DO_NOT_DISTURB = "BUSY_DO_NOT_DISTURB",
    OFFLINE = "OFFLINE"
}

/**
 * Notification severity levels
 */
export enum NotificationLevels {
    Success = 1,
    Error = 2,
    Warning = 3,
    Information = 4
}

/**
 * Live work item (conversation) status codes
 */
export enum OCLiveWorkItemStatus {
    Active = 2,
    WrapUp = 5,
    Closed = 4
}

/**
 * Message sender type
 */
export enum SenderType {
    Agent = 1,
    Customer = 3
}

/**
 * Message content type
 */
export enum ContentType {
    Text = 0,
    RichText = 1
}

/**
 * Customer sentiment states
 */
export enum SentimentState {
    NA = 0,
    VeryNegative = 7,
    Negative = 8,
    SlightlyNegative = 9,
    Neutral = 10,
    SlightlyPositive = 11,
    Positive = 12,
    VeryPositive = 13
}

/**
 * Transfer destination types
 */
export enum TransferDestination {
    Agent = "Agent",
    Queue = "Queue"
}
