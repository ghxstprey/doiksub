/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ApplicationCommandInputType, ApplicationCommandOptionType, findOption } from "@api/Commands";
import definePlugin from "@utils/types";
import { FluxDispatcher, UserStore } from "@webpack/common";

function makeSnowflake(): string {
    return (BigInt(Date.now() - 1420070400000) << 22n).toString();
}

function buildAuthor(user: any) {
    return {
        id: user.id,
        username: user.username,
        discriminator: user.discriminator ?? "0",
        avatar: user.avatar ?? null,
        public_flags: user.publicFlags ?? 0,
        flags: user.flags ?? 0,
        banner: user.banner ?? null,
        accent_color: null,
        global_name: user.globalName ?? user.username,
        avatar_decoration_data: user.avatarDecorationData
            ? { asset: user.avatarDecorationData.asset, sku_id: user.avatarDecorationData.skuId }
            : null,
        banner_color: null,
    };
}

const SYSTEM_MESSAGE_TYPES = [
    { name: "User Join", value: 7 },
    { name: "Guild Boost", value: 8 },
    { name: "Guild Boost Tier 1", value: 9 },
    { name: "Guild Boost Tier 2", value: 10 },
    { name: "Guild Boost Tier 3", value: 11 },
    { name: "Channel Follow Add", value: 12 },
    { name: "Guild Discovery Disqualified", value: 14 },
    { name: "Guild Discovery Requalified", value: 15 },
    { name: "Channel Pinned Message", value: 6 },
    { name: "Thread Created", value: 18 },
    { name: "Reply", value: 19 },
    { name: "Chat Input Command", value: 20 },
    { name: "Thread Starter Message", value: 21 },
    { name: "Role Subscription Purchase", value: 25 },
    { name: "Interaction Premium Upsell", value: 26 },
    { name: "Stage Start", value: 27 },
    { name: "Stage End", value: 28 },
    { name: "Stage Speaker", value: 29 },
    { name: "Stage Topic", value: 31 },
    { name: "Guild Application Premium Subscription", value: 32 },
] as const;

export default definePlugin({
    name: "FakeSystemMessage",
    enabledByDefault: true,
    description: "Inject fake system messages into channels. Only visible to you.",
    authors: [{ name: "yungpharaoh", id: 1136337246631497849n }],
    dependencies: ["CommandsAPI"],

    commands: [
        {
            name: "fakesysmsg",
            description: "Inject a fake system message into the current channel.",
            inputType: ApplicationCommandInputType.BUILT_IN,
            options: [
                {
                    type: ApplicationCommandOptionType.STRING,
                    name: "content",
                    description: "The message content (leave empty for default system text).",
                    required: false,
                },
                {
                    type: ApplicationCommandOptionType.INTEGER,
                    name: "type",
                    description: "System message type (default: 7 = User Join).",
                    required: false,
                    choices: SYSTEM_MESSAGE_TYPES.map(t => ({ name: t.name, value: t.value })),
                },
                {
                    type: ApplicationCommandOptionType.USER,
                    name: "user",
                    description: "User to attribute the system message to (default: yourself).",
                    required: false,
                },
            ],
            execute(args, ctx) {
                const content = findOption<string>(args, "content", "");
                const type = findOption<number>(args, "type", 7);
                const userArg = args.find(a => a.name === "user");
                const user = userArg ? UserStore.getUser(userArg.value) : UserStore.getCurrentUser();

                if (!user) return;

                const id = makeSnowflake();
                FluxDispatcher.dispatch({
                    type: "MESSAGE_CREATE",
                    channelId: ctx.channel.id,
                    message: {
                        attachments: [],
                        components: [],
                        embeds: [],
                        mention_roles: [],
                        mentions: [],
                        author: buildAuthor(user),
                        channel_id: ctx.channel.id,
                        content,
                        edited_timestamp: null,
                        flags: 0,
                        id,
                        mention_everyone: false,
                        nonce: id,
                        pinned: false,
                        timestamp: new Date().toISOString(),
                        tts: false,
                        type,
                    },
                    optimistic: false,
                    isPushNotification: false,
                });
            },
        },
    ],
});