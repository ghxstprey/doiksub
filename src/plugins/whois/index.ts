/*
 * doiksub, a Discord client mod
 * Copyright (c) 2026 ghxst and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ApplicationCommandInputType, ApplicationCommandOptionType, findOption, sendBotMessage } from "@api/Commands";
import { doiksubDevs } from "@utils/constants";
import { makeCodeblock } from "@utils/text";
import definePlugin from "@utils/types";
import { IconUtils, SnowflakeUtils, UserStore, UserUtils } from "@webpack/common";

const PREMIUM_TYPES: Record<number, string> = {
    0: "None",
    1: "Nitro Classic",
    2: "Nitro",
    3: "Nitro Basic",
};

function fmtDate(ts: number): string {
    return new Date(ts).toLocaleString();
}

function buildWhois(user: any): string {
    const avatarUrl = (() => {
        try { return IconUtils.getUserAvatarURL(user, 256, true, "webp"); } catch { return undefined; }
    })();

    const lines = [
        `Username: ${user.username}`,
        user.globalName ? `Global name: ${user.globalName}` : null,
        // why do they still have ${user.tag} when discrims got removed like years ago
        `ID: ${user.id}`,
        `Created: ${fmtDate(SnowflakeUtils.extractTimestamp(user.id))}`,
        `Created (Formatted): ${new Date(SnowflakeUtils.extractTimestamp(user.id)).toLocaleString()}`,
        `Bot: ${user.bot ? "Yes" : "No"}`,
        user.system ? `System: ${user.system ? "Yes" : "No"}` : null,
        `Verified: ${user.verified ? "Yes" : "No"}`,
        `Premium: ${PREMIUM_TYPES[user.premiumType ?? 0] ?? "uhhh... iono..."}`,
        avatarUrl ? `Avatar: ${avatarUrl}` : null,
    ].filter(Boolean);

    return makeCodeblock(lines.join("\n"));
}

export default definePlugin({
    name: "WhoIs",
    description: "Get info about a user (id, creation date, avatar, badges, etc.) via /whois.",
    authors: [doiksubDevs.god],
    tags: ["Sigil"],
    enabledByDefault: true,
    dependencies: ["CommandsAPI"],

    commands: [
        {
            name: "whois",
            description: "Get info about a user.",
            inputType: ApplicationCommandInputType.BUILT_IN,
            options: [
                {
                    type: ApplicationCommandOptionType.USER,
                    name: "user",
                    description: "The user to look up (default: you).",
                    required: false,
                },
            ],
            async execute(args, ctx) {
                const idArg = args.find(a => a.name === "user");
                const id = idArg ? idArg.value : UserStore.getCurrentUser()?.id;
                if (!id) {
                    sendBotMessage(ctx.channel.id, { content: "Couldn't determine the user." });
                    return;
                }

                let user = UserStore.getUser(id);
                if (!user) {
                    try { user = await UserUtils.getUser(id); } catch { user = null; }
                }

                if (!user) {
                    sendBotMessage(ctx.channel.id, { content: "Couldn't find that user." });
                    return;
                }

                sendBotMessage(ctx.channel.id, {
                    content: `**Who is — ${user.globalName ?? user.username}**\n${buildWhois(user)}`,
                });
            },
        },
    ],
});