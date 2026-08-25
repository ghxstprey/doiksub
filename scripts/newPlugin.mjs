/*
 * doiksub, a Vencord fork
 * Copyright (c) 2026 ghxst and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// Usage: node scripts/newPlugin.mjs <pluginName> [--test]
// Creates src/plugins/<pluginName>/index.tsx with boilerplate
// pass --alpha to create it in src/alplugins instead

import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const args = process.argv.slice(2);
const name = args.find(a => !a.startsWith("--"));
const test = args.includes("--alpha");

if (!name) {
    console.error("Usage: node scripts/newPlugin.mjs <name> [--test]");
    process.exit(1);
}

const dir = join("src", test ? "alplugins" : "plugins", name);
mkdirSync(dir, { recursive: true });

const template = `/*
 * doiksub, a Vencord fork
 * Copyright (c) 2026 ghxst and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { doiksubDevs } from "@utils/constants";
import definePlugin from "@utils/types";

export default definePlugin({
    name: "${name}",
    description: "TODO: describe your plugin",
    authors: [doiksubDevs.ghxst],

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
