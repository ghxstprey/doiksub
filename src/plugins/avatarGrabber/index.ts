/*
 * Endcord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ApplicationCommandOptionType, findOption, sendBotMessage } from "@api/Commands";
import { doiksubDevs } from "@utils/constants";
import definePlugin from "@utils/types";
import { IconUtils, UserStore } from "@webpack/common";

export default definePlugin({
    name: "AvatarGrabber",
    description: "/avatar grabs the full-resolution avatar of any user (or yourself). Sends as a public message.",
    authors: [doiksubDevs.god],
    tags: ["Sigil"],
    enabledByDefault: true,
    dependencies: ["CommandsAPI"],
    commands: [
        {
            name: "avatar",
            description: "Get a user's full-size avatar",
            options: [
                { name: "user", description: "Whose avatar (defaults to you)", type: ApplicationCommandOptionType.USER },
                { name: "system", description: "Send as a Clyde/system message instead of command response", type: ApplicationCommandOptionType.BOOLEAN }
            ],
            execute: (opts, ctx) => {
                const userId = findOption<string>(opts, "user") ?? UserStore.getCurrentUser()?.id;
                const asSystem = findOption<boolean>(opts, "system", false);
                const user = userId ? UserStore.getUser(userId) : null;
                if (!user) {
                    sendBotMessage(ctx.channel.id, { content: "Couldn't find that user." });
                    return;
                }
                const url = IconUtils.getUserAvatarURL(user, true, 1024);
                if (asSystem) {
                    sendBotMessage(ctx.channel.id, { content: url });
                    return;
                }
                return { content: url };
            }
        }
    ]
});
