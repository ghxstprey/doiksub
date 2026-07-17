/*
 * deadcord, a Vencord fork
 * Copyright (c) 2026 ghxst and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// Usage: node scripts/newPlugin.mjs <pluginName>
// Creates src/plugins/<pluginName>/index.tsx with boilerplate

import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const name = process.argv[2];
if (!name) {
    console.error("Usage: node scripts/newPlugin.mjs <name>");
    process.exit(1);
}

const dir = join("src", "plugins", name);
mkdirSync(dir, { recursive: true });

const template = `/*
 * deadcord, a Vencord fork
 * Copyright (c) 2026 ghxst and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { DeadcordDevs } from "@utils/constants";
import definePlugin from "@utils/types";

export default definePlugin({
    name: "${name}",
    description: "TODO: describe your plugin",
    authors: [DeadcordDevs.ghxst],

    // Webpack module patches
    patches: [],

    // Runs when the plugin is started
    start() {},

    // Runs when the plugin is stopped
    stop() {},
});
`;

writeFileSync(join(dir, "index.tsx"), template);
console.log(`\x1b[32m✔\x1b[0m Created ${dir}/index.tsx`);