// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ICTIInterface } from "@ccaas/ictiinterface";
import { embedSDKSampleUsage } from "./EmbedSDKSampleUsage";

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

const OPEN_CTI_VERSION = '54.0';

class SFExampleCTIDriver implements ICTIInterface {

    /**
     * Function to initialize the scripts and do the operations once it is loaded
     *
     * @returns Promise void
     */
    public initialize(): Promise<boolean> {
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
                reject(new Error(`Error in loading ${source}`));
            };
            document.getElementsByTagName('head')[0].appendChild(script);
        })
    }

}

/**
 * Checks and initializes the CCaaS namespace and CTIDriver object if they don't exist.
 * If CCaaS namespace does not exist, it creates it as an empty object.
 * If CTIDriver object does not exist within CCaaS namespace, it assigns it the value of SFExampleCTIDriver.
 */
window.CCaaS = window.CCaaS || {};
if (!window.CCaaS.CTIDriver) {
    window.CCaaS.CTIDriver = SFExampleCTIDriver;
}

export default SFExampleCTIDriver;

