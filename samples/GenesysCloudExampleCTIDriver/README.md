# Genesys Cloud CTI Driver

CTI Driver for integrating D365 Contact Center with Genesys Cloud using the PureCloud Platform Client SDK.

## Features

- Genesys Cloud Platform Client SDK integration
- User presence synchronization
- Conversation event handling
- Authentication support

## Prerequisites

1. Genesys Cloud account
2. OAuth client credentials configured
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

3. Deploy `dist/GenesysCloudExampleCTIDriver.*.min.js` to your web server

## Authentication

Configure authentication before initializing:

```javascript
// Set up OAuth access token
GenesysCloudExampleCTIDriver.configureAuth(
    'your-access-token',
    'mypurecloud.com' // or your Genesys Cloud region
);

const driver = new GenesysCloudExampleCTIDriver();
await driver.initialize();
```

## Genesys Cloud Regions

- `mypurecloud.com` - Americas (US East)
- `mypurecloud.ie` - EMEA (Ireland)
- `mypurecloud.com.au` - APAC (Australia)
- `mypurecloud.jp` - APAC (Japan)
- `usw2.pure.cloud` - Americas (US West)
- `cac1.pure.cloud` - Americas (Canada)
- `euw2.pure.cloud` - EMEA (London)
- `apne2.pure.cloud` - APAC (Seoul)

## API Reference

### GenesysCloudExampleCTIDriver

```typescript
class GenesysCloudExampleCTIDriver implements ICTIInterface {
    static configureAuth(accessToken: string, environment?: string): void;
    initialize(): Promise<boolean>;
    bindEvents(): void;
    getUsersApi(): GenesysUsersApi | null;
    getConversationsApi(): GenesysConversationsApi | null;
    getCurrentUser(): GenesysUser | null;
}
```

## License

MIT License - Microsoft Corporation
