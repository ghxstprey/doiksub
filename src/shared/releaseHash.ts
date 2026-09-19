/*
 * doiksub, a Vencord fork
 * Copyright (c) 2026 ghxst and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 * doiksub republishes every build as the same "nightly" release, so neither the tag nor
 * the release id changes; the commit hash is carried as the last token of the release
 * name instead ("nightly 4603a50"), pinned to the `~git-hash` define by build.yml.
 *
 * Consumers: the built-in http updater (this repo) and meoew.com's doiksub updater.
 */
export function releaseHash(releaseName?: string | null) {
    return releaseName?.match(/(?:^|\s)([0-9a-f]{7,40})$/i)?.[1] ?? null;
}
