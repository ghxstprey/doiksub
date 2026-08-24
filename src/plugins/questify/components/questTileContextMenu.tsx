/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { copyToClipboard } from "@utils/index";
import type { Quest } from "@vencord/discord-types";
import { Menu } from "@webpack/common";
import type { ReactNode } from "react";

import { addIgnoredQuest, questIsIgnored, removeIgnoredQuest } from "../settings/ignoredQuests";
import { rerenderQuests } from "../settings/rerender";
import { canAutoCompleteQuest, getQuestAutoCompleteEntry, processQuestForAutoComplete, stopQuestAutoComplete, type QuestButtonAnalyticsArgs } from "../utils/completion";
import { q } from "../utils/ui";

export function QuestTileContextMenu(
    children: ReactNode[],
    props: {
        quest?: Quest;
        analyticsCtxQuestContent?: unknown;
        analyticsCtxSourceQuestContent?: unknown;
        analyticsCtxQuestContentPosition?: unknown;
        analyticsCtxQuestContentRowIndex?: unknown;
    },
    isClaimedMenu: boolean = false,
): void {
    const { quest } = props;

    if (!quest) {
        return;
    }

    const isIgnored = questIsIgnored(quest.id);
    const isAutoCompleting = getQuestAutoCompleteEntry(quest) != null;
    // Enrollment no longer needs to happen first: the auto-complete runners enroll unenrolled Quests themselves.
    const canStartAutoComplete = !isClaimedMenu && canAutoCompleteQuest(quest);
    // Only pass the analytics context through if the menu actually received one,
    // otherwise the runner falls back to synthesizing a Quests page context itself.
    const analyticsArgs: QuestButtonAnalyticsArgs | undefined =
        [props.analyticsCtxQuestContent, props.analyticsCtxSourceQuestContent, props.analyticsCtxQuestContentPosition, props.analyticsCtxQuestContentRowIndex].some(value => value != null)
            ? {
                analyticsCtxQuestContent: props.analyticsCtxQuestContent,
                analyticsCtxSourceQuestContent: props.analyticsCtxSourceQuestContent,
                analyticsCtxQuestContentPosition: props.analyticsCtxQuestContentPosition,
                analyticsCtxQuestContentRowIndex: props.analyticsCtxQuestContentRowIndex,
            }
            : undefined;

    children.unshift((
        <Menu.MenuGroup>
            {!isClaimedMenu && (!isIgnored ? (
                <Menu.MenuItem
                    id={q("ignore-quest")}
                    label="Mark as Ignored"
                    action={() => addIgnoredQuest(quest.id)}
                />
            ) : (
                <Menu.MenuItem
                    id={q("unignore-quest")}
                    label="Unmark as Ignored"
                    action={() => removeIgnoredQuest(quest.id)}
                />
            ))}
            {isAutoCompleting ? (
                <Menu.MenuItem
                    id={q("stop-auto-complete")}
                    label="Stop Auto-Complete"
                    action={() => {
                        stopQuestAutoComplete(quest, {
                            manual: true,
                            preserveResume: false,
                            terminalHeartbeat: true,
                        });
                        rerenderQuests();
                    }}
                />
            ) : canStartAutoComplete ? (
                <Menu.MenuItem
                    id={q("start-auto-complete")}
                    label="Start Auto-Complete"
                    action={() => {
                        processQuestForAutoComplete(quest, {
                            force: true,
                            source: "manual",
                            analyticsArgs,
                        });
                        rerenderQuests();
                    }}
                />
            ) : null}
            <Menu.MenuItem
                id={q("copy-quest-id")}
                label="Copy Quest ID"
                action={() => copyToClipboard(quest.id)}
            />
        </Menu.MenuGroup>
    ));
}
