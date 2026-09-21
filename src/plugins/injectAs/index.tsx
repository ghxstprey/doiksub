/*
 * doiksub, a Discord client mod
 * Copyright (c) 2026 ghxst and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { NavContextMenuPatchCallback } from "@api/ContextMenu";
import { doiksubDevs } from "@utils/constants";
import {
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalRoot,
    openModal,
} from "@utils/modal";
import definePlugin from "@utils/types";
import { Button, FluxDispatcher, IconUtils, Menu, React, UserStore } from "@webpack/common";

// ─── Snowflake generator ──────────────────────────────────────────────────────
let _idCounter = 0;

function uniqueSnowflake(): string {
    const offset = _idCounter++ % 4096;
    const ms = Math.max(0, Date.now() - 1420070400000);
    return ((BigInt(ms) << 22n) | BigInt(offset)).toString();
}

// ─── Build author object ──────────────────────────────────────────────────────
function buildAuthor(user: any) {
    return {
        id: user.id,
        username: user.username,
        discriminator: user.discriminator ?? "0",
        avatar: user.avatar ?? null,
        public_flags: user.publicFlags ?? 0,
        flags: user.flags ?? 0,
        banner: user.banner ?? null,
        accent_color: null,
        global_name: user.globalName ?? user.username,
        avatar_decoration_data: user.avatarDecorationData
            ? { asset: user.avatarDecorationData.asset, sku_id: user.avatarDecorationData.skuId }
            : null,
        banner_color: null,
    };
}

// ─── Inject message ───────────────────────────────────────────────────────────
function injectMessage(channelId: string, author: any, content: string) {
    const id = uniqueSnowflake();
    FluxDispatcher.dispatch({
        type: "MESSAGE_CREATE",
        channelId,
        message: {
            attachments: [],
            components: [],
            embeds: [],
            mention_roles: [],
            mentions: [],
            author: buildAuthor(author),
            channel_id: channelId,
            content,
            edited_timestamp: null,
            flags: 0,
            id,
            mention_everyone: false,
            nonce: id,
            pinned: false,
            timestamp: new Date().toISOString(),
            tts: false,
            type: 0,
        },
        optimistic: false,
        isPushNotification: false,
    });
}

// ─── Modal ────────────────────────────────────────────────────────────────────
interface InjectModalProps {
    modalProps: any;
    author: any;
    channelId: string;
}

function InjectModal({ modalProps, author, channelId }: InjectModalProps) {
    const [text, setText] = React.useState("");
    const [flash, setFlash] = React.useState<string | null>(null);
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    const displayName: string = author.globalName ?? author.username ?? "Unknown";
    const avatarUrl = (() => {
        try {
            return IconUtils.getUserAvatarURL(author, false, 64);
        } catch {
            return "https://cdn.discordapp.com/embed/avatars/0.png";
        }
    })();

    React.useEffect(() => {
        const id = setTimeout(() => textareaRef.current?.focus(), 60);
        return () => clearTimeout(id);
    }, []);

    function submit() {
        const trimmed = text.trim();
        if (!trimmed) return;
        injectMessage(channelId, author, trimmed);
        setText("");
        setFlash("Injected ✓");
        setTimeout(() => { setFlash(null); textareaRef.current?.focus(); }, 1800);
    }

    return (
        <ModalRoot {...modalProps} size="small">
            <ModalHeader separator={false}>
                <div className="vc-ia-header">
                    <img className="vc-ia-avatar" src={avatarUrl} alt="" />
                    <div>
                        <div className="vc-ia-title">Inject as {displayName}</div>
                        <div className="vc-ia-subtitle">only visible to you</div>
                    </div>
                </div>
                <ModalCloseButton onClick={modalProps.onClose} />
            </ModalHeader>

            <ModalContent>
                <textarea
                    ref={textareaRef}
                    rows={4}
                    className="vc-ia-input"
                    placeholder={`Message as ${displayName}…`}
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            submit();
                        }
                    }}
                />
                <div className="vc-ia-hint">
                    <span><kbd className="vc-ia-kbd">Enter</kbd> inject</span>
                    <span><kbd className="vc-ia-kbd">Shift + Enter</kbd> newline</span>
                </div>
                {flash && <div className="vc-ia-flash">{flash}</div>}
            </ModalContent>

            <ModalFooter>
                <div className="vc-ia-footer">
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        Fake local message in this channel
                    </span>
                    <Button
                        variant="primary"
                        disabled={!text.trim()}
                        onClick={submit}
                    >
                        Inject
                    </Button>
                </div>
            </ModalFooter>
        </ModalRoot>
    );
}

// ─── Context menu patch ───────────────────────────────────────────────────────
const messageContextMenuPatch: NavContextMenuPatchCallback = (children, { message, channel }) => {
    // Skip system messages, webhooks, or anything without a real author
    if (!message?.author?.id) return;

    // Prefer the full cached user from UserStore; fall back to the partial on the message
    const author = UserStore.getUser(message.author.id) ?? message.author;
    const displayName: string = (author as any).globalName ?? author.username ?? "Unknown";
    // it looks very ugly so i will also need to fix that... whatever
    children.push(
        <Menu.MenuSeparator key="injectas-sep" />,
        <Menu.MenuItem
            key="injectas-item"
            id="injectas-user"
            label={`Inject as ${displayName}`}
            action={() => openModal(props => (
                <InjectModal
                    modalProps={props}
                    author={author}
                    channelId={channel.id}
                />
            ))}
        />
    );
};

// ─── Plugin ───────────────────────────────────────────────────────────────────
export default definePlugin({
    name: "InjectAs",
    enabledByDefault: true,
    description: "Right-click any message to inject a fake local reply as that user. Used in cases such as Discord where you can't type in chat.",
    authors: [doiksubDevs.sqz],
    tags: ["Sigil"],

    contextMenus: {
        "message": messageContextMenuPatch,
    },

    stop() {
        _idCounter = 0;
    },
});