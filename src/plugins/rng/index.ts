/*
 * doiksub, a Discord client mod
 * Copyright (c) 2026 ghxst and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ApplicationCommandInputType, ApplicationCommandOptionType, findOption, sendBotMessage } from "@api/Commands";
import { doiksubDevs } from "@utils/constants";
import definePlugin from "@utils/types";

export default definePlugin({
    name: "RNG",
    description: "Random number / dice roll / coin flip utilities via /rng <coin|dice|number>.",
    authors: [doiksubDevs.god],
    tags: ["Sigil"],
    enabledByDefault: true,
    dependencies: ["CommandsAPI"],

    commands: [
        {
            name: "rng",
            description: "Random utilities: coin flip, dice roll or random number.",
            inputType: ApplicationCommandInputType.BUILT_IN,
            options: [
                {
                    type: ApplicationCommandOptionType.SUB_COMMAND,
                    name: "coin",
                    description: "Flip a coin (heads or tails).",
                },
                {
                    type: ApplicationCommandOptionType.SUB_COMMAND,
                    name: "dice",
                    description: "Roll a dice.",
                    options: [
                        {
                            type: ApplicationCommandOptionType.INTEGER,
                            name: "sides",
                            description: "Number of sides (default: 6).",
                            required: false,
                        },
                    ],
                },
                {
                    // this is where i input numbers in the command...
                    type: ApplicationCommandOptionType.SUB_COMMAND,
                    name: "number",
                    description: "Get a random number between min and max (inclusive).",
                    options: [
                        {
                            type: ApplicationCommandOptionType.INTEGER,
                            name: "min",
                            description: "Lower bound (default: 1).",
                            required: false,
                        },
                        {
                            type: ApplicationCommandOptionType.INTEGER,
                            name: "max",
                            description: "Upper bound (default: 100).",
                            required: false,
                        },
                    ],
                },
            ],
            execute(args, ctx) {
                const cmdName: string = (this as any)?.name ?? "rng";
                const sub = cmdName.split(" ").slice(1).join(" ");

                if (sub === "coin") {
                    const flip = Math.random() < 0.5 ? "Heads" : "Tails";
                    sendBotMessage(ctx.channel.id, { content: `${flip}` });
                    return;
                }

                if (sub === "dice") {
                    const subArg = args.find(a => a.name === "dice");
                    const nested = subArg?.options ?? args;
                    const sides = Math.max(2, Math.floor(findOption<number>(nested, "sides", 6) || 6));
                    const roll = 1 + Math.floor(Math.random() * sides);
                    sendBotMessage(ctx.channel.id, { content: `${roll} (1-${sides})` });
                    return;
                }

                if (sub === "number") {
                    const subArg = args.find(a => a.name === "number");
                    const nested = subArg?.options ?? args;

                    const min = Math.floor(findOption<number>(nested, "min", 1) ?? 1);
                    const max = Math.floor(findOption<number>(nested, "max", 100) ?? 100);
                    const lower = Math.min(min, max);
                    const upper = Math.max(min, max);
                    const result = Math.floor(Math.random() * (upper - lower + 1)) + lower;
                    sendBotMessage(ctx.channel.id, { content: `${result}\n-# (${lower}-${upper})` });
                    return;
                }

                sendBotMessage(ctx.channel.id, { content: "Usage: `/rng coin`, `/rng dice [sides]`, `/rng number [min] [max]`" });
            },
        },
    ],
});