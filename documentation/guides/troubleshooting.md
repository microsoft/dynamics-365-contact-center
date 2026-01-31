# Troubleshooting Guide

This guide helps diagnose and resolve common issues with CTI drivers.

## Common Issues

### Driver Not Loading

**Symptoms:**
- CTI driver bundle not executing
- `window.MyCTIDriver` is undefined
- No console output from driver

**Possible Causes and Solutions:**

1. **Script not loaded**
   ```javascript
   // Check if script is in the DOM
   const scripts = document.querySelectorAll('script[src*="CTIDriver"]');
   console.log('CTI scripts found:', scripts.length);
   ```

2. **CORS error**
   - Check browser console for CORS errors
   - Verify CDN/server CORS headers include D365 origin
   - Required header: `Access-Control-Allow-Origin: https://*.dynamics.com`

3. **Content Security Policy (CSP) blocking**
   - Check for CSP violation errors in console
   - See [CSP Compliance Guide](../security/csp-compliance.md)

4. **Network failure**
   - Check Network tab for failed requests
   - Verify URL is accessible
   - Check for certificate issues with HTTPS

### EmbedSDK Not Available

**Symptoms:**
```
CCaaS EmbedSDK not available
window.Microsoft.CCaaS.EmbedSDK is undefined
```

**Solutions:**

1. **Wait for SDK to load**
   ```typescript
   async function waitForEmbedSDK(timeout = 10000): Promise<boolean> {
       const start = Date.now();

       while (Date.now() - start < timeout) {
           if (window.Microsoft?.CCaaS?.EmbedSDK) {
               return true;
           }
           await new Promise(r => setTimeout(r, 100));
       }

       return false;
   }

   // Usage
   if (await waitForEmbedSDK()) {
       driver.initialize();
   } else {
       console.error('EmbedSDK not available after timeout');
   }
   ```

2. **Check D365 Contact Center is loaded**
   - Ensure page is fully loaded
   - Verify user has Contact Center license
   - Check browser compatibility

### Events Not Firing

**Symptoms:**
- Event handlers never called
- `onConversationLoaded` not triggered
- Presence changes not detected

**Diagnostic Steps:**

1. **Verify event binding**
   ```typescript
   const embedSDK = window.Microsoft?.CCaaS?.EmbedSDK;

   // Log to confirm binding
   embedSDK?.conversation.onConversationLoaded((data) => {
       console.log('EVENT: onConversationLoaded', data);
   });

   console.log('Event binding complete');
   ```

2. **Check for multiple bindings**
   - Ensure `bindEvents()` is called only once
   - Avoid binding in constructor if also in `initialize()`

3. **Verify conversation exists**
   - Events only fire when conversations are active
   - Test with an actual conversation

### Click-to-Dial Not Working

**Symptoms:**
- Click-to-dial button does nothing
- No call initiated in telephony platform

**Solutions:**

1. **Check handler registration**
   ```typescript
   embedSDK?.ctiDriver.onClickToDial((dialInfo) => {
       console.log('Click-to-dial received:', dialInfo);
       console.log('Number:', dialInfo.number);

       // Verify number is valid
       if (!dialInfo.number) {
           console.error('No phone number provided');
           return;
       }

       // Initiate call
       myPlatform.makeCall(dialInfo.number);
   });
   ```

2. **Verify platform API available**
   ```typescript
   if (!this.platformApi) {
       console.error('Platform API not initialized');
       return;
   }
   ```

### Presence Sync Issues

**Symptoms:**
- Presence not updating in telephony platform
- Bidirectional sync not working

**Solutions:**

1. **Check presence mapping**
   ```typescript
   embedSDK?.presence.onPresenceChange((presence) => {
       console.log('Presence changed:', presence);
       console.log('Presence ID:', presence.presenceId);
       console.log('Status:', presence.status);

       // Map to platform state
       const platformState = mapPresenceToPlatform(presence);
       console.log('Mapped to:', platformState);
   });
   ```

2. **Handle async operations**
   ```typescript
   embedSDK?.presence.onPresenceChange(async (presence) => {
       try {
           await platformApi.setAgentState(mapPresence(presence));
       } catch (error) {
           console.error('Failed to sync presence:', error);
       }
   });
   ```

## Browser Developer Tools

### Console Logging

Enable verbose logging during development:

