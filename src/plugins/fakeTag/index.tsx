/*
 * Endcord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { get as dsGet, set as dsSet } from "@api/DataStore";
import { definePluginSettings } from "@api/Settings";
import { doiksubDevs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { FluxDispatcher, React, UserStore } from "@webpack/common";

const DS_BADGE_KEY = "FakeTag_badgeEmojiId";

let originalGetCurrentUser: (() => ReturnType<typeof UserStore.getCurrentUser>) | null = null;
let originalGetUser: ((id: string) => ReturnType<typeof UserStore.getUser>) | null = null;
let cachedBadgeEmojiId: string = "";
let cachedBadgeDataUrl: string = "";

const settings = definePluginSettings({
    enabled: {
        type: OptionType.BOOLEAN,
        description: "Show the fake tag next to your name.",
        default: false,
        onChange(v: boolean) {
            if (v) applyPatch(); else removePatch();
        },
    },
    tag: {
        type: OptionType.STRING,
        description: "Tag text (up to 5 chars, auto-uppercased).",
        default: "MALL",
        onChange() {
            if (settings.store.enabled) notifyUpdate();
        },
    },
    _badgeUrlInput: {
        type: OptionType.COMPONENT,
        description: "",
        component: BadgeUrlInput,
    },
});

async function loadBadge() {
    const stored = await dsGet<string>(DS_BADGE_KEY);
    cachedBadgeEmojiId = stored ?? "";
    if (cachedBadgeEmojiId) {
        cachedBadgeDataUrl = await fetchEmojiAsDataUrl(cachedBadgeEmojiId);
    }
}

async function saveBadge(emojiId: string) {
    cachedBadgeEmojiId = emojiId;
    await dsSet(DS_BADGE_KEY, emojiId);
    if (emojiId) {
        cachedBadgeDataUrl = await fetchEmojiAsDataUrl(emojiId);
    } else {
        cachedBadgeDataUrl = "";
    }
}

async function fetchEmojiAsDataUrl(emojiId: string): Promise<string> {
    try {
        const response = await fetch(`https://cdn.discordapp.com/emojis/${emojiId}.png?size=128`);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch {
        return "";
    }
}

function buildFakePrimaryGuild() {
    const { tag } = settings.store;
    if (!tag.trim()) return null;
    const badge = cachedBadgeDataUrl || null;
    return {
        tag: tag.trim().slice(0, 5).toUpperCase(),
        badge,
        identityEnabled: true,
        identityGuildId: "0",
    };
}

function wrapUser(user: any) {
    const fake = buildFakePrimaryGuild();
    if (!fake) return user;
    const wrapped = Object.create(Object.getPrototypeOf(user));
    for (const key of Object.getOwnPropertyNames(user)) {
        const desc = Object.getOwnPropertyDescriptor(user, key);
        if (desc) Object.defineProperty(wrapped, key, desc);
    }
    wrapped.primaryGuild = fake;
    return wrapped;
}

function getMyId() {
    return originalGetCurrentUser?.()?.id ?? UserStore.getCurrentUser()?.id;
}

function applyPatch() {
    if (originalGetCurrentUser) return;
    originalGetCurrentUser = UserStore.getCurrentUser.bind(UserStore);
    originalGetUser = (UserStore as any).getUser.bind(UserStore);

    (UserStore as any).getCurrentUser = function () {
        const user = originalGetCurrentUser!();
        if (!user) return user;
        return wrapUser(user);
    };

    (UserStore as any).getUser = function (id: string) {
        const user = originalGetUser!(id);
        if (!user || id !== getMyId()) return user;
        return wrapUser(user);
    };

    notifyUpdate();
}

function removePatch() {
    if (!originalGetCurrentUser) return;
    (UserStore as any).getCurrentUser = originalGetCurrentUser;
    (UserStore as any).getUser = originalGetUser;
    originalGetCurrentUser = null;
    originalGetUser = null;
    notifyUpdate();
}

function notifyUpdate() {
    try {
        const me = originalGetCurrentUser?.() ?? UserStore.getCurrentUser();
        if (me) FluxDispatcher.dispatch({ type: "USER_UPDATE", user: me });
    } catch { }
}

function BadgeUrlInput() {
    const [inputValue, setInputValue] = React.useState<string>(cachedBadgeEmojiId || "");
    const [previewDataUrl, setPreviewDataUrl] = React.useState<string>(cachedBadgeDataUrl);

    async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const value = e.target.value.trim();
        setInputValue(value);
        await saveBadge(value);
        if (value) {
            const dataUrl = await fetchEmojiAsDataUrl(value);
            setPreviewDataUrl(dataUrl);
        } else {
            setPreviewDataUrl("");
        }
        if (settings.store.enabled) notifyUpdate();
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 12, color: "var(--header-secondary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Badge Emoji ID
            </div>
            <input
                type="text"
                value={inputValue}
                onChange={handleChange}
                placeholder="Enter emoji ID (e.g. ea76d37bcd6f1b0543efcce6c32fe999)"
                style={{
                    padding: "8px 12px",
                    borderRadius: 4,
                    border: "1px solid var(--background-modifier-accent)",
                    background: "var(--background-secondary)",
                    color: "var(--text-normal)",
                    fontSize: 13,
                    width: "100%",
                    boxSizing: "border-box",
                }}
            />
            {previewDataUrl && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <img
                        src={previewDataUrl}
                        alt="badge preview"
                        width={24}
                        height={24}
                        style={{ borderRadius: 2 }}
                    />
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        Preview
                    </span>
                </div>
            )}
        </div>
    );
}

export default definePlugin({
    name: "FakeTag",
    description: "Adds a fake clan tag and badge emoji next to your username. The emoji's are lwk broken rn sorry.",
    tags: ["Sigil"],
    authors: [doiksubDevs.ghxst],
    settings,

    async start() {
        await loadBadge();
        if (settings.store.enabled) applyPatch();
    },

    stop() {
        removePatch();
    },
});
