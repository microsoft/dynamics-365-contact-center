# Five9 CTI Driver

CTI Driver for integrating D365 Contact Center with Five9 using the Agent Desktop Toolkit API.

## Features

- Five9 Agent Desktop Toolkit API integration
- Agent state synchronization
- Interaction event handling
- Click-to-dial support
- Call control (hold, transfer, conference)

## Prerequisites

1. Five9 account with Agent Desktop Toolkit access
2. Five9 Agent Desktop application running
3. D365 Contact Center setup

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the driver:
   ```bash
   npm run build:prod
   ```

3. Deploy `dist/Five9ExampleCTIDriver.*.min.js` to your web server

## Configuration

The Five9 Agent Desktop Toolkit API is automatically detected when running within the Five9 Agent Desktop environment:

```javascript
const driver = new Five9ExampleCTIDriver();
const initialized = await driver.initialize();

if (initialized) {
    console.log('Five9 CTI Driver ready');
}
```

## Five9 Agent States

- `READY` - Agent is available to receive calls
- `NOT_READY` - Agent is not available
- `BUSY` - Agent is on a call
- `WRAP_UP` - Agent is in after-call work

## API Reference

### Five9ExampleCTIDriver

```typescript
class Five9ExampleCTIDriver implements ICTIInterface {
    initialize(): Promise<boolean>;
    bindEvents(): void;
    getAgentDesktopApi(): Five9AgentDesktopAPI | null;
    getCurrentInteraction(): Five9InteractionData | null;
    setAgentState(state: string, reasonCodeId?: string): Promise<void>;
    makeCall(phoneNumber: string, campaignId?: string): Promise<void>;
    endCall(callId: string): Promise<void>;
    holdCall(callId: string): Promise<void>;
    retrieveCall(callId: string): Promise<void>;
    transferCall(callId: string, destination: string): Promise<void>;
    dispose(): void;
}
```

### Five9InteractionData

```typescript
interface Five9InteractionData {
    interactionId: string;
    campaignId?: string;
    callType?: 'INBOUND' | 'OUTBOUND' | 'MANUAL';
    ani?: string;
    dnis?: string;
    callVariables?: Record<string, string>;
}
```

## Call Control Operations

### Making Calls

```javascript
// Make an outbound call
await driver.makeCall('+1234567890');

// Make a call with campaign
await driver.makeCall('+1234567890', 'campaign-id');
```

### Call Management

```javascript
const api = driver.getAgentDesktopApi();

// Hold a call
await driver.holdCall(callId);

// Retrieve a held call
await driver.retrieveCall(callId);

// Transfer a call
await driver.transferCall(callId, '+1987654321');

// End a call
await driver.endCall(callId);
```

## Events

The driver automatically handles the following Five9 events:

- `onCallStarted` - New call received or initiated
- `onCallEnded` - Call completed
- `onAgentStateChange` - Agent state changed
- `onCallHeld` - Call placed on hold
- `onCallRetrieved` - Call retrieved from hold
- `onTransferInitiated` - Transfer started
- `onConferenceInitiated` - Conference started

## Presence Synchronization

Agent presence is automatically synchronized between D365 Contact Center and Five9:

| D365 Presence | Five9 State |
|---------------|-------------|
| Available     | READY       |
| Busy          | NOT_READY   |
| Away          | NOT_READY   |
| Offline       | NOT_READY   |

## License

MIT License - Microsoft Corporation
