import { IConversationLoadedEventData, ClickDialPayloadInfo, IConversationData } from "@ccaas/CCaaSEmbedSDK";
import { setSoftPhonePanelVisibility } from "./EmbedSDKSampleUsage";

interface SFRecordInfo {
    id: string;
    type: string;
}

interface SFRecord {
    RecordType: string
}

export const CUSTOMERDATAENUM = {
    PHONENUMBER: 'customerPhoneNumber',
    EMAIL: 'customerEmail',
    NAME: 'customerName'
};

const RECORD_TYPE = {
    CONTACT: 'Contact',
    ACCOUNT: 'Account'
};

const CONVERSATION_TYPE = {
    "VOICE_CALL": 192440000,
    "VOICE": 192370000
}

/**
 * Prepares a conversation, if an account/contact is found then it shows screen pop with customer information
 *
 * @param {IConversationLoadedEventData} conversationData - An object containing conversation data.
 * @param {Partial<IConversationData>} conversationDetails - An object containing conversation details.
 * @returns {Promise<void>} A promise that resolves when the conversation is ready, or rejects with an error if any issues occur.
 */
export async function conversationReady(conversationData: IConversationLoadedEventData, conversationDetails: Partial<IConversationData>): Promise<void> {

    return new Promise<void>(async (resolve, reject) => {

        // Get conversation call type (example: inbound, outbound, etc.)
        let conversationCallType = window.sforce.opencti.CALL_TYPE.INBOUND;

        if (conversationDetails.msdyn_channel) {
            if (Number(conversationDetails.msdyn_channel) === CONVERSATION_TYPE.VOICE || Number(conversationDetails.msdyn_channel) === CONVERSATION_TYPE.VOICE_CALL) {
                if (conversationDetails.msdyn_isoutbound) {
                    conversationCallType = window.sforce.opencti.CALL_TYPE.OUTBOUND;
                }
            }
        }

        // find if contact or account salesforce record available for given customer info
        const { contactId, accountId } = await getContactOrAccountId(conversationData, conversationCallType);

        if (contactId || accountId) {
            screenPop(contactId || accountId);
        }
    });
}

/**
 * Function to handle operations on Click to dial
 * @param {ClickToDialCallbackFunction} callbackFuntion func to be registered for click-to-dial.
 * @returns void
 */
export function onClickToDial(callbackFuntion): void {
    window.sforce.opencti.enableClickToDial();
    window.sforce.opencti.onClickToDial({
        listener: (payload) => {
            const clickDialPayload: ClickDialPayloadInfo = {
                number: payload.number
            };

            callbackFuntion(clickDialPayload);
            setSoftPhonePanelVisibility(true);
        }
    });
}


/**
 * Initiates a screen pop action in OpenCTI.
 *
 * @param {string} recordId - The ID of the record to be displayed in the screen pop.
 * @returns {Promise<string>} A promise that resolves with a success message upon successful screen pop, or rejects with an error message if screen pop fails.
 */
function screenPop(recordId: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        window.sforce.opencti.screenPop({
            type: window.sforce.opencti.SCREENPOP_TYPE.SOBJECT,
            params: {
                recordId: recordId
            },
            callback: (response) => {
                if (response.success) {
                    resolve(response.success);
                } else {
                    reject(response.errors);
                }
            }
        });
    });
}

/**
 * Searches for records based on the specified search parameters and call type.
 *
 * @param {string} searchParam - The value used to search for records.
 * @param {string} callType - The type of call being made.
 * @returns {Promise<SFRecordInfo[]>} A promise that resolves with an array of records found from the search.
 */
export async function searchForRecords(searchParam: string, callType: string): Promise<SFRecordInfo[]> {
    return new Promise((resolve, reject) => {
        window.sforce.opencti.searchAndScreenPop({
            searchParams: searchParam,
            callType: callType,
            deferred: true,
            callback: (response) => {
                const recordsArray: SFRecordInfo[] = [];

                if (response.success && response.returnValue) {
                    for (const [key, record] of Object.entries(response.returnValue)) {
                        if (record && ((record as SFRecord).RecordType === RECORD_TYPE.CONTACT || (record as SFRecord).RecordType === RECORD_TYPE.ACCOUNT)) {
                            recordsArray.push({
                                id: key,
                                type: (record as SFRecord).RecordType
                            });
                        }
                    }
                    resolve(recordsArray);
                } else {
                    reject(response.errors);
                }
            }
        });
    });
}

/**
 * Method to fetch ContactId and accountId using current conversation information
 * @param conversationData conversationData Object containing conversation data.
 * @param conversationCallType Call Type
 * @returns {Promise<contactId: string | null, accountId: string | null>}
 */
async function getContactOrAccountId(conversationData: IConversationLoadedEventData, conversationCallType: string): Promise<{ contactId: string | null, accountId: string | null }> {
    const contactIds: Set<string> = new Set();
    const accountIds: Set<string> = new Set();

    const records = await getRecords(conversationData, conversationCallType);

    if (records) {
        records.forEach(({ id, type }) => {
            if (type === RECORD_TYPE.CONTACT) {
                contactIds.add(id);
            } else if (type === RECORD_TYPE.ACCOUNT) {
                accountIds.add(id);
            }
        });
    }

    const contactId = (contactIds.size === 1) ? contactIds.values().next().value : undefined;
    const accountId = (accountIds.size === 1) ? accountIds.values().next().value : undefined;

    return { contactId, accountId };
}

/**
 * Get Records data using conversation details
 * @param conversationData conversationData Object containing conversation details and customer data.
 * @param conversationCallType Call Type
 * @returns {Promise<SFRecordInfo[]>}
 */
async function getRecords(conversationData: IConversationLoadedEventData, conversationCallType: string): Promise<SFRecordInfo[]> {
    let records: SFRecordInfo[] = [];

    try {
        if (checkIfNotEmtpy(CUSTOMERDATAENUM.PHONENUMBER, conversationData)) {
            records = await searchForRecords(conversationData.customerPhoneNumber, conversationCallType);
        } else if (checkIfNotEmtpy(CUSTOMERDATAENUM.NAME, conversationData)) {
            records = await searchForRecords(conversationData.customerName, conversationCallType);
        }

        return records;
    } catch (errors) {
        throw new Error(errors);
    }
}

/**
 * Check if not empty or null or undefined
 * @param fieldName string of field name
 * @param customerData object to be search in
 * @returns boolean
 */
function checkIfNotEmtpy(fieldName: string, customerData: IConversationLoadedEventData) {
    return customerData[fieldName] !== undefined && customerData[fieldName] !== null && customerData[fieldName] !== "";
}