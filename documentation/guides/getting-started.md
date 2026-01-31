# Getting Started with D365 Contact Center CTI Drivers

This guide walks you through creating your first CTI driver for D365 Contact Center.

## Prerequisites

Before you begin, ensure you have:

- **Node.js** 18.x or later
- **npm** 9.x or later
- **TypeScript** 5.x
- Access to D365 Contact Center environment
- Your third-party telephony platform account (Salesforce, ServiceNow, Zendesk, etc.)

## Project Structure

The CTI Driver SDK uses a monorepo structure:

```
samples/
├── core/                    # Shared utilities and base classes
├── ICCaaSEmbedSDK/         # Type definitions for CCaaS SDK
├── ICTIInterface/          # CTI interface definitions
├── SFExampleCTIDriver/     # Salesforce example
├── ServiceNowExampleCTIDriver/
├── ZendeskExampleCTIDriver/
├── GenesysCloudExampleCTIDriver/
├── Five9ExampleCTIDriver/
├── GenericExampleCTIDriver/
├── webpack.base.js         # Shared webpack configuration
└── tsconfig.base.json      # Shared TypeScript configuration
```

## Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/microsoft/dynamics-365-contact-center.git

# Navigate to samples directory
cd dynamics-365-contact-center/samples

# Install dependencies for core utilities
cd core && npm install && cd ..

# Install dependencies for your chosen driver
cd SFExampleCTIDriver && npm install
```

### 2. Build Your First Driver

```bash
# Development build (with source maps)
npm run build

# Production build (minified)
npm run build:prod

# Watch mode for development
npm run build:watch
```

### 3. Understand the Output

After building, you'll find the bundle in the `dist/` folder:

- `{DriverName}.{hash}.min.js` - Production bundle
- `{DriverName}.{hash}.min.js.map` - Source map (if enabled)

## Creating a Custom Driver

### Step 1: Set Up Project Structure

Create a new directory for your driver:

```bash
mkdir -p samples/MyCustomCTIDriver/src
cd samples/MyCustomCTIDriver
```

### Step 2: Create package.json

```json
{
  "name": "my-custom-ctidriver",
  "version": "1.0.0",
  "scripts": {
    "build": "webpack --mode development",
    "build:prod": "webpack --mode production",
    "clean": "rimraf dist"
  },
  "dependencies": {
    "@ccaas/CCaaSEmbedSDK": "file:../ICCaaSEmbedSDK/typings",
    "@ccaas/ictiinterface": "file:../ICTIInterface/typings"
  },
  "devDependencies": {
    "rimraf": "^5.0.0",
    "terser-webpack-plugin": "^5.3.16",
    "ts-loader": "^9.5.1",
    "typescript": "^5.4.3",
    "webpack": "^5.91.0",
    "webpack-cli": "^5.1.4"
  }
}
```

### Step 3: Create tsconfig.json

```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Step 4: Create webpack.config.js

```javascript
const createConfig = require('../webpack.base.js');

module.exports = createConfig({
    entry: "./src/MyCustomCTIDriver.ts",
    outputName: "MyCustomCTIDriver",
    dirname: __dirname
});
```

### Step 5: Implement the Driver

Create `src/MyCustomCTIDriver.ts`:

```typescript
import { ICTIInterface } from "@ccaas/ictiinterface";
import Microsoft from "@ccaas/CCaaSEmbedSDK";

export class MyCustomCTIDriver implements ICTIInterface {
    private embedSDK = window.Microsoft?.CCaaS?.EmbedSDK;

    async initialize(): Promise<boolean> {
        if (!this.embedSDK) {
            console.error('CCaaS EmbedSDK not available');
            return false;
        }

        this.bindEvents();
        console.log('MyCustomCTIDriver initialized');
        return true;
    }

    bindEvents(): void {
        if (!this.embedSDK) return;

        // Handle conversation events
        this.embedSDK.conversation.onConversationLoaded((data) => {
            console.log('Conversation loaded:', data);
            // Your integration logic here
        });

        // Handle click-to-dial
        this.embedSDK.ctiDriver.onClickToDial((dialInfo) => {
            console.log('Click-to-dial:', dialInfo);
            // Initiate call in your telephony system
        });

        // Handle presence changes
        this.embedSDK.presence.onPresenceChange((presence) => {
            console.log('Presence changed:', presence);
            // Sync with your telephony system
        });
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    (window as any).MyCustomCTIDriver = MyCustomCTIDriver;
}
```

## Deployment

### 1. Build for Production

```bash
npm run build:prod
```

### 2. Host the Bundle

Upload the generated bundle to a web server accessible by D365 Contact Center. Common options:

- Azure Blob Storage with CDN
- AWS S3 with CloudFront
- Your organization's web server

### 3. Configure in D365

1. Navigate to Contact Center admin center
2. Go to **Channels** > **Phone** > **CTI provider**
3. Add the URL to your hosted CTI driver bundle
4. Configure any required parameters

## Using Core Utilities

The SDK provides utility functions for common patterns:

```typescript
import { withRetry, CircuitBreaker, withTimeout } from '@ccaas/core';

// Retry API calls with exponential backoff
const result = await withRetry(
    () => fetchData(),
    { maxRetries: 3, initialDelayMs: 1000 }
);

// Use circuit breaker for fault tolerance
const breaker = new CircuitBreaker({ failureThreshold: 5 });
const data = await breaker.execute(() => callExternalApi());

// Add timeout to operations
const response = await withTimeout(
    longRunningOperation(),
    5000 // 5 second timeout
);
```

## Next Steps

- Read [CTI Driver Development Guide](./cti-driver-development.md) for architecture details
- Learn about [Error Handling](./error-handling.md) patterns
- Review [Performance Tuning](./performance-tuning.md) best practices
- See [Troubleshooting](./troubleshooting.md) for common issues

## Resources

- [CCaaS SDK API Reference](../CCaaS%20SDK%20APIs/README.md)
- [Example Drivers](../../samples/)
- [GitHub Issues](https://github.com/microsoft/dynamics-365-contact-center/issues)
