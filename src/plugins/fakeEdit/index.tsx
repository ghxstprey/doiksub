/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { Menu, MessageActions, React } from "@webpack/common";

export default definePlugin({
    name: "FakeEdit",
    description: "Fake edit messages by adding a zero-width space.",
    authors: [{ name: "yungpharaoh", id: 1136337246631497849n }],
    dependencies: ["ContextMenuAPI"],

    contextMenus: {
        "message"(children, { message }) {
            if (!message || message.state === "SENDING") return;

            children.push(
                <Menu.MenuGroup>
                    <Menu.MenuItem
                        id="fake-edit"
                        label="Fake Edit"
                        action={() => {
                            MessageActions.editMessage(
                                message.channel_id,
                                message.id,
                                { content: message.content + "\u200b" }
                            );
                        }}
                    />
                </Menu.MenuGroup>
            );
        }
    },

    start() {
        // No-op, contextMenu is declarative
    },

    stop() {
        // No-op
    }
});
