/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Logger } from "@utils/Logger";
import definePlugin, { OptionType } from "@utils/types";
import { findStoreLazy } from "@webpack";
import { Constants, FluxDispatcher, RestAPI } from "@webpack/common";

const logger = new Logger("AutoReact");
const ChannelStore = findStoreLazy("ChannelStore");

interface ReactPair {
    userId: string;
    emoji: string;
}

const settings = definePluginSettings({
    pairs: {
        type: OptionType.STRING,
        multiline: true,
        description: "One pair per line: userId:emoji (e.g. 123456789:💀). Same user can have multiple lines for multiple emojis.",
        default: "",
    },
    delay: {
        type: OptionType.SLIDER,
        description: "Delay before reacting in seconds (to look natural).",
        markers: [0, 1, 2, 3, 5, 10],
        default: 1,
    },
    onlyDMs: {
        type: OptionType.BOOLEAN,
        description: "Only auto-react in DMs.",
        default: false,
    },
});

function normalizeEmoji(emoji: string): string | null {
    const trimmed = emoji.trim();
    if (!trimmed) return null;

    const customMatch = trimmed.match(/^(?:<(?:(a):)?|:)?([\w-]+?)(?:~\d+)?:([0-9]+)>?$/);
    if (customMatch) {
        return `${customMatch[2]}:${customMatch[3]}`;
    }

    return trimmed;
}

function parsePairs(raw: string): ReactPair[] {
    const pairs: ReactPair[] = [];
    for (const line of raw.split(/[\n,]/)) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        const colonIdx = trimmed.indexOf(":");
        if (colonIdx === -1) continue;

        const userId = trimmed.slice(0, colonIdx).trim();
        const emoji = trimmed.slice(colonIdx + 1).trim();
        if (!userId || !emoji) continue;

        const normalized = normalizeEmoji(emoji);
        if (!normalized) continue;

        pairs.push({ userId, emoji: normalized });
    }
    return pairs;
}

let handler: ((data: { message: { author: { id: string; }; channel_id: string; id: string; }; channelId: string; }) => void) | null = null;

export default definePlugin({
    name: "AutoReact",
    enabledByDefault: true,
    description: "Automatically reacts with emojis to messages from specific users. Configure multiple user:emoji pairs.",
    authors: [{ name: "yungpharaoh", id: 1136337246631497849n }],
    settings,

    start() {
        handler = (data) => {
            const { pairs: rawPairs, delay, onlyDMs } = settings.store;
            if (!rawPairs) return;

            const msg = data.message;
            if (!msg || !msg.author) return;

            const pairs = parsePairs(rawPairs);
            const matching = pairs.filter(p => p.userId === msg.author.id);
            if (matching.length === 0) return;

            const channelId = msg.channel_id || data.channelId;
            if (!channelId) return;

            if (onlyDMs) {
                const channel = ChannelStore?.getChannel?.(channelId);
                if (channel && channel.type !== 1 && channel.type !== 3) return;
            }

            const delayMs = (delay ?? 1) * 1000;
            let offset = 0;
            for (const pair of matching) {
                setTimeout(() => {
                    RestAPI.put({
                        url: Constants.Endpoints.REACTION(channelId, msg.id, pair.emoji, "@me"),
                    }).catch((e: unknown) => {
                        logger.error("Failed to auto-react:", e);
                    });
                }, delayMs + offset);
                offset += 500;
            }
        };

        FluxDispatcher.subscribe("MESSAGE_CREATE", handler);
    },

    stop() {
        if (handler) {
            FluxDispatcher.unsubscribe("MESSAGE_CREATE", handler);
            handler = null;
        }
    },
});