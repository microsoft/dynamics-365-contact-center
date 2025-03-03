// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import { embedSDKSampleUsage } from "./EmbedSDKSampleUsage";
import { ICTIInterface } from "@ccaas/ictiinterface";


class SNExampleCTIDriver implements ICTIInterface {

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
     * Function to bind Embed CCaaS SDK APIs events
     */
    public bindEvents(): void {
        embedSDKSampleUsage();
    }

    /**
     * Helper function to load the snctidriver script
     * @param source
     * @returns Promise fulfilled with boolean on whether script is loaded or not
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