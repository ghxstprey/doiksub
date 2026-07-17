/*
 * Deadcord - UserArea API
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { React } from "@webpack/common";

export interface UserAreaRenderProps {
    iconForeground: string;
    hideTooltips?: boolean;
    nameplate?: React.ReactNode;
}

export interface UserAreaButtonProps extends React.ComponentPropsWithoutRef<"div"> {
    onClick?: () => void;
    onContextMenu?: (e: React.MouseEvent) => void;
    tooltipText?: string;
    icon?: React.ReactNode;
    role?: string;
    "aria-checked"?: boolean;
    redGlow?: boolean;
    plated?: boolean;
}

export function UserAreaButton(props: UserAreaButtonProps) {
    const { icon, tooltipText, onClick, onContextMenu, ...rest } = props;
    return (
        <div
            {...rest}
            role="button"
            onClick={onClick}
            onContextMenu={onContextMenu}
            aria-label={tooltipText}
            title={tooltipText}
            style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", padding: "2px" }}
        >
            {icon}
        </div>
    );
}