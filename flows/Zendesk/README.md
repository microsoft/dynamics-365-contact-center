[//]: # "Copyright (c) Microsoft Corporation."
[//]: # "Licensed under the MIT License."

# Flows for Zendesk Data Sync

The Microsoft Omnichannel Add-on is package of Power Automate flows for Zendesk connector that allows organizations to sync(one-time-initial-bulk sync or real-time sync) the CRM data to Dataverse.

# Overall Process 

The zip files in this folder are Power Automate flows and are used for import.
 1. ZendeskOrgUsersInitialSync_[DateTimeStamp].zip : This Manually-triggered flow sync(one-time-initial-bulk sync) the existing bulk data from CRM to Dataverse.
 2. ZendeskCreateUserAPICall_[DateTimeStamp].zip: This Automated-triggered flow sync the newly created User record at CRM end into Dataverse in realtime.
 3. ZendeskUpdateUserAPICall_[DateTimeStamp].zip : This Automated-triggered flow sync the newly/recently updated User record at CRM end into Dataverse in realtime.
 4. ZendeskDeleteUserHttp_[DateTimeStamp].zip : This Automated-triggered flow sync the newly/recently deleted User record at CRM end into Dataverse in realtime.
 5. ZendeskCreateOrgHttp_[DateTimeStamp].zip : This Automated-triggered flow sync the newly created Organisation record at CRM end into Dataverse in realtime.
 6. ZendeskUpdateOrgHttp_[DateTimeStamp].zip : This Automated-triggered flow sync the newly/recently updated Organisation record at CRM end into Dataverse in realtime.
 7. ZendeskDeleteOrgHttp_[DateTimeStamp].zip : This Automated-triggered flow sync the newly/recently deleted Organisation record at CRM end into Dataverse in realtime.



