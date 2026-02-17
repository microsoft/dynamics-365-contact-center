// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * FailoverManager — Iframe failover for CCaaS widget
 *
 * Strategy:
 *   1. Probe the primary (AFD) URL with a no-cors fetch + AbortController timeout.
 *   2. If the probe resolves  → the server is reachable → load it in the iframe.
 *   3. If the probe rejects   → DNS / connection failure → try the fallback URL.
 *   4. If the fallback also fails → invoke the error callback.
 *   5. While on fallback, periodically re-probe the primary and notify
 *      so the consumer can offer a manual switch (no auto-switch to avoid session loss).
 *
 * Limitations:
 *   - `no-cors` fetch cannot distinguish HTTP 200 from HTTP 5xx; it only detects
 *     DNS / TCP-level failures.  For the AFD-outage (DNS) scenario this is sufficient.
 */

// ─── Public types ────────────────────────────────────────────────────

export type LogLevel = "info" | "warn" | "error" | "ok";

export enum FailoverStatus {
    /** Currently probing an endpoint */
    Probing = "probing",
    /** Connected to the primary (Azure Front Door) endpoint */
    Primary = "primary",
    /** Failover active — using the fallback endpoint */
    Fallback = "fallback",
    /** Both endpoints unreachable */
    Error = "error",
}

export interface FailoverConfig {
    /** The preferred CCaaS widget URL (Azure Front Door). */
    primaryUrl: string;
    /** The disaster-recovery CCaaS widget URL (e.g. GCC Blob Storage). */
    fallbackUrl: string;
    /**
     * How long (ms) to wait for a probe response before declaring failure.
     * @default 10_000
     */
    probeTimeoutMs?: number;
    /**
     * How often (ms) to re-check the primary while on fallback.
     * @default 60_000
     */
    reprobeIntervalMs?: number;
    /**
     * Called whenever the failover status changes (probing → primary / fallback / error).
     */
    onStatusChange?: (status: FailoverStatus, message: string) => void;
    /**
     * Called for every log-worthy event (useful for on-screen log panels / telemetry).
     */
    onLog?: (message: string, level: LogLevel) => void;
    /**
     * Called when the primary becomes reachable again while on fallback.
     * The consumer should present a manual "Switch to primary" action
     * (auto-switching could disrupt an active chat session).
     */
    onPrimaryRestoredWhileOnFallback?: () => void;
}

export interface FailoverResult {
    /** The URL that was successfully probed and should be loaded. */
    url: string;
    /** Which endpoint was selected. */
    source: "primary" | "fallback";
}

// ─── Default configuration ──────────────────────────────────────────

const DEFAULT_PROBE_TIMEOUT_MS = 10_000;
const DEFAULT_REPROBE_INTERVAL = 60_000;

// ─── FailoverManager class ──────────────────────────────────────────

export class FailoverManager {
    private readonly config: Required<Pick<FailoverConfig, "primaryUrl" | "fallbackUrl" | "probeTimeoutMs" | "reprobeIntervalMs">> & FailoverConfig;
    private reprobeTimer: ReturnType<typeof setInterval> | null = null;
    private activeSource: "primary" | "fallback" | null = null;
    private disposed = false;

    constructor(config: FailoverConfig) {
        this.config = {
            probeTimeoutMs: DEFAULT_PROBE_TIMEOUT_MS,
            reprobeIntervalMs: DEFAULT_REPROBE_INTERVAL,
            ...config,
        };
    }

    public getActiveSource(): "primary" | "fallback" | null {
        return this.activeSource;
    }

