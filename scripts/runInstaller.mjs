/*
 * doiksub, a Discord client mod
 * Copyright (c) 2024 ghxst and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./checkNodeVersion.js";

import { execFileSync, execSync } from "child_process";
import { createWriteStream, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { Readable } from "stream";
import { finished } from "stream/promises";
import { fileURLToPath } from "url";

const BASE_URL = "https://github.com/Vencord/Installer/releases/latest/download/";
const INSTALLER_PATH_DARWIN = "VencordInstaller.app/Contents/MacOS/VencordInstaller";

const BASE_DIR = join(dirname(fileURLToPath(import.meta.url)), "..");
const FILE_DIR = join(BASE_DIR, "dist", "Installer");
const ETAG_FILE = join(FILE_DIR, "etag.txt");

// Windows Discord install folder names, in priority order
const DISCORD_DIR_NAMES = ["Discord", "DiscordPTB", "DiscordCanary", "DiscordDevelopment"];

function getFilename() {
    switch (process.platform) {
        case "win32":
            return "VencordInstallerCli.exe";
        case "darwin":
            return "VencordInstaller.MacOS.zip";
        case "linux":
            return "VencordInstallerCli-linux";
        default:
            throw new Error("Unsupported platform: " + process.platform);
    }
}

async function ensureBinary() {
    const filename = getFilename();
    console.log("Downloading " + filename);

    mkdirSync(FILE_DIR, { recursive: true });

    const downloadName = join(FILE_DIR, filename);
    const outputFile = process.platform === "darwin"
        ? join(FILE_DIR, "VencordInstaller")
        : downloadName;

    const etag = existsSync(outputFile) && existsSync(ETAG_FILE)
        ? readFileSync(ETAG_FILE, "utf-8")
        : null;

    const res = await fetch(BASE_URL + filename, {
        headers: {
            "User-Agent": "doiksub (https://github.com/ghxstprey/doiksub)",
            "If-None-Match": etag
        }
    });

    if (res.status === 304) {
        console.log("Up to date, not redownloading!");
        return outputFile;
    }
    if (!res.ok)
        throw new Error(`Failed to download installer: ${res.status} ${res.statusText}`);

    writeFileSync(ETAG_FILE, res.headers.get("etag"));

    if (process.platform === "darwin") {
        console.log("Unzipping...");
        const zip = new Uint8Array(await res.arrayBuffer());

        const ff = await import("fflate");
        const bytes = ff.unzipSync(zip, {
            filter: f => f.name === INSTALLER_PATH_DARWIN
        })[INSTALLER_PATH_DARWIN];

        writeFileSync(outputFile, bytes, { mode: 0o755 });

        console.log("Overriding security policy for installer binary (this is required to run it)");
        console.log("xattr might error, that's okay");

        const logAndRun = cmd => {
            console.log("Running", cmd);
            try {
                execSync(cmd);
            } catch { }
        };
        logAndRun(`sudo spctl --add '${outputFile}' --label "doiksub Installer"`);
        logAndRun(`sudo xattr -d com.apple.quarantine '${outputFile}'`);
    } else {
        // WHY DOES NODE FETCH RETURN A WEB STREAM OH MY GOD
        const body = Readable.fromWeb(res.body);
        await finished(body.pipe(createWriteStream(outputFile, {
            mode: 0o755,
            autoClose: true
        })));
    }

    console.log("Finished downloading!");

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
            VENCORD_USER_DATA_DIR: BASE_DIR,
            VENCORD_DEV_INSTALL: "1"
        }
    });
} catch (e) {
    const status = typeof e?.status === "number" ? e.status : 1;
    console.error("The installer failed. doiksub was NOT injected.");
    process.exit(status);
}

console.log("Done.");