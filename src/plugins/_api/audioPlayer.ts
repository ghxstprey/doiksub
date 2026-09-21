/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

/*
 * Registration-only plugin. The actual AudioPlayer implementation lives in
 * `@api/AudioPlayer` (consumed directly by plugins via `import { playAudio } from "@api/AudioPlayer"`).
 *
 * This thin registration exists so that:
 *   - `"AudioPlayerAPI" in plugins` is true, causing `Settings.plugins["AudioPlayerAPI"]`
 *     to be seeded with `{ enabled }` by SettingsStore's `getDefaultValue`, and
 *   - plugins declaring `dependencies: ["AudioPlayerAPI", ...]` (e.g. Questify)
 *     resolve their dependency in PluginManager.startDependenciesRecursive
 *     (#139 `settings[d].enabled`) instead of crashing on undefined.
 *
 * It carries no patches and therefore does not require a restart.
 */
export default definePlugin({
    name: "AudioPlayerAPI",
    authors: [Devs.Ven],
    description: "Api required for plugins that play audio",
    requiresRestart: false,
});
