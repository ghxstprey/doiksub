/*
 * Deadcord - HeaderBar API
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { React } from "@webpack/common";

let buttons: Record<string, () => JSX.Element> = {};

export function addHeaderBarButton(id: string, button: () => JSX.Element, priority?: number) {
    buttons[id] = button;
}

export function removeHeaderBarButton(id: string) {
    delete buttons[id];
}

export function HeaderBarButton(props: React.ComponentPropsWithoutRef<"div"> & { icon: React.ReactNode; tooltip?: string; onClick?: () => void }) {
    const { icon, tooltip, onClick, ...rest } = props;
    return (
        <div {...rest} role="button" onClick={onClick} aria-label={tooltip} style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "4px" }}>
            {icon}
        </div>
    );
}