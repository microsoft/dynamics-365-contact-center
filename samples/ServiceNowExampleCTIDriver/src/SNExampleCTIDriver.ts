// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import { CCaaSSdk } from "./types/CCaaSSDK";
import {ICTIInterface, ConversationInfo, ClickToDialCallbackFunction} from "./types/IOpenFrame";

class SNExampleCTIDriver implements ICTIInterface {
    ccaaSSDKInstance: CCaaSSdk;

    /**
     * Constructor
     *
     * @param {CCaaSSdk} ccaaSSDKInstance Instance of CCaaSSDK
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
        let isServiceNowPresent = typeof (window as any).openFrameAPI !== 'undefined'
        if (isServiceNowPresent === false) {
            const openCTIurlPath = `/scripts/openframe/latest/openFrameAPI.min.js`;
            const servicenoworgdomain: string = window.location.ancestorOrigins[0];
            const source = `${servicenoworgdomain}${openCTIurlPath}`;

            const sourceResult = SNExampleCTIDriver.loadScript(source);
            return sourceResult;
        }

        return Promise.resolve(true);
    }

    /**
     * Funtion to set width of softphone panel
     *
     * @param {number} width number to set width
     *
     * @returns void
     */
    public setSoftPhonePanelWidth(width: number): void {
        (window as any).openFrameAPI.setWidth(width);
    }

     /**
     * Funtion to set height of softphone panel
     *
     * @param {number} height number to set height
     *
     * @returns void
     */
     public setSoftPhonePanelHeight(height: number): void {
        (window as any).openFrameAPI.setHeight(height);
    }

    /**
     * Function to set visibility of softphone panel
     *
     * @param {boolean} visible value to set visibility
     *
     * @returns void
     */
    public setSoftPhonePanelVisibility(visible: boolean): void {
        if (visible) {
            (window as any).openFrameAPI.show();
          } else {
            (window as any).openFrameAPI.hide();
          }
    }

    /**
     * Prepares a conversation, if an account/contact is found then it shows screen pop with customer information
     * @param {ConversationInfo} conversationData Object containing conversation details and customer data.
     *
     * @returns void
     */
    public async conversationReady(conversationData: ConversationInfo): Promise<void> {

        return new Promise<void>(async (resolve, reject) => {
            // TO IMPLEMENT.
            reject(new Error('Customer data for search is missing'));
        });
    }

    /**
     * Function for ending a conversation.
     *
     * @param {string} conversationId - Unique identifier of the conversation.
     * @returns void
     */
    public endConversation(conversationId: string): void {
        throw new Error('Method not implemented.');
    }

    /**
    * Function to handle operations on Click to dial
    * @param {ClickToDialCallbackFunction} callbackFuntion func to be registered for click-to-dial.
    *
    * @returns void
    */
    public onClickToDial(callbackFuntion: ClickToDialCallbackFunction): void {
        throw new Error('Method not implemented.');
    }

    /**
     * Helper function to load the snctidriver script
     * @param source
     * @returns Promise fulilled with boolean on whether script is loaded or not
     */
    private static loadScript(source: string): Promise<boolean> {
        return new Promise((resolve, reject)=>{
            const script = document.createElement('script');
            script.type='text/javascript';
            script.async = true;
            script.src = source;
            script.onload = function (){
                resolve(true);
            };

            script.onerror = function(){
                reject(new Error(`Error in loading ${source}`));
            };
            document.getElementsByTagName('head')[0].appendChild(script);
        })
    }

}

(window as any).CCaaS = (window as any).CCaaS || {};
if (!(window as any).CCaaS.CTIDriver) {
    (window as any).CCaaS.CTIDriver = SNExampleCTIDriver;
}

export default SNExampleCTIDriver;