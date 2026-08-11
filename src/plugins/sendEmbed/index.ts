/*
 * doiksub, a Discord client mod
 * Copyright (c) 2026 ghxst and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ApplicationCommandInputType, ApplicationCommandOptionType, findOption, sendBotMessage } from "@api/Commands";
import { doiksubDevs } from "@utils/constants";
import definePlugin from "@utils/types";

function parseColor(raw?: string): number | undefined {
    if (!raw) return undefined;
    const hex = raw.trim().replace(/^#/, "");
    if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(hex)) return undefined;
    const full = hex.length === 3 ? hex.split("").map(c => c + c).join("") : hex;
    const parsed = parseInt(full, 16);
    return Number.isNaN(parsed) ? undefined : parsed;
}

export default definePlugin({
    name: "sendEmbed",
    description: "Customize a embed and send it in chat via /sendembed. Only visible to you, though another plugin for manipulating webhooks is planned.",
    authors: [doiksubDevs.god],
    tags: ["Sigil"],
    enabledByDefault: true,
    dependencies: ["CommandsAPI"],

    commands: [
        {
            name: "sendembed",
            description: "Send a customized embed message in chat.",
            inputType: ApplicationCommandInputType.BUILT_IN,
            options: [
                {
                    type: ApplicationCommandOptionType.STRING,
                    name: "title",
                    description: "Embed title.",
                    required: false,
                },
                {
                    type: ApplicationCommandOptionType.STRING,
                    name: "description",
                    description: "Embed description (supports limited markdown).",
                    required: false,
                },
                {
                    type: ApplicationCommandOptionType.STRING,
                    name: "color",
                    description: "Embed color as hex, e.g. #5865F2.",
                    required: false,
                },
                {
                    type: ApplicationCommandOptionType.STRING,
                    name: "author",
                    description: "Author name shown at the top of the embed.",
                    required: false,
                },
                {
                    type: ApplicationCommandOptionType.STRING,
                    name: "footer",
                    description: "Footer text.",
                    required: false,
                },
                {
                    type: ApplicationCommandOptionType.STRING,
                    name: "image",
                    description: "Image URL to render inside the embed.",
                    required: false,
                },
                {
                    type: ApplicationCommandOptionType.STRING,
                    name: "url",
                    description: "Link the embed title to a URL.",
                    required: false,
                },
            ],
            execute(args, ctx) {
                const title = findOption<string>(args, "title", "");
                const description = findOption<string>(args, "description", "");
                const author = findOption<string>(args, "author", "");
                const footer = findOption<string>(args, "footer", "");
                const image = findOption<string>(args, "image", "");
                const url = findOption<string>(args, "url", "");
                const color = parseColor(findOption<string>(args, "color", ""));

                if (!title && !description && !image) {
                    sendBotMessage(ctx.channel.id, {
                        content: "You need at least a title, description or image for the embed.",
                    });
                    return;
                }

                const embed: any = { type: "rich" };
                if (title) embed.title = title;
                if (description) embed.description = description;
                if (author) embed.author = { name: author };
                if (footer) embed.footer = { text: footer };
                if (image) embed.image = { url: image };
                if (url) embed.url = url;
                if (color != null) embed.color = color;

                sendBotMessage(ctx.channel.id, { embeds: [embed] });
            },
        },
    ],
});