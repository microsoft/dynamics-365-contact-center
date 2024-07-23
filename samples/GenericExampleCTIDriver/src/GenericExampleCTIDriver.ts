// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { CCaaSSdk } from "./types/CCaaSSDK";
import {
    ClickToDialCallbackFunction,
    ConversationInfo,
    ICTIInterface
} from "./types/ICTI";

class GenericExampleCTIDriver implements ICTIInterface {
    ccaaSSDKInstance: CCaaSSdk; // This is CCaaSSDK Instance, sdk will get loaded from ccaas itself and after intialization ccaas passes this instance to the constructor.

    /**
     * Constructor
     *
     * @param {any} ccaaSSDKInstance Instance of CCaaSSDK
     *
     * @returns Instance
     */
    constructor(ccaaSSDKInstance: CCaaSSdk) {

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
    public initialize(): Promise<boolean> {
        const crmCTILibUrlPath = `<crm-ctidriver-file-path`; // give crm's cti js lib path
        const crmorgdomain: string = window.location.ancestorOrigins[0];
        const source = `${crmorgdomain}${crmCTILibUrlPath}`;
        const sourceResult = GenericExampleCTIDriver.loadScript(source);
        return sourceResult;
    }

    /**
     * Prepares a conversation, method that gets called as soon as a conversation is accepted by agent
     *
     * @param {ConversationInfo} conversationData - An object containing conversation details and customer data.
     * @returns {Promise<void>} A promise that resolves when the conversation is ready, or rejects with an error if any issues occur.
     */
    public async conversationReady(conversationData: ConversationInfo): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            // Add your implementation
             reject(new Error('Method not implemented yet'));
        });
    }

    /**
     * Function that gets called when conversation is ended
     *
     * @param {string} conversationId - Unique identifier of the conversation.
     * @returns void
     */
    public endConversation(): void {
        throw new Error('Method not implemented.');
    }

    /**
     * Function to handle operations on Click to dial (outbound call)
     * @param {ClickToDialCallbackFunction} callbackFuntion func to be registered for click-to-dial.
     * @returns void
     */
    public onClickToDial(callbackFuntion: ClickToDialCallbackFunction): void {
        throw new Error('Method not implemented.');
    }

    /**
     * Funtion to set visibility of softphone panel
     * @param {boolean} visible flag to indicate visibility
     * @returns void
     */
    public setSoftPhonePanelVisibility(status: boolean = true): void {
        throw new Error('Method not implemented.');
    }

    /**
     * Funtion to set width of softphone panel
     * @param {number} width number to set width
     * @returns void
     */
    public setSoftPhonePanelWidth(width: number): void {
        throw new Error('Method not implemented.');
    }

    /**
     * Funtion to set height of softphone panel
     * @param {number} height number to set height
     * @returns void
     */
    public setSoftPhonePanelHeight(height: number): void {
        throw new Error('Method not implemented.');
    }

    /**
     * Function to get script to load
     *
     * @param {string} source url
     */
    private static loadScript(source: string): Promise<boolean> {
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

/**
 * Checks and initializes the CCaaS namespace and CTIDriver object if they don't exist.
 * If CCaaS namespace does not exist, it creates it as an empty object.
 * If CTIDriver object does not exist within CCaaS namespace, it assigns it the value of GenericExampleCTIDriver.
 */
(window as any).CCaaS = (window as any).CCaaS || {};
if (!(window as any).CCaaS.CTIDriver) {
    (window as any).CCaaS.CTIDriver = GenericExampleCTIDriver;
}

export default GenericExampleCTIDriver;