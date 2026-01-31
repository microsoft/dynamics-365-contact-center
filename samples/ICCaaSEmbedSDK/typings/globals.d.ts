// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * Global type extensions for D365 Contact Center CTI Drivers
 *
 * This file provides proper TypeScript declarations for:
 * - Microsoft.CCaaS.EmbedSDK
 * - window.CCaaS namespace for CTI drivers
 * - Platform-specific CTI libraries (Salesforce, ServiceNow)
 */

import { EmbedSDK, ClickDialPayloadInfo } from './CCaaSEmbedSDK';
import { ICTIInterface } from '../../ICTIInterface/typings/ICTI';

// ==================== Salesforce OpenCTI Types ====================

/**
 * Salesforce OpenCTI API types
 * @see https://developer.salesforce.com/docs/atlas.en-us.api_cti.meta/api_cti/
 */
declare namespace SalesforceOpenCTI {
    interface ScreenPopParams {
        type: string;
        params?: Record<string, unknown>;
        callback?: (response: CallbackResponse) => void;
    }

    interface SearchAndScreenPopParams {
        searchParams: string;
        queryParams?: string;
        defaultFieldValues?: Record<string, string>;
        callType?: string;
        deferred?: boolean;
        callback?: (response: SearchCallbackResponse) => void;
    }

    interface SoftphonePanelParams {
        widthPX?: number;
        heightPX?: number;
        visible?: boolean;
        callback?: (response: CallbackResponse) => void;
    }

    interface ClickToDialParams {
        listener: (payload: ClickToDialPayload) => void;
    }

    interface ClickToDialPayload {
        number: string;
        recordId?: string;
        objectType?: string;
    }

    interface CallbackResponse {
        success: boolean;
        returnValue?: unknown;
        errors?: string[];
    }

    interface SearchCallbackResponse extends CallbackResponse {
        returnValue?: {
            [objectType: string]: Array<{
                Id: string;
                RecordType?: string;
                [key: string]: unknown;
            }>;
        };
    }

    interface IsSoftphonePanelVisibleResponse extends CallbackResponse {
        returnValue?: {
            visible: boolean;
        };
    }

    interface OpenCTI {
        SCREENPOP_TYPE: {
            SOBJECT: string;
            URL: string;
            OBJECTHOME: string;
            LIST: string;
            SEARCH: string;
            NEW_RECORD_MODAL: string;
            FLOW: string;
        };

        CALL_TYPE: {
            INBOUND: string;
            OUTBOUND: string;
            INTERNAL: string;
        };

        screenPop(params: ScreenPopParams): void;
        searchAndScreenPop(params: SearchAndScreenPopParams): void;
        setSoftphonePanelWidth(params: SoftphonePanelParams): void;
        setSoftphonePanelHeight(params: SoftphonePanelParams): void;
        setSoftphonePanelVisibility(params: SoftphonePanelParams): void;
        isSoftphonePanelVisible(params: { callback: (response: IsSoftphonePanelVisibleResponse) => void }): void;
        enableClickToDial(params?: { callback?: (response: CallbackResponse) => void }): void;
        disableClickToDial(params?: { callback?: (response: CallbackResponse) => void }): void;
        onClickToDial(params: ClickToDialParams): void;
        getCallCenterSettings(params: { callback: (response: CallbackResponse) => void }): void;
    }
}

// ==================== ServiceNow OpenFrame Types ====================

/**
 * ServiceNow OpenFrame API types
 * @see https://developer.servicenow.com/dev.do#!/reference/api/openframe
 */
declare namespace ServiceNowOpenFrame {
    interface OpenFrameAPI {
        /**
         * Open a record in ServiceNow
         */
        openServiceNowForm(params: OpenFormParams): void;

        /**
         * Set the height of the softphone panel
         */
        setHeight(height: number): void;

        /**
         * Set the width of the softphone panel
         */
        setWidth(width: number): void;

        /**
         * Show or hide the softphone panel
         */
        setVisible(visible: boolean): void;

        /**
         * Show the softphone panel
         */
        show(): void;

        /**
         * Hide the softphone panel
         */
        hide(): void;

        /**
         * Check if the panel is visible
         */
        isVisible(): boolean;

        /**
         * Subscribe to click-to-dial events
         */
        subscribe(event: 'openframe.click_to_dial', callback: (data: ClickToDialData) => void): void;

        /**
         * Get the current ServiceNow instance URL
         */
        getInstanceUrl(): string;
    }

    interface OpenFormParams {
        entity: string;
        query?: string;
        sysId?: string;
    }

    interface ClickToDialData {
        phone_number: string;
        record_sys_id?: string;
        table?: string;
    }
}

// ==================== Global Window Extensions ====================

declare global {
    interface Window {
        /**
         * Microsoft CCaaS namespace
         */
        Microsoft?: {
            CCaaS?: {
                EmbedSDK?: EmbedSDK;
            };
        };

        /**
         * CCaaS CTI Driver namespace
         */
        CCaaS?: {
            CTIDriver?: new () => ICTIInterface;
        };

        /**
         * Salesforce namespace
         */
        sforce?: {
            opencti?: SalesforceOpenCTI.OpenCTI;
        };

        /**
         * ServiceNow OpenFrame API
         */
        openFrameAPI?: ServiceNowOpenFrame.OpenFrameAPI;
    }
}

// Export types for use in implementations
export {
    SalesforceOpenCTI,
    ServiceNowOpenFrame
};
