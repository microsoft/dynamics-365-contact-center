// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import {
    ClickDialPayloadInfo, ClickToDialCallbackFunction,
    ConversationDetails,
    ConversationInfo,
    CustomerInfo,
    ICTIInterface
} from "./types/ICTI";

declare global {
    interface SalesForce {
        opencti: any;
    }
    interface Window {
        sforce: SalesForce;
        CCaaS: any;
        Microsoft: any;
    }
}

interface SFRecordInfo {
    id: string;
    type: string;
}

interface SFRecord {
    RecordType: string
}
export const CUSTOMERDATAENUM = {
    PHONENUMBER: 'phonenumber',
    EMAIL: 'email',
    NAME: 'name'
};

const OPEN_CTI_VERSION = '54.0';

const RECORD_TYPE = {
    CONTACT: 'Contact',
    ACCOUNT: 'Account'
};

const CONVERSATION_TYPE = {
    "VOICE_CALL": 192440000,
    "VOICE": 192370000
}

class SFExampleCTIDriver implements ICTIInterface {
    ccaaSSDKInstance: any; // This is CCaaSSDK Instance, sdk will get loaded from widget itself and after intialization we can pass this instance to SF constructor.
    contactId: string;
    accountId: string;
    taskId: string;
    coversationCallType: string;

    /**
     * Constructor
     * 
     * @param {any} ccaaSSDKInstance Instance of CCaaSSDK
     * 
     * @returns Instance 
     */
    constructor(ccaaSSDKInstance: any) {

        if (!ccaaSSDKInstance) {
            throw new Error('ccaaSSDKInstance cannot be null or undefined');
        }

        this.ccaaSSDKInstance = ccaaSSDKInstance;
    }

    /**
     * Function to initialize the scripts and do the operations once it is loaded
     * 
     * @returns Promise void
     */
    initialize(): Promise<boolean> {
        let isSforcePresent = typeof window.sforce !== 'undefined' && typeof window.sforce.opencti !== 'undefined';

        if (!isSforcePresent) {
            const openCTIurlPath = `/support/api/${OPEN_CTI_VERSION}/lightning/opencti.js`;
            const salesforceorgdomain: string = new URL(document.referrer).origin;
            const source = `${salesforceorgdomain}${openCTIurlPath}`;

            const sourceResult = SFExampleCTIDriver.loadScript(source);
            return sourceResult;
        }

        return Promise.resolve(true);
    }

    /**
     * Prepares for a conversation by fetching necessary data and creating or retrieving associated tasks in Salesforce.
     * 
     * @param {ConversationInfo} conversationData - An object containing conversation details and customer data.
     * @returns {Promise<void>} A promise that resolves when the conversation is ready, or rejects with an error if any issues occur.
     */
    public async conversationReady(conversationData: ConversationInfo): Promise<void> {

        return new Promise<void>(async (resolve, reject) => {

            const conversationDetails = await this.ccaaSSDKInstance.conversation.getConversationData(conversationData.conversationId, ['msdyn_isoutbound', 'msdyn_channel', 'subject']);

            // Get conversation call type (example: inbound, outbound, etc.)
            let conversationCallType = window.sforce.opencti.CALL_TYPE.INBOUND;

            if (conversationDetails.msdyn_channel) {
                if (conversationDetails.msdyn_channel === CONVERSATION_TYPE.VOICE || conversationDetails.msdyn_channel === CONVERSATION_TYPE.VOICE_CALL) {
                    if (conversationDetails.msdyn_isoutbound) {
                        conversationCallType = window.sforce.opencti.CALL_TYPE.OUTBOUND;
                    }
                }
            }

            // find if contact or account salesforce record available for given customer info
            const { contactId, accountId } = await SFExampleCTIDriver.getContactOrAccountId(conversationData, conversationCallType);

            this.contactId = contactId;
            this.accountId = accountId;

            if (this.contactId || this.accountId) {
                SFExampleCTIDriver.screenPop(this.contactId || this.accountId);
            }
        });
    }

    /**
     * Function for ending a conversation.
     * 
     * @param {string} conversationId - Unique identifier of the conversation.
     * @returns void
     */
    public async endConversation(conversationId: string): Promise<void> {
        window.sforce.opencti.refreshView();
    }

    /**
     * Function to handle operations on Click to dial 
     * @param {ClickToDialCallbackFunction} callbackFuntion func to be registered for click-to-dial.
     * @returns void
     */
    onClickToDial(callbackFuntion: ClickToDialCallbackFunction): void {
        window.sforce.opencti.enableClickToDial();
        window.sforce.opencti.onClickToDial({
            listener: (payload) => {
                const clickDialPayload: ClickDialPayloadInfo = {
                    number: payload.number,
                    objectType: payload.objectType,
                    recordId: payload.recordId,
                    recordName: payload.recordName
                };

                callbackFuntion(clickDialPayload);
                this.setSoftPhonePanelVisibility(true);
            }
        });
    }

