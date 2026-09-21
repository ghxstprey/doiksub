/*
 * doiksub, a Vencord fork
 * Copyright (c) 2026 (Vendicated|ghxst) and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ApplicationCommandInputType, ApplicationCommandOptionType, findOption, sendBotMessage } from "@api/Commands";
import { doiksubDevs } from "@utils/constants";
import definePlugin from "@utils/types";

const STYLES = [
    { name: "relative", letter: "R", example: "in 3 hours / 5 minutes ago" },
    { name: "shortTime", letter: "t", example: "6:00 PM" },
    { name: "longTime", letter: "T", example: "6:00:00 PM" },
    { name: "shortDate", letter: "d", example: "24/08/2026" },
    { name: "longDate", letter: "D", example: "August 24, 2026" },
    { name: "shortFull", letter: "f", example: "August 24, 2026 6:00 PM" },
    { name: "longFull", letter: "F", example: "Monday, August 24, 2026 6:00 PM" },
] as const;

// ms per unit, keyed by the first letter of the matched word
const UNIT_MS: Record<string, number> = {
    w: 604_800_000,
    d: 86_400_000,
    h: 3_600_000,
    m: 60_000,
    s: 1_000,
};

/** Parses stuff like "2h 30m", "90m", "1 week" into a target timestamp relative to now */
function parseRelative(input: string): number | null {
    const re = /(\d+)\s*(weeks?|w|days?|d|hours?|hrs?|h|minutes?|mins?|m|seconds?|secs?|s)/gi;
    let total = 0;
    let matched = false;
    let match: RegExpExecArray | null;

    while ((match = re.exec(input))) {
        matched = true;
        total += parseInt(match[1]) * UNIT_MS[match[2][0].toLowerCase()];
    }

    return matched ? Date.now() + total : null;
}

/**
 * Figures out what the user meant:
 * - offsets like "2h 30m" / "90m" / "3d"
 * - a time today like "18:45" or "9:30pm" (rolls to tomorrow if already past)
 * - an absolute date like "2026-12-25" or "2026-12-25T18:00"
 */
function parseTarget(input?: string): number | null {
    if (!input?.trim())
        return Date.now();

    const cleaned = input.trim().replace(/^in\s+/i, "").replace(/\s+from\s+now$/i, "");

    // bare time of day
    const timeOfDay = cleaned.match(/^(\d{1,2})(?::(\d{2}))?(?::(\d{2}))?\s*(am|pm)?$/i);
    if (timeOfDay) {
        let hours = parseInt(timeOfDay[1]);
        const minutes = parseInt(timeOfDay[2] ?? "0");
        const seconds = parseInt(timeOfDay[3] ?? "0");
        const ampm = timeOfDay[4]?.toLowerCase();

        if (ampm === "pm" && hours < 12) hours += 12;
        if (ampm === "am" && hours === 12) hours = 0;
        if (hours > 23) return null;

        const date = new Date();
        date.setHours(hours, minutes, seconds, 0);
        // already passed today -> next occurrence
        if (date.getTime() <= Date.now()) date.setDate(date.getDate() + 1);
        return date.getTime();
    }

    // relative offset
    const relative = parseRelative(cleaned);
    if (relative !== null)
        return relative;

    // absolute date
    // Date.parse treats date-only ISO strings as UTC midnight, which lands on
    // the previous day for anyone west of UTC -> parse as local midnight instead
    const dateOnly = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateOnly)
        return new Date(+dateOnly[1], +dateOnly[2] - 1, +dateOnly[3]).getTime();

    // "2026-12-25 18:00" with a space separator parses inconsistently across
    // engines -> normalize to "T" so it's always treated as local time
    const absolute = Date.parse(cleaned.includes(" ") ? cleaned.replace(" ", "T") : cleaned);
    return Number.isNaN(absolute) ? null : absolute;
}

export default definePlugin({
    name: "Timestamp",
    description: "Builds discord dynamic timestamps (<t:unix:style>) via /timestamp.",
    authors: [doiksubDevs.god],
    tags: ["Sigil"],
    enabledByDefault: true,
    dependencies: ["CommandsAPI"],

    commands: [
        {
            name: "timestamp",
            description: "Generate a dynamic <t:...> timestamp you can copy into any message.",
            inputType: ApplicationCommandInputType.BUILT_IN,
            options: [
                {
                    type: ApplicationCommandOptionType.STRING,
                    name: "time",
                    description: 'Offset ("2h 30m", "90m", "3d"), a time ("18:45", "9:30pm") or a date ("2026-12-25"). Defaults to now.',
                    required: false,
                },
                {
                    type: ApplicationCommandOptionType.STRING,
                    name: "style",
                    description: 'How it renders: R "in 3 hours", t "18:00", T "18:00:00", d "24/08/2026", D "August 24, 2026", f/F full date+time.',
                    required: false,
                    choices: STYLES.map(style => ({ name: style.name, label: style.name, value: style.letter })),
                },
            ],
            execute(args, ctx) {
                const timeInput = findOption<string>(args, "time", "");
                const styleLetter = findOption<string>(args, "style", "R");

                const style = STYLES.find(style => style.letter === styleLetter) ?? STYLES[0];

                const target = parseTarget(timeInput);
                if (target === null) {
                    sendBotMessage(ctx.channel.id, {
                        content: `Couldn't parse \`${timeInput}\`. Try \`90m\`, \`2h 30m\`, \`3d\`, \`18:45\`, \`9:30pm\` or an ISO date like \`2026-12-25T18:00\`.`,
                    });
                    return;
                }

                const unix = Math.floor(target / 1000);
                const tag = `<t:${unix}:${style.letter}>`;
                const allStyles = STYLES.map(s => `${s.letter}: <t:${unix}:${s.letter}>`).join(" | ");

                sendBotMessage(ctx.channel.id, {
                    content: `${tag} (${style.name})\n\`${tag}\`\n-# ${allStyles}`,
                });
            },
        },
    ],
});
