/*
 * doiksub, a Discord client mod
 * Copyright (c) 2026 ghxst and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { findOption, sendBotMessage } from "@api/Commands";
import { doiksubDevs } from "@utils/constants";
import definePlugin from "@utils/types";
import { CommandArgument, CommandContext } from "@vencord/discord-types";
import { EmojiStore, FluxDispatcher, MessageStore, UserStore } from "@webpack/common";

interface ParsedReactionEmoji {
    name: string;
    id: string | null;
    animated: boolean;
}

function parseEmoji(raw: string): ParsedReactionEmoji {
    const trimmed = raw.trim();

    const discordMatch = trimmed.match(/^<(a)?:([\w-]+):(\d{17,21})>$/);
    if (discordMatch) {
        return {
            animated: !!discordMatch[1],
            name: discordMatch[2],
            id: discordMatch[3],
        };
    }

    const customMatch = trimmed.match(/^(?:(a):)?(?::)?([\w-]+):(\d{17,21}):?$/);
    if (customMatch) {
        return {
            animated: !!customMatch[1],
            name: customMatch[2],
            id: customMatch[3],
        };
    }

    const cleanName = trimmed.replace(/^:|:$/g, "");
    const resolved = EmojiStore?.getDisambiguatedEmojiContext(null)?.getByName(cleanName);
    if (resolved) {
        if (resolved.type === 1) {
            return {
                name: resolved.name,
                id: resolved.id,
                animated: resolved.animated,
            };
        }
        if (resolved.type === 0) {
            return {
                name: resolved.surrogates,
                id: null,
                animated: false,
            };
        }
    }

    return { name: cleanName, id: null, animated: false };
}

function latestMessage(channelId: string): any | null {
    try {
        const messages = MessageStore.getMessages(channelId);
        if (!messages) return null;
        return messages.last?.() ?? messages._array?.at(-1) ?? null;
    } catch {
        return null;
    }
}

export async function executeReaction(args: CommandArgument[], ctx: CommandContext) {
    const emojiArg = args.find(a => a.name === "emoji") as any;
    const emojiRaw: string = emojiArg?.value
        || (emojiArg?.emoji ? `<${emojiArg.emoji.animated ? "a" : ""}:${emojiArg.emoji.name}:${emojiArg.emoji.id}>` : "")
        || "";
    if (!emojiRaw) {
        sendBotMessage(ctx.channel.id, { content: "You must provide an emoji." });
        return;
    }

    const emoji = parseEmoji(emojiRaw);
    const rawMsgArg = findOption<string>(args, "message", "").trim();
    const rawUserArg = findOption<string>(args, "user", UserStore.getCurrentUser()?.id);
    const userId = rawUserArg?.replace(/[<@!>]/g, "");

    let messageId = (rawMsgArg.match(/\/(\d{17,21})$/) ?? [])[1] ?? rawMsgArg;
    let targetMessage: any = null;

    if (!messageId) {
        targetMessage = latestMessage(ctx.channel.id);
        if (!targetMessage) {
            sendBotMessage(ctx.channel.id, { content: "Couldn't find a message to react to in this channel." });
            return;
        }
        messageId = targetMessage.id;
    } else {
        targetMessage = MessageStore.getMessage(ctx.channel.id, messageId);
    }

    const messageAuthorId = targetMessage?.author?.id ?? UserStore.getCurrentUser()?.id;

    FluxDispatcher.dispatch({
        type: "MESSAGE_REACTION_ADD",
        channelId: ctx.channel.id,
        messageId,
        userId,
        emoji,
        burst: false,
        burstColors: [],
        optimistic: false,
        guildId: ctx.channel.guild_id,
        messageAuthorId,
    });
}

export default definePlugin({
    name: "FakeReaction",
    description: "Add fake reactions onto messages. Disappears on reload. Use /fake reaction.",
    authors: [doiksubDevs.ghxst],
    tags: ["Sigil"],
    enabledByDefault: true,
    dependencies: ["Fake", "CommandsAPI"],

    start() { },
    stop() { },
});