    public async resolve(): Promise<FailoverResult> {
        this.stopReprobe();
        this.activeSource = null;

        this.setStatus(FailoverStatus.Probing, "Probing primary endpoint…");
        this.log(`Probing primary: ${this.hostname(this.config.primaryUrl)} (timeout ${this.config.probeTimeoutMs / 1000}s)…`);

        const primaryOk = await this.probeUrl(this.config.primaryUrl);

        if (primaryOk) {
            this.activeSource = "primary";
            this.setStatus(FailoverStatus.Primary, "Connected to primary endpoint (Azure Front Door)");
            this.log(`Primary endpoint reachable — using ${this.hostname(this.config.primaryUrl)}`, "ok");
            return { url: this.config.primaryUrl, source: "primary" };
        }

        this.log("Primary unreachable. Probing fallback endpoint…", "warn");
        this.setStatus(FailoverStatus.Probing, "Primary unreachable — probing fallback endpoint…");

        const fallbackOk = await this.probeUrl(this.config.fallbackUrl);

        if (fallbackOk) {
            this.activeSource = "fallback";
            this.setStatus(FailoverStatus.Fallback, "Failover active — loaded from fallback endpoint");
            this.log(`Fallback endpoint reachable — using ${this.hostname(this.config.fallbackUrl)}`, "ok");
            this.startReprobe();
            return { url: this.config.fallbackUrl, source: "fallback" };
        }

        this.activeSource = null;
        this.log("Both primary and fallback endpoints are unreachable.", "error");
        this.setStatus(FailoverStatus.Error, "Both endpoints unreachable");
        throw new Error("Both primary and fallback CCaaS widget endpoints are unreachable.");
    }

    public async retryPrimary(): Promise<FailoverResult> {
        this.stopReprobe();
        this.setStatus(FailoverStatus.Probing, "Re-probing primary endpoint…");
        this.log("Manual retry: probing primary endpoint…");

        const primaryOk = await this.probeUrl(this.config.primaryUrl);

        if (primaryOk) {
            this.activeSource = "primary";
            this.setStatus(FailoverStatus.Primary, "Connected to primary endpoint (Azure Front Door)");
            this.log("Switched back to primary endpoint.", "ok");
            return { url: this.config.primaryUrl, source: "primary" };
        }

        this.log("Primary still unreachable — staying on fallback.", "warn");
        if (this.activeSource === "fallback") {
            this.setStatus(FailoverStatus.Fallback, "Failover active — primary still unreachable");
            this.startReprobe();
        }
        throw new Error("Primary CCaaS widget endpoint is still unreachable.");
    }

    public dispose(): void {
        this.disposed = true;
        this.stopReprobe();
    }

    public async probeUrl(url: string): Promise<boolean> {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.config.probeTimeoutMs);
        const probeTarget = url + (url.includes("?") ? "&" : "?") + "_probe=" + Date.now();

        try {
            await fetch(probeTarget, {
                mode: "no-cors",
                cache: "no-store",
                signal: controller.signal,
            });
            clearTimeout(timer);
            return true;
        } catch (err: unknown) {
            clearTimeout(timer);
            const message = err instanceof Error ? err.message : String(err);
            this.log(`Probe failed for ${this.hostname(url)}: ${message}`, "warn");
            return false;
        }
    }

    private startReprobe(): void {
        this.stopReprobe();
        this.reprobeTimer = setInterval(async () => {
            if (this.disposed) {
                this.stopReprobe();
                return;
            }
            this.log("Re-probing primary endpoint…");
            const ok = await this.probeUrl(this.config.primaryUrl);
            if (ok && this.activeSource === "fallback") {
                this.log("Primary endpoint is back online.", "ok");
                this.setStatus(
                    FailoverStatus.Fallback,
                    "Fallback active — primary is back online. Switch when ready."
                );
                this.config.onPrimaryRestoredWhileOnFallback?.();
            }
        }, this.config.reprobeIntervalMs);
    }

    private stopReprobe(): void {
        if (this.reprobeTimer) {
            clearInterval(this.reprobeTimer);
            this.reprobeTimer = null;
        }
    }

    private setStatus(status: FailoverStatus, message: string): void {
        this.config.onStatusChange?.(status, message);
    }

    private log(msg: string, level: LogLevel = "info"): void {
        const ts = new Date().toLocaleTimeString();
        const line = `[${ts}] [Failover] ${msg}`;

        switch (level) {
            case "error": console.error(line); break;
            case "warn":  console.warn(line);  break;
            default:      console.log(line);   break;
        }

        this.config.onLog?.(line, level);
    }

    private hostname(url: string): string {
        try {
            return new URL(url).hostname;
        } catch {
            return url;
        }
    }
}
