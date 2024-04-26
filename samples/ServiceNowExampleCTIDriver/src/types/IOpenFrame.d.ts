
export interface IOpenFrame {
    initialize():Promise<boolean>;
    conversationReady(conversationData: ConversationInfo): Promise<void>;
    onClickToDial(callbackFuntion: ClickToDialCallbackFunction): void;
}

export interface ConversationInfo {
    conversationId: string;
    customerData: CustomerInfo;
}

interface CustomerInfo {
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

export type ClickToDialCallbackFunction = (payload: ClickDialPayloadInfo) => void;