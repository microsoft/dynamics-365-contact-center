# GenericExampleCTIDriverWithFailover

Sample React app that acts as a **CRM host page** consuming the Dynamics 365 Contact Center CCaaS widget via an iframe with built-in endpoint failover.

## What it does

1. **Failover resolution** — Probes a primary (Azure Front Door) and fallback endpoint. Loads the first reachable one into an iframe. Re-probes the primary periodically while on fallback.
2. **Embed SDK event binding** — Once the widget iframe loads, subscribes to all CCaaS Embed SDK events (conversation, notification, presence, voice/video, CTI driver) and displays them in a live event table.
3. **Click-to-dial** — Demonstrates sending a `clickToDial` message from the CRM host into the widget iframe.

## Setup

```bash
cd samples/GenericExampleCTIDriverWithFailover
npm install
```

Edit the `.env` file with your actual widget URLs:

```env
REACT_APP_PRIMARY_URL=https://<afd-host>/widget/index.html?dynamicsUrl=<org>&useCustomCTI=1
REACT_APP_FALLBACK_URL=https://<blob-host>/widget/index.html?dynamicsUrl=<org>&useCustomCTI=1
```

## Load the External Embed SDK

The CCaaS Embed SDK is **not** an npm package — it is injected at runtime by the CCaaS widget inside the iframe. To listen to SDK events from the CRM host page:

1. Include the CCaaS Embed SDK script in `public/index.html` **before** the closing `</body>` tag:

   ```html
   <script src="https://<your-org>.crm.dynamics.com/webresources/Widget/msdyn_ciabordsdk.js"></script>
   ```

   Replace the URL with the SDK endpoint for your Dynamics 365 organization.

2. Once the script loads, it exposes `window.Microsoft.CCaaS.EmbedSDK` on the host page. The `useEmbedSDK` hook polls for this object after the iframe loads and binds all event listeners automatically.

> **Note:** If you are running locally without a real Dynamics 365 org, the SDK will not be available and the event panel will show a timeout error. You can still verify failover and click-to-dial functionality independently.

## Run

```bash
npm start
```

Opens `http://localhost:3000`. The app will:
- Probe both endpoints (check the **Failover Log** panel)
- Load the winning URL into the iframe
- Display a status badge (Primary / Fallback / Error)
- Show a live stream of **Embed SDK Events** as agents interact with conversations

## Project structure

```
src/
├── App.tsx                     # Main CRM host page
├── index.tsx                   # React entry point
├── FailoverManager.ts          # Endpoint probe + failover logic
├── types/
│   └── EmbedSDKTypes.ts        # Standalone SDK type definitions
├── hooks/
│   ├── useFailover.ts          # React hook wrapping FailoverManager
│   └── useEmbedSDK.ts          # React hook binding all SDK events
├── components/
│   ├── StatusBadge.tsx          # Failover status indicator
│   ├── LogPanel.tsx             # Scrollable failover log
│   └── EventList.tsx            # SDK event table
```
