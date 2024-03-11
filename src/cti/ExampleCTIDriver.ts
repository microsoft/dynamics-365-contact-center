// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ICTIInterface, ConversationInfo, ClickToDialCallbackFunction, ConversationDetails } from "./ICTI";

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

class ExampleCTIDriver implements ICTIInterface {
    contactId: string;
    accountId: string;
    taskId: string;
    coversationCallType: string;

    /**
     * Constructor
     */
    constructor(){
    }

    /**
     * Function to initialize the scripts and do the operations once it is loaded
     * 
     * @returns Promise void
     */
    initialize():Promise<boolean>{ 
        // load opencti library

        return Promise.resolve(true);
    }

    /**
     * 
     * @param {ConversationInfo} conversationData Object containing conversation details and customer data.
     * 
     * @returns void 
     */
    public async conversationReady(conversationData: ConversationInfo): Promise<void> {
        // Open up contact/account record in third party crm system
    }    


    /**
     * Function for ending a conversation.
     * 
     * @param {string} conversationId - Unique identifier of the conversation that is being ended.
     * @returns void
     */  
    public async endConversation(conversationId: string): Promise<void> {
        // Add operations to be performed when conversation is ended
        // like saving the conversation transcript in the contact
    }

    /**
     * Function to handle operations on Click to dial 
     * @param {ClickToDialCallbackFunction} callbackFuntion func to be registered for click-to-dial.
     * 
     * @returns void
     */
    onClickToDial(callbackFuntion: ClickToDialCallbackFunction): void {
        // Add operations to be performed when outbound call is performed
        // like in third party crm system if a contact's phone number is clicked then prepopulate softphone dialer with contact's number
    }

    /**
     * Funtion to set visibility of softphone panel
     * 
     * @param {boolean} visible flag to indicate visibility
     * 
     * @returns void
     */
    setSoftPhonePanelVisibility(visible: boolean = true): void {
       // Set softphone visibility to be visible/hidden
    }

    /**
     * Funtion to set width of softphone panel
     * 
     * @param {number} width number to set width
     * 
     * @returns void
     */
    setSoftPhonePanelWidth(width: number): void {
       // Set softPhonePanle width
    }

    /**
     * Funtion to set height of softphone panel
     * 
     * @param {number} height number to set height
     * 
     * @returns void
     */
    setSoftPhonePanelHeight(height: number): void {
        // Set softPhonePanle height
    }

    /**
     * Function to get conversation details
     * 
     * @param {string[]} conversationIds Array of ids
     * 
     * @returns {Promise<ConversationDetails[]>} Array of conversation details
     */
    public async getConversationDetails(conversationIds: string[]): Promise<ConversationDetails[]> {
          // Query conversations inside third party crm system with the conversation idd in the parameter, return the result of the query
    }  
}

window.CCaaS = window.CCaaS || {};
if (!window.CCaaS.CTIDriver) {
    window.CCaaS.CTIDriver = ExampleCTIDriver;
}

export default ExampleCTIDriver;