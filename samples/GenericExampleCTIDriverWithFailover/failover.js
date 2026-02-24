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

    /** Probe a URL via no-cors fetch. Returns Promise<boolean>. */
    function probe(url) {
        var ctrl = new AbortController();
        var t = setTimeout(function () { ctrl.abort(); }, TIMEOUT);
        return fetch(url + (url.indexOf("?") !== -1 ? "&" : "?") + "_p=" + Date.now(), {
            mode: "no-cors", cache: "no-store", signal: ctrl.signal
        }).then(function () { clearTimeout(t); return true; })
          .catch(function () { clearTimeout(t); return false; });
    }

    /** Probe primary then fallback; load the first reachable URL into the iframe. */
    function init(cfg) {
        var iframe = document.getElementById(cfg.iframeId);
        if (!iframe) throw new Error('No iframe with id "' + cfg.iframeId + '"');

        console.log("[Failover] Probing primary…");

        probe(cfg.primaryUrl).then(function (ok) {
            if (ok) {
                console.log("[Failover] Primary reachable — loading.");
                iframe.src = cfg.primaryUrl;
                return;
            }
            console.warn("[Failover] Primary unreachable — trying fallback…");
            probe(cfg.fallbackUrl).then(function (ok2) {
                if (ok2) {
                    console.warn("[Failover] Using fallback endpoint.");
                    iframe.src = cfg.fallbackUrl;
                } else {
                    console.error("[Failover] Both endpoints unreachable.");
                }
            });
        });
    }

    return { init: init, probe: probe };
})();
