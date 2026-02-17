// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useFailover } from "./hooks/useFailover";
import { useEmbedSDK } from "./hooks/useEmbedSDK";
import { StatusBadge } from "./components/StatusBadge";
import { LogPanel } from "./components/LogPanel";
import { EventList } from "./components/EventList";
import { FailoverStatus } from "./FailoverManager";

// ─── Read .env values ────────────────────────────────────────────────

const PRIMARY_URL = process.env.REACT_APP_PRIMARY_URL ?? "";
const FALLBACK_URL = process.env.REACT_APP_FALLBACK_URL ?? "";
const PROBE_TIMEOUT = Number(process.env.REACT_APP_PROBE_TIMEOUT_MS) || 10_000;
const REPROBE_INTERVAL = Number(process.env.REACT_APP_REPROBE_INTERVAL_MS) || 60_000;

// ─── Event log entry ─────────────────────────────────────────────────

interface EventEntry {
    label: string;
    data: unknown;
    ts: string;
}

// ─── App ─────────────────────────────────────────────────────────────

const App: React.FC = () => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [iframeLoaded, setIframeLoaded] = useState(false);
    const [events, setEvents] = useState<EventEntry[]>([]);

    const { state, resolve, retryPrimary, dispose } = useFailover();

    // ── 1. Run failover resolution on mount ──────────────────────────

    useEffect(() => {
        if (!PRIMARY_URL || !FALLBACK_URL) {
            console.error(
                "[App] REACT_APP_PRIMARY_URL and REACT_APP_FALLBACK_URL must be set in .env",
            );
            return;
        }

        resolve({
            primaryUrl: PRIMARY_URL,
            fallbackUrl: FALLBACK_URL,
            probeTimeoutMs: PROBE_TIMEOUT,
            reprobeIntervalMs: REPROBE_INTERVAL,
        }).catch(() => {
            // error is already captured in `state.error`
        });

        return () => dispose();
    }, []);

    // ── 2. Load resolved URL into iframe ─────────────────────────────

    useEffect(() => {
        if (state.resolvedUrl && iframeRef.current) {
            iframeRef.current.src = state.resolvedUrl;
        }
    }, [state.resolvedUrl]);

    const handleIframeLoad = useCallback(() => {
        setIframeLoaded(true);
    }, []);

    // ── 3. Bind Embed SDK events once iframe is ready ────────────────

    const onSDKEvent = useCallback((label: string, data: unknown) => {
        setEvents((prev) => [
            ...prev.slice(-199), // keep last 200
            { label, data, ts: new Date().toLocaleTimeString() },
        ]);
    }, []);

    useEmbedSDK(iframeLoaded, onSDKEvent);

    // ── 4. Click-to-dial demo (send message to iframe) ───────────────

    const [dialNumber, setDialNumber] = useState("+15551234567");

    const handleClickToDial = () => {
        if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.postMessage(
                JSON.stringify({
                    messageType: "clickToDial",
                    messageData: { number: dialNumber },
                }),
                "*",
            );
        }
    };

    // ── Render ───────────────────────────────────────────────────────

    const envMissing = !PRIMARY_URL || !FALLBACK_URL;

    return (
        <div style={{ fontFamily: "Segoe UI, sans-serif", padding: 24, maxWidth: 1100, margin: "0 auto" }}>
            <h1 style={{ fontSize: 22, marginBottom: 4 }}>
                CCaaS Widget — CRM Host with Failover
            </h1>
            <p style={{ color: "#666", marginTop: 0 }}>
                Sample React app acting as a CRM that loads the CCaaS widget in an iframe
                and listens to Embed SDK events.
            </p>

            {envMissing && (
                <div
                    style={{
                        padding: 16,
                        backgroundColor: "#fff3cd",
                        border: "1px solid #ffc107",
                        borderRadius: 4,
                        marginBottom: 16,
                    }}
                >
                    <strong>Configuration required:</strong> Set{" "}
                    <code>REACT_APP_PRIMARY_URL</code> and{" "}
                    <code>REACT_APP_FALLBACK_URL</code> in the <code>.env</code> file, then
                    restart the dev server.
                </div>
            )}

            {/* ── Status bar ────────────────────────────────────────── */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 16,
                    flexWrap: "wrap",
                }}
            >
                <StatusBadge status={state.status} source={state.source} />

                {state.loading && (
                    <span style={{ fontSize: 13, color: "#888" }}>Resolving endpoint…</span>
                )}

                {state.error && (
                    <span style={{ fontSize: 13, color: "#dc3545" }}>{state.error}</span>
                )}

                {state.primaryRestored && state.status === FailoverStatus.Fallback && (
                    <button
                        onClick={retryPrimary}
                        style={{
                            padding: "6px 14px",
                            fontSize: 13,
                            cursor: "pointer",
                            backgroundColor: "#007bff",
                            color: "#fff",
                            border: "none",
                            borderRadius: 4,
                        }}
                    >
                        Switch to Primary
                    </button>
                )}
            </div>

            {/* ── Iframe ────────────────────────────────────────────── */}
            <div
                style={{
                    border: "1px solid #ccc",
                    borderRadius: 4,
                    overflow: "hidden",
                    marginBottom: 16,
                    backgroundColor: "#fafafa",
                }}
            >
                <iframe
                    ref={iframeRef}
                    title="CCaaS Widget"
                    onLoad={handleIframeLoad}
                    style={{
                        width: "100%",
                        height: 500,
                        border: "none",
                    }}
                />
            </div>

            {/* ── Click-to-dial demo ────────────────────────────────── */}
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600 }}>Click-to-Dial:</label>
                <input
                    value={dialNumber}
                    onChange={(e) => setDialNumber(e.target.value)}
                    style={{
                        padding: "4px 8px",
                        fontSize: 13,
                        border: "1px solid #ccc",
                        borderRadius: 4,
                        width: 180,
                    }}
                />
                <button
                    onClick={handleClickToDial}
                    disabled={!iframeLoaded}
                    style={{
                        padding: "4px 14px",
                        fontSize: 13,
                        cursor: iframeLoaded ? "pointer" : "not-allowed",
                    }}
                >
                    Dial
                </button>
            </div>

            {/* ── Embed SDK events ──────────────────────────────────── */}
            <h2 style={{ fontSize: 16, marginBottom: 8 }}>Embed SDK Events</h2>
            <EventList events={events} />

            {/* ── Failover log ──────────────────────────────────────── */}
            <h2 style={{ fontSize: 16, marginTop: 20, marginBottom: 8 }}>Failover Log</h2>
            <LogPanel logs={state.logs} />
        </div>
    );
};

export default App;
