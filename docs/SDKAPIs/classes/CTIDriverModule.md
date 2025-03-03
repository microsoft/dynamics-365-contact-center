[@embedccaas/embed-ccaas-sdk](../README.md) / [Exports](../modules.md) / CTIDriverModule


# CTIDriver Module
| Method | Availability |
| ------ | ------------ |
| [clickToDial](CTIDriverModule.md#clicktodial) | Embed |
| [onSoftPhonePanelHeightChange](CTIDriverModule.md#onsoftphonepanelheightchange) | Embed |
| [onSoftPhonePanelVisibilityChange](CTIDriverModule.md#onsoftphonepanelvisibilitychange) | Embed |
| [onSoftPhonePanelWidthChange](CTIDriverModule.md#onsoftphonepanelwidthchange) | Embed|


## Methods

### clickToDial
**`Description`**

Sends the data required for initiating an outbound call, such as the phone number, to the CCaaS UI.
This method allows the number to be displayed in the dialer of the CCaaS UI, enabling the agent to make a call by clicking the call button.
It is triggered by the CTI Driver when an outbound call needs to be initiated from a saved number in the CRM.
**clickToDial**(`dialPayload`): `void`

#### Parameters

| Name          | Type                                                            | Description                                                                      |
| :------------ | :-------------------------------------------------------------- | :------------------------------------------------------------------------------- |
| `dialPayload` | [`ClickDialPayloadInfo`](../interfaces/ClickDialPayloadInfo.md) | An object of type `ClickDialPayloadInfo` containing details of the phone number. |

#### Returns

`void`


**`Example`**

```ts
const dialPayload = {
	number: "+1234567890"
};
Microsoft.CCaaS.EmbedSDK.ctiDriver.clickToDial(dialPayload);
```



---

### onSoftPhonePanelHeightChange
**`Description`**

Subscribes to the event that triggers when the height of the SoftPhone Panel in the CRM has to be changed.
This event notifies the agent's CRM interface about the new height of the SoftPhone Panel.
**onSoftPhonePanelHeightChange**(`callback`): `void`

#### Parameters

| Name       | Type                           | Description                                                                                                                                                                                                                                                                                       |
| :--------- | :----------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `callback` | (`height`: `number`) => `void` | A function to be invoked when the height of the SoftPhone Panel has to be updated. The `callback` receives a numeric value representing the new height (in pixels) of the panel. Inside the callback, the CTI library method has to be invoked to update the SoftPhone Panel's height in the CRM. |

#### Returns

`void`


**`Example`**

```ts
Microsoft.CCaaS.EmbedSDK.ctiDriver.onSoftPhonePanelHeightChange((newHeight) => {
	console.log(`SoftPhone Panel height has been updated to: ${newHeight}px`);
});
```



---

### onSoftPhonePanelVisibilityChange
**`Description`**

Subscribes to the event that triggers when the visibility of the SoftPhone Panel in the CRM has to be changed.
This event notifies whether the SoftPhone Panel has to be shown or hidden in the agent's CRM interface.
**onSoftPhonePanelVisibilityChange**(`callback`): `void`

#### Parameters

| Name       | Type                             | Description                                                                                                                                                                                                                                                                                                                                                   |
| :--------- | :------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `callback` | (`visible`: `boolean`) => `void` | A function to be invoked when the visibility of the SoftPhone Panel has to be changed. The `callback` receives a boolean value, where `true` indicates that the panel should be made visible, and `false` indicates that it should be made hidden. Inside the callback, the CTI library method has to be invoked to show/hide the SoftPhone Panel in the CRM. |

#### Returns

`void`


**`Example`**

```ts
Microsoft.CCaaS.EmbedSDK.ctiDriver.onSoftPhonePanelVisibilityChange((isVisible) => {
	if (isVisible) {
		console.log("SoftPhone Panel is now visible.");
	} else {
		console.log("SoftPhone Panel is now hidden.");
	}
});
```



---

### onSoftPhonePanelWidthChange
**`Description`**

Subscribes to the event that triggers when the width of the SoftPhone Panel in the CRM has to be changed.
This event notifies the agent's CRM interface about the new width of the SoftPhone Panel.
**onSoftPhonePanelWidthChange**(`callback`): `void`

#### Parameters

| Name       | Type                          | Description                                                                                                                                                                                                                                                                                    |
| :--------- | :---------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `callback` | (`width`: `number`) => `void` | A function to be invoked when the width of the SoftPhone Panel has to be updated. The `callback` receives a numeric value representing the new width (in pixels) of the panel. Inside the callback, the CTI library method has to be invoked to update the SoftPhone Panel's width in the CRM. |

#### Returns

`void`


**`Example`**

```ts
Microsoft.CCaaS.EmbedSDK.ctiDriver.onSoftPhonePanelWidthChange((newWidth) => {
	console.log(`SoftPhone Panel width has been updated to: ${newWidth}px`);
});
```
