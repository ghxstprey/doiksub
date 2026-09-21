/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { doiksubDevs } from "@utils/constants";
import { Logger } from "@utils/Logger";
import definePlugin, { OptionType } from "@utils/types";
import { findStoreLazy } from "@webpack";
import { Constants, FluxDispatcher, React, RestAPI, UserStore } from "@webpack/common";
import { JSX } from "react";

const logger = new Logger("AutoReact");
const ChannelStore = findStoreLazy("ChannelStore");
const EmojiStore = findStoreLazy("EmojiStore");

interface ReactPair {
    userId: string;
    emoji: string;
}

const settings = definePluginSettings({
    pairs: {
        type: OptionType.STRING,
        multiline: true,
        description: "One pair per line: userId:emoji (e.g. 123456789:💀). Same user can have multiple lines for multiple emojis.",
        default: "",
    },
    delay: {
        type: OptionType.SLIDER,
        description: "Delay before reacting in seconds (to look natural).",
        markers: [0, 1, 2, 3, 5, 10],
        default: 1,
    },
    onlyDMs: {
        type: OptionType.BOOLEAN,
        description: "Only auto-react in DMs.",
        default: false,
    },
});

function normalizeEmoji(emoji: string): string | null {
    const trimmed = emoji.trim();
    if (!trimmed) return null;

    const customMatch = trimmed.match(/^(?:<(?:(a):)?|:)?([\w-]+?)(?:~\d+)?:([0-9]+)>?$/);
    if (customMatch) {
        return `${customMatch[2]}:${customMatch[3]}`;
    }

    return trimmed;
}

function parsePairs(raw: string): ReactPair[] {
    const pairs: ReactPair[] = [];
    for (const line of raw.split(/[\n,]/)) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        const colonIdx = trimmed.indexOf(":");
        if (colonIdx === -1) continue;

        const userId = trimmed.slice(0, colonIdx).trim();
        const emoji = trimmed.slice(colonIdx + 1).trim();
        if (!userId || !emoji) continue;

        const normalized = normalizeEmoji(emoji);
        if (!normalized) continue;

        pairs.push({ userId, emoji: normalized });
    }
    return pairs;
}

function pairsToString(pairs: ReactPair[]): string {
    return pairs.map(p => `${p.userId}:${p.emoji}`).join("\n");
}

// ─── Emoji Picker Component ──────────────────────────────────────────────────

const EMOJI_CATEGORIES = [
    "😀 Smileys", "❤️ Emotion", "👋 People", "🐶 Animals", "🍔 Food",
    "⚽ Activities", "🚗 Travel", "💡 Objects", "🔣 Symbols", "🏁 Flags"
];

// Common emojis for quick pick
const QUICK_EMOJIS = [
    "😂", "❤️", "🔥", "💀", "😭", "🥺", "😳", "🤨", "😏", "👍",
    "👎", "🎉", "💯", "✅", "❌", "⭐", "👀", "💪", "🤝", "🙏",
    "😊", "😍", "🤔", "😈", "👻", "💜", "🖤", "✨", "🥶", "🤡",
];

interface EmojiPickerProps {
    onSelect: (emoji: string) => void;
    onClose: () => void;
}

