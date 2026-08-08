/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Notice } from "@components/Notice";
import { doiksubDevs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { UserStore } from "@webpack/common";

const settings = definePluginSettings({
    platform: {
        type: OptionType.SELECT,
        description: "What platform to show up as on",
        restartNeeded: true,
        options: [
            {
                label: "Desktop",
                value: "desktop",
            },
            {
                label: "Web",
                value: "web",
            },
            {
                label: "Mobile",
                value: "mobile",
                default: true,
            },
            {
                label: "Console",
                value: "console",
            },
        ]
    }
});

export default definePlugin({
    name: "PlatformSpoofer",
    description: "Spoof what platform or device you're on (default: mobile)",
    tags: ["Utility", "Sigil"],
    authors: [{ name: "dragalt_", id: 1189903210564038697n }, { name: "neoarz", id: 218675193592283137n }, doiksubDevs.ghxst],
    enabledByDefault: true,
    settings: settings,
    patches: [
        {
            find: "_doIdentify(){",
            replacement: [
                {
                    match: /window._ws=null,null!=\i/,
                    replace: "false"
                },
                {
                    match: /(?<="GatewaySocket"\)\}\),properties:)(\i)/,
                    replace: "{...$1,...$self.getPlatform(true)}"
                },
            ]
        }
    ],
    getPlatform(bypass, userId?: any) {
        const platform = settings.store.platform ?? "mobile";

        if (bypass || userId === UserStore.getCurrentUser().id) {
            switch (platform) {
                case "desktop":
                    return { browser: "Discord Client" };
                case "web":
                    return { browser: "Discord Web" };
                case "mobile":
                    return { browser: "Discord iOS" };
                case "console":
                    return { browser: "Discord Console" };
                default:
                    return null;
            }
        }

        return null;
    }
});