/*
 * doiksub, a Discord client mod
 * Copyright (c) 2026 ghxst and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * HeaderBarAPI — renders buttons added via addHeaderBarButton().
 */

import ErrorBoundary from "@components/ErrorBoundary";
import definePlugin from "@utils/types";
import { findComponentByCodeLazy } from "@webpack";
import { React } from "@webpack/common";

import { buttons } from "@api/HeaderBar";

const HeaderBarIcon = findComponentByCodeLazy(".HEADER_BAR_BADGE_BOTTOM,", 'position:"bottom"');

function HeaderBarButtons() {
    const [, forceUpdate] = React.useReducer((x: number) => x + 1, 0);

    React.useEffect(() => {
        const interval = setInterval(forceUpdate, 1000);
        return () => clearInterval(interval);
    }, []);

    const entries = Object.entries(buttons).sort((a, b) => (a[1].priority ?? 0) - (b[1].priority ?? 0));

    return (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
            {entries.map(([id, btn]) => (
                <ErrorBoundary key={id} noop>
                    {btn.render()}
                </ErrorBoundary>
            ))}
        </div>
    );
}

export default definePlugin({
    name: "HeaderBarAPI",
    description: "API to add buttons to the header bar",
    authors: [{ name: "ghxst", id: 1518140533586006126n }],
    required: true,

    patches: [
        {
            find: ".HEADER_BAR_BADGE_BOTTOM,",
            replacement: {
                match: /HEADER_BAR_BADGE_BOTTOM,.+?\)(?=,)/,
                replace: "$&,$self.HeaderBarButtons()"
            }
        }
    ],

    start() {
        // No-op, patches handle rendering
    },

    stop() {
        // Cleanup handled by removeHeaderBarButton
    },
});