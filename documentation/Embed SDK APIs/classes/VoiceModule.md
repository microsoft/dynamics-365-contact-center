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


Starts recording the ongoing call.

▸ **startRecording**(`payload`: `IToggleRecording`): `Promise`<`void`\>

#### Parameters

| Name      | Type                | Description                                                                 |
| :-------- | :------------------ | :-------------------------------------------------------------------------- |
| `payload` | `IToggleRecording`  | An object containing details required to start the recording, such as call ID. |

#### Returns

`Promise`<`void`\>
A promise that resolves when the recording has successfully started.

**`Throws`**
Throws an error if the payload is invalid or if the recording cannot be started.

**`Example`**

```ts
Microsoft.CCaaS.StandaloneSDK.voice.startRecording((e: IToggleRecording) =>
console.log("CCaaSSdk Standalone: startRecording", e)
);
```



---

### pauseRecording
**`Description`**

Pauses the ongoing call recording.
This method allows to temporarily halt call recording.

**pauseRecording**(`payload`: `IToggleRecording`): `Promise`<`void`\>

### Parameters

| Name      | Type                | Description                                                                 |
| :-------- | :------------------ | :-------------------------------------------------------------------------- |
| `payload` | `IToggleRecording`  | An object containing details required to pause the recording, such as call ID. |

### Returns

`Promise`<`void`\>
A promise that resolves when the recording has successfully paused.

**`Throws`**
Throws an error if the payload is invalid or if the recording cannot be paused.

**`Example`**

```ts
Microsoft.CCaaS.StandaloneSDK.voice.pauseRecording((e: IToggleRecording) =>
console.log("CCaaSSdk Standalone: pause Recording", e)
);
```



---
## startTranscription
**`Description`**

Starts transcription of the ongoing call.
This method allows to enable real-time transcription.

**startTranscription**(`payload`: `IToggleTranscription`): `Promise`<`void`\>

### Parameters

| Name      | Type                   | Description                                                                     |
| :-------- | :--------------------- | :------------------------------------------------------------------------------ |
| `payload` | `IToggleTranscription` | An object containing details required to start transcription, such as liveWorkItemId. |

### Returns

`Promise`<`void`\>
A promise that resolves when the transcription has successfully started.

**`Throws`**
Throws an error if the payload is invalid or if the transcription cannot be started.

**`Example`**

```ts
Microsoft.CCaaS.StandaloneSDK.voice.startTranscription((e: IToggleRecording) =>
console.log("CCaaSSdk Standalone: start Transcription", e)
);
```



---
## pauseTranscription
**`Description`**

Pauses the ongoing call transcription.
This method allows to temporarily halt transcription.

**pauseTranscription**(`payload`: `IToggleTranscription`): `Promise`<`void`\>

### Parameters

| Name      | Type                   | Description                                                                     |
| :-------- | :--------------------- | :------------------------------------------------------------------------------ |
| `payload` | `IToggleTranscription` | An object containing details required to pause transcription, such as call ID. |

### Returns

`Promise`<`void`\>
A promise that resolves when the transcription has successfully paused.

**`Throws`**
Throws an error if the payload is invalid or if the transcription cannot be paused.

**`Example`**

```ts
Microsoft.CCaaS.StandaloneSDK.voice.pauseTranscription((e: IToggleRecording) =>
console.log("CCaaSSdk Standalone: pause Transcription", e)
);
```



---
## onTranscriptionOperationCompleted
**`Description`**

Subscribes to transcription operation completion events.
This method allows to listen for events indicating that a transcription operation (start or pause) has completed.

**onTranscriptionOperationCompleted**(`callback`: `(data: ITranscriptionOperationCompletedEventData) => void`): `string`

### Parameters

| Name       | Type                                                    | Description                                                                 |
| :--------- | :------------------------------------------------------ | :-------------------------------------------------------------------------- |
| `callback` | `(data: ITranscriptionOperationCompletedEventData) => void` | A callback function invoked with event data when the transcription operation completes. |

### Returns

`string`
A subscription ID that can be used to unsubscribe from the event.

**`Throws`**
Throws an error if the callback is invalid or if the subscription fails.

**`Example`**

```ts
Microsoft.CCaaS.StandaloneSDK.voice.onTranscriptionOperationCompleted((e: IToggleRecording) =>
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
| `callback` | `(data: IRecordingOperationCompletedEventData) => void` | A callback function invoked with event data when the recording operation completes. |

### Returns

`string`
A subscription ID that can be used to unsubscribe from the event.

**`Throws`**
Throws an error if the callback is invalid or if the subscription fails.

**`Example`**

```ts
Microsoft.CCaaS.StandaloneSDK.voice.onRecordingOperationCompleted((e: IToggleRecording) =>
console.log("CCaaSSdk Standalone: onRecordingOperationCompleted", e)
);
```



---