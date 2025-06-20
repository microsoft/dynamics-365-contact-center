# Presence Module
| Method | Availability |
| ------ | ------------ |
| [getPresence](PresenceModule.md#getpresence) | Embed (Public Preview), Standalone (Public Preview) |
| [getPresenceOptions](PresenceModule.md#getpresenceoptions) | Embed (Public Preview), Standalone (Public Preview) |
| [onPresenceChange](PresenceModule.md#onpresencechange) | Embed (Public Preview) |
| [setPresence](PresenceModule.md#setpresence) | Embed (Public Preview), Standalone (Public Preview) |


## Methods

### getPresence
**`Description`**

Retrieves the current presence status of the logged-in agent.
This method returns information about the agent's presence, such as their availability or activity status.
**getPresence**(): `Promise`<[`IPresence`](../interfaces/IPresence.md)\>

#### Returns

`Promise`<[`IPresence`](../interfaces/IPresence.md)\>

A promise that resolves to a `IPresence` object,
containing details about the agent's current presence status, including fields like `presenceId`,
`presenceName`, `presenceText`, and other relevant information.


**`Example`**

```ts
Microsoft.CCaaS.EmbedSDK.presence
	.getPresence()
	.then((presenceInfo) => {
		console.log("Agent's Current Presence:", presenceInfo);
		if (presenceInfo.basePresenceStatus == BasePresenceStatus.AVAILABLE) {
			console.log("The agent is available for new tasks.");
		} else {
			console.log(`The agent is currently ${presenceInfo.presenceText}.`);
		}
	})
	.catch((error) => {
		console.error("Failed to retrieve agent's presence status:", error);
	});
```



---

### getPresenceOptions
**`Description`**

Retrieves all the available presence options for the logged-in agent.
These options represent the different presence states (e.g., "Available", "Busy", "Do Not Disturb")
that the agent can choose from.
**getPresenceOptions**(): `Promise`<[`IPresence`](../interfaces/IPresence.md)[]\>

#### Returns

`Promise`<[`IPresence`](../interfaces/IPresence.md)[]\>

A promise that resolves to an array of `IPresence` items.
Each object contains details about a specific presence option, including its ID, name, description,
and other relevant information.


**`Example`**

```ts
Microsoft.CCaaS.EmbedSDK.presence
	.getPresenceOptions()
	.then((presenceOptions) => {
		console.log("Available Presence Options:", presenceOptions);
		presenceOptions.forEach((option) => {
			console.log(`ID: ${option.presenceId}, Name: ${option.presenceName}`);
		});
	})
	.catch((error) => {
		console.error("Failed to retrieve presence options:", error);
	});
```



---

### onPresenceChange
**`Description`**

Subscribes to the presence change event for the logged-in agent.
This event is triggered whenever the agent's presence status is updated,
reflecting a change in their availability or activity state.
**onPresenceChange**(`callback`): `void`

#### Parameters

| Name       | Type                                                                                    | Description                                                                                                                                                                                                                                     |
| :--------- | :-------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `callback` | (`presenceChangeData`: [`IPresence`](../interfaces/IPresence.md)) => `void` | A function to be invoked when the presence change occurs. The `callback` receives a `presenceChangeData` object of type `IPresence`, containing details about the updated presence, such as its ID, name, and other relevant information. |

#### Returns

`void`


**`Example`**

```ts
Microsoft.CCaaS.EmbedSDK.presence.onPresenceChange((presenceChangeData) => {
	console.log("Agent's presence has changed:", presenceChangeData);
	console.log(`New Presence: ${presenceChangeData.presenceName}`);
});
```



---

### setPresence
**`Description`**

Sets the presence status of the logged-in agent based on the specified presence ID.
This method updates the agent's presence to reflect their current availability or activity status.
**setPresence**(`presenceId`): `Promise`<`void`\>

#### Parameters

| Name         | Type     | Description                                                                                        |
| :----------- | :------- | :------------------------------------------------------------------------------------------------- |
| `presenceId` | `string` | The ID of the desired presence status to set. This id can be retrieved from getPresenceOptions API |

#### Returns

`Promise`<`void`\>

A promise that resolves when the presence status is successfully updated.

**`Throws`**

Throws an error if `presenceId` is missing or is not a valid string.


**`Example`**

```ts
Microsoft.CCaaS.EmbedSDK.presence
	.setPresence("f523f628-c07a-e811-8162-000d3aa11f50")
	.then(() => {
		console.log("Agent's presence status has been updated to 'Available'.");
	})
	.catch((error) => {
		console.error("Failed to update agent's presence status:", error);
	});
```


