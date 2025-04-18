# VoiceOrVideoCalling Module
| Method | Availability |
| ------ | ------------ |
| [onHoldChange](VoiceOrVideoCallingModule.md#onholdchange) | Embed (Public Preview), Standalone (To be Released) |
| [onMuteChange](VoiceOrVideoCallingModule.md#onmutechange) | Embed (Public Preview), Standalone (To be Released) |



## Methods

### onHoldChange
**`Description`**

Subscribes to the hold state change event for a voice call for an agent.
This event is triggered whenever the agent changes the hold state of a call.
**onHoldChange**(`callback`): `void`

#### Parameters

| Name       | Type                                                                                          | Description                                                                                                                                                                                                                             |
| :--------- | :-------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `callback` | (`holdChangeData`: [`IHoldChangeEventData`](../interfaces/IHoldChangeEventData.md)) => `void` | A function to be invoked when the hold state changes. The `callback` receives a `holdChangeData` object of type `IHoldChangeEventData`, containing details about the hold state change, such as whether the call is on hold or resumed. |

#### Returns

`void`


**`Example for Embed SDK`**

```ts
Microsoft.CCaaS.EmbedSDK.voiceOrVideoCalling.onHoldChange((holdChangeData) => {
	console.log("Hold state changed for the call:", holdChangeData);
	if (holdChangeData.isAgentOnHold) {
		console.log("Agent has put the call on hold.");
	} else {
		console.log("Agent has resumed the call.");
	}
});
```



**`Example for Standalone SDK`**

```ts
Microsoft.CCaaS.StandaloneSDK.voiceVideoCalling.onHoldChange((holdChangeData) => {
	console.log("Hold state changed for the call:", holdChangeData);
	if (holdChangeData.isAgentOnHold) {
		console.log("Agent has put the call on hold.");
	} else {
		console.log("Agent has resumed the call.");
	}
});
```

---

### onMuteChange
**`Description`**

Subscribes to the mute state change event for a voice call.
This event is triggered whenever the agent mutes or unmutes the call.
**onMuteChange**(`callback`): `void`

#### Parameters

| Name       | Type                                                                                          | Description                                                                                                                                                                                                                           |
| :--------- | :-------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `callback` | (`muteChangeData`: [`IMuteChangeEventData`](../interfaces/IMuteChangeEventData.md)) => `void` | A function to be invoked when the mute state changes. The `callback` receives a `muteChangeData` object of type `IMuteChangeEventData`, containing details about the mute state change, such as whether the call is muted or unmuted. |

#### Returns

`void`


**`Example for Embed SDK`**

```ts
Microsoft.CCaaS.EmbedSDK.voiceOrVideoCalling.onMuteChange((muteChangeData) => {
	console.log("Mute state changed for the call:", muteChangeData);
	if (muteChangeData.isAgentMuted) {
		console.log("The agent has muted the call.");
	} else {
		console.log("The agent has unmuted the call.");
	}
});
```

**`Example for Standalone SDK`**

```ts
Microsoft.CCaaS.StandaloneSDK.voiceVideoCalling.onMuteChange((muteChangeData) => {
	console.log("Mute state changed for the call:", muteChangeData);
	if (muteChangeData.isAgentMuted) {
		console.log("The agent has muted the call.");
	} else {
		console.log("The agent has unmuted the call.");
	}
});
```