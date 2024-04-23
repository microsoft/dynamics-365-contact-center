
interface IOpenFrame {
    initialize():Promise<boolean>;
    conversationReady(conversationData: ConversationInfo): Promise<void>;
    onClickToDial(callbackFuntion: ClickToDialCallbackFunction): void;
}

interface ConversationInfo {
    conversationId: string;
    customerData: CustomerInfo;
}

interface CustomerInfo {
    phonenumber?: string;
    email?: string;
    name?: string;
}


interface RecordDetails {
    name?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phonenumber?: string;
}

interface ClickDialPayloadInfo {
    number: string;
    objectType: string;
    recordId: string;
    recordName: string;
}

type ClickToDialCallbackFunction = (payload: ClickDialPayloadInfo) => void;