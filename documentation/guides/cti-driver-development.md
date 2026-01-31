# CTI Driver Development Guide

This guide covers the architecture and development patterns for building CTI drivers.

## Architecture Overview

### Components

```
┌─────────────────────────────────────────────────────────┐
│                   D365 Contact Center                    │
├─────────────────────────────────────────────────────────┤
│                   CCaaS EmbedSDK                         │
│  ┌──────────┬──────────┬──────────┬──────────────────┐  │
│  │Conversa- │ Notifi-  │ Presence │    CTI Driver    │  │
│  │  tion    │  cation  │          │     Module       │  │
│  └──────────┴──────────┴──────────┴──────────────────┘  │
├─────────────────────────────────────────────────────────┤
│                    CTI Driver                            │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Your Custom Implementation                       │   │
│  │  - Event handling                                 │   │
│  │  - API integration                                │   │
│  │  - State synchronization                          │   │
│  └──────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│              Third-Party Telephony Platform              │
│         (Salesforce, ServiceNow, Genesys, etc.)         │
└─────────────────────────────────────────────────────────┘
```

### ICTIInterface

All CTI drivers must implement the `ICTIInterface`:

```typescript
interface ICTIInterface {
    /**
     * Initialize the CTI driver
     * @returns Promise resolving to true on success
     */
    initialize(): Promise<boolean>;

    /**
     * Bind event handlers between CCaaS and telephony platform
     */
    bindEvents(): void;
}
```

## Event Handling

### CCaaS EmbedSDK Events

The EmbedSDK provides several modules with events:

#### Conversation Module

```typescript
const embedSDK = window.Microsoft?.CCaaS?.EmbedSDK;

// Conversation loaded
embedSDK.conversation.onConversationLoaded((data: IConversationLoadedEventData) => {
    console.log('Conversation ID:', data.conversationId);
    console.log('Channel:', data.channel);
    console.log('Customer:', data.customerName);
});

// Status change
embedSDK.conversation.onStatusChange((data: IConversationStatusChangeData) => {
    if (data.statusCode === OCLiveWorkItemStatus.Closed) {
        // Handle conversation close
    }
});

// Accept/Reject
embedSDK.conversation.onAccept((data) => { /* Handle accept */ });
embedSDK.conversation.onReject((data) => { /* Handle reject */ });

// Customer sentiment
embedSDK.conversation.onCustomerSentimentChange((data: ISentimentObject) => {
    console.log('Sentiment:', data.sentiment);
});
```

#### Notification Module

```typescript
// New conversation notification
embedSDK.notification.onNewConversationNotification((data: INewConversationEventData) => {
    // Handle incoming conversation
});

// General notifications
embedSDK.notification.onNewNotification((data: INotification) => {
    console.log('Notification:', data.message);
});
```

#### Presence Module

```typescript
// Presence changes
embedSDK.presence.onPresenceChange((data: IPresence) => {
    console.log('New presence:', data.presenceId);
    console.log('Status:', data.status);
});
```

#### CTI Driver Module

```typescript
// Click-to-dial
embedSDK.ctiDriver.onClickToDial((data: ClickDialPayloadInfo) => {
    const phoneNumber = data.number;
    // Initiate call in telephony system
});

// Panel events
embedSDK.ctiDriver.onSoftPhonePanelHeightChange((height: number) => {
    console.log('Panel height:', height);
});

embedSDK.ctiDriver.onSoftPhonePanelWidthChange((width: number) => {
    console.log('Panel width:', width);
});

embedSDK.ctiDriver.onSoftPhonePanelVisibilityChange((visible: boolean) => {
    console.log('Panel visible:', visible);
});
```

## Driver Patterns

### Basic Driver Structure

