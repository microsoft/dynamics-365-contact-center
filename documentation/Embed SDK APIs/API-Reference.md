## Modules

Both **Embed SDK** and **Standalone SDK** share some core modules, while others are exclusive to the Embed SDK.

**Note:**
All examples in this document are for the Embed SDK. To use APIs in the standalone version, please use the
`Microsoft.CCaaS.StandaloneSDK` namespace.

### Common Modules (Available in Both SDKs)

#### 1. [Conversation Module](classes/ConversationModule.md)
Provides APIs and events related to conversations between the agent and the customer.

| Method                                             | Availability     |
|----------------------------------------------------|-----------------|
| [getAssignedConversationsList](classes/ConversationModule.md#getassignedconversationslist) | Embed (Public Preview)           |
| [getConversationDataUsingFetchXML](classes/ConversationModule.md#getconversationdatausingfetchxml) | Embed (Public Preview)           |
| [getFocusedConversationId](classes/ConversationModule.md#getfocusedconversationid) | Embed (Public Preview)           |
| [getConversationData](classes/ConversationModule.md#getconversationdata) | Embed (Public Preview)           |
| [getTranscript](classes/ConversationModule.md#gettranscript) | Embed (Public Preview) |
| [onAccept](classes/ConversationModule.md#onaccept) | Embed (Public Preview)           |
| [onConsultEnd](classes/ConversationModule.md#onconsultend) | Embed (Public Preview), Standalone (To be Released) |
| [onConsultStart](classes/ConversationModule.md#onconsultstart) | Embed (Public Preview), Standalone (To be Released) |
| [onConversationLoaded](classes/ConversationModule.md#onconversationloaded) | Embed (Public Preview), Standalone (To be Released) |
| [onCustomerSentimentChange](classes/ConversationModule.md#oncustomersentimentchange) | Embed (Public Preview), Standalone (To be Released) |
| [onNewMessage](classes/ConversationModule.md#onnewmessage) | Embed (Public Preview), Standalone (To be Released) |
| [onNotesAdded](classes/ConversationModule.md#onnotesadded) | Embed (Public Preview)           |
| [onReject](classes/ConversationModule.md#onreject) | Embed (Public Preview)           |
| [onStatusChange](classes/ConversationModule.md#onstatuschange) | Embed (Public Preview)           |
| [onTransfer](classes/ConversationModule.md#ontransfer) | Embed (Public Preview), Standalone (To be Released) |

#### 2. [Presence Module](classes/PresenceModule.md)
Offers APIs and events related to agent presence within the CCaaS environment.

| Method                                        | Availability     |
|-----------------------------------------------|-----------------|
| [getPresence](classes/PresenceModule.md#getpresence) | Embed (Public Preview), Standalone (To be Released) |
| [getPresenceOptions](classes/PresenceModule.md#getpresenceoptions) | Embed (Public Preview), Standalone (To be Released) |
| [onPresenceChange](classes/PresenceModule.md#onpresencechange) | Embed (Public Preview)           |
| [setPresence](classes/PresenceModule.md#setpresence) | Embed (Public Preview), Standalone (To be Released) |

#### 3. [VoiceOrVideoCalling Module](classes/VoiceOrVideoCallingModule.md)
Enables voice and video calling capabilities within the embedded application.

| Method                                        | Availability     |
|-----------------------------------------------|-----------------|
| [onHoldChange](classes/VoiceOrVideoCallingModule.md#onholdchange) | Embed (Public Preview), Standalone (To be Released) |
| [onMuteChange](classes/VoiceOrVideoCallingModule.md#onmutechange) | Embed (Public Preview), Standalone (To be Released) |

---

### Embed SDK Exclusive Modules

#### 1. [CTIDriver Module](classes/CTIDriverModule.md)
Contains the logic to interact with the 3rd-party CRM and the Widget.

| Method                                        | Availability     |
|-----------------------------------------------|-----------------|
| [clickToDial](classes/CTIDriverModule.md#clicktodial) | Embed (Public Preview)           |
| [onSoftPhonePanelHeightChange](classes/CTIDriverModule.md#onsoftphonepanelheightchange) | Embed (Public Preview) |
| [onSoftPhonePanelVisibilityChange](classes/CTIDriverModule.md#onsoftphonepanelvisibilitychange) | Embed (Public Preview) |
| [onSoftPhonePanelWidthChange](classes/CTIDriverModule.md#onsoftphonepanelwidthchange) | Embed (Public Preview) |

#### 2. [Dataverse Module](classes/DataverseModule.md)
Integrates with Dataverse to fetch records.

| Method                                        | Availability     |
|-----------------------------------------------|-----------------|
| [retrieveMultipleRecords](classes/DataverseModule.md#retrievemultiplerecords) | Embed (Public Preview) |
| [retrieveRecord](classes/DataverseModule.md#retrieverecord) | Embed (Public Preview) |

#### 3. [Notification Module](classes/NotificationModule.md)
Provides APIs and events for handling notifications within the CCaaS environment.

| Method                                        | Availability     |
|-----------------------------------------------|-----------------|
| [addNewNotification](classes/NotificationModule.md#addnewnotification) | Embed (Public Preview) |
| [onNewConversationNotification](classes/NotificationModule.md#onnewconversationnotification) | Embed (Public Preview) |
| [onNewNotification](classes/NotificationModule.md#onnewnotification) | Embed (Public Preview) |

---

### Standalone SDK Exclusive Modules
#### 1. [Utility Module](classes/UtilityModule.md)
Provides utility function for the SDK.
| Method                                        | Availability     |
|-----------------------------------------------|-----------------|
| [removeEventHandlerById](classes/UtilityModule.md#removeeventhandlerbyid) | Standalone (To be Released) |
