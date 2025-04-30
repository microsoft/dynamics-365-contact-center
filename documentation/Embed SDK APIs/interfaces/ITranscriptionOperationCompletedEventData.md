# Interface: ITranscriptionOperationCompletedEventData

## Table of contents

### Properties

-   [liveWorkItemId](ITranscriptionOperationCompletedEventData.md#liveworkitemid)
-   [transactionId](ITranscriptionOperationCompletedEventData.md#transactionid)
-   [result](ITranscriptionOperationCompletedEventData.md#result)
-   [currentState](ITranscriptionOperationCompletedEventData.md#currentstate)
-   [desiredState](ITranscriptionOperationCompletedEventData.md#desiredstate)

### Types

-   [TranscriptionStateValues](ITranscriptionOperationCompletedEventData.md#transcriptionstatevalues)

## Properties

### liveWorkItemId

• **liveWorkItemId**: `string`

---

### transactionId

• **transactionId**: `string`

---

### result

• **result**: `boolean`

---

### currentState

• **currentState**: [`TranscriptionStateValues`](ITranscriptionOperationCompletedEventData.md#transcriptionstatevalues)

---

### desiredState

• **desiredState**: [`TranscriptionStateValues`](ITranscriptionOperationCompletedEventData.md#transcriptionstatevalues)

---

## Types

### TranscriptionStateValues

`TranscriptionStateValues` = `"in-progress"` | `"not-started"` | `"paused"` | `"unknown"`

---