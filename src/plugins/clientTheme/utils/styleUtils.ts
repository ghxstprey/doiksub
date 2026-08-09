/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { managedStyleRootNode } from "@api/Styles";
import { createAndAppendStyle } from "@utils/css";

import { hexToHSL } from "./colorUtils";
const VARS_STYLE_ID = "vc-clientTheme-vars";
const OVERRIDES_STYLE_ID = "vc-clientTheme-overrides";
type StyleId = typeof VARS_STYLE_ID | typeof OVERRIDES_STYLE_ID;

const styleCache = {} as Record<StyleId, HTMLStyleElement | null>;

// Base saturation/lightness from the last picked color, so a hue-shifting
// gradient keeps the theme legible (text contrast relies on lightness).
let baseSaturation = 0;
let baseLightness = 0;
let baseHue = 0;

/** Hue degrees advanced per second while gradient mode is active. */
const GRADIENT_SPEED = 30;

let gradientFrameHandle: number | null = null;
let gradientStartTime: number | null = null;

function setThemeVars(hue: number, saturation: number, lightness: number) {
    createOrUpdateStyle(VARS_STYLE_ID, `:root {
        --theme-h: ${hue};
        --theme-s: ${saturation}%;
        --theme-l: ${lightness}%;
    }`);
}

export function createOrUpdateThemeColorVars(color: string) {
    stopGradient();
    const { hue, saturation, lightness } = hexToHSL(color);

    baseHue = hue;
    baseSaturation = saturation;
    baseLightness = lightness;

    setThemeVars(hue, saturation, lightness);
}

/**
 * Animate the theme hue over time to create a shifting color gradient.
 * The green/neutral overrides already reference `var(--theme-h)` live, so
 * only this vars style needs to update each frame.
 */
export function startGradient() {
    stopGradient();
    if (gradientFrameHandle != null) return;

    setThemeVars(baseHue, baseSaturation, baseLightness);
    gradientStartTime = performance.now();

    const tick = (now: number) => {
        // Wrap hue through 0-360 so the transition loops seamlessly.
        const hue = (baseHue + ((now - gradientStartTime!) / 1000) * GRADIENT_SPEED) % 360;
        setThemeVars(hue, baseSaturation, baseLightness);
        gradientFrameHandle = requestAnimationFrame(tick);
    };

    gradientFrameHandle = requestAnimationFrame(tick);
}

export function stopGradient() {
    if (gradientFrameHandle != null) {
        cancelAnimationFrame(gradientFrameHandle);
        gradientFrameHandle = null;
    }
    gradientStartTime = null;
}

export async function startClientTheme(color: string, gradient = false) {
    createOrUpdateThemeColorVars(color);
    if (gradient) startGradient();
    createColorsOverrides(await getDiscordStyles());
}

export function disableClientTheme() {
    stopGradient();
    styleCache[VARS_STYLE_ID]?.remove();
    styleCache[OVERRIDES_STYLE_ID]?.remove();
    styleCache[VARS_STYLE_ID] = null;
    styleCache[OVERRIDES_STYLE_ID] = null;
}

function getOrCreateStyle(styleId: StyleId) {
    if (!styleCache[styleId]) {
        styleCache[styleId] = createAndAppendStyle(styleId, managedStyleRootNode);
    }
    return styleCache[styleId];
}

function createOrUpdateStyle(styleId: StyleId, css: string) {
    const style = getOrCreateStyle(styleId);
    style.textContent = css;
}

/**
 * @returns A string containing all the CSS styles from the Discord client.
 */
async function getDiscordStyles(): Promise<string> {
    const styleLinkNodes = document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]');

    const cssTexts = await Promise.all(Array.from(styleLinkNodes, async node => {
        if (!node.href)
            return null;

        return fetch(node.href).then(res => res.text());
    }));

    return cssTexts.filter(Boolean).join("\n");
}

const VISUAL_REFRESH_COLORS_VARIABLES_REGEX = /(--neutral-\d{1,3}?-hsl):.+?([\d.]+?)%;/g;

function createColorsOverrides(styles: string) {
    const visualRefreshColorsLightness = {} as Record<string, number>;

    for (const [, colorVariableName, lightness] of styles.matchAll(VISUAL_REFRESH_COLORS_VARIABLES_REGEX)) {
        visualRefreshColorsLightness[colorVariableName] = parseFloat(lightness);
    }

    const lightThemeBaseLightness = visualRefreshColorsLightness["--neutral-2-hsl"];
    const darkThemeBaseLightness = visualRefreshColorsLightness["--neutral-69-hsl"];

    createOrUpdateStyle(OVERRIDES_STYLE_ID, [
        `.theme-light {\n ${generateNewColorVars(visualRefreshColorsLightness, lightThemeBaseLightness)} \n}`,
        `.theme-dark {\n ${generateNewColorVars(visualRefreshColorsLightness, darkThemeBaseLightness)} \n}`,
    ].join("\n\n"));
}

function generateNewColorVars(colorsLightess: Record<string, number>, baseLightness: number) {
    return Object.entries(colorsLightess).map(([colorVariableName, lightness]) => {
        const lightnessOffset = lightness - baseLightness;
        const plusOrMinus = lightnessOffset >= 0 ? "+" : "-";

        return `${colorVariableName}: var(--theme-h) var(--theme-s) calc(var(--theme-l) ${plusOrMinus} ${Math.abs(lightnessOffset).toFixed(2)}%);`;
    }).join("\n");
}