```typescript
const DEBUG = true;

function log(message: string, data?: any): void {
    if (DEBUG) {
        console.log(`[CTI Driver] ${message}`, data ?? '');
    }
}

// Usage
log('Initializing driver');
log('Event received', eventData);
```

### Network Tab

Monitor API calls:

1. Open DevTools (F12)
2. Go to Network tab
3. Filter by XHR/Fetch
4. Look for failed requests (red)
5. Check response status and body

### Application Tab

Check storage and service workers:

1. Local Storage - cached tokens, state
2. Session Storage - temporary data
3. Service Workers - check for registration issues

### Performance Tab

Profile driver performance:

1. Start recording
2. Perform actions (load conversation, click-to-dial)
3. Stop recording
4. Analyze flame chart for bottlenecks

## Common Error Messages

### "TypeError: Cannot read properties of undefined"

```javascript
// Error
window.Microsoft.CCaaS.EmbedSDK.conversation.onConversationLoaded(...)
// TypeError: Cannot read properties of undefined (reading 'CCaaS')

// Fix: Use optional chaining
window.Microsoft?.CCaaS?.EmbedSDK?.conversation?.onConversationLoaded(...)
```

### "Network request failed"

```javascript
// Add retry logic
const result = await withRetry(
    () => fetchData(),
    { maxRetries: 3 }
);

if (!result.success) {
    console.error('Request failed after retries:', result.error);
}
```

### "Circuit breaker is open"

```javascript
// The circuit breaker is preventing requests due to failures
// Wait for timeout or reset manually

if (!breaker.isAllowingRequests()) {
    console.log('Service temporarily unavailable');
    console.log('Circuit state:', breaker.getState());
    console.log('Stats:', breaker.getStats());

    // Option 1: Wait for automatic half-open
    // Option 2: Reset manually if service is known to be up
    // breaker.reset();
}
```

### "Timeout exceeded"

```typescript
// Increase timeout for slow operations
const result = await withTimeout(
    slowOperation(),
    30000 // 30 seconds instead of default
);
```

## Platform-Specific Issues

### Salesforce OpenCTI

**Issue:** `window.sforce.opencti` is undefined

**Solution:**
```typescript
// Wait for OpenCTI to load
function waitForOpenCTI(): Promise<boolean> {
    return new Promise((resolve) => {
        if (window.sforce?.opencti) {
            resolve(true);
            return;
        }

        // Use Salesforce's onReady callback
        (window as any).sforce?.one?.on('ocready', () => {
            resolve(true);
        });

        setTimeout(() => resolve(false), 10000);
    });
}
```

### ServiceNow OpenFrame

**Issue:** `openFrameAPI.init` callback never fires

**Solution:**
```typescript
// Check OpenFrame configuration in ServiceNow
// Verify CTI softphone is enabled
// Check system property glide.ui.openframe.enabled = true
```

### Genesys Cloud

**Issue:** API calls fail with 401 Unauthorized

**Solution:**
```typescript
// Verify access token is valid
// Check token expiration
// Refresh token if needed
GenesysCloudExampleCTIDriver.configureAuth(
    newAccessToken,
    'mypurecloud.com'
);
```

## Debugging Checklist

- [ ] Browser console shows no errors
- [ ] Network requests succeeding (check Network tab)
- [ ] EmbedSDK is available (`window.Microsoft.CCaaS.EmbedSDK`)
- [ ] Platform API is available (e.g., `window.sforce.opencti`)
- [ ] Events are being bound (add console.log to confirm)
- [ ] Event handlers are being called (add console.log inside handlers)
- [ ] Async operations have error handling
- [ ] CORS is configured correctly
- [ ] CSP allows script execution

## Getting Help

If you're still experiencing issues:

1. **Check documentation**
   - [CCaaS SDK API Reference](../CCaaS%20SDK%20APIs/README.md)
   - [Getting Started Guide](./getting-started.md)

2. **Search existing issues**
   - [GitHub Issues](https://github.com/microsoft/dynamics-365-contact-center/issues)

3. **Create a new issue**
   - Include browser and version
   - Include error messages from console
   - Include steps to reproduce
   - Include relevant code snippets

## See Also

- [Error Handling Guide](./error-handling.md)
- [Performance Tuning](./performance-tuning.md)
- [CSP Compliance](../security/csp-compliance.md)
