/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// oddy: add gradient support instead of just solid colors. will require having to dissect the css variables in discord but fuck it we ball

import "./clientTheme.css";

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType, StartAt } from "@utils/types";

import { ResetThemeColorComponent, ThemeSettingsComponent } from "./components/Settings";
import { disableClientTheme, startClientTheme } from "./utils/styleUtils";

export const settings = definePluginSettings({
    color: {
        type: OptionType.COMPONENT,
        default: "313338",
        component: ThemeSettingsComponent
    },
    gradient: {
        type: OptionType.BOOLEAN,
        description: "Animate the theme color through a shifting gradient",
        default: false,
        restartNeeded: false,
        hidden: true
    },
    resetColor: {
        type: OptionType.COMPONENT,
        component: ResetThemeColorComponent
    }
});

export default definePlugin({
    name: "ClientTheme",
    authors: [Devs.Nuckyz],
    description: "Recreation of the old client theme experiment. Add a color to your Discord client theme",
    tags: ["Appearance", "Customisation"],
    settings,

    startAt: StartAt.DOMContentLoaded,
    start: () => startClientTheme(settings.store.color, settings.store.gradient),
    stop: disableClientTheme
});
