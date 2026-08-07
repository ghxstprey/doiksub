/*
 * doiksub, a Discord client mod
 * Copyright (c) 2026 ghxst and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { doiksubDevs } from "@utils/constants";
import definePlugin from "@utils/types";

import style from "./style.css?managed";

export default definePlugin({
    name: "NoBadges",
    description: "Removes all badges from user profiles.",
    tags: ["Sigil"],
    authors: [doiksubDevs.ghxst],
    managedStyle: style,

    patches: [
        {
            // Patch getBadges() to return an empty array, removing all native Discord
            // badges (Staff, Partner, HypeSquad, Bug Hunter, Nitro, Boost, etc.).
            // Using `new Array` instead of `[]` prevents the BadgeAPI patch from
            // re-matching its `return[` regex and re-injecting custom badges.
            find: "getLegacyUsername(){",
            replacement: {
                match: /getBadges\(\)\{.{0,200}?return\[[^\]]*\]\s*\}/,
                replace: "getBadges(){return new Array}"
            }
        }
    ],
});