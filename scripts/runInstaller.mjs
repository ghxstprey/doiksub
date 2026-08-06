/*
 * doiksub, a Discord client mod
 * Copyright (c) 2024 ghxst and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./checkNodeVersion.js";

import { execFileSync, execSync } from "child_process";
import { existsSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const BASE_DIR = join(dirname(fileURLToPath(import.meta.url)), "..");
const ZIGGYZAG_DIR = existsSync(join(BASE_DIR, "ziggyzag"))
    ? join(BASE_DIR, "ziggyzag")
    : join(BASE_DIR, "..", "ziggyzag");

function getLocalInstallerPath() {
    switch (process.platform) {
        case "win32":
            return join(ZIGGYZAG_DIR, "DoiksubInstallerCli.exe");
        case "darwin":
            return join(ZIGGYZAG_DIR, "DoiksubInstaller.app", "Contents", "MacOS", "DoiksubInstaller");
        case "linux":
            return join(ZIGGYZAG_DIR, "DoiksubInstallerCli-linux");
        default:
            throw new Error("Unsupported platform: " + process.platform);
    }
}

async function ensureBinary() {
    const outputFile = getLocalInstallerPath();

    if (!existsSync(outputFile)) {
        console.log("Installer binary not found at " + outputFile);
        console.log("Please build the ziggyzag installer first:");
        console.log("  cd " + ZIGGYZAG_DIR);
        console.log("  go build --tags cli   # or just `go build` for GUI");
        throw new Error("Installer binary not found");
    }

    console.log("Using local installer: " + outputFile);
    return outputFile;
}

/**
 * Find running Discord installs by checking which Discord*.exe processes
 * are currently alive and mapping them back to their install folder.
 * @returns {string[]} list of install base dirs (e.g. C:\Users\...\AppData\Local\DiscordPTB)
 */
function getRunningDiscordInstalls() {
    if (process.platform !== "win32") return [];
    try {
        const out = execSync("tasklist /fo csv /nh", { encoding: "utf-8" });
        const running = new Set(
            out.split("\n")
                .map(l => l.split('","')[0]?.replace(/^"/, "").toLowerCase())
                .filter(Boolean)
        );
        const localAppData = process.env.LOCALAPPDATA;
        if (!localAppData) return [];

        const found = [];
        for (const name of DISCORD_DIR_NAMES) {
            const base = join(localAppData, name);
            const exe = `${name.toLowerCase()}.exe`;
            if (existsSync(base) && running.has(exe))
                found.push(base);
        }
        return found;
    } catch {
        return [];
    }
}

/**
 * Scan for installed Discord builds (any folder under LOCALAPPDATA that has an
 * app-* resources dir with _app.asar present).
 * @returns {string[]}
 */
function getInstalledDiscordInstalls() {
    if (process.platform !== "win32") return [];
    const localAppData = process.env.LOCALAPPDATA;
    if (!localAppData) return [];

    const found = [];
    for (const name of DISCORD_DIR_NAMES) {
        const base = join(localAppData, name);
        if (!existsSync(base)) continue;

        let hasApp = false;
        try {
            const apps = readdirSync(base)
                .filter(d => d.startsWith("app-"));
            for (const app of apps) {
                if (existsSync(join(base, app, "resources", "_app.asar"))) {
                    hasApp = true;
                    break;
                }
            }
        } catch { }
        if (hasApp) found.push(base);
    }
    return found;
}

/**
 * Make sure we have a built dist. If not, build it (so injection can't silently
 * succeed against a missing/empty build).
 */
function ensureBuild() {
    const patcher = join(BASE_DIR, "dist", "patcher.js");
    const renderer = join(BASE_DIR, "dist", "renderer.js");
    if (existsSync(patcher) && existsSync(renderer)) return;

    console.log("dist build missing, running pnpm build first...");
    execFileSync("pnpm", ["build"], { stdio: "inherit", cwd: BASE_DIR });
}

const installerBin = await ensureBinary();
ensureBuild();

console.log("Now running Installer...");

const argStart = process.argv.indexOf("--");
const userArgs = argStart === -1 ? [] : process.argv.slice(argStart + 1);

// Check for auto-inject flag
const autoInject = userArgs.includes("-auto") || userArgs.includes("-y");

const args = [...userArgs];

// Strip auto-inject flag from args before passing to installer
const installerArgs = args.filter(a => a !== "-auto" && a !== "-y");

if (!autoInject) {
    // Don't pass -location automatically — let the user choose
    console.log("Interactive mode — the installer will prompt you to select a Discord install.");
} else {
    // Auto-inject: select first found install without prompting
    const running = getRunningDiscordInstalls();
    const installed = getInstalledDiscordInstalls();
    const target = running[0] ?? installed[0];

    if (!target) {
        console.error("No Discord install found to auto-inject into.");
        process.exit(1);
    }

    console.log(`Auto-injecting into: ${target}`);
    installerArgs.push("-location", target);
}

try {
    execFileSync(installerBin, installerArgs, {
        stdio: "inherit",
        env: {
            ...process.env,
            DOIKSUB_USER_DATA_DIR: BASE_DIR,
            DOIKSUB_DEV_INSTALL: "1"
        }
    });
} catch (e) {
    const status = typeof e?.status === "number" ? e.status : 1;
    console.error("The installer failed. doiksub was NOT injected.");
    process.exit(status);
}

console.log("Done.");