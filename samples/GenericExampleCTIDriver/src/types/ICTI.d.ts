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


type ClickToDialCallbackFunction = (payload: ClickDialPayloadInfo) => void;

export interface ICTIInterface {

      /**
       * @description Initialize the scripts and do the operations once it is loaded
       * @returns Promise void
       */
     initialize():Promise<boolean>;

      /**
       * @description Function to be called when conversation is ready. Could be used for operations like
       *              opening up contact/account record in third party crm system
       * @param {ConversationInfo} conversationData Object containing conversation details and customer data.
       * @returns void
       * @example conversationReady({ conversationId: "c6e27f69-c9ea-4547-8040-dc26c2712c07" ,
       *                              customerData: { phonenumber: "+1-212-456-7890" , email: "firstname.secondname@domain.com" , name: "John"}})
       */
    conversationReady(conversationData: ConversationInfo): Promise<void>;

     /**
      * @description Function for ending a conversation.
      *              Add operations to be performed when conversation is ended,
      *              like saving the conversation transcript in the contact
      * @param {string} conversationId - Unique identifier of the conversation that is being ended.
      * @returns void
      * @example endConversation("b46d915e-f7da-4c58-80e9-9f842517617b")
      */
    endConversation(conversationId: string): void;

    /**
     * @description Function to handle operations on Click to dial, Add operations to be performed when outbound call is performed
     * @param {ClickToDialCallbackFunction} callbackFuntion function to be registered for click-to-dial.
     * @returns void
     * @example clickToDial((payload: ClickToDialCallbackFunction) => {// implementation})
     */
    onClickToDial(callbackFuntion: ClickToDialCallbackFunction): void;

    /**
     * @description Funtion to set visibility of softphone panel
     * @param {boolean} visible flag to indicate visibility
     * @returns void
     * @example setSoftPhonePanelVisibility(true)
     */
    setSoftPhonePanelVisibility(visible: boolean): void;

    /**
     * @description Funtion to set width of softphone panel
     * @param {number} width number to set width
     * @returns void
     * @example setSoftPhonePanelWidth(500)
     */
    setSoftPhonePanelWidth(width: number): void;

    /**
     * @description Funtion to set height of softphone panel
     * @param {number} height number to set height
     * @returns void
     * @example setSoftPhonePanelHeight(748)
     */
    setSoftPhonePanelHeight(height: number): void;
}
