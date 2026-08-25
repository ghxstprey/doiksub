/*
 * doiksub, a Vencord fork
 * Copyright (c) 2026 (Vendicated|ghxst) and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ApplicationCommandInputType, ApplicationCommandOptionType, findOption, sendBotMessage } from "@api/Commands";
import { doiksubDevs } from "@utils/constants";
import definePlugin from "@utils/types";
import { ChannelStore, RestAPI } from "@webpack/common";

// discord epoch, used to build a snowflake from "right now"
const DISCORD_EPOCH = 1420070400000n;

type AnyMessage = { id: string; content?: string; };

/**
 * Finds the oldest message in a channel.
 * Tries the search endpoint first (fast), falls back to paginating backwards
 * since freshly created channels aren't indexed yet.
 */
async function findFirstMessage(channelId: string): Promise<AnyMessage | null> {
    try {
        const { body } = await RestAPI.get({
            url: `/channels/${channelId}/messages/search`,
            query: { sort_by: "timestamp", sort_order: "asc", include_nsfw: true },
        });

        const hit = (body.messages as AnyMessage[][] | undefined)?.[0]?.[0];
        if (hit) return hit;
        if (body.total_results === 0) return null;
    } catch {
        // not indexed yet (or search unavailable) -> paginate manually below
    }

    // start from a snowflake representing right now and page backwards
    let before = ((BigInt(Date.now()) - DISCORD_EPOCH) << 22n).toString();
    for (let i = 0; i < 500; i++) {
        const { body } = await RestAPI.get({
            url: `/channels/${channelId}/messages`,
            query: { limit: 100, before },
        });
        const messages = body as AnyMessage[];
        if (!messages.length) return null;
        if (messages.length < 100) return messages[messages.length - 1];
        before = messages[messages.length - 1].id;
    }

    return null;
}

export default definePlugin({
    name: "FirstMessage",
    description: "Get a jump link to the very first message of any channel via /firstmsg.",
    authors: [doiksubDevs.god],
    tags: ["Sigil"],
    enabledByDefault: true,
    dependencies: ["CommandsAPI"],

    commands: [
        {
            name: "firstmsg",
            description: "Link to the first message ever sent in this channel (or another one).",
            inputType: ApplicationCommandInputType.BUILT_IN,
            options: [
                {
                    type: ApplicationCommandOptionType.CHANNEL,
                    name: "channel",
                    description: "Channel to look in (default: this one).",
                    required: false,
                },
            ],
            async execute(args, ctx) {
                const channelId = findOption<string>(args, "channel", ctx.channel.id);

                let message: AnyMessage | null = null;
                try {
                    message = await findFirstMessage(channelId);
                } catch {
                    message = null;
                }

                if (!message) {
                    sendBotMessage(ctx.channel.id, { content: "Couldn't find any messages in that channel." });
                    return;
                }

                const channel = ChannelStore.getChannel(channelId);
                const guildId = channel?.getGuildId?.() ?? null;
                const link = `https://discord.com/channels/${guildId ?? "@me"}/${channelId}/${message.id}`;
                const where = channel?.name ? ` in **#${channel.name}**` : "";

                const content = message.content?.trim();
                const preview = content
                    ? `\n-# ${content.slice(0, 80)}${content.length > 80 ? "…" : ""}`
                    : "";

                sendBotMessage(ctx.channel.id, {
                    content: `First message${where}: ${link}${preview}`,
                });
            },
        },
    ],
});
