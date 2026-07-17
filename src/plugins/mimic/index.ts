/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { EquicordDevs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { sendMessage } from "@utils/discord";
import { SelectedChannelStore } from "@webpack/common";

const settings = definePluginSettings({
    targetUserId: {
        type: OptionType.STRING,
        description: "User ID to mimic.",
        default: "",
    },
    stripPings: {
        type: OptionType.BOOLEAN,
        description: "Strip @mentions from mimic'd messages to avoid double pinging.",
        default: true,
    },
});

function strip(content: string): string {
    return content.replace(/<@!?(\d+)>/g, "@\u200b$1").replace(/@(everyone|here)/g, "@\u200b$1");
}

export default definePlugin({
    name: "Mimic",
    description: "Automatically sends messages that a specified user sends in channels you are watching.",
    authors: [{ name: "yungpharaoh", id: 1136337246631497849n }],
    settings,

    flux: {
        MESSAGE_CREATE({ message, channelId }: { message: { author: { id: string; }; content: string; }; channelId: string; }) {
            const { targetUserId, stripPings } = settings.store;
            if (!targetUserId || message.author.id !== targetUserId) return;

            const currentChannelId = SelectedChannelStore.getChannelId();
            if (!currentChannelId) return;

            const content = stripPings ? strip(message.content) : message.content;
            if (!content.trim()) return;

            sendMessage(currentChannelId, { content });
        },
    },
});
