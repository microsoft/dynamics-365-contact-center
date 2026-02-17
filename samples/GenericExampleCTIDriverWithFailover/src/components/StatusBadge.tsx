// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React from "react";
import { FailoverStatus } from "../FailoverManager";

interface StatusBadgeProps {
    status: FailoverStatus;
    source: "primary" | "fallback" | null;
}

const STATUS_COLORS: Record<FailoverStatus, string> = {
    [FailoverStatus.Probing]: "#e0a800",
    [FailoverStatus.Primary]: "#28a745",
    [FailoverStatus.Fallback]: "#fd7e14",
    [FailoverStatus.Error]: "#dc3545",
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, source }) => (
    <span
        style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 12px",
            borderRadius: 4,
            fontSize: 13,
            fontWeight: 600,
            color: "#fff",
            backgroundColor: STATUS_COLORS[status],
        }}
    >
        <span
            style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: "#fff",
                opacity: 0.8,
            }}
        />
        {status.toUpperCase()}
        {source && ` (${source})`}
    </span>
);
