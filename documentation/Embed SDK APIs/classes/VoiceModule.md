# Voice Module

| Method | Availability |
| ------ | ------------ |
| [startRecording](classes/VoiceModule.md#startRecording) | Standalone |
| [pauseRecording](classes/VoiceModule.md#pauseRecording) | Standalone |
| [startTranscription](classes/VoiceModule.md#startTranscription) | Standalone |
| [pauseTranscription](classes/VoiceModule.md#pauseTranscription) | Standalone |
| [onTranscriptionOperationCompleted](classes/VoiceModule.md#onTranscriptionOperationCompleted) | Standalone |
| [onRecordingOperationCompleted](classes/VoiceModule.md#onRecordingOperationCompleted) | Standalone |



### Methods

### startRecording


**`Description`**


Starts recording the ongoing call.
This method allows to  initiate call recording for compliance, quality assurance, or other purposes.

▸ **startRecording**(`payload`: `IToggleRecording`): `Promise`<`void`\>
startRecording(payload: IToggleRecording): Promise<void>
remove event handler by id

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