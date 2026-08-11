/*
 * doiksub, a Discord client mod
 * Copyright (c) 2026 ghxst and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { findOption, sendBotMessage } from "@api/Commands";
import { doiksubDevs } from "@utils/constants";
import definePlugin from "@utils/types";
import { CommandArgument, CommandContext } from "@vencord/discord-types";
import { FluxDispatcher, MessageStore, UserStore } from "@webpack/common";

function parseEmoji(raw: string): { name: string; id: string | null; animated: boolean } {
    const trimmed = raw.trim();

    // Discord format: <:name:id> or <a:name:id>
    const discordMatch = trimmed.match(/^<(a)?:([a-zA-Z0-9_]+):(\d{17,20})>$/);
    if (discordMatch) {
        return {
            animated: !!discordMatch[1],
            name: discordMatch[2],
            id: discordMatch[3],
        };
    }

    // Colon format: :name:id, a:name:id, or name:id
    const m = trimmed.match(/^(a)?:?([a-zA-Z0-9_]+):?(\d{17,20})?:?$/);
    if (m) {
        const animated = !!m[1];
        const name = m[2];
        const id = m[3] ?? null;
        return { name, id, animated };
    }

    return { name: trimmed, id: null, animated: false };
}

function latestMessage(channelId: string): any | null {
    try {
        const messages = MessageStore.getMessages(channelId);
        if (!messages) return null;
        const last = typeof messages.last === "function" ? messages.last() : Array.from(messages)[messages.length - 1];
        return last ?? null;
    } catch {
        return null;
    }
}

export async function executeReaction(args: CommandArgument[], ctx: CommandContext) {
    const emojiRaw = findOption<string>(args, "emoji", "");
    if (!emojiRaw) {
        sendBotMessage(ctx.channel.id, { content: "You must provide an emoji." });
        return;
    }

    const emoji = parseEmoji(emojiRaw);
    const msgIdArg = findOption<string>(args, "message", "");
    const userId = findOption<string>(args, "user", UserStore.getCurrentUser()?.id);

    let messageId = msgIdArg;
    if (!messageId) {
        const msg = latestMessage(ctx.channel.id);
        if (!msg) {
            sendBotMessage(ctx.channel.id, { content: "Couldn't find a message to react to in this channel." });
            return;
        }
        messageId = msg.id;
    }

    FluxDispatcher.dispatch({
        type: "MESSAGE_REACTION_ADD",
        channelId: ctx.channel.id,
        messageId,
        userId,
        emoji,
        burst: false,
        messageAuthorId: UserStore.getCurrentUser()?.id,
    });
}

export default definePlugin({
    name: "FakeReaction",
    description: "Add fake reactions onto messages. Disappears on reload. Use /fake reaction.",
    authors: [doiksubDevs.ghxst],
    tags: ["Sigil"],
    enabledByDefault: true,
    dependencies: ["Fake", "CommandsAPI"],

    start() {
        // No-op, command is handled by Fake
    },

    stop() {
        // No-op
    },
});