/*
 * doiksub, a Discord client mod
 * Copyright (c) 2026 ghxst and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { get as dsGet, set as dsSet } from "@api/DataStore";
import { Logger } from "@utils/Logger";
import type { Activity } from "@vencord/discord-types";
import { ActivityType } from "@vencord/discord-types/enums";
import { ApplicationAssetUtils, PresenceStore } from "@webpack/common";

const logger = new Logger("FakeRPC");
const DS_KEY = "FakeRPC_state";

export type FakeStatus = "online" | "idle" | "dnd" | "offline";

export interface FakeRpc {
    userId: string;
    name: string;
    type: number;
    appId?: string;
    details?: string;
    state?: string;
    largeImage?: string;
    largeText?: string;
    smallImage?: string;
    smallText?: string;
    status?: FakeStatus;
}

export const fakes = new Map<string, FakeRpc>();

export async function persist() {
    try {
        await dsSet(DS_KEY, [...fakes.values()]);
    } catch (e) {
        logger.error("persist failed:", e);
    }
}

export async function load() {
    try {
        const stored = await dsGet<FakeRpc[]>(DS_KEY);
        if (Array.isArray(stored)) for (const f of stored) fakes.set(f.userId, f);
    } catch (e) {
        logger.error("load failed:", e);
    }
}

export function emitPresence() {
    // Never dispatch a synthetic PRESENCE_UPDATE here: a payload without
    // activities/status makes the store wipe the user's real presence
    // (which is why other RPCs disappeared). The patched getters merge the
    // fake in on read, so emitting a change is all views need to re-render.
    try {
        (PresenceStore as any).emitChange?.();
    } catch { }
}

// How CustomRPC does it: image inputs are Discord app asset *keys*, resolved
// to asset ids via fetchAssetIds(appId, [key]) at save time. Raw https URLs
// are passed through untouched — Discord's client only renders them when the
// gateway's activity object carries an `mp:` ref, which only happens for
// activities that actually came over the socket. Since our fake is
// client-side, raw URLs can't be proxied reliably, so:
//   - asset keys (+ app ID) -> resolved id, works like CustomRPC
//   - https URLs -> passed through as-is; render if the client can, else text only
//   - cdn.discordapp.com / media.discordapp.net URLs -> refused with a hint
//     (CustomRPC's own validator says: "Don't use a Discord link. Use an
//     Imgur image link instead." — Discord CDN links 404 as activity assets).
const IMAGEABLE_HOSTS = /https?:\/\/(cdn|media)\.discordapp\.(com|net)\//i;

export function imageHint(raw?: string): string | null {
    if (raw && IMAGEABLE_HOSTS.test(raw.trim())) {
        return "That Discord CDN link won't render as an activity image (Discord returns 404 for it). Re-upload it to Imgur and paste the i.imgur.com link instead.";
    }
    return null;
}

export async function resolveImage(appId: string | undefined, raw: string | undefined): Promise<string | undefined> {
    const v = raw?.trim();
    if (!v) return undefined;
    if (/^https?:\/\//i.test(v)) return v;
    if (!appId?.trim()) return v;
    try {
        const [id] = await ApplicationAssetUtils.fetchAssetIds(appId.trim(), [v]);
        return id || v;
    } catch (e) {
        logger.error("fetchAssetIds failed:", e);
        return v;
    }
}

export interface ResolvedImages { large?: string; small?: string; }

// image url -> resolved asset id, so the async fetchAssetIds only runs on save.
const resolvedImages = new Map<string, ResolvedImages>();

export async function refreshImages(userId: string) {
    const f = fakes.get(userId);
    if (!f) {
        resolvedImages.delete(userId);
        return;
    }
    const [large, small] = await Promise.all([
        resolveImage(f.appId, f.largeImage),
        resolveImage(f.appId, f.smallImage),
    ]);
    resolvedImages.set(userId, { large, small });
}

export function clearImages(userId: string) {
    resolvedImages.delete(userId);
}

export function buildActivity(f: FakeRpc): Activity {
    const resolved = resolvedImages.get(f.userId);
    const activity: Activity = {
        id: `fakerpc:${f.userId}`,
        application_id: f.appId?.trim() || "0",
        name: f.name.trim() || "Fake Game",
        type: f.type as ActivityType,
        flags: 0,
        created_at: Date.now(),
    };
    if (f.details?.trim()) activity.details = f.details.trim();
    if (f.state?.trim()) activity.state = f.state.trim();
    const large = resolved?.large ?? f.largeImage?.trim() ?? undefined;
    const small = resolved?.small ?? f.smallImage?.trim() ?? undefined;
    if (large || small) {
        activity.assets = {};
        if (large) {
            activity.assets.large_image = large;
            if (f.largeText?.trim()) activity.assets.large_text = f.largeText.trim();
        }
        if (small) {
            activity.assets.small_image = small;
            if (f.smallText?.trim()) activity.assets.small_text = f.smallText.trim();
        }
    }
    if (f.type === ActivityType.STREAMING) {
        (activity as any).url = "https://twitch.tv/fakerpc";
    } else {
        activity.timestamps = { start: Date.now() };
    }
    return activity;
}
