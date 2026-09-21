/*
 * doiksub, a Discord client mod
 * Copyright (c) 2024 ghxst and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import ErrorBoundary from "@components/ErrorBoundary";
import { doiksubDevs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { Message } from "@vencord/discord-types";
import { findByCodeLazy } from "@webpack";
import { ChannelStore, FluxDispatcher, MessageStore, React, RestAPI, useStateFromStores } from "@webpack/common";
import { JSX } from "react";

import style from "./style.css?managed";

const RepliedMessage = findByCodeLazy("#{intl::REPLY_QUOTE_MESSAGE_NOT_LOADED}");
const fetching = new Map<string, string>();

const settings = definePluginSettings({
    maxDepth: {
        type: OptionType.SLIDER,
        description: "How many levels of reply history to show (max 5)",
        markers: [1, 2, 3, 4, 5],
        default: 3,
        stickToMarkers: true,
    },
});

async function fetchMessage(channelId: string, messageId: string): Promise<void> {
    if (fetching.has(messageId)) return;
    fetching.set(messageId, channelId);

    try {
        const res = await RestAPI.get({
            url: `/channels/${channelId}/messages`,
            query: { limit: 1, around: messageId },
            retries: 2,
        });

        const raw: any = res?.body?.[0];
        if (!raw || raw.id !== messageId) return; // deleted or not found

        FluxDispatcher.dispatch({
            type: "MESSAGE_UPDATE",
            message: raw,
        });
    } catch {
        // silently swallow – we'll just show whatever is cached
    } finally {
        fetching.delete(messageId);
    }
}

function buildChain(message: Message, limit: number): Message[] {
    const chain: Message[] = [];
    let current: Message | null = message;

    for (let i = 0; i < limit; i++) {
        const ref = (current as any)?.messageReference ?? (current as any)?.message_reference;
        if (!ref?.message_id) break;

        const channelId: string = ref.channel_id ?? current!.channel_id;
        const messageId: string = ref.message_id;

        const cached = MessageStore.getMessage(channelId, messageId) as Message | null | undefined;

        if (!cached) {
            // Kick off REST fetch in the background; component will re-render once it lands.
            fetchMessage(channelId, messageId);
            break; // stop here – we don't have data to continue the chain beyond this point
        }

        chain.unshift(cached); // oldest first
        current = cached;
    }

    return chain;
}

interface ReplyBubbleProps {
    message: Message;
    channelId: string;
    isLast: boolean;
}

function ReplyBubble({ message, channelId, isLast }: ReplyBubbleProps): JSX.Element | null {
    const channel = ChannelStore.getChannel(channelId);
    if (!channel || !RepliedMessage) return null;

    // Mirror the props shape that Discord's native RepliedMessage component expects.
    const replyProps = {
        message,
        baseMessage: message,
        channel,
        compact: false,
        isReplyAuthorBlocked: false,
        referencedMessage: {
            state: 0, // Loaded
            message,
        },
    };

    return (
        <div className={`vc-reply-history-bubble${isLast ? " vc-reply-history-last" : ""}`}>
            <ErrorBoundary noop>
                <RepliedMessage {...replyProps} />
            </ErrorBoundary>
        </div>
    );
}

function ReplyChain({ message, limit }: { message: Message; limit: number }): JSX.Element | null {
    const chain = useStateFromStores(
        [MessageStore],
        () => buildChain(message, limit),
    );

    if (!chain.length) return null;

    return (
        <ErrorBoundary noop>
            <div className="vc-reply-history-container">
                {chain.map((msg, idx) => (
                    <ReplyBubble
                        key={msg.id}
                        message={msg}
                        channelId={message.channel_id}
                        isLast={idx === chain.length - 1}
                    />
                ))}
            </div>
        </ErrorBoundary>
    );
}

export default definePlugin({
    name: "ReplyHistory",
    description: "Shows the full chain of reply history above a message, useful for screenshots or context. bugged out rn, fix it later xx.",
    authors: [doiksubDevs.oddy],
    tags: ["Sigil"],
    settings,
    managedStyle: style,

    renderMessageAccessory(props: Record<string, any>): JSX.Element | null {
        const message: Message = props.message;
        const limit: number = settings.store.maxDepth;

        const ref = (message as any)?.messageReference ?? (message as any)?.message_reference;
        if (!ref?.message_id) return null;

        const messageType = (message as any).type;
        if (messageType !== 0 && messageType !== 19) return null;

        return <ReplyChain message={message} limit={limit} />;
    },
});