    /**
     * Funtion to set visibility of softphone panel
     * @param {boolean} visible flag to indicate visibility
     * @returns void
     */
    setSoftPhonePanelVisibility(status: boolean = true): void {
        const isPanelVisible = window.sforce.opencti.isSoftphonePanelVisible({
            callback: (response) => {
                if (response.success) {
                    return response.returnValue.visible
                } else {
                    throw new Error(response.errors);
                }
            }
        });

        if (status !== isPanelVisible) {
            window.sforce.opencti.setSoftphonePanelVisibility({
                visible: status
            });
        }
    }

    /**
     * Funtion to set width of softphone panel
     * @param {number} width number to set width
     * @returns void
     */
    setSoftPhonePanelWidth(width: number): void {
        window.sforce.opencti.setSoftphonePanelWidth({
            widthPX: width
        });
    }

    /**
     * Funtion to set height of softphone panel
     * @param {number} height number to set height
     * @returns void
     */
    setSoftPhonePanelHeight(height: number): void {
        window.sforce.opencti.setSoftphonePanelHeight({
            heightPX: height
        });
    }

    /**
     * Function to get conversation details
     * @param {string[]} conversationIds Array of ids
     * @returns {Promise<ConversationDetails[]>} Array of conversation details
     */
    public async getConversationDetails(conversationIds: string[]): Promise<ConversationDetails[]> {
        return new Promise((resolve, reject) => {
            const callback = (response) => {
                if (response.success) {
                    const items = JSON.parse(response.returnValue.runApex);
                    resolve(items);
                } else {
                    reject(response.errors);
                }
            };
            window.sforce.opencti.runApex({
                apexClass: "CCaaSHelper", // This class is part of CCaaSSF Package 
                methodName: "queryConversations",
                methodParams: "conversationIds=" + conversationIds.join(','),
                callback: callback
            });
        });
    }

    /**
     * Initiates a screen pop action in OpenCTI.
     * 
     * @param {string} recordId - The ID of the record to be displayed in the screen pop.
     * @returns {Promise<string>} A promise that resolves with a success message upon successful screen pop, or rejects with an error message if screen pop fails.
     */
    static screenPop(recordId: string): Promise<string> {
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
    static async searchForRecords(searchParam: string, callType: string): Promise<SFRecordInfo[]> {
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
     * Method to fetch ContactId and accountId using current convesation information
     * @param conversationData conversationData Object containing conversation details and customer data.
     * @param conversationCallType Call Type
     * @returns {Promise<contactId, accountId>} 
     */
    static async getContactOrAccountId(conversationData: ConversationInfo, coversationCallType: string): Promise<{ contactId: string | null, accountId: string | null }> {
        const contactIds: Set<string> = new Set();
        const accountIds: Set<string> = new Set();

        const records = await SFExampleCTIDriver.getRecords(conversationData, coversationCallType);

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
    static async getRecords(conversationData: ConversationInfo, coversationCallType: string): Promise<SFRecordInfo[]> {
        const customerData: CustomerInfo = conversationData.customerData;
        let records: SFRecordInfo[] = [];

        try {
            if (SFExampleCTIDriver.checkIfNotEmtpy(CUSTOMERDATAENUM.PHONENUMBER, customerData)) {
                records = await SFExampleCTIDriver.searchForRecords(customerData.phonenumber, coversationCallType);
            } else if (SFExampleCTIDriver.checkIfNotEmtpy(CUSTOMERDATAENUM.EMAIL, customerData)) {
                records = await SFExampleCTIDriver.searchForRecords(customerData.email, coversationCallType);
            } else if (SFExampleCTIDriver.checkIfNotEmtpy(CUSTOMERDATAENUM.NAME, customerData)) {
                records = await SFExampleCTIDriver.searchForRecords(customerData.name, coversationCallType);
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
    static checkIfNotEmtpy(fieldName: string, customerData: CustomerInfo) {
        return customerData[fieldName] !== undefined && customerData[fieldName] !== null && customerData[fieldName] !== "";
    }

    /**
     * Function to get script to load
     * 
     * @param {string} source url
     */
    static loadScript(source: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.async = true;
            script.src = source;
            script.onload = function () {
                resolve(true);
            };

            script.onerror = function () {
                reject(new Error(`Error in loading ${source}`));
            };
            document.getElementsByTagName('head')[0].appendChild(script);
        })
    }
}

window.CCaaS = window.CCaaS || {};
if (!window.CCaaS.CTIDriver) {
    window.CCaaS.CTIDriver = SFExampleCTIDriver;
}

export default SFExampleCTIDriver;