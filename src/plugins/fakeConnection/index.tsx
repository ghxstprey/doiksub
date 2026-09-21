/*
 * doiksub, a Vencord fork
 * Copyright (c) 2026 (Vendicated|ghxst) and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { get as dsGet, set as dsSet } from "@api/DataStore";
import { definePluginSettings } from "@api/Settings";
import { Button } from "@components/Button";
import { doiksubDevs } from "@utils/constants";
import { Logger } from "@utils/Logger";
import definePlugin, { OptionType } from "@utils/types";
import { FluxDispatcher,React, SearchableSelect, showToast, TextInput, Toasts, UserStore } from "@webpack/common";

const logger = new Logger("FakeConnections");

// patch for discord ptb, MIGHT break on other vers
function onDispatch(action: any) {
    if (action.type !== "USER_PROFILE_FETCH_SUCCESS") return;

    const prof = action.userProfile ?? action.profile;
    const myId = UserStore.getCurrentUser()?.id;
    const profileId = prof?.userId ?? prof?.id ?? action.userId;
    if (!prof || !myId || profileId !== myId || !_cache.length) return;

    const fakes = _cache.map(c => ({
        type: c.type,
        id: c.uid,
        name: c.name,
    }));

    const existing = prof.connectedAccounts ?? [];
    if (!existing.some((a: any) => String(a.id).startsWith("fc-"))) {
        prof.connectedAccounts = [...existing, ...fakes];
    }

    if (Array.isArray(prof.connections) && !prof.connections.some((a: any) => String(a.id).startsWith("fc-"))) {
        prof.connections = [...prof.connections, ...fakes];
    }
}

interface FakeConnection {
    uid: string;
    type: string;
    name: string;
    url: string;
}

const DS_KEY = "FakeConnections";
let _cache: FakeConnection[] = [];
let _cacheLoaded = false;

async function loadConnections(): Promise<FakeConnection[]> {
    const stored = await dsGet<FakeConnection[]>(DS_KEY);
    _cache = stored ?? [];
    _cacheLoaded = true;
    return _cache;
}
async function saveConnections(list: FakeConnection[]) {
    _cache = list;
    await dsSet(DS_KEY, list);
}

const PLATFORM_OPTIONS = [
    { label: "YouTube", value: "youtube" },
    { label: "Twitch", value: "twitch" },
    { label: "Twitter / X", value: "twitter" },
    { label: "GitHub", value: "github" },
    { label: "Steam", value: "steam" },
    { label: "Spotify", value: "spotify" },
    { label: "Reddit", value: "reddit" },
    { label: "TikTok", value: "tiktok" },
    { label: "Instagram", value: "instagram" },
    { label: "Roblox", value: "roblox" },
    { label: "Facebook", value: "facebook" },
    { label: "Xbox", value: "xbox" },
    { label: "PlayStation", value: "playstation" },
    { label: "Epic Games", value: "epicgames" },
    { label: "Battle.net", value: "battlenet" },
    { label: "League of Legends", value: "leagueoflegends" },
    { label: "Riot Games", value: "riotgames" },
    { label: "SoundCloud", value: "soundcloud" },
    { label: "Bluesky", value: "bluesky" },
    { label: "Mastodon", value: "mastodon" },
    { label: "Crunchyroll", value: "crunchyroll" },
    { label: "Domain", value: "domain" },
];

const PLATFORM_COLORS: Record<string, string> = {
    youtube: "#FF0000",
    twitch: "#9146FF",
    twitter: "#1D9BF0",
    github: "#57606A",
    steam: "#66C0F4",
    spotify: "#1DB954",
    reddit: "#FF4500",
    tiktok: "#FE2C55",
    instagram: "#E1306C",
    roblox: "#00A2FF",
    facebook: "#1877F2",
    xbox: "#107C10",
    playstation: "#0070D1",
    epicgames: "#313131",
    battlenet: "#1487C8",
    leagueoflegends: "#C89B3C",
    riotgames: "#D13639",
    soundcloud: "#FF5500",
    bluesky: "#1185FE",
    mastodon: "#6364FF",
    crunchyroll: "#F47521",
    domain: "#5865F2",
};

function getPlatformLabel(type: string) {
    return PLATFORM_OPTIONS.find(o => o.value === type)?.label ?? type;
}

function FakeConnectionsPanel() {
    const [list, setList] = React.useState<FakeConnection[]>([]);
    const [pending, setPending] = React.useState<FakeConnection[]>([]);
    const [selType, setSelType] = React.useState("youtube");
    const [name, setName] = React.useState("");
    const [url, setUrl] = React.useState("");
    const [dirty, setDirty] = React.useState(false);
    const [loaded, setLoaded] = React.useState(false);

    React.useEffect(() => {
        loadConnections().then(d => { setList(d); setPending([...d]); setLoaded(true); });
    }, []);

    function update(u: FakeConnection[]) { setPending(u); setDirty(true); }

    async function save() {
        await saveConnections(pending);
        setList([...pending]);
        setDirty(false);
        showToast("Saved! Reopen your profile to see connections.", Toasts.Type.SUCCESS);
    }

    if (!loaded) return <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Loading...</div>;

    return (
        <div className="vc-fc-settings">

            <div className="vc-fc-note">
                Stored in Discord's files. All local, basically.<br />
            </div>

            {dirty && (
                <div className="vc-fc-banner">
                    <span>Unsaved changes</span>
                    <div style={{ display: "flex", gap: 8 }}>
                        <Button variant="primary" size="small" onClick={save}>Save</Button>
                        <Button variant="dangerPrimary" size="small" onClick={() => { setPending([...list]); setDirty(false); }}>Discard</Button>
                    </div>
                </div>
            )}

            <div>
                <div className="vc-fc-label">Your Connections</div>
                {pending.length === 0
                    ? <div className="vc-fc-empty">No connections yet. Add one below.</div>
                    : pending.map(c => (
                        <div key={c.uid} className="vc-fc-card">
                            <span
                                className="vc-fc-chip"
                                style={{ background: PLATFORM_COLORS[c.type] ?? "#5865F2" }}
                            >
                                {getPlatformLabel(c.type)[0]}
                            </span>
                            <div className="vc-fc-card-text">
                                <span className="vc-fc-card-name">{c.name}</span>
                                <span className="vc-fc-card-platform">{getPlatformLabel(c.type)}{c.url ? " · linked" : ""}</span>
                            </div>
                            <Button
                                variant="dangerSecondary"
                                size="small"
                                onClick={() => update(pending.filter(x => x.uid !== c.uid))}
                                style={{ flexShrink: 0 }}
                            >
                                Remove
                            </Button>
                        </div>
                    ))
                }
            </div>

            <div className="vc-fc-divider" />

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div className="vc-fc-label">Add Connection</div>

                <div>
                    <label className="vc-fc-field-label">Platform</label>
                    <SearchableSelect
                        options={PLATFORM_OPTIONS}
                        value={PLATFORM_OPTIONS.find(o => o.value === selType)?.value}
                        placeholder="Select a platform..."
                        maxVisibleItems={8}
                        onChange={(v: string) => setSelType(v)}
                    />
                </div>

                <div>
                    <label className="vc-fc-field-label">Display Name</label>
                    <TextInput value={name} onChange={setName} placeholder="e.g. YourUsername" />
                </div>

                <Button
                    variant="primary"
                    size="medium"
                    disabled={!name.trim() || !selType}
                    onClick={() => {
                        const t = name.trim();
                        if (!t) return;
                        update([...pending, {
                            uid: `fc-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                            type: selType,
                            name: t,
                            url: url.trim(),
                        }]);
                        setName("");
                        setUrl("");
                    }}
                >
                    Add to list
                </Button>
            </div>

            <div className="vc-fc-divider" />

            <Button
                variant="positive"
                size="medium"
                disabled={!dirty}
                onClick={save}
            >
                Save Connections
            </Button>

            <div className="vc-fc-footer-hint">
                After saving, reopen your profile to see the connections.
            </div>
        </div>
    );
}

const settings = definePluginSettings({
    _panel: {
        type: OptionType.COMPONENT,
        description: "",
        component: FakeConnectionsPanel,
    }
});

export default definePlugin({
    name: "FakeConnections",
    description: "Add fake connections to your own profile. They render natively in your profile modal and popout.",
    authors: [doiksubDevs.ghxst],
    tags: ["Sigil"],
    settings,

    patches: [
        {
            find: "UserProfileStore",
            replacement: {
                match: /(?<=getUserProfile\(\i\){return )(.+?)(?=})/,
                replace: "$self.addFakeConnections($1)"
            },
        },
    ],

    async start() {
        await loadConnections();
        FluxDispatcher.addInterceptor(onDispatch);
    },

    stop() {
        FluxDispatcher.removeInterceptor(onDispatch);
    },

    addFakeConnections(user: any) {
        try {
            const myId = UserStore.getCurrentUser()?.id;
            if (!user || !myId || !_cache.length) return user;

            if (Array.isArray(user.connectedAccounts) && user.connectedAccounts.some((a: any) => String(a.id).startsWith("fc-"))) {
                return user;
            }

            const profileId = user.userId ?? user.id;
            if (profileId !== myId) return user;
            return {
                ...user,
                connectedAccounts: [
                    ...(user.connectedAccounts ?? []),
                    ..._cache.map(c => ({ type: c.type, id: c.uid, name: c.name })),
                ],
            };
        } catch (e) {
            logger.error("addFakeConnections crashed:", e);
            return user;
        }
    },
});
