/*
 * doiksub, a Discord client mod
 * Copyright (c) 2024 ghxst and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ApplicationCommandInputType, ApplicationCommandOptionType, findOption, sendBotMessage } from "@api/Commands";
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

export default definePlugin({
    name: "FakeTyping",
    description: "Simulate infinite typing in channels.",
    authors: [doiksubDevs.sqz, { name: "yungpharaoh", id: 1136337246631497849n }],
    dependencies: ["CommandsAPI"],

    commands: [
        {
            name: "infinitype", //infitity type, ty, infitype whatever u get it
            description: "Toggle infinite typing in this channel.",
            inputType: ApplicationCommandInputType.BUILT_IN,
            options: [
                {
                    name: "toggle",
                    description: "Whether to enable or disable infinite typing.",
                    type: ApplicationCommandOptionType.BOOLEAN,
                    required: false,
                }
            ],
            execute: async (args, ctx) => {
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
            },
        }
    ],

    start() {
        // No-op, command handles it
    },

    stop() {
        typingChannels.clear();
        if (interval) {
            window.clearInterval(interval);
            interval = undefined;
        }
    }
});