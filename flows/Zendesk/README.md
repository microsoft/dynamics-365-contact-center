[//]: # "Copyright (c) Microsoft Corporation."
[//]: # "Licensed under the MIT License."

# Flows for Zendesk Data Sync

The Microsoft Omnichannel Add-on is package of Power Automate flows for Zendesk connector that allows organizations to sync(one-time-initial-bulk sync or real-time sync) the CRM data to Dataverse.

# Overall Process 

The zip files in this folder are Power Automate flows and are used for import.
 1. ZendeskOrgUsersInitialSync_20240614133021.zip : This Manually-triggered flow sync(one-time-initial-bulk sync) the existing bulk data from CRM to Dataverse.
 2. ZendeskCreateUserAPICall_20240614133355.zip: This Automated-triggered flow sync the newly created User record at CRM end into Dataverse in realtime.
 3. ZendeskUpdateUserAPICall_20240614132606.zip : This Automated-triggered flow sync the newly/recently updated User record at CRM end into Dataverse in realtime.
 4. ZendeskDeleteUserHttp_20240614133625.zip : This Automated-triggered flow sync the newly/recently deleted User record at CRM end into Dataverse in realtime.
 5. ZendeskCreateOrgHttp_20240614133311.zip : This Automated-triggered flow sync the newly created Organisation record at CRM end into Dataverse in realtime.
 6. ZendeskUpdateOrgHttp_20240614133235.zip : This Automated-triggered flow sync the newly/recently updated Organisation record at CRM end into Dataverse in realtime.
 7. ZendeskDeleteOrgHttp_20240614133139.zip : This Automated-triggered flow sync the newly/recently deleted Organisation record at CRM end into Dataverse in realtime.



