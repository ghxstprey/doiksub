/*
 * doiksub, a Discord client mod
 * Copyright (c) 2026 ghxst and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ApplicationCommandInputType, ApplicationCommandOptionType } from "@api/Commands";
import { doiksubDevs } from "@utils/constants";
import definePlugin from "@utils/types";

import { executeReaction } from "../fakeReaction";
import { executeSystemMessage, SYSTEM_MESSAGE_TYPES } from "../fakeSystemMessage";
import { executeTyping } from "../fakeTyping";

export default definePlugin({
    name: "Fake",
    description: "Unified slash command for fake actions: /fake reaction, /fake sys, /fake type.",
    authors: [doiksubDevs.ghxst],
    tags: ["Sigil"],
    enabledByDefault: true,
    dependencies: ["CommandsAPI"],

    commands: [
        {
            name: "fake",
            description: "Perform a fake action.",
            inputType: ApplicationCommandInputType.BUILT_IN,
            options: [
                {
                    type: ApplicationCommandOptionType.SUB_COMMAND,
                    name: "reaction",
                    description: "Add a fake reaction to a message.",
                    options: [
                        {
                            type: ApplicationCommandOptionType.STRING,
                            name: "emoji",
                            description: "Emoji to add. Accepts <:name:id>, <a:name:id>, :name:id, a:name:id, or a unicode emoji. Can also use emoji picker.",
                            required: true,
                        },
                        {
                            type: ApplicationCommandOptionType.STRING,
                            name: "message",
                            description: "Message ID to react to (default: newest message in the channel).",
                            required: false,
                        },
                        {
                            type: ApplicationCommandOptionType.USER,
                            name: "user",
                            description: "User to attribute the reaction to (default: you).",
                            required: false,
                        },
                    ],
                    execute(args, ctx) {
                        return executeReaction(args, ctx);
                    },
                },
                {
                    type: ApplicationCommandOptionType.SUB_COMMAND,
                    name: "sys",
                    description: "Inject a fake system message into the current channel.",
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
                        return executeSystemMessage(args, ctx);
                    },
                },
                {
                    type: ApplicationCommandOptionType.SUB_COMMAND,
                    name: "type",
                    description: "Toggle infinite typing in this channel.",
                    options: [
                        {
                            name: "toggle",
                            description: "Whether to enable or disable infinite typing.",
                            type: ApplicationCommandOptionType.BOOLEAN,
                            required: false,
                        },
                    ],
                    execute(args, ctx) {
                        return executeTyping(args, ctx);
                    },
                },
            ],
        },
    ],
});
