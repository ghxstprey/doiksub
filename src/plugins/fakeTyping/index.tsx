/*
 * doiksub, a Discord client mod
 * Copyright (c) 2024 ghxst and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { CommandArgument, CommandContext } from "@vencord/discord-types";
import { findOption, sendBotMessage } from "@api/Commands";
import { doiksubDevs } from "@utils/constants";
import definePlugin from "@utils/types";
import { findByPropsLazy } from "@webpack";

const TypingActions = findByPropsLazy("startTyping");

const typingChannels = new Set<string>();
let interval: number | undefined;

function startTypingLoop() {
    if (interval) return;
    interval = window.setInterval(() => {
        if (typingChannels.size === 0) {
            window.clearInterval(interval);
            interval = undefined;
            return;
        }

        for (const channelId of typingChannels) {
            TypingActions.startTyping(channelId);
        }
    }, 1000); // 4000 was too slow, and 2 is probably gonna get me flagged. 500 seems good, but ill keep upping until im comfy
}

export async function executeTyping(args: CommandArgument[], ctx: CommandContext) {
    const channelId = ctx.channel.id;
    const toggle = findOption(args, "toggle", !typingChannels.has(channelId));

    if (toggle) {
        typingChannels.add(channelId);
        TypingActions.startTyping(channelId);
        startTypingLoop();
        sendBotMessage(channelId, { content: "Infinite typing enabled in this channel." });
    } else {
        typingChannels.delete(channelId);
        sendBotMessage(channelId, { content: "Infinite typing disabled in this channel." });
    }
}

export default definePlugin({
    name: "FakeTyping",
    description: "Simulate infinite typing in channels. Use /fake type. Doesn't work if you have silent typing on.",
    authors: [doiksubDevs.sqz, doiksubDevs.god],
    tags: ["Sigil"],
    dependencies: ["Fake", "CommandsAPI"],

    start() {
        // No-op, command is handled by Fake
    },

    stop() {
        typingChannels.clear();
        if (interval) {
            window.clearInterval(interval);
            interval = undefined;
        }
    }
});