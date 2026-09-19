/*
 * doiksub, a Vencord fork
 * Copyright (c) 2026 ghxst and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { releaseHash } from "../src/shared/releaseHash";

/**
 * Both the built-in updater and meoew.com read the built commit hash out of the GitHub
 * release name, and compare it against a hash baked into the build. This checks that the
 * workflows that publish the Vesktop assets (the ones forks actually consume) keep that
 * contract, since getting it wrong makes every install either never update or re-download
 * the same files forever.
 */

const SAMPLE_HASH = "0f00ba5";

// src/main/updater/common.ts picks exactly these when IS_DISCORD_DESKTOP is false
const FILES_THE_UPDATER_LOOKS_FOR = [
    "vencordDesktopMain.js",
    "vencordDesktopPreload.js",
    "vencordDesktopRenderer.js",
    "vencordDesktopRenderer.css",
];

assert.equal(releaseHash("nightly 4603a50"), "4603a50");
assert.equal(releaseHash("v1.14.16-doinky 4603a50"), "4603a50");
assert.equal(releaseHash(null), null);
assert.equal(releaseHash("nightly"), null, "a name without a hash must not report an update");
assert.equal(releaseHash(""), null);

const workflowsDir = join(process.cwd(), ".github", "workflows");
assert.ok(existsSync(workflowsDir), "run this from the repository root");

const publishers = readdirSync(workflowsDir)
    .filter(file => /\.ya?ml$/.test(file))
    .filter(file => readFileSync(join(workflowsDir, file), "utf-8").includes("dist/vencordDesktopMain.js"));

assert.ok(publishers.length, "no workflow publishes the Vesktop assets, so nothing would be updatable");

for (const file of publishers) {
    const workflow = readFileSync(join(workflowsDir, file), "utf-8");

    const releaseStep = workflow.slice(workflow.indexOf("softprops/action-gh-release"));
    const name = releaseStep.match(/^\s*name:\s*(\S.*)$/m)?.[1]?.trim();
    assert.ok(name, `${file}: the release step needs a name, the updater reads the hash from it`);

    const releasedName = name.replace(/\$\{\{\s*steps\.sha\.outputs\.short\s*\}\}/g, SAMPLE_HASH);
    assert.notEqual(releasedName, name, `${file}: the release name must carry the short sha`);
    assert.equal(
        releaseHash(releasedName),
        SAMPLE_HASH,
        `${file}: release name "${releasedName}" must end in the commit hash, or every check reports an update`
    );

    assert.match(workflow, /pnpm build --standalone/, `${file}: these assets are loaded from a plain folder, so they need --standalone`);
    assert.match(
        workflow,
        /DOIKSUB_HASH:\s*\$\{\{\s*steps\.sha\.outputs\.short\s*\}\}/,
        `${file}: DOIKSUB_HASH (what ~git-hash bakes in) must be the same short sha the release name carries`
    );

    for (const asset of FILES_THE_UPDATER_LOOKS_FOR)
        assert.ok(workflow.includes(`dist/${asset}`), `${file}: does not publish dist/${asset}`);
}

console.log(`release naming ok (${publishers.join(", ")})`);
