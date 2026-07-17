/*
 * doiksub Installer - uses VencordInstaller engine but fetches doiksub assets
 */

import "./checkNodeVersion.js";

import { execFileSync, execSync } from "child_process";
import { createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { Readable } from "stream";
import { finished } from "stream/promises";
import { fileURLToPath } from "url";

// Point to Vencord's installer binary (the tooling is the same)
const BASE_URL = "https://github.com/Vencord/Installer/releases/latest/download/";
const INSTALLER_PATH_DARWIN = "VencordInstaller.app/Contents/MacOS/VencordInstaller";

const BASE_DIR = join(dirname(fileURLToPath(import.meta.url)), "..");
const FILE_DIR = join(BASE_DIR, "dist", "Installer");
const ETAG_FILE = join(FILE_DIR, "etag.txt");

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
    // ... (same as Vencord's installer, or just use `pnpm inject` for development)
}

console.log("doiksub injector ready.");
console.log("Run the VencordInstaller manually and point it to your doiksub/build output.");