function EmojiPicker({ onSelect, onClose }: EmojiPickerProps): JSX.Element {
    const [search, setSearch] = React.useState("");

    // Get custom emojis from guilds
    const customEmojis = React.useMemo(() => {
        try {
            const allEmojis = EmojiStore?.getAllGuildEmojis?.() ?? {};
            const result: { name: string; id: string; animated: boolean; url: string; }[] = [];
            for (const guildId in allEmojis) {
                const emojis = allEmojis[guildId];
                if (Array.isArray(emojis)) {
                    for (const e of emojis) {
                        if (e?.name && e?.id) {
                            result.push({
                                name: e.name,
                                id: e.id,
                                animated: !!e.animated,
                                url: `https://cdn.discordapp.com/emojis/${e.id}.${e.animated ? "gif" : "webp"}?size=32`,
                            });
                        }
                    }
                }
            }
            return result;
        } catch { return []; }
    }, []);

    const filteredCustom = customEmojis.filter(e =>
        e.name.toLowerCase().includes(search.toLowerCase())
    );

    const filteredQuick = QUICK_EMOJIS.filter(e =>
        e.includes(search)
    );

    return (
        <div
            style={{
                position: "fixed", zIndex: 1000001,
                background: "var(--background-floating)",
                border: "1px solid var(--background-modifier-accent)",
                borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                width: 320, maxHeight: 360, overflow: "hidden",
                display: "flex", flexDirection: "column",
            }}
        >
            {/* Search */}
            <div style={{ padding: "8px 10px", borderBottom: "1px solid var(--background-modifier-accent)" }}>
                <input
                    autoFocus
                    placeholder="Search emojis..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{
                        width: "100%", boxSizing: "border-box",
                        background: "var(--input-background)",
                        border: "1px solid var(--background-modifier-accent)",
                        borderRadius: 4, color: "var(--text-normal)",
                        fontSize: 13, padding: "6px 10px", outline: "none",
                    }}
                />
            </div>

            {/* Emoji grid */}
            <div style={{ flex: 1, overflowY: "auto", padding: "6px 8px" }}>
                {/* Quick / searched unicode emojis */}
                {filteredQuick.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 2, marginBottom: 6 }}>
                        {filteredQuick.map(e => (
                            <button
                                key={e}
                                onClick={() => { onSelect(e); onClose(); }}
                                style={{
                                    width: 36, height: 36, fontSize: 20,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    background: "transparent", border: "none", borderRadius: 4,
                                    cursor: "pointer", transition: "background 0.1s",
                                }}
                                onMouseEnter={e => (e.currentTarget.style.background = "var(--background-modifier-hover)")}
                                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                                title={e}
                            >
                                {e}
                            </button>
                        ))}
                    </div>
                )}

                {/* Custom emojis */}
                {filteredCustom.length > 0 && (
                    <>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", margin: "4px 0", letterSpacing: ".04em" }}>
                            Custom Emojis
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                            {filteredCustom.map(e => (
                                <button
                                    key={e.id}
                                    onClick={() => { onSelect(`<${e.animated ? "a" : ""}:${e.name}:${e.id}>`); onClose(); }}
                                    style={{
                                        width: 36, height: 36,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        background: "transparent", border: "none", borderRadius: 4,
                                        cursor: "pointer", transition: "background 0.1s",
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.background = "var(--background-modifier-hover)")}
                                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                                    title={`:${e.name}:`}
                                >
                                    <img src={e.url} alt={e.name} style={{ width: 22, height: 22 }} />
                                </button>
                            ))}
                        </div>
                    </>
                )}

                {filteredQuick.length === 0 && filteredCustom.length === 0 && (
                    <div style={{ padding: 20, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                        No emojis found
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── User Search Component ───────────────────────────────────────────────────

interface UserSearchProps {
    onSelect: (userId: string, username: string) => void;
    excludeIds: Set<string>;
}

function UserSearch({ onSelect, excludeIds }: UserSearchProps): JSX.Element {
    const [query, setQuery] = React.useState("");
    const [results, setResults] = React.useState<{ id: string; name: string; globalName: string; }[]>([]);
    const [focused, setFocused] = React.useState(false);

    React.useEffect(() => {
        if (query.length < 1) { setResults([]); return; }
        const q = query.toLowerCase();
        try {
            // Search through all cached users
            const allUsers: any[] = [];
            // UserStore doesn't have a getAll, but we can iterate known users
            // from RelationshipStore, guild members, etc.
            // For simplicity, we search through RelationshipStore's friends
            const RelationshipStore = findStoreLazy("RelationshipStore") as any;
            const friendIds: string[] = RelationshipStore?.getFriendIDs?.() ?? [];
            for (const id of friendIds) {
                const u = UserStore.getUser(id) as any;
                if (u && !excludeIds.has(id)) {
                    const name = u.username ?? "";
                    const globalName = u.globalName ?? "";
                    if (name.toLowerCase().includes(q) || globalName.toLowerCase().includes(q)) {
                        allUsers.push({ id, name, globalName });
                    }
                }
            }
            // Also search GuildMemberStore for more users
            try {
                const GuildMemberStore = findStoreLazy("GuildMemberStore") as any;
                const allMemberIds = new Set<string>();
                // Get members from the current guild
                const guildIds: string[] = GuildMemberStore?.getGuildIds?.() ?? [];
                for (const gid of guildIds.slice(0, 3)) { // limit to 3 guilds for perf
                    const ids: string[] = GuildMemberStore.getMemberIds(gid) ?? [];
                    for (const id of ids) {
                        if (!allMemberIds.has(id) && !excludeIds.has(id)) {
                            allMemberIds.add(id);
                            const u = UserStore.getUser(id) as any;
                            if (u) {
                                const name = u.username ?? "";
                                const globalName = u.globalName ?? "";
                                if (name.toLowerCase().includes(q) || globalName.toLowerCase().includes(q)) {
                                    allUsers.push({ id, name, globalName });
                                }
                            }
                        }
                    }
                }
            } catch { }

            // Deduplicate by id
            const seen = new Set<string>();
            const deduped = allUsers.filter(u => {
                if (seen.has(u.id)) return false;
                seen.add(u.id);
                return true;
            });

            setResults(deduped.slice(0, 20));
        } catch { setResults([]); }
    }, [query, excludeIds]);

    return (
        <div style={{ position: "relative" }}>
            <input
                placeholder="Search users..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setTimeout(() => setFocused(false), 200)}
                style={{
                    width: "100%", boxSizing: "border-box",
                    background: "var(--input-background)",
                    border: "1px solid var(--background-modifier-accent)",
                    borderRadius: 4, color: "var(--text-normal)",
                    fontSize: 13, padding: "6px 10px", outline: "none",
                }}
            />
            {focused && results.length > 0 && (
                <div
                    style={{
                        position: "absolute", top: "100%", left: 0, right: 0, zIndex: 1000001,
                        background: "var(--background-floating)",
                        border: "1px solid var(--background-modifier-accent)",
                        borderRadius: 4, boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                        maxHeight: 200, overflowY: "auto", marginTop: 2,
                    }}
                >
                    {results.map(u => (
                        <button
                            key={u.id}
                            onMouseDown={() => { onSelect(u.id, u.globalName || u.name); setQuery(""); setResults([]); }}
                            style={{
                                display: "block", width: "100%", textAlign: "left",
                                padding: "6px 10px", background: "transparent",
                                border: "none", color: "var(--text-normal)",
                                fontSize: 13, cursor: "pointer",
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = "var(--background-modifier-hover)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                        >
                            {u.globalName || u.name}
                            <span style={{ color: "var(--text-muted)", marginLeft: 6, fontSize: 11 }}>
                                @{u.name}
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Settings Component ──────────────────────────────────────────────────────

function AutoReactSettings(): JSX.Element {
    const [pairs, setPairs] = React.useState<ReactPair[]>(() => parsePairs(settings.store.pairs));
    const [showEmojiPicker, setShowEmojiPicker] = React.useState<string | null>(null);
    const [emojiPickerPos, setEmojiPickerPos] = React.useState<{ x: number; y: number; }>({ x: 0, y: 0 });

    const excludeIds = new Set(pairs.map(p => p.userId));

    function updatePairs(newPairs: ReactPair[]) {
        setPairs(newPairs);
        settings.store.pairs = pairsToString(newPairs);
    }

    function addPair(userId: string, username: string) {
        // Don't add duplicate user entries — we'll add the user and let them pick emoji
        if (pairs.some(p => p.userId === userId)) return;
        updatePairs([...pairs, { userId, emoji: "😂" }]);
    }

    function removePair(index: number) {
        const newPairs = pairs.filter((_, i) => i !== index);
        updatePairs(newPairs);
    }

    function setEmoji(index: number, emoji: string) {
        const newPairs = [...pairs];
        newPairs[index] = { ...newPairs[index], emoji };
        updatePairs(newPairs);
        setShowEmojiPicker(null);
    }

    function getUserName(userId: string): string {
        const u = UserStore.getUser(userId) as any;
        return u?.globalName || u?.username || userId;
    }

    return (
        <div style={{ padding: "8px 0" }}>
            {/* Add new pair */}
            <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 6 }}>
                    Add User to Auto-React
                </div>
                <UserSearch onSelect={addPair} excludeIds={excludeIds} />
            </div>

            {/* Pair list */}
            {pairs.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 6 }}>
                        Configured Pairs ({pairs.length})
                    </div>
                    {pairs.map((pair, idx) => (
                        <div
                            key={`${pair.userId}-${idx}`}
                            style={{
                                display: "flex", alignItems: "center", gap: 6,
                                padding: "6px 8px", marginBottom: 4,
                                background: "var(--background-secondary)",
                                borderRadius: 6, border: "1px solid var(--background-modifier-accent)",
                            }}
                        >
                            {/* User info */}
                            <span style={{ flex: 1, fontSize: 13, color: "var(--text-normal)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {getUserName(pair.userId)}
                            </span>

                            {/* Emoji button */}
                            <button
                                onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setEmojiPickerPos({ x: rect.left, y: rect.top - 320 });
                                    setShowEmojiPicker(showEmojiPicker === pair.userId ? null : pair.userId);
                                }}
                                style={{
                                    width: 32, height: 32, fontSize: 18,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    background: "var(--background-modifier-hover)",
                                    border: "1px solid var(--background-modifier-accent)",
                                    borderRadius: 4, cursor: "pointer",
                                }}
                                title="Change emoji"
                            >
                                {pair.emoji.startsWith("<") ? "🖼" : pair.emoji}
                            </button>

                            {/* Remove button */}
                            <button
                                onClick={() => removePair(idx)}
                                style={{
                                    width: 24, height: 24, fontSize: 14,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    background: "transparent", border: "none",
                                    color: "var(--text-danger)", cursor: "pointer",
                                    borderRadius: 4,
                                }}
                                onMouseEnter={e => (e.currentTarget.style.background = "var(--background-modifier-hover)")}
                                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                                title="Remove"
                            >
                                ✕
                            </button>

                            {/* Emoji picker popout */}
                            {showEmojiPicker === pair.userId && (
                                <div
                                    style={{
                                        position: "fixed",
                                        left: emojiPickerPos.x,
                                        top: emojiPickerPos.y,
                                        zIndex: 1000002,
                                    }}
                                >
                                    <EmojiPicker
                                        onSelect={(emoji) => setEmoji(idx, emoji)}
                                        onClose={() => setShowEmojiPicker(null)}
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {pairs.length === 0 && (
                <div style={{ padding: "12px 0", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                    No pairs configured. Search for a user above to add them.
                </div>
            )}
        </div>
    );
}

// ─── Handler ─────────────────────────────────────────────────────────────────

let handler: ((data: { message: { author: { id: string; }; channel_id: string; id: string; }; channelId: string; }) => void) | null = null;

export default definePlugin({
    name: "AutoReact",
    description: "Automatically reacts with emojis to messages from specific users. Configure multiple user:emoji pairs.",
    authors: [doiksubDevs.god],
    tags: ["Sigil"],
    settings,
    settingsAboutComponent: AutoReactSettings,

    start() {
        handler = (data) => {
            const { pairs: rawPairs, delay, onlyDMs } = settings.store;
            if (!rawPairs) return;

            const msg = data.message;
            if (!msg || !msg.author) return;

            const pairs = parsePairs(rawPairs);
            const matching = pairs.filter(p => p.userId === msg.author.id);
            if (matching.length === 0) return;

            const channelId = msg.channel_id || data.channelId;
            if (!channelId) return;

            if (onlyDMs) {
                const channel = ChannelStore?.getChannel?.(channelId);
                if (channel && channel.type !== 1 && channel.type !== 3) return;
            }

            const delayMs = (delay ?? 1) * 1000;
            let offset = 0;
            for (const pair of matching) {
                setTimeout(() => {
                    RestAPI.put({
                        url: Constants.Endpoints.REACTION(channelId, msg.id, pair.emoji, "@me"),
                    }).catch((e: unknown) => {
                        logger.error("Failed to auto-react:", e);
                    });
                }, delayMs + offset);
                offset += 500;
            }
        };

        FluxDispatcher.subscribe("MESSAGE_CREATE", handler);
    },

    stop() {
        if (handler) {
            FluxDispatcher.unsubscribe("MESSAGE_CREATE", handler);
            handler = null;
        }
    },
});