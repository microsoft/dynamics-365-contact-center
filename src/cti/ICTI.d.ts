// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

export interface CustomerInfo {
	phonenumber?: string;
	email?: string;
	name?: string;
}

interface ClickDialPayloadInfo {
	number: string;
	objectType: string;
	recordId: string;
	recordName: string;
}

export interface ConversationInfo {
	conversationId: string;
	customerData: CustomerInfo;
}

interface RecordDetails {
	name?: string;
	firstName?: string;
	lastName?: string;
	email?: string;
	phonenumber?: string;
}

interface ConversationTaskDetails {
    subject: string;
    status: string;
    record: RecordDetails;
}

export interface ConversationDetails{
    [ConversationId: string]: ConversationTaskDetails;
}

type ClickToDialCallbackFunction = (payload: ClickDialPayloadInfo) => void;

export interface ICTIInterface {
    conversationReady(conversationData: ConversationInfo): Promise<void>;

    initialize():Promise<boolean>;

    endConversation(conversationId: string): void;

    onClickToDial(callbackFuntion: ClickToDialCallbackFunction): void;

    setSoftPhonePanelVisibility(visible: boolean): void;

    setSoftPhonePanelWidth(width: number): void;

    setSoftPhonePanelHeight(height: number): void;

    getConversationDetails(conversationIds: string[]): Promise<ConversationDetails[]>;
}
