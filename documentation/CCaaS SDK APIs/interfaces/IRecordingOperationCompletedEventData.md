# Interface: IRecordingOperationCompletedEventData

## Table of contents

### Properties

- [liveWorkItemId](IRecordingOperationCompletedEventData.md#liveworkitemid)
- [transactionId](IRecordingOperationCompletedEventData.md#transactionid)
- [result](IRecordingOperationCompletedEventData.md#result)
- [currentState](IRecordingOperationCompletedEventData.md#currentstate)
- [desiredState](IRecordingOperationCompletedEventData.md#desiredstate)

---

### Types

-   [RecordingStateValues](IRecordingOperationCompletedEventData.md#RecordingStateValues)
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

• **currentState**: [`RecordingStateValues`](IRecordingOperationCompletedEventData.md#RecordingStateValues)

---

### desiredState

• **desiredState**:[`RecordingStateValues`](IRecordingOperationCompletedEventData.md#RecordingStateValues)

---

## Types

### RecordingStateValues

`RecordingStateValues` = `"in-progress"` | `"not-started"` | `"paused"` | `"unknown"`

---