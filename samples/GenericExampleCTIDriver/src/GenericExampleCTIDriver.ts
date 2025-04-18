// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ICTIInterface } from "@ccaas/ictiinterface";
import { embedSDKSampleUsage } from "./EmbedSDKSampleUsage";

class GenericExampleCTIDriver implements ICTIInterface {
 
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
     * Function to bind Embed CCaaS SDK APIs events
     */
    public bindEvents(): void {
        embedSDKSampleUsage();
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
                resolve(true);
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