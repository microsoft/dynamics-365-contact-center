[//]: # "Copyright (c) Microsoft Corporation."
[//]: # "Licensed under the MIT License."

# Project

The Microsoft Omnichannel Add-on is transforming customer engagement through Generative AI technology across various communication channels. It serves as an AI-centric contact center solution compatible with any CRM or third-party (3P) software. This add-on enables customers to leverage Dynamics 365 Omnichannel (OC) along with AI functionalities within their preferred CRM system.

Built upon the Dynamics Contact Center Platform (DCCP) infrastructure, the Omnichannel Add-on extends its capabilities by seamlessly integrating OC and AI features with existing 3P solutions. Agents have the flexibility to utilize the add-on in either Embedded mode, where the 3P CRM serves as the primary user experience (UX) with OC/AI functionalities embedded, or Standalone mode, where Dynamics OC/AI capabilities take precedence while maintaining connectivity with 3P CRM data.
You can find more details in (https://microsoft.sharepoint.com/:w:/t/Dynamics365CustomerCareApplications/Ee3vBYzRVh9OqGQgNq0ehj8BSSgmm17L1susO6wn7jKnSQ?e=sii0Le)

# Overall Process 

The following steps will guide you to get the Omnichannel Add-on embedded mode working within Salesforce. You should budget for 40 minutes or more to complete the Required Steps. 

Required Steps: 

1. Setup Dynamics OmniChannel 
   
2. Setup Salesforce (for Embedded Model; optional for Standalone) 

3. Integrate Dynamics Omnichannel Add-on with Salesforce (for Embedded Model; optional for Standalone) 

 Optional Steps: 

4. Make updates to your CRM integrations. 

5. Sync (one-time or as needed) CRM data with Dataverse. 


- The CTI driver serves as a bridge between the Microsoft Omnichannel Add-on and Salesforce CRM, allowing for the integration of telephony features into the CRM environment.
 


Note: These steps can be omitted if the default CTIDriver file is used. 

# CTIDriver Extention for SF and SN

# CTIDriver Implementation for Generic CRM 

1. Develop your CTIDriver file by implementing the ICTIDriver interface (ICTI.d.ts), which is available in the repository microsoft/copilot-for-service (github.com) 

// Remove this.
2. Make the class created in step 1? accessible within the window.CCaaS object. The class name created in step 1? is SFCTIDriver. 
 
window.CCaaS = window.CCaaS || {}; 

if (!window.CCaaS.CTIDriver) { 

    window.CCaaS.CTIDriver = SFCTIDriver; 

} 

3. Add implementations for the methods provided by ICTI Interface. 
execute this command from path: `npm run build`
 // Number 4 and 5 can be combined.
4. Host the compiled file on a CDN and include the CDN URL as a query parameter in the call center definition file imported/seen in step 3 under “Salesforce specific instructions: CTI Adapter instructions” heading. 

5. Note: It does not need to be a CDN URL, any URL with public access will also work 
 
The format of the URL should be: 
 
https://ccaas-embed-test.azureedge.net/widget/index.html?dynamicsUrl=https://msdynccaasdev.crm.dynamics.com&ctiDriverUrl=<CDN-url> 
 
Replace <CDN-url> with the actual URL of the hosted compiled file on the CDN. 


# How to use sample code for Salesforce CTI Driver

1. Using "git clone" command, clone the repository

2. User can add customized methods to SFExampleCTIDriver.ts file or User can also use current file
Please note that: If User is writing his own code, then User can define types in ICTI.d.ts first and then write methods in SFExampleCTIDriver.ts file

3. To run build: 
`npm run build`

4. User will get SFExampleCTIDriver.js file generated in **dist** folder
   
5. Give the path of generated JS file in the URL inside query parameter **ctiDriverUrl**
eg: https://ccaas-embed-ppe.azureedge.net/widget/index.html?dynamicsUrl=https://msdynccaasdemo.crm.dynamics.com&msdynembedmode=3&ctiDriverUrl=https://samplectidriver.blob.core.windows.net/ctidriver/SFExampleCTIDriver.js
