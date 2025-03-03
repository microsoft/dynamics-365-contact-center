[@embedccaas/embed-ccaas-sdk](../README.md) / [Exports](../modules.md) / ITranscriptMessage

# Interface: ITranscriptMessage

## Table of contents

### Properties

-   [attachmentInfo](ITranscriptMessage.md#attachmentinfo)
-   [content](ITranscriptMessage.md#content)
-   [createdOn](ITranscriptMessage.md#createdon)
-   [id](ITranscriptMessage.md#id)
-   [mode](ITranscriptMessage.md#mode)
-   [sender](ITranscriptMessage.md#sender)

## Properties

### attachmentInfo

• **attachmentInfo**: [`IAttachmentInfo`](IAttachmentInfo.md)[]


---

### content

• **content**: `string`


---

### createdOn

• **createdOn**: `string`


---

### id

• **id**: `string`


---

### mode

• **mode**: `"internal"` \| `"external"`

An external message is exchanged between an agent and a customer, whereas an internal message is exchanged between two agents (consultation).


---

### sender

• **sender**: `Object`

#### Type declaration

| Name               | Type                                         |
| :----------------- | :------------------------------------------- |
| `user`             | { `displayName`: `string` ; `id`: `string` } |
| `user.displayName` | `string`                                     |
| `user.id`          | `string`                                     |

