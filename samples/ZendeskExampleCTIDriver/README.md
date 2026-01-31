# Zendesk Talk CTI Driver

CTI Driver for integrating D365 Contact Center with Zendesk Talk using the Zendesk App Framework (ZAF) SDK.

## Features

- Screen pop to user profile based on phone number
- Click-to-dial integration
- Softphone panel resize support
- Conversation and presence event handling

## Prerequisites

1. Zendesk Support account with Talk enabled
2. Zendesk App Framework knowledge
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

3. Deploy `dist/ZendeskExampleCTIDriver.*.min.js` as a Zendesk app

## Zendesk App Configuration

Create a Zendesk app with the following `manifest.json`:

```json
{
  "name": "D365 Contact Center",
  "author": {
    "name": "Your Company"
  },
  "defaultLocale": "en",
  "private": true,
  "location": {
    "support": {
      "top_bar": {
        "url": "assets/index.html"
      }
    }
  },
  "frameworkVersion": "2.0"
}
```

## Usage

The driver automatically:
1. Loads the ZAF SDK
2. Initializes the ZAF client
3. Binds CCaaS SDK events
4. Handles screen pop on incoming conversations
5. Routes click-to-dial events to CCaaS

## API Reference

### ZendeskExampleCTIDriver

```typescript
class ZendeskExampleCTIDriver implements ICTIInterface {
    initialize(): Promise<boolean>;
    bindEvents(): void;
    getZAFClient(): ZAFClientInstance | null;
}
```

## License

MIT License - Microsoft Corporation
