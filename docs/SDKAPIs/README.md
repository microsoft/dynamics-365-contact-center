# CCaaS SDK APIs

## Introduction

CCaaS SDK provides a set of APIs that enable seamless integration of **Dynamics 365 Contact Center** functionalities into both **3rd-party CRMs** and **Dynamics environments**. These APIs allow developers to enhance agent workflows, manage customer interactions, and retrieve essential data, ensuring a more efficient and responsive contact center experience.

The SDK operates in two modes:
- **Embed SDK Mode**: Designed for embedding CCaaS functionalities within external CRMs, enabling direct integration with 3rd-party applications.
- **Standalone SDK Mode**: Enables direct interaction with CCaaS within the Dynamics environment without requiring external embedding.

With **CCaaS SDK APIs**, applications can interact with CCaaS, listen to real-time events such as `onCustomerSentimentChange` and `onPresenceChange`, and customize workflows dynamically. Additionally, the SDK facilitates **data retrieval from Dataverse**, allowing access to customer records, interactions, and historical data for enhanced automation and informed decision-making.

Whether used as an embedded solution within a 3rd-party CRM or as a standalone integration within Dynamics, CCaaS SDK APIs provide a scalable and flexible approach to modernizing contact center capabilities.

## Embed SDK vs. Standalone SDK

### Embed SDK

Embed SDK is designed for applications that run within an embedded environment, such as inside a CRM or other business applications. It allows real-time event listening and interaction with CCaaS while operating within a host application. Key capabilities include:

- Listening to real-time events like `onCustomerSentimentChange` when customer sentiment changes and `onPresenceChange` when an agent's presence updates.
- Seamless integration between CRM and CCaaS Widget.
- Accessing and managing data from Dataverse, ensuring agents have relevant customer records and historical interactions.

You can refer to [sample implementation of CTIDriver utilizing Embed SDK](../../samples/GenericExampleCTIDriver/src/GenericExampleCTIDriver.ts).

### Standalone SDK

Standalone SDK provides the same powerful CCaaS integration capabilities but operates within the dynamics environment. It is useful for:

- Executing custom logic on supported events such as `onCustomerSentimentChange`
- Perform actions to retrieve specific data such as `getPresenceOptions` or `getTranscipt`

You can refer to the [private preview guide](../Standalone%20SDK%20API%20docs/Dynamics%20365%20Contact%20Center%20SDK%20preview.pdf) and [sample implementation utilizing Standalone SDK](../../samples/StandaloneSDKExample/formOnloadScript.ts).


Both SDKs offer event-driven capabilities enabling developers to create highly customizable and scalable solutions.
For detailed API documentation and usage examples, refer to the full API reference in the [SDK API Guide](./API-Reference.md).
