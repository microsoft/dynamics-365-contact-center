[//]: # "Copyright (c) Microsoft Corporation."
[//]: # "Licensed under the MIT License."

# Flows and Scripts for ServiceNow Data Sync

The Microsoft Omnichannel Add-on is package of Power Automate flows for ServiceNow connector that allows organizations to sync(one-time-initial-bulk sync or real-time sync) the CRM data to Dataverse.

# Overall Process 

The zip files in this folder are Power Automate flows and are used for import.
 1. SNToDVAccountContactInitialFlow_20240611130010.zip : This Manually-triggered flow sync(one-time-initial-bulk sync) the existing bulk data from CRM to Dataverse.
 2. SNCreateTriggerContact_20240611132402.zip : This Automated-triggered flow sync the newly created Contact record at CRM end into Dataverse in realtime.
 3. SNUpdateTriggerContact_20240611132039.zip : This Automated-triggered flow sync the newly/recently updated Contact record at CRM end into Dataverse in realtime.
 4. SNDeleteTriggerContact_20240611132132.zip : This Automated-triggered flow sync the newly/recently deleted Contact record at CRM end into Dataverse in realtime.
 5. SNTODVCreateAccountTrigger_20240611132447.zip : This Automated-triggered flow sync the newly created Account record at CRM end into Dataverse in realtime.
 6. SNTODVUpdateAccountTrigger_20240611130904.zip : This Automated-triggered flow sync the newly/recently updated Account record at CRM end into Dataverse in realtime.
 7. SNTODVDeleteAccountTrigger_20240611130758.zip : This Automated-triggered flow sync the newly/recently deleted Account record at CRM end into Dataverse in realtime.

The Scripts folder contains the scripts that are required while configuring the Business Rules in ServiceNow instance.
  1.ServiceNowCreateAccountScript.txt : This script is used while configuring Business Rule that gets invoked when a new Account gets created in CRM.
  2.ServiceNowCreateContactScript.txt : This script is used while configuring Business Rule that gets invoked when a new Contact gets created in CRM.
  3.ServiceNowUpdateAccountScript.txt : This script is used while configuring Business Rule that gets invoked when an Account gets updated in CRM.
  4.ServiceNowUpdateContactScript.txt : This script is used while configuring Business Rule that gets invoked when a Contact gets updated in CRM.
  5.ServiceNowDeleteAccountScript.txt : This script is used while configuring Business Rule that gets invoked when an Account gets deleted in CRM.
  6.ServiceNowDeleteContactScript.txt : This script is used while configuring Business Rule that gets invoked when a Contact gets deleted in CRM.


