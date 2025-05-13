# Voice Module

| Method | Availability |
| ------ | ------------ |
| [startRecording](VoiceModule.md#startRecording) | Standalone |
| [pauseRecording](VoiceModule.md#pauseRecording) | Standalone |
| [startTranscription](VoiceModule.md#startTranscription) | Standalone |
| [pauseTranscription](VoiceModule.md#pauseTranscription) | Standalone |
| [onTranscriptionOperationCompleted](VoiceModule.md#onTranscriptionOperationCompleted) | Standalone |
| [onRecordingOperationCompleted](VoiceModule.md#onRecordingOperationCompleted) | Standalone |



### Methods

### startRecording


**`Description`**


Starts the recording of the current voice call. This includes transcription. Please ensure that you have recording enabled.

▸ **startRecording**(`payload`: `IToggleRecording`): `Promise`<`void`\>

#### Parameters

| Name      | Type                | Description                                                                 |
| :-------- | :------------------ | :-------------------------------------------------------------------------- |
| `payload` | [`IToggleRecording`](../interfaces/IToggleRecording.md) | An object containing details required to start the recording, such as liveWorkItemId. |

#### Returns

`void`

**`Throws`**
1. Throws an error if recording is not enabled.

2. Throws an error if you already started transcribing the current voice call

**`Note`**

If you already started transcribing, do not use startRecording. This is by design because recording includes transcription. Use [startTranscription](VoiceModule.md#startTranscription)   instead.

**`Example`**

```ts
await Microsoft.CCaaS.StandaloneSDK.voice.startRecording({ liveWorkItemId: 'f523f628-c07a-e811-8162-000d3aa11f50' });
console.log("CCaaSSdk Standalone: startRecording successful");
```



---

### pauseRecording
**`Description`**

Pauses the recording of the current voice call. This includes transcription. Please ensure that you have recording enabled.

**pauseRecording**(`payload`: `IToggleRecording`): `Promise`<`void`\>

### Parameters

| Name      | Type                | Description                                                                 |
| :-------- | :------------------ | :-------------------------------------------------------------------------- |
| `payload` | [`IToggleRecording`](../interfaces/IToggleRecording.md) | An object containing details required to start the recording, such as liveWorkItemId. |

#### Returns

`void`

**`Throws`**
1. Throws an error if recording is not enabled.

2. Throws an error if you already started transcribing the current voice call

**`Example`**

```ts
Microsoft.CCaaS.StandaloneSDK.voice.pauseRecording({ liveWorkItemId: 'f523f628-c07a-e811-8162-000d3aa11f50' });
console.log("CCaaSSdk Standalone: pause Recording successful");
```



---
## startTranscription
**`Description`**

Starts the transcription of the current voice call. Please ensure that you have transcription enabled.

**startTranscription**(`payload`: `IToggleTranscription`): `Promise`<`void`\>

### Parameters

| Name      | Type                   | Description                                                                     |
| :-------- | :--------------------- | :------------------------------------------------------------------------------ |
| `payload` | [`IToggleTranscription`](../interfaces/IToggleTranscription.md) | An object containing details required to start transcription, such as liveWorkItemId. |

#### Returns

`void`

**`Throws`**
1. Throws an error if transcription is not enabled.

2. Throws an error if you are already recording the current voice call

**`Example`**

```ts
Microsoft.CCaaS.StandaloneSDK.voice.startTranscription({ liveWorkItemId: 'f523f628-c07a-e811-8162-000d3aa11f50' });
console.log("CCaaSSdk Standalone: start Transcription successful");
```



---
## pauseTranscription
**`Description`**

Pauses the transcription of the current voice call. 

**pauseTranscription**(`payload`: `IToggleTranscription`): `Promise`<`void`\>

### Parameters

| Name      | Type                   | Description                                                                     |
| :-------- | :--------------------- | :------------------------------------------------------------------------------ |
| `payload` | [`IToggleTranscription`](../interfaces/IToggleTranscription.md) | An object containing details required to start transcription, such as liveWorkItemId. |

#### Returns

`void`

**`Throws`**
1. Throws an error if transcription is not enabled.

2. Throws an error if you are already recording the current voice call


**`Note`**

If you already started recording, do not use pauseTranscription. This is by design because recording includes transcription. Use pausingRecording instead.

**`Example`**

```ts
Microsoft.CCaaS.StandaloneSDK.voice.pauseTranscription({ liveWorkItemId: 'f523f628-c07a-e811-8162-000d3aa11f50' });
console.log("CCaaSSdk Standalone: pause Transcription successful");
```



---
## onTranscriptionOperationCompleted

**`Description`**

Calls the callback with ITranscriptionOperationCompletedEventData after transcription action has been invoked

**onTranscriptionOperationCompleted**(`callback`: `(data: ITranscriptionOperationCompletedEventData) => void`): `string`

### Parameters

| Name       | Type                                                    | Description                                                                 |
| :--------- | :------------------------------------------------------ | :-------------------------------------------------------------------------- |
| `callback` | (`data`: [`ITranscriptionOperationCompletedEventData`](../interfaces/ITranscriptionOperationCompletedEventData.md)) => `void` | A callback function invoked with event data when the transcription operation completes. |

### Returns

`string`
A subscription ID that can be used to unsubscribe from the event.

**`Throws`**
Throws an error if the callback is invalid or if the subscription fails.

**`Example`**

```ts
Microsoft.CCaaS.StandaloneSDK.voice.onTranscriptionOperationCompleted((e: ITranscriptionOperationCompletedEventData) =>
console.log("CCaaSSdk Standalone: onTranscriptionOperationCompleted", e)
);
```



---

## onRecordingOperationCompleted
**`Description`**

Subscribes to recording operation completion events.
This method allows to listen for events indicating that a recording operation (start or pause) has completed.

**onRecordingOperationCompleted**(`callback`: `(data: IRecordingOperationCompletedEventData) => void`): `string`

### Parameters

| Name       | Type                                                  | Description                                                               |
| :--------- | :---------------------------------------------------- | :------------------------------------------------------------------------ |
| `callback` | (`data`: [`IRecordingOperationCompletedEventData`](../interfaces/IRecordingOperationCompletedEventData.md)) => `void` | A callback function invoked with event data when the recording operation completes. |

### Returns

`string`
A subscription ID that can be used to unsubscribe from the event.

**`Throws`**
Throws an error if the callback is invalid or if the subscription fails.

**`Example`**

```ts
Microsoft.CCaaS.StandaloneSDK.voice.onRecordingOperationCompleted((e: IRecordingOperationCompletedEventData) =>
console.log("CCaaSSdk Standalone: onRecordingOperationCompleted", e)
);
```



---