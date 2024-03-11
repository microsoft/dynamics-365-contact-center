// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ICopilotAdapter, OnPageNavigationCallbackFunction, GetDataRequest, GetDataResponse, ProcessDataRequest, ProcessDataResponse, newEventCallbackFunction } from "./ICopilotAdpter";

declare global {
    interface SalesForce {
        opencti: any;
    }
    interface Window {
        sforce: SalesForce;
        CCaaS: any;
    }
}

class ExampleCopilotAdapter implements ICopilotAdapter {

    /**
     * Function to initialize the scripts and do the operations once it is loaded
     * 
     * @returns Promise void
     */
    initialize(): Promise<boolean> {
        // load opencti library

        return Promise.resolve(true);
    }

    onPageNavigation(callback: OnPageNavigationCallbackFunction): void {
       // Listen to the page navigation of third party CRM 
       // and call the callback passed to perform necessary action on page navigation
    }

    getData(request: GetDataRequest): Promise<GetDataResponse> {
        // Retrieve the third party knowledge articles for copilot
    }

    processData(request: ProcessDataRequest): Promise<ProcessDataResponse> {      
        // need to add appropriate description for this method
    }

    onNewEvent(callback: newEventCallbackFunction): void {
        // need to add appropriate description for this method
    }

}

window.CCaaS = window.CCaaS || {};
if (!window.CCaaS.CopilotAdapter) {
    window.CCaaS.CopilotAdapter = ExampleCopilotAdapter;
}

export default ExampleCopilotAdapter;