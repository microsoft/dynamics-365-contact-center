// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * CCaaS Widget Iframe Failover — Simple Script
 *
 * Usage:
 *   <iframe id="ccaas-widget"></iframe>
 *   <script src="failover.js"></script>
 *   <script>
 *     CCaaSFailover.init({
 *       primaryUrl:  "https://PRIMARY/widget/index.html?dynamicsUrl=ORG&useCustomCTI=1",
 *       fallbackUrl: "https://FALLBACK/widget/index.html?dynamicsUrl=ORG&useCustomCTI=1",
 *       iframeId:    "ccaas-widget"
 *     });
 *   </script>
 */

var CCaaSFailover = (function () {
    "use strict";

    var TIMEOUT = 10000; // 10-second probe timeout

    /**
     * Probe a URL via fetch. Returns Promise<boolean>.
     * Uses cors mode so HTTP 5xx is detected. Falls back to no-cors
     * automatically if the server doesn't send CORS headers.
     */
    async function probe(url) {
        var ctrl = new AbortController();
        var t = setTimeout(function () { ctrl.abort(); }, TIMEOUT);
        var target = url + (url.indexOf("?") !== -1 ? "&" : "?") + "_p=" + Date.now();
        try {
            var res = await fetch(target, {
                mode: "cors", cache: "no-store", signal: ctrl.signal
            });
            clearTimeout(t);
            return res.ok; // true for 2xx, false for 4xx/5xx
        } catch (_) {
            clearTimeout(t);
            return false;
        }
    }

    /** Probe primary then fallback; load the first reachable URL into the iframe. */
    async function init(cfg) {
        var iframe = document.getElementById(cfg.iframeId);
        if (!iframe) throw new Error('No iframe with id "' + cfg.iframeId + '"');

        console.log("[Failover] Probing primary…");

        if (await probe(cfg.primaryUrl)) {
            console.log("[Failover] Primary reachable — loading.");
            iframe.src = cfg.primaryUrl;
            return;
        }

        console.warn("[Failover] Primary unreachable — trying fallback…");

        if (await probe(cfg.fallbackUrl)) {
            console.warn("[Failover] Using fallback endpoint.");
            iframe.src = cfg.fallbackUrl;
        } else {
            console.error("[Failover] Both endpoints unreachable.");
        }
    }

    return { init: init, probe: probe };
})();
