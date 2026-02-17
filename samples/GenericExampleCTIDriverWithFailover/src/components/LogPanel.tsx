// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React, { useRef, useEffect } from "react";

interface LogPanelProps {
    logs: string[];
}

export const LogPanel: React.FC<LogPanelProps> = ({ logs }) => {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs.length]);

    return (
        <div
            style={{
                flex: 1,
                minHeight: 120,
                maxHeight: 240,
                overflowY: "auto",
                backgroundColor: "#1e1e1e",
                color: "#d4d4d4",
                fontFamily: "Consolas, 'Courier New', monospace",
                fontSize: 12,
                lineHeight: 1.6,
                padding: 10,
                borderRadius: 4,
                border: "1px solid #333",
            }}
        >
            {logs.length === 0 && (
                <span style={{ color: "#888" }}>Waiting for events…</span>
            )}
            {logs.map((line, i) => (
                <div key={i}>{line}</div>
            ))}
            <div ref={bottomRef} />
        </div>
    );
};
