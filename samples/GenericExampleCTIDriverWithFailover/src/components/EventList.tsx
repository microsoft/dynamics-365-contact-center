// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React from "react";

interface EventListProps {
    events: Array<{ label: string; data: unknown; ts: string }>;
}

export const EventList: React.FC<EventListProps> = ({ events }) => (
    <div
        style={{
            maxHeight: 200,
            overflowY: "auto",
            fontSize: 13,
            fontFamily: "Consolas, 'Courier New', monospace",
            backgroundColor: "#f5f5f5",
            borderRadius: 4,
            border: "1px solid #ddd",
        }}
    >
        {events.length === 0 && (
            <div style={{ padding: 10, color: "#999" }}>
                No Embed SDK events received yet.
            </div>
        )}
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
                {events.map((e, i) => (
                    <tr
                        key={i}
                        style={{
                            borderBottom: "1px solid #eee",
                        }}
                    >
                        <td style={{ padding: "4px 8px", whiteSpace: "nowrap", color: "#888" }}>
                            {e.ts}
                        </td>
                        <td style={{ padding: "4px 8px", fontWeight: 600 }}>{e.label}</td>
                        <td
                            style={{
                                padding: "4px 8px",
                                color: "#555",
                                maxWidth: 400,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {JSON.stringify(e.data)}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);