```typescript
import { ICTIInterface } from "@ccaas/ictiinterface";
import Microsoft from "@ccaas/CCaaSEmbedSDK";

export class MyCTIDriver implements ICTIInterface {
    private embedSDK = window.Microsoft?.CCaaS?.EmbedSDK;
    private platformApi: PlatformAPI | null = null;

    async initialize(): Promise<boolean> {
        try {
            // 1. Initialize platform connection
            this.platformApi = await this.connectToPlatform();

            // 2. Authenticate if needed
            await this.authenticate();

            // 3. Bind events
            this.bindEvents();

            console.log('CTI Driver initialized');
            return true;
        } catch (error) {
            console.error('Initialization failed:', error);
            return false;
        }
    }

    bindEvents(): void {
        this.bindCCaaSEvents();
        this.bindPlatformEvents();
    }

    private bindCCaaSEvents(): void {
        if (!this.embedSDK) return;

        this.embedSDK.conversation.onConversationLoaded(
            this.handleConversationLoaded.bind(this)
        );

        this.embedSDK.presence.onPresenceChange(
            this.handlePresenceChange.bind(this)
        );

        this.embedSDK.ctiDriver.onClickToDial(
            this.handleClickToDial.bind(this)
        );
    }

    private bindPlatformEvents(): void {
        if (!this.platformApi) return;

        this.platformApi.on('incomingCall', this.handleIncomingCall.bind(this));
        this.platformApi.on('callEnded', this.handleCallEnded.bind(this));
    }

    // Event handlers
    private handleConversationLoaded(data: IConversationLoadedEventData): void {
        // Sync conversation to platform
    }

    private handlePresenceChange(data: IPresence): void {
        // Sync presence to platform
    }

    private handleClickToDial(data: ClickDialPayloadInfo): void {
        // Initiate outbound call
    }

    private handleIncomingCall(callData: any): void {
        // Handle platform incoming call
    }

    private handleCallEnded(callData: any): void {
        // Handle platform call end
    }
}
```

### State Synchronization

Sync state between CCaaS and your platform:

```typescript
class StateSynchronizer {
    private presenceMap: Map<string, string>;

    constructor() {
        // Map CCaaS presence to platform states
        this.presenceMap = new Map([
            ['available', 'READY'],
            ['busy', 'NOT_READY'],
            ['away', 'AWAY'],
            ['offline', 'OFFLINE']
        ]);
    }

    mapPresenceToPlatform(ccaasPresence: string): string {
        return this.presenceMap.get(ccaasPresence) ?? 'NOT_READY';
    }

    mapPlatformToPresence(platformState: string): string {
        for (const [presence, state] of this.presenceMap) {
            if (state === platformState) return presence;
        }
        return 'available';
    }
}
```

### Error Handling Pattern

```typescript
import { withRetry, CircuitBreaker } from '@ccaas/core';

class ResilientDriver implements ICTIInterface {
    private circuitBreaker = new CircuitBreaker({
        failureThreshold: 5,
        timeout: 30000
    });

    async initialize(): Promise<boolean> {
        const result = await withRetry(
            () => this.circuitBreaker.execute(() => this.connect()),
            {
                maxRetries: 3,
                initialDelayMs: 1000,
                onRetry: (error, attempt) => {
                    console.log(`Init retry ${attempt}: ${error.message}`);
                }
            }
        );

        return result.success;
    }

    private async connect(): Promise<void> {
        // Connection logic
    }
}
```

## Platform Integration Examples

### Salesforce OpenCTI

```typescript
class SalesforceDriver implements ICTIInterface {
    private opencti = window.sforce?.opencti;

    async initialize(): Promise<boolean> {
        if (!this.opencti) {
            console.error('Salesforce OpenCTI not available');
            return false;
        }
        this.bindEvents();
        return true;
    }

    bindEvents(): void {
        // Screen pop on conversation load
        this.embedSDK?.conversation.onConversationLoaded(async (data) => {
            await this.opencti?.screenPop({
                type: this.opencti.SCREEN_POP_TYPE.SOBJECT,
                params: { recordId: data.recordId }
            });
        });

        // Sync presence
        this.embedSDK?.presence.onPresenceChange((presence) => {
            this.opencti?.setSoftphoneItemLabel({
                label: presence.status
            });
        });
    }
}
```

