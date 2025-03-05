[@embedccaas/embed-ccaas-sdk](../README.md) / [Exports](../modules.md) / UtilityModule





# Utility Module

| Method | Availability |
| ------ | ------------ |
| [removeEventHandlerById](UtilityModule.md#removeeventhandlerbyid) | Standalone |



### Methods

### removeEventHandlerById


**`Description`**


This method is used to unsubscribe from subscribed event(removes callback of the registered event).

▸ **removeEventHandlerById**(`id`): `boolean`

remove event handler by id

#### Parameters

| Name | Type     | Description                                      |
| :--- | :------- | :----------------------------------------------- |
| `id` | `string` | unique id returned by the event handler functions |

#### Returns

`boolean`

boolean - if removed successfully

**`Example`**

```ts
// handlerId is a parameter returned by the onSentimentChange method to allow for handler removal
const handlerId =
Microsoft.CCaaS.StandaloneSDK.conversation.onCustomerSentimentChange((e: ISentimentObject) =>
// Callback function
console.log("CCaaSSdk Standalone: Sentiment", e)
);

if (handlerId) {
Microsoft.CCaaS.StandaloneSDK.utility.removeEventHandlerById(
handlerId
);
}