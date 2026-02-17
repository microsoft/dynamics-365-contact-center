// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { useState, useCallback, useRef } from "react";
import {
    FailoverManager,
    FailoverConfig,
    FailoverResult,
    FailoverStatus,
    LogLevel,
} from "../FailoverManager";

export interface FailoverState {
    /** Which endpoint is active, or null while still probing. */
    status: FailoverStatus;
    /** The URL that was loaded, or empty string before resolution. */
    resolvedUrl: string;
    /** "primary" | "fallback" | null */
    source: "primary" | "fallback" | null;
    /** true while the initial resolve() or retryPrimary() is in flight */
    loading: boolean;
    /** Non-null when both endpoints are unreachable */
    error: string | null;
    /** true when the primary comes back while on fallback */
    primaryRestored: boolean;
    /** Scrollable log lines for the UI panel */
    logs: string[];
}

const INITIAL_STATE: FailoverState = {
    status: FailoverStatus.Probing,
    resolvedUrl: "",
    source: null,
    loading: true,
    error: null,
    primaryRestored: false,
    logs: [],
};

/**
 * React hook that wraps the FailoverManager lifecycle.
 *
 * Returns the current failover state and action methods
 * (`resolve`, `retryPrimary`, `dispose`).
 */
export function useFailover() {
    const [state, setState] = useState<FailoverState>(INITIAL_STATE);
    const managerRef = useRef<FailoverManager | null>(null);

    const appendLog = useCallback((message: string, _level: LogLevel) => {
        setState((prev) => ({
            ...prev,
            logs: [...prev.logs, message],
        }));
    }, []);

    /**
     * Run the failover resolution.  Call this once on mount.
     */
    const resolve = useCallback(
        async (config: Omit<FailoverConfig, "onStatusChange" | "onLog" | "onPrimaryRestoredWhileOnFallback">) => {
            // Tear down any previous instance
            managerRef.current?.dispose();

            setState({ ...INITIAL_STATE, logs: [] });

            const fullConfig: FailoverConfig = {
                ...config,
                onStatusChange: (status: FailoverStatus, message: string) => {
                    setState((prev) => ({ ...prev, status }));
                    appendLog(message, "info");
                },
                onLog: appendLog,
                onPrimaryRestoredWhileOnFallback: () => {
                    setState((prev) => ({ ...prev, primaryRestored: true }));
                },
            };

            const manager = new FailoverManager(fullConfig);
            managerRef.current = manager;

            try {
                const result: FailoverResult = await manager.resolve();
                setState((prev) => ({
                    ...prev,
                    resolvedUrl: result.url,
                    source: result.source,
                    loading: false,
                    error: null,
                }));
                return result;
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                setState((prev) => ({
                    ...prev,
                    loading: false,
                    error: message,
                }));
                throw err;
            }
        },
        [appendLog],
    );

    /**
     * Attempt to switch back to the primary endpoint.
     */
    const retryPrimary = useCallback(async () => {
        const manager = managerRef.current;
        if (!manager) return;

        setState((prev) => ({ ...prev, loading: true, primaryRestored: false }));

        try {
            const result = await manager.retryPrimary();
            setState((prev) => ({
                ...prev,
                resolvedUrl: result.url,
                source: result.source,
                loading: false,
                error: null,
            }));
            return result;
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setState((prev) => ({
                ...prev,
                loading: false,
                error: message,
            }));
        }
    }, []);

    /**
     * Clean up the FailoverManager (stop reprobe timer).
     */
    const dispose = useCallback(() => {
        managerRef.current?.dispose();
        managerRef.current = null;
    }, []);

    return { state, resolve, retryPrimary, dispose };
}
