/*
 * doiksub, a Discord client mod
 * Copyright (c) 2026 ghxst and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Logger } from "@utils/Logger";
import { PresenceStore } from "@webpack/common";

import { buildActivity, emitPresence, fakes } from "./store";

const logger = new Logger("FakeRPC");
const origs = new Map<string, Function>();

function fakeFor(userId: string) {
    const f = fakes.get(userId);
    return f ? buildActivity(f) : null;
}

function appendFake(userId: string, real: any[]): any[] {
    const fake = fakeFor(userId);
    if (!fake) return real;
    const rest = (real ?? []).filter(a => a?.id !== fake.id);
    return [fake, ...rest];
}

export function refreshPresence() {
    emitPresence();
}

export function patchStore() {
    const store = PresenceStore as any;
    const patch = (name: string, fn: (orig: Function) => Function) => {
        if (origs.has(name) || typeof store[name] !== "function") return;
        origs.set(name, store[name]);
        store[name] = fn(store[name].bind(store));
    };

    patch("getActivities", orig => function (userId: string, ...rest: any[]) {
        return appendFake(userId, orig(userId, ...rest) ?? []);
    });
    patch("getUnfilteredActivities", orig => function (userId: string, ...rest: any[]) {
        return appendFake(userId, orig(userId, ...rest) ?? []);
    });
    patch("getPrimaryActivity", orig => function (userId: string, ...rest: any[]) {
        return fakeFor(userId) ?? orig(userId, ...rest);
    });
    patch("findActivity", orig => function (userId: string, pred: (a: any) => boolean, ...rest: any[]) {
        const fake = fakeFor(userId);
        if (fake) {
            try {
                if (pred(fake)) return fake;
            } catch { return fake; }
        }
        return orig(userId, pred, ...rest);
    });
    patch("getStatus", orig => function (userId: string, ...rest: any[]) {
        return fakes.get(userId)?.status ?? orig(userId, ...rest);
    });
    patch("getState", orig => function (...args: any[]) {
        const state = orig(...args);
        if (!fakes.size) return state;
        try {
            // Never mutate the live store snapshot: getState returns the store's
            // own object, and writing the fake into it permanently poisons the
            // real presence (that's why Remove didn't work — the merged array
            // was already baked into the snapshot). Shallow-clone maps/arrays.
            const next = { ...state };
            if (state.activities) next.activities = { ...state.activities };
            if (state.filteredActivities) next.filteredActivities = { ...state.filteredActivities };
            if (state.statuses) next.statuses = { ...state.statuses };
            if (state.presencesForGuilds) {
                next.presencesForGuilds = { ...state.presencesForGuilds };
                for (const gid of Object.keys(next.presencesForGuilds)) {
                    const guild = next.presencesForGuilds[gid];
                    if (guild && Object.keys(guild).some(id => fakes.has(id))) {
                        next.presencesForGuilds[gid] = { ...guild };
                        for (const userId of fakes.keys()) {
                            if (guild[userId]) next.presencesForGuilds[gid][userId] = { ...guild[userId] };
                        }
                    }
                }
            }
            for (const userId of fakes.keys()) {
                const f = fakes.get(userId)!;
                const a = fakeFor(userId)!;
                if (next.activities) {
                    const rest = (next.activities[userId] ?? []).filter((x: any) => x?.id !== a.id);
                    next.activities[userId] = [a, ...rest];
                }
                if (next.filteredActivities) {
                    const rest = (next.filteredActivities[userId] ?? []).filter((x: any) => x?.id !== a.id);
                    next.filteredActivities[userId] = [a, ...rest];
                }
                if (next.statuses && f.status) next.statuses[userId] = f.status;
                for (const gid of Object.keys(next.presencesForGuilds ?? {})) {
                    const entry = next.presencesForGuilds[gid]?.[userId];
                    if (entry) {
                        entry.activities = [a, ...(entry.activities ?? []).filter((x: any) => x?.id !== a.id)];
                        if (f.status) entry.status = f.status;
                    }
                }
            }
            return next;
        } catch (e) {
            logger.error("getState patch failed:", e);
        }
        return state;
    });
}

export function unpatchStore() {
    const store = PresenceStore as any;
    for (const [name, orig] of origs) store[name] = orig;
    origs.clear();
}
