
# ServiceNow Configuration Guide

## Contents

1. [How to Configure Embed Widget in ServiceNow](#how-to-configure-embed-widget-in-servicenow)
2. [How to Configure Copilot in ServiceNow](#how-to-configure-copilot-in-servicenow)
3. [How to Enable Click to Dial](#how-to-enable-click-to-dial)
4. [Link for Setting Up Data Sync](#link-for-setting-up-data-sync)
5. [Alternatives to Data Sync Flow Setup](#alternatives-to-data-sync-flow-setup)
   

## How to configure Embed widget in ServiceNow

#### Configure Openframe CTI
1. Login to Servicenow instance.
2. Click on All. Search for openframe. Select OpenFrame > Configurations.
3. Click on New to add a new configuration.
4. Set the configuration as shown in the screenshot below and click on Submit.

![image](https://github.com/user-attachments/assets/b15100c2-8765-4f2c-bbcd-ea1af7a21bcf)


Now refresh the page. You should get a CTI button on the top right corner.

![image](https://github.com/user-attachments/assets/25cb01f2-8170-496d-9ceb-38ba6c10cb67)


Click the CTI button to invoke the widget floating window.

## How to configure Copilot in ServiceNow

####  Install Knowledge API

Install the plugin for Knowledge API, by following the steps below:
- Click on All. Search for Plugins, and click on Plugins menu item.
- Search for knowledge api. The search should give back the knowledge api plugin (App id: sn_km_api). Click on the Knowledge API card.

![image](https://github.com/user-attachments/assets/1e0a39f7-52d8-4dd8-9dbe-de609ba8cc47)

- Click on Install button to start the plugin installation process. Select the latest version and install now. Wait for the Knowledge API to complete installation.

####  Install Openframe plugin

Install the Openframe plugin, by following the steps below:
- Click on All. Search for Plugins, and click on Plugins menu item.
- Search for Openframe plugin. The search should give back the openframe plugin 	 (Plugin id:: com.sn_openframe). Click on the Openframe plugin card.
- Click on Install button to start the plugin installation process. Select the latest version and install now. Wait for installation to complete.

#### Install Customer Service plugin

Install the Customer Service plugin, by following the steps below:
- Click on All. Search for Plugins, and click on Plugins menu item.
- Search for Customer Serviceplugin. The search should give back the Customer Service plugin (Plugin id:: com.sn_customerservice). 
- Click on Install button on plugin card to start the plugin installation process. Select the latest version and install now. Wait for installation to complete.

#### Adding UI Scripts [Copilot Open Frame (Top-Bar) only]

Create the UI scripts for supporting the CoPilot widget by following the steps below:

Make sure you are in the "Global" workspace.

![image](https://github.com/user-attachments/assets/80984e04-95e5-4f4c-97e7-e219c36e669d)

- Click on All. Search for UI Scripts, and click on UI Scripts menu item.
- Click on New button. Fill in the form as follows:
   - **API Name:** Copilot open frame workspace script
   - **UI Type:** Mobile / Service Portal
   - **Script:** Copy the contents of the script below. 
 ```javascript
(function () {
  try {
    var logMoniker = "Copilot Navigator UI script: ";

    if (!globalThis.copilotNavigationWorkspaceListenerAdded) {
      console.log(logMoniker + "loading workspace navigator....");
      var payload = {
        url: globalThis.window.location.href,
        source: "workspaceUIScript",
        sourceId: "b54abfa8-3d78-4aa0-ae3f-1e2ffbc56850",
        configType: "singleFrame"
      };
      var context = {
        payload: JSON.stringify(payload),
        method: "openframe_communication"
      };
      globalThis.CustomEvent.fireAll("openframe_request", context);

      globalThis.window.navigation.addEventListener("navigate", (event) => {
        console.log(
          logMoniker +
            "Workspace PAGE NAVIGATED: " +
            "\n Old Url: " +
            globalThis.window.location.href +
            "\n New url: " +
            event.destination.url
        );

        var payload = {
          url: event.destination.url,
          source: "workspaceUIScript",
          sourceId: "b54abfa8-3d78-4aa0-ae3f-1e2ffbc56850",
          configType: "singleFrame"
        };
        var context = {
          payload: JSON.stringify(payload),
          method: "openframe_communication"
        };
        globalThis.CustomEvent.fireAll("openframe_request", context);
      });

      globalThis.copilotNavigationWorkspaceListenerAdded = true;
    } else {
      console.log(logMoniker + "Workspace navigator already loaded....");
    }
  } catch (error) {
    console.error(logMoniker + "Workspace Navigator error");
    console.error(error);
  }

  function initialiseScript() {
    // do nothing
  }

  return initialiseScript;
})();
```

  
#### Add another UI script 
- Click on New button. Fill in the form as follows:
   - **API Name:** Copilot open frame desktop script
   - **UI Type:** Desktop
   - Check the Global checkbox
   - **Script:** Copy the contents of the script below. 
   
```javascript
(function () {
  try {
    var logMoniker = "Copilot Navigator UI script: ";
    if (
      !window.parent.navigationListenerAdded &&
      !window.copilotNavigationClassicListenerAdded
    ) {
      console.log(logMoniker + "loading desktop navigator....");
      var payload = {
        url: window.location.href,
        source: "classicUIScript",
        sourceId: "b54abfa8-3d78-4aa0-ae3f-1e2ffbc56850",
        configType: "singleFrame"
      };
      var context = {
        payload: JSON.stringify(payload),
        method: "openframe_communication"
      };
      CustomEvent.fireAll("openframe_request", context);

      window.navigation.addEventListener("navigate", (event) => {
        console.log(
          logMoniker +
            "desktop PAGE NAVIGATED: " +
            "\n Old Url: " +
            window.location.href +
            "\n New url: " +
            event.destination.url
        );

        var payload = {
          url: event.destination.url,
          source: "classicUIScript",
          sourceId: "b54abfa8-3d78-4aa0-ae3f-1e2ffbc56850",
          configType: "singleFrame"
        };
        var context = {
          payload: JSON.stringify(payload),
          method: "openframe_communication"
        };
        CustomEvent.fireAll("openframe_request", context);
      });

      window.copilotNavigationClassicListenerAdded = true;
    } else {
      console.log(logMoniker + "Skipping desktop navigator load....");
    }
  } catch (error) {
    console.log(logMoniker + "Classic UI navigator error");
    console.log(error);
  }
})();
```


#### Adding Client Scripts [Copilot Open Frame (Top-Bar) only]
Create the client scripts for supporting the CoPilot widget by following the steps below:
  
  Make sure you are in the "Global" workspace.

![image](https://github.com/user-attachments/assets/f8d744d7-8b12-43f6-8b5f-3fcc2234ddc4)

- Click on All. Search for Client Scripts, and click on Client Scripts menu item.
- Click on New button. Fill in the form as follows:
	- **Name:** Copilot open frame incident table script
	- **Table:** Incident
	- **UI Type:**  desktop
	- **Type:** onLoad
	- **Script:** Copy the contents of the script below
```javascript
function onLoad() {
  try {
    var tableName = g_form.getTableName();
    var id = g_form.getUniqueValue();
    var payload = {
      recordId: id,
      objectType: tableName,
      source: "classicClientScript",
      sourceId: "b54abfa8-3d78-4aa0-ae3f-1e2ffbc56850",
      configType: "singleFrame"
    };
    var context = {
      payload: JSON.stringify(payload),
      method: "openframe_communication"
    };
    CustomEvent.fireAll("openframe_request", context);
  } catch (error) {
    console.log(
      "Copilot Navigator UI script: CopilotClassicClientScriptCase navigator error"
    );
    console.log(error);
  }
}
```

   Repeat above steps to add same client script for tables Email & sn_customerservice_case

## How to enable click to dial

#### Adding UI Action Client Scripts

Create the UI action client scripts for supporting click to dial by following the steps below:

Make sure you are in the "Global" workspace.

![image](https://github.com/user-attachments/assets/e7bbc101-9e5e-421e-929e-cc3fdf5989ed)


-   Click on All. Search for UI Actions, and click on UI Actions menu item under System Definition.
    
-   Click on New button. Fill in the form as follows:
    
    -   **Name:**  Call
        
    -   **Table:**  Contact [customer_contact]
        
    -   **Active:** checked
        
    -   **Client:** checked
        
    -   **FormButton:** checked
        
    -   **OnClick:** onClick(); [function name provied in script]
        
    -   **Script:** Copy the contents of the script below

```javascript
function onClick() { 
    try { 
        if(!g_form.getValue('phone')) { 
            throw new Error('No phone number available for this contact.'); 
        } 
        
        var tableName = g_form.getTableName(); 
        var id = g_form.getUniqueValue(); 
        var phoneNumber = g_form.getValue('phone'); 
        var payload = { 
            recordId: id, 
            number: phoneNumber, 
            objectType: tableName, 
            source: "classicUIActionScript", 
            sourceId: "a07fa18e-acd8-4335-b78c-a7791c0c21cc" 
        }; 

        var context = { 
            payload: JSON.stringify(payload), 
            method: "openframe_communication" 
        }; 

        CustomEvent.fireAll("openframe_request", context); 
    } catch (error) { 
        console.log( 
        "OpenFrame UI action: openFrame click to dial error" 
        ); 
        console.log(error); 
    } 
} 
```

   Repeat above steps to add same ui actions script for Account table.


## Link for setting up data sync
Follow the document to [Configure the connector for ServiceNow](https://learn.microsoft.com/en-us/dynamics365/contact-center/extend/configure-servicenow-connector)


## Alternatives to data sync flow setup
1. Log in to ServiceNow, navigate to the table, right-click on the desired row, and select Copy sys_id, as shown in the screenshot below.
   
![image](https://github.com/user-attachments/assets/23c5f941-eddb-4027-b7e2-dc6a6aca3d8b)

2. Copy additional details such as First Name, Last Name, and Email from ServiceNow.
3. Log in to your Dynamics 365 organization, open the developer tools, and execute the code snippet below after customizing the values as needed.

```javascript
// define the data to update a record
var Sample data =
    {
        "firstname": "Updated Sample contact",
        "lastname": "updated last name",
        "emailaddress1": "email address to be updated",
	"msdyn_source_crm": 2,
	"msdyn_source_crm_id": "sys_id of the record from servicenow crm",
	"msdyn_source_crm_url": "url of the record from servicenow crm"
    }
// update the record
Xrm.WebApi.updateRecord("contact", "dataverse record id to be updated", data).then(
    function success(result) {
        console.log("Contact updated");
        // perform operations on record update
    },
    function (error) {
        console.log(error.message);
        // handle error conditions
    }
);


// define the data to update a record
var data = {
        "firstname": "Fourth",
        "lastname": "coffee",
        "emailaddress1": "amardkumar@microsoft.com",
	"msdyn_source_crm": 2,
	"msdyn_source_crm_id": "f73db901c3c95a1007111dd1b4013168",
	"msdyn_source_crm_url": "https://dev251806.service-now.com/now/nav/ui/classic/params/target/customer_contact.do%3Fsys_id%3Df73db901c3c95a1007111dd1b4013168%26sysparm_view%3Dcase%26sysparm_record_target%3Dcustomer_contact%26sysparm_record_row%3D1%26sysparm_record_rows%3D1%26sysparm_record_list%3DORDERBYname"
    };


// create account record
Xrm.WebApi.createRecord("contact", data).then(
    function success(result) {
        console.log("Contact created with ID: " + result.id);
        // perform operations on record creation
    },
    function (error) {
        console.log(error.message);
        // handle error conditions
    }
);
```
