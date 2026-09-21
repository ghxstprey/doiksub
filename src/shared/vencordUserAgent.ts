/*
 * doiksub, a Discord client mod
 * Copyright (c) 2024 ghxst and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import gitHash from "~git-hash";
import gitRemote from "~git-remote";

export { gitHash, gitRemote };

export const DOIKSUB_USER_AGENT = `doiksub/${gitHash}${gitRemote ? ` (https://github.com/${gitRemote})` : ""}`;