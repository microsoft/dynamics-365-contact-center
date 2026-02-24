# GenericExampleCTIDriverWithFailover

Simple standalone script that loads the Dynamics 365 Contact Center CCaaS widget in an iframe with automatic endpoint failover. No build step, no frameworks — just plain JavaScript.

## How it works

1. Probes the **primary** URL (e.g. Azure Front Door) with a no-cors fetch + 10 s timeout.
2. If reachable → loads it into the iframe.
3. If unreachable → probes the **fallback** URL (e.g. Blob Storage) and loads that instead.
4. If both fail → logs an error to the console.

## Files

```
failover.js            # Failover logic (~60 lines)
failover-sample.html   # Drop-in demo page
README.md
```

## Usage

1. Open `failover-sample.html` and edit the two URLs in the `<script>` block:

   ```js
   CCaaSFailover.init({
       primaryUrl:  "https://PRIMARY_HOST/widget/index.html?dynamicsUrl=ORG&useCustomCTI=1",
       fallbackUrl: "https://FALLBACK_HOST/widget/index.html?dynamicsUrl=ORG&useCustomCTI=1",
       iframeId:    "ccaas-widget"
   });
   ```

2. Open the HTML file in a browser (or serve it from any static host).

### Integrate into your own page

Add an iframe and include the script:

```html
<iframe id="ccaas-widget"></iframe>
<script src="failover.js"></script>
<script>
    CCaaSFailover.init({
        primaryUrl:  "https://...",
        fallbackUrl: "https://...",
        iframeId:    "ccaas-widget"
    });
</script>
```

## API

| Method | Description |
|---|---|
| `CCaaSFailover.init(config)` | Probe primary → fallback → load winner into iframe |
| `CCaaSFailover.probe(url)` | Test reachability of any URL. Returns `Promise<boolean>` |

### `init(config)`

| Property | Type | Required | Description |
|---|---|---|---|
| `primaryUrl` | string | yes | Preferred CCaaS widget URL |
| `fallbackUrl` | string | yes | Disaster-recovery widget URL |
| `iframeId` | string | yes | `id` of the target `<iframe>` element |
