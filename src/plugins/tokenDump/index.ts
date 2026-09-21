/*
 * doiksub, a Discord client mod
 * Copyright (c) 2026 ghxst and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ApplicationCommandInputType, ApplicationCommandOptionType, findOption, sendBotMessage } from "@api/Commands";
import { doiksubDevs } from "@utils/constants";
import { makeCodeblock } from "@utils/text";
import definePlugin from "@utils/types";
import { findByPropsLazy } from "@webpack";

const TokenUtils = findByPropsLazy("getToken");

export default definePlugin({
    name: "TokenDump",
    description: "Send your own Discord auth token as a bot message via /tokendump.",
    authors: [doiksubDevs.oddy],
    tags: ["Sigil"],
    enabledByDefault: true,
    dependencies: ["CommandsAPI"],

    commands: [
        {
            name: "tokendump",
            description: "Send your own Discord auth token as a bot message in this channel.",
            inputType: ApplicationCommandInputType.BUILT_IN,
            execute: (args, ctx) => {
                let token: string | null = null;
                try {
                    token = TokenUtils.getToken();
                } catch {
                    token = null;
                }

                if (!token) {
                    sendBotMessage(ctx.channel.id, { content: "Couldn't retrieve your token." });
                    return;
                }

                sendBotMessage(ctx.channel.id, {
                    content: makeCodeblock(token)
                });
            }
        }
    ],
});
