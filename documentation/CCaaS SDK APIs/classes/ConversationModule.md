# Conversation Module

| Method | Availability |
| ------ | ------------ |
| [getAssignedConversationsList](ConversationModule.md#getassignedconversationslist) | Embed (Public Preview) |
| [getConversationDataUsingFetchXML](ConversationModule.md#getconversationdatausingfetchxml) | Embed (Public Preview) |
| [getFocusedConversationId](ConversationModule.md#getfocusedconversationid) | Embed (Public Preview) |
| [getConversationData](ConversationModule.md#getconversationdata) | Embed (Public Preview) |
| [getTranscript](ConversationModule.md#gettranscript) | Embed (Public Preview) |
| [onAccept](ConversationModule.md#onaccept) | Embed (Public Preview) |
| [onConsultEnd](ConversationModule.md#onconsultend) | Embed (Public Preview), Standalone (Public Preview) |
| [onConsultStart](ConversationModule.md#onconsultstart) | Embed (Public Preview), Standalone (Public Preview) |
| [onConversationLoaded](ConversationModule.md#onconversationloaded) | Embed (Public Preview), Standalone (Public Preview) |
| [onCustomerSentimentChange](ConversationModule.md#oncustomersentimentchange) | Embed (Public Preview), Standalone (Public Preview) |
| [onNewMessage](ConversationModule.md#onnewmessage) | Embed (Public Preview), Standalone (Public Preview) |
| [onNotesAdded](ConversationModule.md#onnotesadded) | Embed (Public Preview) |
| [onReject](ConversationModule.md#onreject) | Embed (Public Preview) |
| [onStatusChange](ConversationModule.md#onstatuschange) | Embed (Public Preview) |
| [onTransfer](ConversationModule.md#ontransfer) | Embed (Public Preview), Standalone (Public Preview) |
| [getCopilotSummary](ConversationModule.md#getcopilotsummary) | Embed (Public Preview), Standalone (Public Preview) |




## Methods
### getAssignedConversationsList

**`Description`**

Retrieves the list of conversations assigned to the logged-in agent based on the specified status.

**getAssignedConversationsList**(`status`): `Promise`[`IAssignedConversationList`](../interfaces/IAssignedConversationList.md)[]\>

#### Parameters

| Name    | Type                                                     | Description                                                                                                                                                                                    |
| :------ | :------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `status` | [`OCLiveWorkItemStatus`](../enums/OCLiveWorkItemStatus.md) | The status of the live work items to filter the assigned conversations. The `status` parameter is of type `OCLiveWorkItemStatus`, representing the desired status (e.g., 2 - Active, 5 - Wrap-Up). |

#### Returns

`Promise`<[`IAssignedConversationList`](../interfaces/IAssignedConversationList.md)[]\>

A promise that resolves to an `IAssignedConversationList` object,
containing details of the conversations assigned to the logged-in agent.

**`Throws`**

Throws an error if the provided `status` is invalid or not part of the `OCLiveWorkItemStatus` enum.

**`Example`**

```ts
Microsoft.CCaaS.EmbedSDK.conversation
	.getAssignedConversationsList(OCLiveWorkItemStatus.Active)
	.then((conversationList) => {
		console.log("Assigned Conversations:", conversationList);
	})
	.catch((error) => {
		console.error("Failed to retrieve assigned conversations:", error);
	});
```

### getConversationData
**`Description`**

Retrieves conversation data for a specified conversation ID.
**getConversationData**(`liveWorkItemId`, `columns`): `Promise`<`Partial`<[`IConversationData`](../interfaces/IConversationData.md)\>\>

#### Parameters

| Name             | Type       | Description                                                                                                                                                                                                                            |
| :--------------- | :--------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `liveWorkItemId` | `string`   | The liveWorkItemId of the conversation for which data is to be retrieved.                                                                                                                                                              |
| `columns`        | `string`[] | An array of column names specifying which data fields to retrieve. The column names can be taken from this URL: [Logical Column Names](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/supported-customizations#logical-column-names) ,   For more detailed info on columns: [Dynamics 365 Column Documentation](https://learn.microsoft.com/en-us/dynamics365/developer/reference/entities/msdyn_ocliveworkitem).

#### Returns

`Promise`<`Partial`<[`IConversationData`](../interfaces/IConversationData.md)\>\>

A promise that resolves to a `Partial<IConversationData>` object containing the requested conversation data.


**`Example`**

```ts
Microsoft.CCaaS.EmbedSDK.conversation
	.getConversationData("12345", ["msdyn_ocliveworkitemid", "msdyn_channel", "statuscode", "msdyn_createdon"])
	.then((data) => {
		console.log("Conversation data:", data);
	})
	.catch((error) => {
		console.error("Failed to retrieve conversation data:", error);
	});
```



---

### getConversationDataUsingFetchXML
**`Description`**

Retrieves conversation data using a specified FetchXML query.
This method allows for complex querying of conversation data using FetchXML, a proprietary query language for Dynamics 365.

**`Deprecated`**

This method is deprecated and will be removed in future versions.

**getConversationDataUsingFetchXML**(`options`: [`IFetchXMLOptions`](../interfaces/IFetchXMLOptions.md)): `Promise`<[`Entity`](../modules.md#entity)\>

#### Parameters

| Name               | Type     | Description                                                         |
| :----------------- | :------- | :------------------------------------------------------------------ |
| `options` | [`IFetchXMLOptions`](../interfaces/IFetchXMLOptions.md) | An object containing the name of the query and the FetchXML string. |                                  |

#### Returns

`Promise`<[`Entity`](../modules.md#entity)\>

A promise that resolves to the result of the FetchXML query.




**`Example`**

```ts
const fetchXmlQuery = `
  <fetch mapping="logical" distinct="true">
    <entity name="msdyn_ocliveworkitem">
      <attribute name="msdyn_isoutbound" />
 	     <attribute name="msdyn_channel" />
      <attribute name="subject" />
      <filter type="and">
        <condition attribute="activityid" operator="eq" uitype="msdyn_ocliveworkitem" value="${CONVERSATION_ID}"/>
      </filter>
      <link-entity name="contact" from="contactid" to="msdyn_customer" visible="false" link-type="outer">
        <attribute name="fullname" alias="contactname" />
        <attribute name="contactid" alias="contact_id" />
      </link-entity>
    *       <link-entity name="account" from="accountid" to="msdyn_customer" visible="false" link-type="outer">
        <attribute name="name" alias="accountname" />
        <attribute name="accountid" alias="account_id" />
      </link-entity>
    </entity>
  </fetch>`;
Microsoft.CCaaS.EmbedSDK.conversation
	.getConversationDataUsingFetchXML({ name: "msdyn_ocliveworkitems", fetchXml: fetchXmlQuery })
	.then((data) => {
		console.log("Fetched conversation data:", data);
	})
	.catch((error) => {
		console.error("Failed to retrieve conversation data:", error);
	});
```



---

### getFocusedConversationId
**`Description`**

Retrieves the ID of the conversation currently focused in the UI.
**getFocusedConversationId**(): `Promise`<`string`\>

#### Returns

`Promise`<`string`\>

A promise that resolves to a string representing the `conversationId`
of the conversation currently in focus.


**`Example`**

```ts
Microsoft.CCaaS.EmbedSDK.conversation
	.getFocusedConversationId()
	.then((conversationId) => {
		console.log("Focused Conversation ID:", conversationId);
	})
	.catch((error) => {
		console.error("Failed to retrieve focused conversation ID:", error);
	});
```

**`Note`**
Currently **getFocusedConversationId**() is not supported in **StandaloneSDK**. You can use the following snippet to acquire the focused conversation id.
```ts
const sessionContext = await Microsoft.Apm.getFocusedSession().getContext();
const tab = sessionContext.getTabContext("tab-id-1");
const conversationID = tab.data.ocContext.config.sessionParams.LiveWorkItemId;
```

### getTranscript
**`Description`**

Retrieves the transcript of messages for a specified liveWorkItemId.
**getTranscript**(`liveWorkItemId`): `Promise`<[`ITranscriptMessage`](../interfaces/ITranscriptMessage.md)[]\>

#### Parameters

| Name             | Type     | Description                                                     |
| :--------------- | :------- | :-------------------------------------------------------------- |
| `liveWorkItemId` | `string` | The conversationId for which the transcript is to be retrieved. |

#### Returns

`Promise`<[`ITranscriptMessage`](../interfaces/ITranscriptMessage.md)[]\>

A promise that resolves to an array of `ITranscriptMessage` objects, each representing a message in the transcript.

**`Throws`**

Throws an error if the provided `liveWorkItemId` is not a valid string or is empty.

**`Example`**

```ts
Microsoft.CCaaS.Embed.conversation
	.getTranscript("12345")
	.then((transcript) => {
		console.log("transcript received", transcript);
	})
	.catch((error) => {
		console.error("Failed to retrieve transcript:", error);
	});
```



---

### onAccept
**`Description`**

Subscribes to the event triggered when an agent accepts a new conversation.
**onAccept**(`callback`): `void`

#### Parameters

| Name       | Type                                                                                         | Description                                                                                                                                          |
| :--------- | :------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------- |
| `callback` | (`eventData`: [`IConversationEventBase`](../interfaces/IConversationEventBase.md)) => `void` | A function to be called when a new conversation is accepted. The callback receives the `liveWorkItemId` of the accepted conversation as a parameter. |

#### Returns

`void`


**`Example`**

```ts
Microsoft.CCaaS.EmbedSDK.conversation.onAccept((eventData) => {
	console.log(`Conversation accepted with ID: ${eventData.liveWorkItemId}`);
});
```



---

### onConsultEnd
**`Description`**

Subscribes to the event triggered when either primary agent ends the consultation or secondary agent leaves the consultation
**onConsultEnd**(`callback`): `void`

#### Parameters

| Name       | Type                                                                               | Description                                                                                                                                                          |
| :--------- | :--------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `callback` | (`eventData`: [`IConsultEventData`](../interfaces/IConsultEventData.md)) => `void` | A function to be called when a consultation ends. The callback receives an `eventData` object of type `IConsultEventData` containing details about the consultation. |

#### Returns

`void`


**`Example`**

```ts
Microsoft.CCaaS.EmbedSDK.conversation.onConsultEnd((eventData) => {
	console.log("Consultaion ended with these details", eventData);
});
```



---

### onConsultStart
**`Description`**

Subscribes to the event triggered when a consultation starts between agents.
**onConsultStart**(`callback`): `void`

#### Parameters

| Name       | Type                                                                               | Description                                                                                                                                                            |
| :--------- | :--------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `callback` | (`eventData`: [`IConsultEventData`](../interfaces/IConsultEventData.md)) => `void` | A function to be called when a consultation starts. The callback receives an `eventData` object of type `IConsultEventData` containing details about the consultation. |

#### Returns

`void`


**`Example`**

```ts
Microsoft.CCaaS.EmbedSDK.conversation.onConsultStart((eventData) => {
	console.log("Consultaion started with these details", eventData);
});
```



---

### onConversationLoaded
**`Description`**

Subscribes to the conversation loaded event.
**onConversationLoaded**(`callback`): `void`

#### Parameters

| Name       | Type                                                                                                     | Description                                                                                                                                                                                 |
| :--------- | :------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `callback` | (`eventData`: [`IConversationLoadedEventData`](../interfaces/IConversationLoadedEventData.md)) => `void` | A function to be called when a conversation is loaded. The callback receives an `eventData` object of type `IConversationLoadedEventData` containing details about the loaded conversation. |

#### Returns

`void`


**`Example`**

```ts
Microsoft.CCaaS.EmbedSDK.conversation.onConversationLoaded((eventData) => {
	console.log(`Conversation loaded with ID: ${eventData.liveWorkItemId}`);
});
```



---

### onCustomerSentimentChange
**`Description`**

Subscribes to the event triggered when a customer's sentiment changes.
**onCustomerSentimentChange**(`callback`): `void`

#### Parameters

| Name       | Type                                                                                 | Description                                                                                                                                                                              |
| :--------- | :----------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `callback` | (`sentimentData`: [`ISentimentObject`](../interfaces/ISentimentObject.md)) => `void` | A function to be called when the customer's sentiment changes. The callback receives a `sentimentData` object of type `ISentimentObject` containing details about the updated sentiment. |

#### Returns

`void`


**`Example`**

```ts
Microsoft.CCaaS.EmbedSDK.conversation.onCustomerSentimentChange((sentimentData) => {
	console.log(`Customer sentiment changed to: ${sentimentData.sentiment}`);
	console.log(`Sentiment details:`, sentimentData);
});
```



---

### onNewMessage
**`Description`**

Subscribes to the new message event from agent/customer.
**onNewMessage**(`callback`): `void`

#### Parameters

| Name       | Type                                                                               | Description                                                                                                                                                            |
| :--------- | :--------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `callback` | (`eventData`: [`IMessageEventData`](../interfaces/IMessageEventData.md)) => `void` | A function to be called when a new message is sent/received. The callback receives an `eventData` object of type `IMessageEventData` containing details about message. |

#### Returns

`void`


**`Example`**

```ts
Microsoft.CCaaS.EmbedSDK.conversation.onNewMessage((eventData) => {
	console.log(`New message with the text: ${eventData.message}`);
});
```



---

### onNotesAdded
**`Description`**

Subscribes to the event triggered when a new note is added.
**onNotesAdded**(`callback`): `void`

#### Parameters

| Name       | Type                                                                             | Description                                                                                                                                                      |
| :--------- | :------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `callback` | (`notesData`: [`INotesAddedEvent`](../interfaces/INotesAddedEvent.md)) => `void` | A function to be called when a new note is added. The callback receives a `notesData` object of type `INotesAddedEvent` containing details about the added note. |

#### Returns

`void`


**`Example`**

```ts
Microsoft.CCaaS.EmbedSDK.conversation.onNotesAdded((notesData) => {
	console.log(`Note added with text: ${notesData.text}`);
	console.log(`Entity ID: ${notesData.entityId}`);
	console.log(`Entity Name: ${notesData.entityName}`);
	console.log(`liveWorkItemId: ${notesData.liveWorkItemId}`);
});
```



---

### onReject
**`Description`**

Subscribes to the event triggered when an agent rejects a new conversation.
**onReject**(`callback`): `void`

#### Parameters

| Name       | Type                                                                                         | Description                                                                                                                                          |
| :--------- | :------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------- |
| `callback` | (`eventData`: [`IConversationEventBase`](../interfaces/IConversationEventBase.md)) => `void` | A function to be called when a new conversation is rejected. The callback receives the `liveWorkItemId` of the rejected conversation as a parameter. |

#### Returns

`void`


**`Example`**

```ts
Microsoft.CCaaS.EmbedSDK.conversation.onReject((eventData) => {
	console.log(`Conversation rejected with ID: ${eventData.liveWorkItemId}`);
});
```



---

### onStatusChange
**`Description`**

Subscribes to the conversation status change event.
**onStatusChange**(`callback`): `void`

#### Parameters

| Name       | Type                                                                                                     | Description                                                                                                                                                                                                      |
| :--------- | :------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `callback` | (`eventData`: [`IConversationStatusChangeData`](../interfaces/IConversationStatusChangeData.md)) => `void` | A function to be called when a conversation status is changed. The callback receives an `eventData` object of type `IConversationStatusChangeData` containing details about the conversation id and updated status. |

#### Returns

`void`


**`Example`**

```ts
Microsoft.CCaaS.EmbedSDK.conversation.onStatusChange((eventData) => {
	console.log(`Conversation status changed with ID: ${eventData.liveWorkItemId} and status: ${eventData.statusCode}`);
});
```



---

### onTransfer
**`Description`**

Subscribes to the conversation transfer event.
**onTransfer**(`callback`): `void`

#### Parameters

| Name       | Type                                                                                               | Description                                                                                                                                                                                                               |
| :--------- | :------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `callback` | (`eventData`: [`IConversationTransferData`](../interfaces/IConversationTransferData.md)) => `void` | A function to be called when a conversation transfer is initiated. The callback receives an `eventData` object of type `IConversationTransferData` containing details about the conversation that is getting transferred. |

#### Returns

`void`


**`Example`**

```ts
Microsoft.CCaaS.EmbedSDK.conversation.onTransfer((eventData) => {
	console.log(`Conversation transferred with ID: ${eventData.liveWorkItemId}`);
});
```

---
### getCopilotSummary
**`Description`**
Retrieves the Copilot summary for a specified conversation.
**getCopilotSummary**(`liveWorkItemId`): `Promise`<[`ICopilotSummary`](../interfaces/ICopilotSummary.md)\>
#### Parameters
| Name             | Type     | Description                                                     |
| :--------------- | :------- | :-------------------------------------------------------------- |
| `liveWorkItemId` | `string` | The conversationId for which the Copilot summary is to be retrieved. |
#### Returns

`Promise`<[`ICopilotSummary`](../interfaces/ICopilotSummary.md)\>

A promise that resolves to an `ICopilotSummary` object containing the summary details for the specified conversation.

**`Throws`**

- `Error`: If the `liveWorkItemId` is invalid, empty, or null
- `Error`: If the conversation is not in Active or wrap-up status
- `Error`: If the Copilot service is unavailable or returns an error

**`Example`**

```ts
Microsoft.CCaaS.EmbedSDK.conversation.getCopilotSummary("your-live-work-item-id")
	.then((summary) => {
		console.log("Copilot Summary:", summary);
	})
	.catch((error) => {
		console.error("Error retrieving Copilot Summary:", error);
	});
```
---