/*
 * doiksub, a Discord client mod
 * Copyright (c) 2026 ghxst and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { get as dsGet, set as dsSet } from "@api/DataStore";
import { addProfileBadge, BadgePosition, removeProfileBadge } from "@api/Badges";
import { definePluginSettings } from "@api/Settings";
import { doiksubDevs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { FluxDispatcher, UserStore } from "@webpack/common";

const DS_BADGE_KEY = "FakeTag_badgeUrl";

let originalGetCurrentUser: (() => ReturnType<typeof UserStore.getCurrentUser>) | null = null;
let originalGetUser: ((id: string) => ReturnType<typeof UserStore.getUser>) | null = null;
let cachedBadgeUrl: string = "";
let blobUrl: string | null = null;
let registeredBadge: ReturnType<typeof buildBadge> | null = null;

const settings = definePluginSettings({
    enabled: {
        type: OptionType.BOOLEAN,
        description: "Show the fake tag and badge next to your name.",
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
    badgeUrl: {
        type: OptionType.STRING,
        description: "Badge image URL (emoji CDN, direct link, etc.).",
        default: "",
        onChange() {
            if (settings.store.enabled) refreshBadge();
        },
    },
});

async function loadBadge() {
    cachedBadgeUrl = (await dsGet<string>(DS_BADGE_KEY)) ?? "";
}

async function saveBadge(url: string) {
    cachedBadgeUrl = url;
    await dsSet(DS_BADGE_KEY, url);
}

async function resolveBlob(url: string): Promise<string | null> {
    if (!url.trim()) return null;
    try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const blob = await res.blob();
        if (blobUrl) URL.revokeObjectURL(blobUrl);
        blobUrl = URL.createObjectURL(blob);
        return blobUrl;
    } catch {
        return null;
    }
}

async function refreshBlob() {
    const iconSrc = blobUrl ?? await resolveBlob(cachedBadgeUrl);
    if (!iconSrc) return;
    if (!settings.store.enabled) return;
    removePatch();
    applyPatch(iconSrc);
    notifyUpdate();
}

function buildBadge(iconSrc: string) {
    const { tag } = settings.store;
    if (!tag.trim()) return null;

    return {
        id: "doiksub_faketag_badge",
        iconSrc,
        description: tag.trim().slice(0, 5).toUpperCase(),
        position: BadgePosition.END,
        shouldShow: ({ userId }) => {
            const myId = originalGetCurrentUser?.()?.id ?? UserStore.getCurrentUser()?.id;
            return userId === myId;
        },
    };
}

function applyPatch(iconSrc?: string) {
    if (originalGetCurrentUser) return;

    originalGetCurrentUser = UserStore.getCurrentUser.bind(UserStore);
    originalGetUser = (UserStore as any).getUser.bind(UserStore);

    const src = iconSrc ?? blobUrl;
    const badge = src ? buildBadge(src) : null;
    if (badge) {
        registeredBadge = badge;
        addProfileBadge(badge);
    }

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

    if (registeredBadge) {
        removeProfileBadge(registeredBadge);
        registeredBadge = null;
    }

    (UserStore as any).getCurrentUser = originalGetCurrentUser;
    (UserStore as any).getUser = originalGetUser;
    originalGetCurrentUser = null;
    originalGetUser = null;
    notifyUpdate();
}

function wrapUser(user: any) {
    const { tag } = settings.store;
    if (!tag.trim()) return user;
    const wrapped = Object.create(Object.getPrototypeOf(user));
    for (const key of Object.getOwnPropertyNames(user)) {
        const desc = Object.getOwnPropertyDescriptor(user, key);
        if (desc) Object.defineProperty(wrapped, key, desc);
    }
    wrapped.primaryGuild = {
        tag: tag.trim().slice(0, 5).toUpperCase(),
        badge: null,
        identityEnabled: true,
        identityGuildId: "0",
    };
    return wrapped;
}

function getMyId() {
    return originalGetCurrentUser?.()?.id ?? UserStore.getCurrentUser()?.id;
}

function notifyUpdate() {
    try {
        const me = originalGetCurrentUser?.() ?? UserStore.getCurrentUser();
        if (me) FluxDispatcher.dispatch({ type: "USER_UPDATE", user: me });
    } catch { }
}

async function refreshBadge() {
    await refreshBlob();
}

export default definePlugin({
    name: "FakeTag",
    description: "Adds a fake clan tag and custom badge next to your username.",
    tags: ["Sigil"],
    authors: [doiksubDevs.ghxst],
    settings,

    async start() {
        await loadBadge();
        await refreshBlob();
    },

    stop() {
        removePatch();
        if (blobUrl) {
            URL.revokeObjectURL(blobUrl);
            blobUrl = null;
        }
    },
});