/*
 * doiksub, a Discord client mod
 * Copyright (c) 2026 ghxst and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { User } from "@vencord/discord-types";
import { Button, React, SearchableSelect, TextInput } from "@webpack/common";
import { ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalRoot } from "@utils/modal";

import { clearImages, emitPresence, fakes, imageHint, persist, refreshImages, type FakeRpc } from "./store";
import { refreshPresence } from "./patch";

export const TYPE_OPTIONS = [
    { label: "Playing", value: "0" },
    { label: "Streaming", value: "1" },
    { label: "Listening to", value: "2" },
    { label: "Watching", value: "3" },
    { label: "Competing in", value: "5" },
];

export const STATUS_OPTIONS = [
    { label: "Don't override", value: "" },
    { label: "Online", value: "online" },
    { label: "Idle", value: "idle" },
    { label: "Do Not Disturb", value: "dnd" },
    { label: "Offline", value: "offline" },
];

function Field({ label, value, set, placeholder }: { label: string; value: string; set: (v: string) => void; placeholder?: string; }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>{label}</label>
            <TextInput value={value} onChange={set} placeholder={placeholder} />
        </div>
    );
}

export function FakeRpcModal({ modalProps, user, existing }: { modalProps: any; user: User; existing?: FakeRpc; }) {
    const [name, setName] = React.useState(existing?.name ?? "");
    const [type, setType] = React.useState(String(existing?.type ?? 0));
    const [appId, setAppId] = React.useState(existing?.appId ?? "");
    const [details, setDetails] = React.useState(existing?.details ?? "");
    const [state, setState] = React.useState(existing?.state ?? "");
    const [largeImage, setLargeImage] = React.useState(existing?.largeImage ?? "");
    const [largeText, setLargeText] = React.useState(existing?.largeText ?? "");
    const [smallImage, setSmallImage] = React.useState(existing?.smallImage ?? "");
    const [smallText, setSmallText] = React.useState(existing?.smallText ?? "");
    const [status, setStatus] = React.useState(existing?.status ?? "");
    const displayName = (user as any).globalName ?? user.username;

    const largeHint = imageHint(largeImage);
    const smallHint = imageHint(smallImage);

    async function save() {
        fakes.set(user.id, {
            userId: user.id,
            name: name.trim() || "Fake Game",
            type: Number(type),
            appId: appId.trim() || undefined,
            details: details.trim() || undefined,
            state: state.trim() || undefined,
            largeImage: largeImage.trim() || undefined,
            largeText: largeText.trim() || undefined,
            smallImage: smallImage.trim() || undefined,
            smallText: smallText.trim() || undefined,
            status: (status || undefined) as FakeRpc["status"],
        });
        await persist();
        await refreshImages(user.id);
        refreshPresence();
        modalProps.onClose();
    }

    async function clear() {
        fakes.delete(user.id);
        clearImages(user.id);
        await persist();
        refreshPresence();
        modalProps.onClose();
    }

    function Hint({ text }: { text: string | null; }) {
        if (!text) return null;
        return <div style={{ fontSize: 12, color: "var(--text-warning, #e0a030)" }}>{text}</div>;
    }

    return (
        <ModalRoot {...modalProps}>
            <ModalHeader>
                <div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>Fake RPC for {displayName}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Only visible to you. Reopen the profile to see it.</div>
                </div>
                <ModalCloseButton onClick={modalProps.onClose} />
            </ModalHeader>
            <ModalContent>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <Field label="Game / App name" value={name} set={setName} placeholder="e.g. Minecraft" />
                    <Field label="Application ID (for asset keys)" value={appId} set={setAppId} placeholder="Discord app ID, only needed for asset keys" />
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>Type</label>
                        <SearchableSelect options={TYPE_OPTIONS} value={type} onChange={setType} />
                    </div>
                    <Field label="Details (line 2)" value={details} set={setDetails} placeholder="e.g. In a match" />
                    <Field label="State (line 3)" value={state} set={setState} placeholder="e.g. Solo queue" />
                    <Field label="Large image (URL or asset key)" value={largeImage} set={setLargeImage} placeholder="i.imgur.com link or asset key" />
                    <Hint text={largeHint} />
                    <Field label="Large image tooltip" value={largeText} set={setLargeText} placeholder="Hover text" />
                    <Field label="Small image (URL or asset key)" value={smallImage} set={setSmallImage} placeholder="i.imgur.com link or asset key" />
                    <Hint text={smallHint} />
                    <Field label="Small image tooltip" value={smallText} set={setSmallText} placeholder="Hover text" />
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>Status override</label>
                        <SearchableSelect options={STATUS_OPTIONS} value={status} onChange={setStatus} />
                    </div>
                </div>
            </ModalContent>
            <ModalFooter>
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", width: "100%" }}>
                    {existing && <Button variant="dangerSecondary" onClick={clear}>Remove</Button>}
                    <Button variant="primary" onClick={save} disabled={!name.trim()}>Save</Button>
                </div>
            </ModalFooter>
        </ModalRoot>
    );
}
