/// <reference types="react-scripts" />

declare namespace NodeJS {
    interface ProcessEnv {
        REACT_APP_PRIMARY_URL: string;
        REACT_APP_FALLBACK_URL: string;
        REACT_APP_PROBE_TIMEOUT_MS?: string;
        REACT_APP_REPROBE_INTERVAL_MS?: string;
    }
}