### ServiceNow OpenFrame

```typescript
class ServiceNowDriver implements ICTIInterface {
    private openFrameAPI = window.openFrameAPI;

    async initialize(): Promise<boolean> {
        return new Promise((resolve) => {
            this.openFrameAPI?.init({ height: 400 }, () => {
                this.bindEvents();
                resolve(true);
            });
        });
    }

    bindEvents(): void {
        // Listen for screen pop requests from ServiceNow
        this.openFrameAPI?.subscribe('openframe.click_to_dial', (data) => {
            this.embedSDK?.ctiDriver.clickToDial({
                number: data.phone_number
            });
        });
    }
}
```

## Testing

### Unit Testing

```typescript
import { describe, it, expect, jest } from '@jest/globals';
import { MyCTIDriver } from './MyCTIDriver';

describe('MyCTIDriver', () => {
    let driver: MyCTIDriver;

    beforeEach(() => {
        // Mock window.Microsoft.CCaaS.EmbedSDK
        (window as any).Microsoft = {
            CCaaS: {
                EmbedSDK: {
                    conversation: {
                        onConversationLoaded: jest.fn()
                    },
                    presence: {
                        onPresenceChange: jest.fn()
                    },
                    ctiDriver: {
                        onClickToDial: jest.fn()
                    }
                }
            }
        };

        driver = new MyCTIDriver();
    });

    it('should initialize successfully', async () => {
        const result = await driver.initialize();
        expect(result).toBe(true);
    });

    it('should bind conversation events', () => {
        driver.bindEvents();

        const embedSDK = window.Microsoft?.CCaaS?.EmbedSDK;
        expect(embedSDK?.conversation.onConversationLoaded).toHaveBeenCalled();
    });
});
```

### Integration Testing

```typescript
describe('Integration', () => {
    it('should sync presence to platform', async () => {
        const driver = new MyCTIDriver();
        await driver.initialize();

        // Simulate presence change
        const presenceCallback = getRegisteredCallback('presence');
        await presenceCallback({ presenceId: 'busy', status: 'Busy' });

        // Verify platform state
        expect(platformApi.getAgentState()).toBe('NOT_READY');
    });
});
```

## Deployment

### Building

```bash
# Development build
npm run build

# Production build (minified, optimized)
npm run build:prod

# Analyze bundle
npm run build:analyze
```

### Output

Production builds generate:

```
dist/
├── MyCTIDriver.abc123.min.js      # Main bundle
└── MyCTIDriver.abc123.min.js.map  # Source map
```

### Hosting Requirements

- HTTPS required
- CORS headers for cross-origin requests
- Content-Type: `application/javascript`
- Cache-Control headers recommended

### CDN Configuration

Example Azure CDN configuration:

```json
{
    "cacheControl": "public, max-age=31536000",
    "contentType": "application/javascript",
    "cors": {
        "allowedOrigins": ["https://*.dynamics.com"],
        "allowedMethods": ["GET"],
        "allowedHeaders": ["*"]
    }
}
```

## Best Practices

1. **Always check for SDK availability** before using APIs
2. **Handle initialization failures** gracefully
3. **Clean up resources** when driver is disposed
4. **Use TypeScript** for type safety
5. **Log meaningful messages** for debugging
6. **Test with real platforms** during development
7. **Monitor performance** with telemetry
8. **Keep bundles small** through tree shaking

## See Also

- [Getting Started](./getting-started.md)
- [Error Handling](./error-handling.md)
- [Performance Tuning](./performance-tuning.md)
- [CCaaS SDK API Reference](../CCaaS%20SDK%20APIs/README.md)
