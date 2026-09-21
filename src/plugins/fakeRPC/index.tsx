/*
 * doiksub, a Discord client mod
 * Copyright (c) 2026 ghxst and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { NavContextMenuPatchCallback } from "@api/ContextMenu";
import { doiksubDevs } from "@utils/constants";
import { openModal } from "@utils/modal";
import definePlugin from "@utils/types";
import type { User } from "@vencord/discord-types";
import { Menu, UserStore } from "@webpack/common";

import { FakeRpcModal } from "./modal";
import { patchStore, unpatchStore } from "./patch";
import { fakes, load, refreshImages } from "./store";

const userContextPatch: NavContextMenuPatchCallback = (children, { user }: { user: User; }) => {
    if (!user?.id) return;
    const fullUser = UserStore.getUser(user.id) ?? user;
    children.push(
        <Menu.MenuItem
            key="fakerpc"
            id="fakerpc-edit"
            label={fakes.has(user.id) ? "Edit Fake RPC" : "Fake RPC"}
            action={() => openModal(props => (
                <FakeRpcModal modalProps={props} user={fullUser} existing={fakes.get(user.id)} />
            ))}
        />
    );
};

export default definePlugin({
    name: "FakeRPC",
    description: "Right-click any user to put a fake game / rich presence on their profile. Also allows for changing presence.",
    authors: [doiksubDevs.sqz],
    tags: ["Sigil"],
    enabledByDefault: true,

    contextMenus: {
        "user-context": userContextPatch,
    },

    async start() {
        await load();
        patchStore();
        for (const userId of fakes.keys()) {
            try { await refreshImages(userId); } catch { }
        }
    },

    stop() {
        unpatchStore();
        fakes.clear();
    },
});
