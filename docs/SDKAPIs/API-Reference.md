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
| [getAssignedConversationsList](classes/ConversationModule.md#getassignedconversationslist) | Embed           |
| [getConversationDataUsingFetchXML](classes/ConversationModule.md#getconversationdatausingfetchxml) | Embed           |
| [getFocusedConversationId](classes/ConversationModule.md#getfocusedconversationid) | Embed           |
| [getConversationData](classes/ConversationModule.md#getconversationdata) | Embed           |
| [getTranscript](classes/ConversationModule.md#gettranscript) | Embed, Standalone |
| [onAccept](classes/ConversationModule.md#onaccept) | Embed           |
| [onConsultEnd](classes/ConversationModule.md#onconsultend) | Embed, Standalone |
| [onConsultStart](classes/ConversationModule.md#onconsultstart) | Embed, Standalone |
| [onConversationLoaded](classes/ConversationModule.md#onconversationloaded) | Embed, Standalone |
| [onCustomerSentimentChange](classes/ConversationModule.md#oncustomersentimentchange) | Embed, Standalone |
| [onNewMessage](classes/ConversationModule.md#onnewmessage) | Embed, Standalone |
| [onNotesAdded](classes/ConversationModule.md#onnotesadded) | Embed           |
| [onReject](classes/ConversationModule.md#onreject) | Embed           |
| [onStatusChange](classes/ConversationModule.md#onstatuschange) | Embed           |
| [onTransfer](classes/ConversationModule.md#ontransfer) | Embed           |

#### 2. [Presence Module](classes/PresenceModule.md)
Offers APIs and events related to agent presence within the CCaaS environment.

| Method                                        | Availability     |
|-----------------------------------------------|-----------------|
| [getPresence](classes/PresenceModule.md#getpresence) | Embed, Standalone |
| [getPresenceOptions](classes/PresenceModule.md#getpresenceoptions) | Embed, Standalone |
| [onPresenceChange](classes/PresenceModule.md#onpresencechange) | Embed           |
| [setPresence](classes/PresenceModule.md#setpresence) | Embed, Standalone |

#### 3. [VoiceOrVideoCalling Module](classes/VoiceOrVideoCallingModule.md)
Enables voice and video calling capabilities within the embedded application.

| Method                                        | Availability     |
|-----------------------------------------------|-----------------|
| [onHoldChange](classes/VoiceOrVideoCallingModule.md#onholdchange) | Embed, Standalone |
| [onMuteChange](classes/VoiceOrVideoCallingModule.md#onmutechange) | Embed, Standalone |

---

### Embed SDK Exclusive Modules

#### 1. [CTIDriver Module](classes/CTIDriverModule.md)
Contains the logic to interact with the 3rd-party CRM and the Widget.

| Method                                        | Availability     |
|-----------------------------------------------|-----------------|
| [clickToDial](classes/CTIDriverModule.md#clicktodial) | Embed           |
| [onSoftPhonePanelHeightChange](classes/CTIDriverModule.md#onsoftphonepanelheightchange) | Embed |
| [onSoftPhonePanelVisibilityChange](classes/CTIDriverModule.md#onsoftphonepanelvisibilitychange) | Embed |
| [onSoftPhonePanelWidthChange](classes/CTIDriverModule.md#onsoftphonepanelwidthchange) | Embed |

#### 2. [Dataverse Module](classes/DataverseModule.md)
Integrates with Dataverse to fetch records.

| Method                                        | Availability     |
|-----------------------------------------------|-----------------|
| [retrieveMultipleRecords](classes/DataverseModule.md#retrievemultiplerecords) | Embed |
| [retrieveRecord](classes/DataverseModule.md#retrieverecord) | Embed |

#### 3. [Notification Module](classes/NotificationModule.md)
Provides APIs and events for handling notifications within the CCaaS environment.

| Method                                        | Availability     |
|-----------------------------------------------|-----------------|
| [addNewNotification](classes/NotificationModule.md#addnewnotification) | Embed |
| [onNewConversationNotification](classes/NotificationModule.md#onnewconversationnotification) | Embed |
| [onNewNotification](classes/NotificationModule.md#onnewnotification) | Embed |
