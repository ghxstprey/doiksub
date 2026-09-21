/*
 * doiksub, a Discord client mod
 * Copyright (c) 2026 ghxst and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { doiksubDevs } from "@utils/constants";
import definePlugin from "@utils/types";

export default definePlugin({
    name: "NoDiscordApp",
    description: "Blocks Discord web from connecting to the local desktop app. Prevents app detection and localhost integration.",
    tags: ["Privacy", "Web"],
    authors: [doiksubDevs.ghxst],
    enabledByDefault: true,

    start() {
        // Block WebSocket connections to localhost/127.0.0.1
        const OriginalWebSocket = window.WebSocket;
        (window as any).WebSocket = class extends OriginalWebSocket {
            constructor(url: string | URL, protocols?: string | string[]) {
                const urlStr = url.toString();
                if (urlStr.includes("localhost") || urlStr.includes("127.0.0.1") || urlStr.includes("0.0.0.0")) {
                    console.log(`[NoDiscordApp] Blocked WebSocket connection to ${urlStr}`);
                    // Create a dummy WebSocket that never connects
                    const ws = Object.create(OriginalWebSocket.prototype);
                    (ws as any).readyState = 0;
                    (ws as any).url = urlStr;
                    (ws as any).protocol = "";
                    (ws as any).extensions = "";
                    setTimeout(() => {
                        (ws as any).readyState = 3;
                        try { (ws as any).onclose?.({ code: 1006, reason: "Blocked by NoDiscordApp", wasClean: false }); } catch {}
                    }, 0);
                    return ws as any;
                }
                return new OriginalWebSocket(url, protocols);
            }
        };

        // Block fetch to localhost
        const OriginalFetch = window.fetch;
        (window as any).fetch = async function (url: RequestInfo | URL, options?: RequestInit) {
            const urlStr = url.toString();
            if (urlStr.includes("localhost") || urlStr.includes("127.0.0.1") || urlStr.includes("0.0.0.0")) {
                console.log(`[NoDiscordApp] Blocked fetch to ${urlStr}`);
                throw new Error(`Blocked by NoDiscordApp: ${urlStr}`);
            }
            return OriginalFetch(url, options);
        };

        // Block XMLHttpRequest to localhost
        const OriginalXHR = window.XMLHttpRequest;
        (window as any).XMLHttpRequest = class extends OriginalXHR {
            open(method: string, url: string | URL, async?: boolean, user?: string, password?: string) {
                const urlStr = url.toString();
                if (urlStr.includes("localhost") || urlStr.includes("127.0.0.1") || urlStr.includes("0.0.0.0")) {
                    console.log(`[NoDiscordApp] Blocked XMLHttpRequest to ${urlStr}`);
                    throw new Error(`Blocked by NoDiscordApp: ${urlStr}`);
                }
                return super.open(method, url, async, user, password);
            }
        };

        console.log("[NoDiscordApp] Active - blocking localhost connections");
    },

    stop() {
        // Note: We can't fully restore the original implementations here,
        // but a page reload will restore them
        console.log("[NoDiscordApp] Stopped - reload page to fully restore");
    },
});
