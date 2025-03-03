[@embedccaas/embed-ccaas-sdk](../README.md) / [Exports](../modules.md) / NotificationModule


# Notification Module
| Method | Availability |
| ------ | ------------ |
| [addNewNotification](NotificationModule.md#addnewnotification) | Embed |
| [onNewConversationNotification](NotificationModule.md#onnewconversationnotification) | Embed |
| [onNewNotification](NotificationModule.md#onnewnotification) | Embed |

## Methods

### addNewNotification
**`Description`**

Adds a new notification to the CCaaS UI.
This method allows developers to programmatically display notifications in the agent's interface,
such as alerts, reminders, or updates about ongoing tasks or system events.
**addNewNotification**(`newNotificationData`): `Promise`<`string`\>

#### Parameters

| Name                  | Type                                                            | Description                                                                                                                         |
| :-------------------- | :-------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------- |
| `newNotificationData` | [`INotificationOptions`](../interfaces/INotificationOptions.md) | An object of type `INotificationOptions` containing details of the notification, such as its level (info, warning, error), message. |

#### Returns

`Promise`<`string`\>

A promise that resolves to a `string`, representing the `notificationId` of the newly added notification.


**`Example`**

```ts
const notificationOptions = {
	level: NotificationLevels.Information,
	message: "New conversation assigned to you!"
};

Microsoft.CCaaS.EmbedSDK.notifications
	.addNewNotification(notificationOptions)
	.then((notificationId) => {
		console.log("Notification added with ID:", notificationId);
	})
	.catch((error) => {
		console.error("Failed to add notification:", error);
	});
```



---

### onNewConversationNotification
**`Description`**

Subscribes to notifications for new conversations.
This event is triggered when a new conversation is assigned to the agent.
**onNewConversationNotification**(`callback`): `void`

#### Parameters

| Name       | Type                                                                                               | Description                                                                                                                                                                                                                                                        |
| :--------- | :------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `callback` | (`eventData`: [`INewConversationEventData`](../interfaces/INewConversationEventData.md)) => `void` | A function invoked when a new conversation notification is received. The `callback` receives an `eventData` object of type `INewConversationEventData`, containing details about the new conversation, such as conversation ID(liveWorkItemId) and other metadata. |

#### Returns

`void`


**`Example`**

```ts
Microsoft.CCaaS.EmbedSDK.notification.onNewConversationNotification((eventData) => {
	console.log("New Conversation Notification Received:", eventData);
});
```



---

### onNewNotification
**`Description`**

Subscribes to notifications for new alerts.
This event is triggered when a new notification is displayed in the CCaaS UI.
**onNewNotification**(`callback`): `void`

#### Parameters

| Name       | Type                                                                       | Description                                                                                                                                                                                                    |
| :--------- | :------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `callback` | (`eventData`: [`INotification`](../interfaces/INotification.md)) => `void` | A function invoked when a new notification is received. The `callback` receives an `eventData` object of type `INotification`, containing details about the notification, such as notification ID and options. |

#### Returns

`void`


**`Example`**

```ts
Microsoft.CCaaS.ExternalSDK.notification.onNewNotification((eventData) => {
	console.log("New Notification Received:", eventData);
});
```


