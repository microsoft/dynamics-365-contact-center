# Content Security Policy (CSP) Compliance

This guide covers Content Security Policy requirements for deploying CTI drivers.

## Overview

Content Security Policy (CSP) is a security feature that helps prevent cross-site scripting (XSS), clickjacking, and other code injection attacks. When deploying CTI drivers, you must ensure your hosting configuration complies with D365 Contact Center's CSP requirements.

## Required CSP Directives

### script-src

Your CTI driver bundle must be served from a domain allowed by the `script-src` directive:

```
script-src 'self' https://your-cdn.example.com;
```

**Requirements:**
- HTTPS required (HTTP will be blocked)
- Domain must be explicitly whitelisted
- No inline scripts (use bundled modules)
- No `eval()` or `Function()` constructors

### connect-src

If your driver makes API calls, the target domains must be in `connect-src`:

```
connect-src 'self' https://api.your-platform.com wss://realtime.your-platform.com;
```

**Requirements:**
- All fetch/XHR destinations whitelisted
- WebSocket connections need explicit permission
- Include both HTTP and WebSocket protocols if needed

### style-src

If your driver includes styles:

```
style-src 'self' 'unsafe-inline';
```

**Note:** Avoid inline styles when possible. Use CSS classes in external stylesheets.

## CDN Configuration

### Azure Blob Storage + CDN

```json
{
  "csp": {
    "enabled": true,
    "reportOnly": false
  },
  "headers": {
    "Content-Security-Policy": "default-src 'self'; script-src 'self'"
  }
}
```

### AWS S3 + CloudFront

CloudFront response headers policy:

```json
{
  "SecurityHeadersConfig": {
    "ContentSecurityPolicy": {
      "Override": true,
      "ContentSecurityPolicy": "default-src 'self'; script-src 'self'"
    }
  }
}
```

### Nginx

```nginx
location /cti-drivers/ {
    add_header Content-Security-Policy "default-src 'self'; script-src 'self'" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
}
```

## CORS Configuration

### Required Headers

Your CDN/server must return these headers:

```http
Access-Control-Allow-Origin: https://*.dynamics.com
Access-Control-Allow-Methods: GET, OPTIONS
Access-Control-Allow-Headers: Content-Type
Access-Control-Max-Age: 86400
```

### Azure CDN CORS Rules

```json
{
  "corsRules": [
    {
      "allowedOrigins": ["https://*.dynamics.com"],
      "allowedMethods": ["GET", "OPTIONS"],
      "allowedHeaders": ["*"],
      "exposedHeaders": ["*"],
      "maxAgeInSeconds": 86400
    }
  ]
}
```

### AWS CloudFront CORS

Response headers policy:

```json
{
  "CorsConfig": {
    "AccessControlAllowOrigins": {
      "Items": ["https://*.dynamics.com"]
    },
    "AccessControlAllowMethods": {
      "Items": ["GET", "OPTIONS"]
    },
    "AccessControlAllowHeaders": {
      "Items": ["*"]
    },
    "AccessControlMaxAgeSec": 86400,
    "OriginOverride": true
  }
}
```

## Subresource Integrity (SRI)

For additional security, use SRI hashes when loading your driver:

```html
<script
  src="https://cdn.example.com/MyCTIDriver.abc123.min.js"
  integrity="sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8wC"
  crossorigin="anonymous">
</script>
```

### Generating SRI Hash

```bash
# Using openssl
cat MyCTIDriver.min.js | openssl dgst -sha384 -binary | openssl base64 -A

# Using shasum
shasum -b -a 384 MyCTIDriver.min.js | awk '{ print $1 }' | xxd -r -p | base64
```

## CSP Violation Reporting

### Configure Report-Only Mode

Test CSP changes without breaking functionality:

```http
Content-Security-Policy-Report-Only: default-src 'self'; report-uri /csp-violations
```

### Set Up Violation Endpoint

```typescript
// Express.js example
app.post('/csp-violations', (req, res) => {
    console.log('CSP Violation:', req.body);
    // Log to monitoring system
    res.status(204).end();
});
```

### Monitor Violations

Use services like:
- Report URI (report-uri.com)
- Sentry CSP monitoring
- Custom logging endpoint

## Common CSP Errors

### "Refused to load script"

```
Refused to load the script 'https://cdn.example.com/driver.js' because it violates
the following Content Security Policy directive: "script-src 'self'"
```

**Solution:** Add your CDN domain to the CSP configuration in D365 admin center.

### "Refused to connect"

```
Refused to connect to 'https://api.platform.com' because it violates the
following Content Security Policy directive: "connect-src 'self'"
```

**Solution:** Add API domain to `connect-src` directive.

### "Refused to execute inline script"

```
Refused to execute inline script because it violates the following
Content Security Policy directive: "script-src 'self'"
```

**Solution:** Move inline scripts to external files. The CTI driver build process handles this automatically.

## Security Best Practices

### 1. Use HTTPS Only

```typescript
// Always use HTTPS URLs
const API_BASE = 'https://api.example.com';

// Validate URLs before use
function isSecureUrl(url: string): boolean {
    try {
        return new URL(url).protocol === 'https:';
    } catch {
        return false;
    }
}
```

### 2. Validate External Data

```typescript
// Sanitize data from external sources
function sanitizePhoneNumber(phone: string): string {
    // Remove non-numeric characters except + and -
    return phone.replace(/[^\d+-]/g, '');
}

embedSDK?.ctiDriver.onClickToDial((dialInfo) => {
    const cleanNumber = sanitizePhoneNumber(dialInfo.number);
    platformApi.makeCall(cleanNumber);
});
```

### 3. Avoid eval() and new Function()

```typescript
// BAD: Never use eval
eval('doSomething()');

// BAD: Never use Function constructor
const fn = new Function('return x + y');

// GOOD: Use direct function calls
doSomething();
const fn = (x: number, y: number) => x + y;
```

### 4. Secure Storage

```typescript
// Don't store sensitive data in localStorage
// Use session storage or secure cookies for tokens

// BAD
localStorage.setItem('authToken', token);

// BETTER: Use session storage (cleared on tab close)
sessionStorage.setItem('authToken', token);

// BEST: Use HTTP-only secure cookies (server-side)
```

### 5. Prevent XSS

```typescript
// Escape HTML when displaying user data
function escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Use textContent instead of innerHTML
element.textContent = userData;
// NOT: element.innerHTML = userData;
```

## Checklist

Before deployment, verify:

- [ ] Driver is served over HTTPS
- [ ] CDN domain is whitelisted in D365 CSP
- [ ] CORS headers configured for dynamics.com origins
- [ ] No inline scripts in the bundle
- [ ] No eval() or Function() usage
- [ ] API endpoints use HTTPS
- [ ] Sensitive data not stored in localStorage
- [ ] User input is sanitized
- [ ] CSP violations are monitored

## References

- [MDN: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [OWASP: Content Security Policy Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/)
