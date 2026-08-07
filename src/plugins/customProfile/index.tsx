/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { BadgePosition, ProfileBadge } from "@api/Badges";
import { addContextMenuPatch, NavContextMenuPatchCallback, removeContextMenuPatch } from "@api/ContextMenu";
import { addHeaderBarButton, HeaderBarButton, removeHeaderBarButton } from "@api/HeaderBar";
import { DataStore } from "@api/index";
import { ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalRoot, openModal } from "@utils/modal";
import definePlugin from "@utils/types";

const ModalRootAny = ModalRoot as any;
const ModalHeaderAny = ModalHeader as any;
const ModalContentAny = ModalContent as any;
const ModalFooterAny = ModalFooter as any;
const ModalCloseButtonAny = ModalCloseButton as any;
import { AuthenticationStore, Button, FluxDispatcher, IconUtils, Menu, React, Select, SnowflakeUtils, UserStore } from "@webpack/common";
import virtualMerge from "virtual-merge";

import { doiksubDevs } from "@utils/constants";

// English-only labels — no translation dependency anymore.
const t = (s: string) => s;

const DS_KEY = "customProfile_data";
const DS_ENABLED = "customProfile_enabled";

const FLAG = {
    STAFF: 1,
    PARTNER: 2,
    HYPESQUAD: 4,
    BUG_HUNTER_1: 8,
    BRAVERY: 64,
    BRILLIANCE: 128,
    BALANCE: 256,
    EARLY_SUPPORTER: 512,
    BUG_HUNTER_2: 16384,
    DEV_VERIFIED: 131072,
    MOD_ALUMNI: 262144,
    ACTIVE_DEVELOPER: 4194304,
};

const BADGES = [
    { label: t("Staff Discord"), flag: FLAG.STAFF, icon: "https://cdn.discordapp.com/badge-icons/5e74e9b61934fc1f67c65515d1f7e60d.png" },
    { label: t("Partner"), flag: FLAG.PARTNER, icon: "https://cdn.discordapp.com/badge-icons/3f9748e53446a137a052f3454e2de41e.png" },
    { label: t("HypeSquad Events"), flag: FLAG.HYPESQUAD, icon: "https://cdn.discordapp.com/badge-icons/bf01d1073931f921909045f3a39fd264.png" },
    { label: t("Bug Hunter Lvl 1"), flag: FLAG.BUG_HUNTER_1, icon: "https://cdn.discordapp.com/badge-icons/2717692c7dca7289b35297368a940dd0.png" },
    { label: t("HypeSquad Bravery"), flag: FLAG.BRAVERY, icon: "https://cdn.discordapp.com/badge-icons/8a88d63823d8a71cd5e390baa45efa02.png" },
    { label: t("HypeSquad Brilliance"), flag: FLAG.BRILLIANCE, icon: "https://cdn.discordapp.com/badge-icons/011940fd013da3f7fb926e4a1cd2e618.png" },
    { label: t("HypeSquad Balance"), flag: FLAG.BALANCE, icon: "https://cdn.discordapp.com/badge-icons/3aa41de486fa12454c3761e8e223442e.png" },
    { label: t("Early Supporter"), flag: FLAG.EARLY_SUPPORTER, icon: "https://cdn.discordapp.com/badge-icons/7060786766c9c840eb3019e725d2b358.png" },
    { label: t("Former Moderator"), flag: FLAG.MOD_ALUMNI, icon: "https://cdn.discordapp.com/badge-icons/fee1624003e2fee35cb398e125dc479b.png" },
    { label: t("Bug Hunter Lvl 2"), flag: FLAG.BUG_HUNTER_2, icon: "https://cdn.discordapp.com/badge-icons/848f79194d4be5ff5f81505cbd0ce1e6.png" },
    { label: t("Verified Developer"), flag: FLAG.DEV_VERIFIED, icon: "https://cdn.discordapp.com/badge-icons/6df5892e0f35b051f8b61eace34f4967.png" },
    { label: t("Active Developer"), flag: FLAG.ACTIVE_DEVELOPER, icon: "https://cdn.discordapp.com/badge-icons/6bdc42827a38498929a4920da12695d9.png" },
];

const OLD_NAME_BADGE_ICON = "https://cdn.discordapp.com/badge-icons/6de6d34650760ba5551a79732e98ed60.png";

const NITRO_LEVELS = [
    { label: t("Nitro (0 months)"), icon: "https://cdn.discordapp.com/badge-icons/2ba85e8026a8614b640c2837bcdfe21b.png" },
    { label: t("Bronze (1 month)"), icon: "https://cdn.discordapp.com/badge-icons/4f33c4a9c64ce221936bd256c356f91f.png" },
    { label: t("Silver (3 months)"), icon: "https://cdn.discordapp.com/badge-icons/4514fab914bdbfb4ad2fa23df76121a6.png" },
    { label: t("Gold (6 months)"), icon: "https://cdn.discordapp.com/badge-icons/2895086c18d5531d499862e41d1155a6.png" },
    { label: t("Platinum (12 months)"), icon: "https://cdn.discordapp.com/badge-icons/0334688279c8359120922938dcb1d6f8.png" },
    { label: t("Diamond (24 months)"), icon: "https://cdn.discordapp.com/badge-icons/0d61871f72bb9a33a7ae568c1fb4f20a.png" },
    { label: t("Emerald (36 months)"), icon: "https://cdn.discordapp.com/badge-icons/11e2d339068b55d3a506cff34d3780f3.png" },
    { label: t("Ruby (60 months)"), icon: "https://cdn.discordapp.com/badge-icons/cd5e2cfd9d7f27a8cdcd3e8a8d5dc9f4.png" },
    { label: t("Opal (72+ months)"), icon: "https://cdn.discordapp.com/badge-icons/5b154df19c53dce2af92c9b61e6be5e2.png" },
];

const BOOST_LABELS_RAW = [
    "1 Month", "2 Months", "3 Months", "6 Months",
    "9 Months", "12 Months", "15 Months", "18 Months", "24 Months"
];
const BOOST_LABELS = BOOST_LABELS_RAW.map(l => t(l));
const BOOST_MONTHS = [1, 2, 3, 6, 9, 12, 15, 18, 24];
const BOOST_ICONS = [
    "https://cdn.discordapp.com/badge-icons/51040c70d4f20a921ad6674ff86fc95c.png", // 1 month
    "https://cdn.discordapp.com/badge-icons/0e4080d1d333bc7ad29ef6528b6f2fb7.png", // 2 months
    "https://cdn.discordapp.com/badge-icons/72bed924410c304dbe3d00a6e593ff59.png", // 3 months
    "https://cdn.discordapp.com/badge-icons/df199d2050d3ed4ebf84d64ae83989f8.png", // 6 months
    "https://cdn.discordapp.com/badge-icons/996b3e870e8a22ce519b3a50e6bdd52f.png", // 9 months
    "https://cdn.discordapp.com/badge-icons/991c9f39ee33d7537d9f408c3e53141e.png", // 12 months
    "https://cdn.discordapp.com/badge-icons/cb3ae83c15e970e8f3d410bc62cb8b99.png", // 15 months
    "https://cdn.discordapp.com/badge-icons/7142225d31238f6387d9f09efaa02759.png", // 18 months
    "https://cdn.discordapp.com/badge-icons/ec92202290b48d0879b7413d2dde3bab.png", // 24 months
];

interface AvatarDecoration {
    id: string;
    label: string;
    passthrough: boolean;
}

const AVATAR_DECORATIONS: AvatarDecoration[] = [
    { id: "1144307957425778779", label: "Hearts", passthrough: true },
    { id: "1333866045303423026", label: "Hearts Arrow", passthrough: true },
    { id: "1341506443718688768", label: "Japanese Exclaim", passthrough: true },
    { id: "1144308196723408958", label: "Japanese Exclaim (Pink)", passthrough: true },
    { id: "1212569433839636530", label: "Cat Ears", passthrough: true },
    { id: "1341506443865489408", label: "Cat Ears (Yellow)", passthrough: true },
    { id: "1481387347642810480", label: "Venom (Marvel?)", passthrough: true },
    { id: "1343751617362661526", label: "Witchy Dust", passthrough: true },
    { id: "1462116613682757888", label: "Celestial", passthrough: true },
    { id: "1462116613691281560", label: "Celestial White", passthrough: true },
    { id: "1373015260465987705", label: "Fallen Angel (Red)", passthrough: true },
    { id: "1144308439720394944", label: "Angry", passthrough: true },
    { id: "1432550258126229565", label: "Moonlit", passthrough: true },
    { id: "1432550258147328050", label: "Moonlit (Purple)", passthrough: true },
    { id: "1432550258134487124", label: "Moonlit (Red)", passthrough: true },
    { id: "1432550258155720704", label: "Moonlit (Blue)", passthrough: true },
    { id: "1462116613653401775", label: "White Roses", passthrough: true },
    { id: "1462116613632426014", label: "Purple Roses", passthrough: true },
    { id: "1447654090640330763", label: "Goat Horns", passthrough: true },
    { id: "1483857762890022923", label: "Bugs Bunny", passthrough: true },
    { id: "1479561706672885811", label: "NASCAR Helmet", passthrough: true },
    { id: "1212569856189407352", label: "Lightning", passthrough: true },
    { id: "1485784028710830242", label: "Cat Ears Headphones", passthrough: true },
    { id: "1341506444150702080", label: "Shock", passthrough: true },
    { id: "1232071712695386162", label: "Constellations", passthrough: true },
    { id: "1220514048068812901", label: "Video Game Kunai", passthrough: true },
    { id: "1427463138634109026", label: "NCS-Type", passthrough: true },
    // { id: "placeholder", label: "placeholder", passthrough: true },
    { id: "1287835633787732070", label: "Fangs (ghxst approved)", passthrough: true },
    { id: "1287835633817227297", label: "Fangs (Radioactive)", passthrough: true },
    { id: "1287835633842258022", label: "Fangs (24kMidas)", passthrough: true },
    { id: "1402472280478580767", label: "Emo Cat Hoodie", passthrough: true },
    { id: "1402472280642289775", label: "RawrXD", passthrough: true },
    { id: "1516559294819074088", label: "Crawling Skeleton", passthrough: true },
    { id: "1459194821221810319", label: "Stars", passthrough: true },
    { id: "1458472704469499965", label: "Rainbow Clouds", passthrough: true },
    { id: "1333866045236314327", label: "Angelic", passthrough: true },
    { id: "1333866045236314327", label: "Angelic (Hearts)", passthrough: true },
    { id: "1521661571665756180", label: "Red Bull", passthrough: true },
    { id: "1432550258247995533", label: "HeavenDust", passthrough: true },
    { id: "1488180278475227266", label: "Hello Kitty", passthrough: true },
    { id: "1488242384113369300", label: "Purin", passthrough: true },
    { id: "1488243577019695174", label: "Cinnamaroll", passthrough: true },
    { id: "1488243796239061062", label: "Pochacco", passthrough: true },
    { id: "1488243999306416303", label: "Kuromi", passthrough: true },
    { id: "1488244167045021816", label: "My Melody", passthrough: true },
    { id: "1488244261362340101", label: "Kiki & Lala", passthrough: true },
    { id: "1488244383466651909", label: "Chococat", passthrough: true },
    { id: "1488244507689484432", label: "Keroppi", passthrough: true },
    { id: "1488244619144855712", label: "Tuxedo Sam", passthrough: true },
    { id: "1385050947767505106", label: "Pink Milk", passthrough: true },
    { id: "1385050947834613820", label: "Duck", passthrough: true },
    { id: "1352407446303412304", label: "Egg (static)", passthrough: false },
    { id: "1352407446303412304", label: "Egg", passthrough: true },
    { id: "1144305233707671573", label: "Ghost", passthrough: true },
    { id: "1341506443685134336", label: "Ghost (Blue)", passthrough: true },
    { id: "1144307257807491094", label: "Sweat_Erm", passthrough: true },
    { id: "1341506443659968512", label: "Sweat_Erm (Light Blue)", passthrough: true },
    { id: "1341506443664162817", label: "Sweat_Erm (Pink)", passthrough: true },
    { id: "1212570596970467378", label: "Sweat", passthrough: true },
    { id: "1341506443806769152", label: "Sweat (Purple)", passthrough: true },
    { id: "1341506443810963456", label: "Sweat (Pink)", passthrough: true },
    { id: "1341506443819352064", label: "Sweat (Yellow)", passthrough: true },
    { id: "1341506443823546368", label: "Sweat (Green)", passthrough: true },
    { id: "1207047597294886923", label: "Wet", passthrough: true },
    { id: "1207047808838799410", label: "Windy", passthrough: true },
    { id: "1212570343567261736", label: "White&Pink Hearts&Flowers", passthrough: true },
    { id: "1232071157746765906", label: "White Star Swirling-Portal", passthrough: true },
    { id: "1256321669426053198", label: "Sickle", passthrough: true },
    { id: "1271174640026255380", label: "Sakura", passthrough: true },
    { id: "1271174732577767626", label: "Katanas Clang", passthrough: true },
    { id: "1286504131325853739", label: "Butterfly", passthrough: true },
    { id: "1282816431850782730", label: "Butterfly (Blue)", passthrough: true },
    { id: "1285465421193154560", label: "Feet (??? why does discord have this)", passthrough: true },
    { id: "1287835633590734848", label: "Black Candles", passthrough: true },
    { id: "1293373563302318110", label: "Sleeping Cat", passthrough: true },
    { id: "1293373563327483984", label: "Sleeping Cat (White)", passthrough: true },
    { id: "1298033986668335135", label: "Angel Antlers", passthrough: true },
    { id: "1306330662990643252", label: "Bunny Sleeping", passthrough: true },
    { id: "1333866045261480007", label: "Succubus but family friendly", passthrough: true },
    { id: "1333866045282451527", label: "Cupid Bunny", passthrough: true },
    { id: "1333866045324394547", label: "Rose Wreath", passthrough: true },
    { id: "1333866045345366136", label: "Rose Wreath (Blue)", passthrough: true },
    { id: "1341506443580276736", label: ">< Fingers", passthrough: true },
    { id: "1341506443584471040", label: ">< Fingers (Hearts)", passthrough: true },
    { id: "1341506443777409024", label: "Glossy Hearts (Purple)", passthrough: true },
    { id: "1341506443781603328", label: "Glossy Hearts (Blue)", passthrough: true },
    { id: "1341506443789991936", label: "Glossy Hearts (Yellow)", passthrough: true },
    { id: "1341506443794186240", label: "Glossy Hearts (Green)", passthrough: true },
    { id: "1352407446328578078", label: "Chicken Nugget", passthrough: false },
    { id: "1352407446370648166", label: "yellow emoji guy", passthrough: false },
    { id: "1387888352539312288", label: "sigh. skibidi toilet.", passthrough: true },
    { id: "1428438924589662298", label: "Yuji's Black Flash", passthrough: true },
    { id: "1428438924619022436", label: "Goji's Infinity", passthrough: true },
    { id: "1428438924669358120", label: "Sukuna's Domain", passthrough: true },
    { id: "1428438924698718268", label: "Mini Yuji", passthrough: true },
    { id: "1428438924728078436", label: "Mini Megumi", passthrough: true },
    { id: "1428438924757438666", label: "Mini Nobara", passthrough: true },
    { id: "1428438924790992946", label: "Mini Gojo", passthrough: true },
    { id: "1428438924820353184", label: "Mini Kento-Dude", passthrough: true },
    { id: "1428438924853907596", label: "Mini Sukuna", passthrough: true },
    { id: "1428438924883267715", label: "Mini Mahito", passthrough: true },
    { id: "1428438924912627853", label: "Mini Geto", passthrough: true },
    { id: "1461062060141051946", label: "Demonic", passthrough: true },
    { id: "1483911783268876489", label: "Clappy Feet", passthrough: true },
    { id: "1483912153596559581", label: "Clappy Feet (White)", passthrough: true },
    { id: "1483912356919513209", label: "Clappy Feet (Brown)", passthrough: true },
    { id: "1483912597710569612", label: "Clappy Feet (Black)", passthrough: true },
    { id: "1498445907169902712", label: "Sleeping Cat (Strawberry Edition)", passthrough: true },
    { id: "1516559294819074088", label: "Wraiths", passthrough: true },
    { id: "1516559585601786028", label: "Damned Souls", passthrough: true },
    { id: "1516559674776752290", label: "Straight Teeth", passthrough: true },
    { id: "1385050947855716503", label: "Bubblely", passthrough: true },
    { id: "1432427447093039205", label: "Atakhan's Aura of Malice", passthrough: true },

];

function getDecorationUrl(assetId: string, animated = false): string {
    return `https://cdn.discordapp.com/media/v1/collectibles-shop/${assetId}/${animated ? "animated" : "static"}`;
}

const PROFILE_EFFECTS = [
    { id: "1139323092645183591", label: t("Hydro Blast") },
    { id: "1139323093991575696", label: t("Sakura Dreams") },
    { id: "1139323099251232828", label: t("Mystic Vines") },
    { id: "1139323099687436419", label: t("Pixie Dust") },
    { id: "1212582298893946880", label: t("Dreamy") },
    { id: "1212582372877541427", label: t("Ki Detonate") },
    { id: "1212582452640350238", label: t("Sushi Mania") },
    { id: "1139323100568244355", label: t("Magic Hearts") },
    { id: "1139323093551165533", label: t("Shatter") },
    { id: "1139323101008642101", label: t("Shuriken Strike") },
    { id: "1139323101881061466", label: t("Power Surge") },
    { id: "1158572178179108968", label: t("Ghoulish Graffiti") },
    { id: "1158572275507937342", label: t("Dark Omens") },
    { id: "1197344693630009424", label: t("Nightrunner") },
    { id: "1197344764174008452", label: t("Uplink Error") },
    { id: "1217626509737459852", label: t("Petal Serenade") },
    { id: "1217627051217911848", label: t("Fellowship of the Spring") },
    { id: "1217627230818009171", label: t("Spring Bloom") },
    { id: "1228233390260486164", label: t("Study Spot") },
    { id: "1228234634379132958", label: t("All Nighter") },
    { id: "1237654783209508904", label: t("Jolly Roger") },
    { id: "1237654867330469949", label: t("Forgotten Treasure") },
    { id: "1237654942202990602", label: t("Haunted Man O' War") },
    { id: "1232073286582538261", label: t("Shooting Stars") },
    { id: "1232073608168472638", label: t("Twilight") },
    { id: "1207049115339591681", label: t("Rock Slide") },
    { id: "1207049364464345158", label: t("Vortex") },
    { id: "1207049498065375343", label: t("Mastery") },
    { id: "1245088205330710539", label: t("Turbo Drive") },
    { id: "1245088254647205991", label: t("Twinkle Trails") },
];

interface CustomProfileData {
    username?: string;
    globalName?: string;
    avatar?: string;
    banner?: string;
    bio?: string;
    accentColor?: number;
    accentColor2?: number;
    pronouns?: string;
    badgeFlags?: number;
    createdAt?: string;
    nitro?: boolean;
    nitroLevel?: number;
    boostMonths?: number;
    email?: string;
    phone?: string;
    customBadgeIds?: string[];
    oldName?: string;
    decorationAsset?: string;
    copiedUserId?: string;
    profileEffectId?: string;
}

const LS_KEY_DATA = "doiksubCP_data";
const LS_KEY_ENABLED = "doiksubCP_enabled";
const DS_ALL_DATA = "customProfile_allData";
const DS_ALL_ENABLED = "customProfile_allEnabled";
const LS_ALL_DATA = "doiksubCP_allData";
const LS_ALL_ENABLED = "doiksubCP_allEnabled";
const DS_PRESETS = "customProfile_presets";
const LS_PRESETS = "doiksubCP_presets";

interface SavedPreset {
    name: string;
    data: CustomProfileData;
}

let storedData: CustomProfileData = {};
let isEnabled = false;
let domObserver: MutationObserver | null = null;

let cachedOriginalUser: any = null;
let cachedFakeUser: any = null;
let cachedDataHash: number = 0;
let _trueOriginalUser: any = null;
let _dataVersion: number = 0;
let allAccountsData: Record<string, CustomProfileData> = {};
let allAccountsEnabled: Record<string, boolean> = {};
let allPresetsData: Record<string, SavedPreset[]> = {};

function getProfileDataFor(userId: string | null | undefined): CustomProfileData | null {
    if (!userId) return null;
    const myId = AuthenticationStore?.getId?.();
    if (myId && userId === myId) return isEnabled ? storedData : null;
    return null;
}

function saveDataSync(data: CustomProfileData, enabled: boolean) {
    try {
        localStorage.setItem(LS_KEY_DATA, JSON.stringify(data));
        localStorage.setItem(LS_KEY_ENABLED, enabled ? "1" : "0");
    } catch { }
}

function saveAllDataSync() {
    try {
        localStorage.setItem(LS_ALL_DATA, JSON.stringify(allAccountsData));
        localStorage.setItem(LS_ALL_ENABLED, JSON.stringify(allAccountsEnabled));
    } catch { }
}

function savePresetsSync() {
    try { localStorage.setItem(LS_PRESETS, JSON.stringify(allPresetsData)); } catch { }
}

function loadPresetsSync() {
    try {
        const raw = localStorage.getItem(LS_PRESETS);
        if (raw) { try { allPresetsData = JSON.parse(raw); } catch { allPresetsData = {}; } }
    } catch { allPresetsData = {}; }
}

function syncCurrentUserData() {
    const myId = _cachedMyId || AuthenticationStore?.getId?.();
    if (myId) {
        _cachedMyId = myId;
        storedData = allAccountsData[myId] || {};
        isEnabled = allAccountsEnabled[myId] || false;
    }
}

function loadDataSync() {
    try {
        const rawAll = localStorage.getItem(LS_ALL_DATA);
        if (rawAll) {
            try { allAccountsData = JSON.parse(rawAll); } catch { allAccountsData = {}; }
            const rawEnabled = localStorage.getItem(LS_ALL_ENABLED);
            try { allAccountsEnabled = rawEnabled ? JSON.parse(rawEnabled) : {}; } catch { allAccountsEnabled = {}; }
            syncCurrentUserData();
            if (!storedData || Object.keys(storedData).length === 0) {
                const rawOld = localStorage.getItem(LS_KEY_DATA);
                const enOld = localStorage.getItem(LS_KEY_ENABLED);
                if (rawOld) {
                    try { storedData = JSON.parse(rawOld); } catch { storedData = {}; }
                    isEnabled = enOld === "1";
                }
            }
            return;
        }
        const raw = localStorage.getItem(LS_KEY_DATA);
        const en = localStorage.getItem(LS_KEY_ENABLED);
        if (raw) {
            try { storedData = JSON.parse(raw); } catch { storedData = {}; }
        } else { storedData = {}; }
        isEnabled = en === "1";
    } catch {
        storedData = {};
        isEnabled = false;
    }
}

function onAccountSwitch() {
    updateCachedRealData();
    syncCurrentUserData();
    cachedFakeUser = null;
    cachedOriginalUser = null;
    _trueOriginalUser = null;
    _dataVersion++;
    _realUsername = "";
    _realGlobalName = "";
    if (isEnabled) startDomObserver();
    else stopDomObserver();
    forceAccountPanelRerender();
}

loadDataSync();
loadPresetsSync();

const HIDE_STYLE_ID = "cp-hide-during-load";
function injectHideStyle() {
    if (!isEnabled) return;
    if (document.getElementById(HIDE_STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = HIDE_STYLE_ID;
    style.textContent = `
        [class*='nameTag'] [class*='username'],
        [class*='nameTag'] [class*='discriminator'],
        [class*='nameTag'] [class*='panelSubtitle']
        { color: transparent !important; }
        [class*='accountProfilePopout'] [class*='avatarWrap'] img,
        [class*='accountProfilePopout'] [class*='avatarWrap'] svg
        { opacity: 0 !important; }
    `;
    const inject = () => {
        if (!document.head) { requestAnimationFrame(inject); return; }
        document.head.appendChild(style);
    };
    inject();
}
function removeHideStyle() {
    document.getElementById(HIDE_STYLE_ID)?.remove();
}
if (isEnabled) injectHideStyle();

let _avatarPatchApplied = false;
function applyAvatarPatchEarly() {
    if (_avatarPatchApplied || !isEnabled || !storedData.avatar) return;
    try {
        const IU = (window as any).Vencord?.Webpack?.findByProps?.("getUserAvatarURL");
        if (!IU?.getUserAvatarURL) return;
        const orig = IU.getUserAvatarURL;
        IU.getUserAvatarURL = function (user: any, ...args: any[]) {
            if (isEnabled && storedData.avatar) {
                const uid = user?.id ?? user?.userId;
                if (uid && isMe(uid)) return storedData.avatar;
            }
            return orig(user, ...args);
        };
        _avatarPatchApplied = true;
    } catch { }
}

async function loadData() {
    try {
        const allData = await DataStore.get(DS_ALL_DATA) as Record<string, CustomProfileData> | null;
        const allEnabled = await DataStore.get(DS_ALL_ENABLED) as Record<string, boolean> | null;
        if (allData && typeof allData === "object" && Object.keys(allData).length > 0) {
            allAccountsData = allData;
            allAccountsEnabled = allEnabled || {};
            syncCurrentUserData();
            saveAllDataSync();
            saveDataSync(storedData, isEnabled);
            return;
        }
        const d = await DataStore.get(DS_KEY) as CustomProfileData | null;
        const e = await DataStore.get(DS_ENABLED) as boolean | null;
        if (d !== null) storedData = d;
        if (e !== null) isEnabled = e === true;
        const myId = AuthenticationStore?.getId?.();
        if (myId && storedData && Object.keys(storedData).length > 0) {
            allAccountsData[myId] = storedData;
            allAccountsEnabled[myId] = isEnabled;
            DataStore.set(DS_ALL_DATA, allAccountsData).catch(() => { });
            DataStore.set(DS_ALL_ENABLED, allAccountsEnabled).catch(() => { });
            saveAllDataSync();
        }
        saveDataSync(storedData, isEnabled);
    } catch (err) { }
}

async function copyUserProfile(userId: string) {
    try {
        const user = UserStore.getUser(userId) as any;
        if (!user) return;

        const { findByProps } = await import("@webpack") as any;
        const UserProfileStore = findByProps("getUserProfile", "getGuildMemberProfile") as any;
        const IU = IconUtils as any;
        const profile = UserProfileStore?.getUserProfile?.(userId) ?? {};

        const newData: CustomProfileData = {
            username: user.username || "",
            globalName: user.globalName || "",
            pronouns: "",
            bio: "",
            accentColor: undefined,
            accentColor2: undefined,
            banner: "",
            avatar: "",
            badgeFlags: 0,
            customBadgeIds: [],
            nitro: false,
            nitroLevel: -1,
            boostMonths: -1,
            decorationAsset: undefined,
            createdAt: undefined,
            copiedUserId: userId
        };

        if (user.bio !== undefined) newData.bio = user.bio || "";
        if (profile.bio !== undefined) newData.bio = profile.bio || "";

        try {
            const avatarUrl = IU?.getUserAvatarURL?.(user, false, 512)
                ?? (user.avatar ? `https://cdn.discordapp.com/avatars/${userId}/${user.avatar}.${user.avatar.startsWith("a_") ? "gif" : "png"}?size=512` : null);
            if (avatarUrl) newData.avatar = avatarUrl;
        } catch { }

        const hasNitro = (profile.premiumType ?? 0) > 0;
        newData.nitro = hasNitro;

        if (hasNitro) {
            const premiumSince = profile.premiumSince ?? user.premiumSince ?? null;
            if (premiumSince) {
                const months = Math.floor((Date.now() - new Date(premiumSince).getTime()) / (1000 * 60 * 60 * 24 * 30));
                if (months >= 72) newData.nitroLevel = 7;
                else if (months >= 36) newData.nitroLevel = 6;
                else if (months >= 24) newData.nitroLevel = 5;
                else if (months >= 12) newData.nitroLevel = 4;
                else if (months >= 6) newData.nitroLevel = 3;
                else if (months >= 3) newData.nitroLevel = 2;
                else if (months >= 2) newData.nitroLevel = 1;
                else newData.nitroLevel = 0;
            } else {
                newData.nitroLevel = 0;
            }
        }

        const boostSince = profile.premiumGuildSince ?? null;
        if (boostSince) {
            const bMonths = Math.floor((Date.now() - new Date(boostSince).getTime()) / (1000 * 60 * 60 * 24 * 30));
            if (bMonths >= 24) newData.boostMonths = 8;
            else if (bMonths >= 18) newData.boostMonths = 7;
            else if (bMonths >= 15) newData.boostMonths = 6;
            else if (bMonths >= 12) newData.boostMonths = 5;
            else if (bMonths >= 9) newData.boostMonths = 4;
            else if (bMonths >= 6) newData.boostMonths = 3;
            else if (bMonths >= 3) newData.boostMonths = 2;
            else if (bMonths >= 2) newData.boostMonths = 1;
            else newData.boostMonths = 0;
        }

        const bannerId = profile.banner ?? user.banner ?? null;
        if (bannerId) newData.banner = `https://cdn.discordapp.com/banners/${userId}/${bannerId}.${bannerId.startsWith("a_") ? "gif" : "png"}?size=512`;

        if (profile.accentColor !== undefined) newData.accentColor = profile.accentColor;
        else if (user.accentColor !== undefined) newData.accentColor = user.accentColor;

        try {
            const ms = Number(BigInt(userId) >> 22n) + 1420070400000;
            newData.createdAt = new Date(ms).toISOString().slice(0, 10);
        } catch { }

        try {
            const flags = user.publicFlags ?? 0;
            let badgeFlags = 0;
            for (const { flag } of BADGES) { if (flags & flag) badgeFlags |= flag; }
            newData.badgeFlags = badgeFlags;
            if (user.avatarDecorationData?.asset) newData.decorationAsset = user.avatarDecorationData.asset;
        } catch { }

        newData.copiedUserId = userId;
        storedData = newData;
        isEnabled = true;
        saveDataSync(newData, true);
        DataStore.set(DS_ALL_DATA, allAccountsData).catch(() => { });
        DataStore.set(DS_ALL_ENABLED, allAccountsEnabled).catch(() => { });

        forceAccountPanelRerender();
    } catch (err) {
        console.error("[CustomProfile] copyUserProfile error:", err);
    }
}

const userContextMenuPatch: NavContextMenuPatchCallback = (children, { user }: any) => {
    if (!children || !Array.isArray(children) || !user || !user.id) return;
    try {
        const me = UserStore.getCurrentUser();
        if (!me || user.id === me.id) return;
        const isCopied = isEnabled && storedData.copiedUserId === user.id;

        children.push(
            <Menu.MenuGroup>
                {isCopied ? (
                    <Menu.MenuItem
                        id="remove-copy-profile"
                        label={t("Remove copy profile")}
                        color="danger"
                        action={() => {
                            try {
                                const myId = AuthenticationStore?.getId?.();
                                if (myId) {
                                    delete allAccountsData[myId];
                                    delete allAccountsEnabled[myId];
                                }
                                storedData = {};
                                isEnabled = false;
                                saveDataSync({}, false);
                                cachedFakeUser = null;
                                cachedOriginalUser = null;
                                _trueOriginalUser = null;
                                _dataVersion++;
                                saveAllDataSync();
                                DataStore.set(DS_ALL_DATA, allAccountsData).catch(() => { });
                                DataStore.set(DS_ALL_ENABLED, allAccountsEnabled).catch(() => { });
                                forceAccountPanelRerender();
                            } catch (e) {
                                console.error("[CustomProfile] Error removing copy:", e);
                            }
                        }}
                    />
                ) : (
                    <Menu.MenuItem
                        id="copy-user-profile"
                        label={t("Copy this profile")}
                        action={() => copyUserProfile(user.id)}
                    />
                )}
            </Menu.MenuGroup>
        );
    } catch (err) {
        console.error("[CustomProfile] Context menu patch error:", err);
    }
};

function getRealNames(): { username: string | null; globalName: string | null; } {
    try {
        const u = UserStore.getCurrentUser();
        return { username: u?.username ?? null, globalName: u?.globalName ?? null };
    } catch { return { username: null, globalName: null }; }
}

function getRealDateVariants(): string[] {
    try {
        const u = UserStore.getCurrentUser();
        if (!u?.id) return [];
        const ms = Number(BigInt(u.id) >> 22n) + 1420070400000;
        const d = new Date(ms);
        const variants = new Set<string>();
        const locales = ["en-US", "en-GB", "fr-FR", "de-DE", "it-IT", navigator.language];
        const fmtSpecs: Intl.DateTimeFormatOptions[] = [
            { day: "numeric", month: "short", year: "numeric" },
            { day: "numeric", month: "long", year: "numeric" },
            { month: "short", day: "numeric", year: "numeric" },
            { month: "long", day: "numeric", year: "numeric" },
            { day: "2-digit", month: "2-digit", year: "numeric" },
        ];
        for (const loc of locales) {
            for (const fmt of fmtSpecs) {
                try {
                    const s = new Intl.DateTimeFormat(loc, fmt).format(d);
                    variants.add(s); variants.add(s.replace(/\s/g, " ")); variants.add(s.replace(/\s/g, "\u00a0"));
                } catch { }
            }
        }
        const day = d.getDate(); const year = d.getFullYear(); const monthsShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthsLong = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const mS = monthsShort[d.getMonth()]; const mL = monthsLong[d.getMonth()];
        const patterns = [`${day} ${mS} ${year}`, `${day} ${mL} ${year}`, `${mS} ${day}, ${year}`, `${mL} ${day}, ${year}`, d.toISOString().slice(0, 10)];
        for (const p of patterns) { variants.add(p); variants.add(p.replace(/ /g, "\u00a0")); variants.add(p.replace(/\u00a0/g, " ")); }
        variants.add(year.toString()); return [...variants].filter(v => v.length >= 4);
    } catch { return []; }
}

function getFakeDateVariants(isoDate: string): string[] {
    try {
        const d = new Date(isoDate + "T12:00:00Z");
        const variants = new Set<string>();
        const fmtSpecs: Intl.DateTimeFormatOptions[] = [
            { day: "numeric", month: "short", year: "numeric" },
            { day: "numeric", month: "long", year: "numeric" },
            { month: "short", day: "numeric", year: "numeric" },
            { month: "long", day: "numeric", year: "numeric" },
        ];
        for (const fmt of fmtSpecs) { try { variants.add(new Intl.DateTimeFormat(navigator.language, fmt).format(d)); } catch { } }
        return [...variants];
    } catch { return []; }
}

let _cachedMyId: string | null = null;
let _realUsername = "";
let _realGlobalName = "";

function updateCachedRealData() {
    try { const myId = AuthenticationStore?.getId?.(); if (myId) _cachedMyId = myId; } catch { }
}

// Cache date variants to avoid recomputing them for every text node
let _cachedRealDates: string[] | null = null;
let _cachedFakeDates: string[] | null = null;
let _cachedCreatedAt: string | null = null;
let _cachedUsername: string | null = null;
let _cachedGlobalName: string | null = null;

function refreshCachedVariantData() {
    try {
        if (_trueOriginalUser) {
            _realUsername = _trueOriginalUser.username || _realUsername;
            _realGlobalName = _trueOriginalUser.globalName || _realGlobalName;
        }
    } catch { }
    _cachedUsername = storedData.username || null;
    _cachedGlobalName = storedData.globalName || null;
    if (storedData.createdAt) {
        if (_cachedCreatedAt !== storedData.createdAt) {
            _cachedRealDates = getRealDateVariants();
            _cachedFakeDates = getFakeDateVariants(storedData.createdAt);
            _cachedCreatedAt = storedData.createdAt;
        }
    } else {
        _cachedRealDates = null;
        _cachedFakeDates = null;
        _cachedCreatedAt = null;
    }
}

let _domQueued = false;
let _domMutations: MutationRecord[] = [];
const MAX_BATCH_SIZE = 200;
const TEXT_NODE_MIN_LENGTH = 2;

function scanTextNode(node: Text) {
    if (!isEnabled || !node.nodeValue || node.nodeValue.length < TEXT_NODE_MIN_LENGTH) return;
    const val = (node as any).__cp_orig || node.nodeValue;
    const v = node.nodeValue;
    if (v === val) return;
    let result = v;
    let replaced = false;
    if (_cachedRealDates && _cachedFakeDates) {
        for (let i = 0; i < _cachedRealDates.length; i++) {
            const realDate = _cachedRealDates[i];
            if (realDate.length >= 4 && (v.includes(realDate) || v.toLowerCase().includes(realDate.toLowerCase()))) {
                result = result.split(realDate).join(_cachedFakeDates[0]); replaced = true;
            }
        }
    }
    if (_cachedUsername && result.includes(_cachedUsername)) { result = result.split(_cachedUsername).join(storedData.username); replaced = true; }
    if (_cachedGlobalName && result.includes(_cachedGlobalName)) { result = result.split(_cachedGlobalName).join(storedData.globalName); replaced = true; }
    if (replaced && result !== node.nodeValue) { if ((node as any).__cp_orig === undefined) (node as any).__cp_orig = val; node.nodeValue = result; }
}

function scanNode(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) { scanTextNode(node as Text); return; }
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    let n: Node | null;
    while ((n = walker.nextNode())) scanTextNode(n as Text);
}

function processDomBatch() {
    _domQueued = false;
    if (!isEnabled) { _domMutations = []; return; }
    refreshCachedVariantData();
    const batch = _domMutations.slice(0, MAX_BATCH_SIZE);
    if (batch.length < _domMutations.length) _domMutations = _domMutations.slice(batch.length);
    else _domMutations = [];
    for (const m of batch) {
        if (m.type === "characterData") scanTextNode(m.target as Text);
        else for (let i = 0; i < m.addedNodes.length; i++) scanNode(m.addedNodes[i]);
    }
}

function startDomObserver() {
    stopDomObserver(); if (!isEnabled) return;
    refreshCachedVariantData();
    requestAnimationFrame(() => {
        if (!isEnabled) return;
        scanNode(document.body);
    });
    domObserver = new MutationObserver(mutations => {
        if (!isEnabled || !mutations.length) return;
        _domMutations.push(...mutations);
        if (!_domQueued) {
            _domQueued = true;
            setTimeout(() => requestAnimationFrame(processDomBatch), 16);
        }
    });
    domObserver.observe(document.body, { childList: true, subtree: true, characterData: true });
}

function stopDomObserver() {
    domObserver?.disconnect(); domObserver = null;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n: Node | null;
    while ((n = walker.nextNode())) { if ((n as any).__cp_orig !== undefined) { n.nodeValue = (n as any).__cp_orig; delete (n as any).__cp_orig; } }
}

function isMe(userId: string | null | undefined): boolean {
    if (!userId) return false;
    if (_cachedMyId) return _cachedMyId === userId;
    try { const myId = AuthenticationStore?.getId?.(); if (myId) { _cachedMyId = myId; return myId === userId; } } catch { }
    return false;
}

function EditIcon({ size = 18 }: { size?: number; }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" /></svg>;
}
function FolderIcon() {
    return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8l-2-2Z" /></svg>;
}
function CloseIcon() {
    return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>;
}
function TrashIcon() {
    return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2h4a1 1 0 1 1 0 2h-1.1l-.9 12.1A3 3 0 0 1 17 23H7a3 3 0 0 1-3-2.9L3.1 8H2a1 1 0 0 1 0-2h4V4Zm2 0v2h6V4H9ZM5.1 8l.9 11.9a1 1 0 0 0 1 .1h6a1 1 0 0 0 1-.1L14.9 8H5.1Z" /></svg>;
}
function SaveIcon() {
    return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7l-4-4Zm-5 16a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm3-10H5V5h10v4Z" /></svg>;
}

function BookmarkIcon() {
    return <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17 2H7a2 2 0 0 0-2 2v18l7-3 7 3V4a2 2 0 0 0-2-2Z" /></svg>;
}
function AddPresetIcon() {
    return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>;
}

function PresetsBar({ accountId, currentData, onLoad }: {
    accountId: string;
    currentData: CustomProfileData;
    onLoad: (data: CustomProfileData) => void;
}) {
    const [presets, setPresets] = React.useState<SavedPreset[]>(() => allPresetsData[accountId] ?? []);
    const [naming, setNaming] = React.useState(false);
    const [newName, setNewName] = React.useState("");
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        setPresets(allPresetsData[accountId] ?? []);
        setNaming(false);
        setNewName("");
    }, [accountId]);

    function persist(updated: SavedPreset[]) {
        allPresetsData[accountId] = updated;
        DataStore.set(DS_PRESETS, allPresetsData).catch(() => { });
        savePresetsSync();
        setPresets(updated);
    }

    function savePreset() {
        const name = newName.trim();
        if (!name) return;
        persist([...presets, { name, data: { ...currentData } }]);
        setNaming(false);
        setNewName("");
    }

    function deletePreset(idx: number) {
        persist(presets.filter((_, i) => i !== idx));
    }

    if (presets.length === 0 && !naming) {
        return (
            <div className="cp-presets-bar cp-presets-bar--empty">
                <BookmarkIcon />
                <span className="cp-presets-hint">{t("No saved presets")}</span>
                <button className="cp-preset-add" onClick={() => { setNaming(true); setTimeout(() => inputRef.current?.focus(), 50); }} title={t("Save current as preset")}>
                    <AddPresetIcon /><span>{t("Save preset")}</span>
                </button>
            </div>
        );
    }

    return (
        <div className="cp-presets-bar">
            <div className="cp-presets-scroll">
                {presets.map((p, i) => (
                    <div key={i} className="cp-preset-chip" title={t("Click to load")} onClick={() => onLoad({ ...p.data })}>
                        <BookmarkIcon />
                        <span className="cp-preset-name">{p.name}</span>
                        <button className="cp-preset-del" title={t("Delete preset")} onClick={e => { e.stopPropagation(); deletePreset(i); }}>
                            <CloseIcon />
                        </button>
                    </div>
                ))}
                {naming ? (
                    <div className="cp-preset-naming">
                        <input
                            ref={inputRef}
                            className="cp-input cp-preset-name-input"
                            placeholder={t("Preset name...")}
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter") savePreset(); if (e.key === "Escape") { setNaming(false); setNewName(""); } }}
                            maxLength={32}
                        />
                        <button className="cp-btn cp-btn-primary cp-preset-confirm" onClick={savePreset} title={t("Confirm")}><SaveIcon /></button>
                        <button className="cp-clear-btn" onClick={() => { setNaming(false); setNewName(""); }} title={t("Cancel")}><CloseIcon /></button>
                    </div>
                ) : (
                    <button className="cp-preset-add" onClick={() => { setNaming(true); setTimeout(() => inputRef.current?.focus(), 50); }} title={t("Save current as preset")}>
                        <AddPresetIcon /><span>{t("Save preset")}</span>
                    </button>
                )}
            </div>
        </div>
    );
}

function SectionLabel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties; }) {
    return <div className="cp-section-label" style={style}>{children}</div>;
}

function Field({ label, value, placeholder, onChange, type = "text" }: {
    label: string; value: string; placeholder?: string; onChange: (v: string) => void; type?: string;
}) {
    return (
        <div className="cp-field">
            <SectionLabel>{label}</SectionLabel>
            <input className="cp-input" type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} />
        </div>
    );
}

function ImageUpload({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void; }) {
    const fileRef = React.useRef<HTMLInputElement>(null);
    function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => { if (ev.target?.result) onChange(ev.target.result as string); };
        reader.readAsDataURL(file);
    }
    return (
        <div className="cp-field">
            <SectionLabel>{label}</SectionLabel>
            <div className="cp-image-row">
                <input className="cp-input cp-url-input" placeholder={t("Image URL...")} value={value.startsWith("data:") ? "" : value} onChange={e => onChange(e.target.value)} />
                <button className="cp-file-btn" onClick={() => fileRef.current?.click()} title={t("Choose a file")}><FolderIcon /></button>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
                {value && <>
                    <img src={value} alt="" className="cp-preview-avatar" />
                    <button className="cp-clear-btn" onClick={() => onChange("")} title={t("Delete")}><CloseIcon /></button>
                </>}
            </div>
        </div>
    );
}

function Toggle({ label, checked, onChange, sublabel }: { label: string; checked: boolean; onChange: (v: boolean) => void; sublabel?: string; }) {
    return (
        <div className="cp-toggle-row" onClick={() => onChange(!checked)}>
            <div className="cp-toggle-text">
                <span className="cp-toggle-label">{label}</span>
                {sublabel && <span className="cp-toggle-sub">{sublabel}</span>}
            </div>
            <div className={`cp-toggle ${checked ? "cp-toggle--on" : ""}`}><div className="cp-toggle-thumb" /></div>
        </div>
    );
}

function BadgeBtn({ label, icon, active, onClick }: { label: string; icon?: string; active: boolean; onClick: () => void; }) {
    return (
        <button onClick={onClick} className={`cp-badge ${active ? "cp-badge--on" : ""}`}
            style={{ display: "flex", alignItems: "center", gap: 5 }}>
            {icon && <img src={icon} alt="" style={{ width: 16, height: 16, objectFit: "contain", flexShrink: 0 }} />}
            <span>{label}</span>
        </button>
    );
}

function BadgePicker({ selected, onChange, nitroType, onNitroType, boostLevel, onBoostLevel, customIds, onCustomIds, oldName, onOldName }: {
    selected: number; onChange: (v: number) => void;
    nitroType: number; onNitroType: (v: number) => void;
    boostLevel: number; onBoostLevel: (v: number) => void;
    customIds: string[]; onCustomIds: (v: string[]) => void;
    oldName: string; onOldName: (v: string) => void;
}) {
    const hasOldName = customIds.includes("oldname");
    return (
        <div className="cp-field">
            <SectionLabel>{t("Badges")}</SectionLabel>
            <div className="cp-badges">
                {BADGES.map(b => (
                    <BadgeBtn key={b.flag} label={b.label} icon={b.icon}
                        active={!!(selected & b.flag)} onClick={() => onChange(selected ^ b.flag)} />
                ))}
            </div>
            <SectionLabel style={{ marginTop: 8 }}>{t("Evolving Nitro Badge")}</SectionLabel>
            <div className="cp-badges">
                <BadgeBtn label={t("None")} active={nitroType === -1} onClick={() => onNitroType(-1)} />
                {NITRO_LEVELS.map((n, i) => (
                    <BadgeBtn key={i} label={n.label} icon={n.icon} active={nitroType === i} onClick={() => {
                        onNitroType(i);
                        // Reset boost when selecting nitro type manually if desired,
                        // but usually these are separate.
                    }} />
                ))}
            </div>
            <SectionLabel style={{ marginTop: 8 }}>{t("Special Badges")}</SectionLabel>
            <div className="cp-badges">
                <BadgeBtn label={t("Completed a quest")}
                    icon="https://cdn.discordapp.com/badge-icons/7d9ae358c8c5e118768335dbe68b4fb8.png"
                    active={customIds.includes("quest")}
                    onClick={() => onCustomIds(customIds.includes("quest") ? customIds.filter(x => x !== "quest") : [...customIds, "quest"])} />
                <BadgeBtn label={t("Orbs — Apprentice")}
                    icon="https://cdn.discordapp.com/badge-icons/83d8a1eb09a8d64e59233eec5d4d5c2d.png"
                    active={customIds.includes("orbs")}
                    onClick={() => onCustomIds(customIds.includes("orbs") ? customIds.filter(x => x !== "orbs") : [...customIds, "orbs"])} />
                <BadgeBtn label={t("Old username")} icon={OLD_NAME_BADGE_ICON} active={hasOldName}
                    onClick={() => onCustomIds(hasOldName ? customIds.filter(x => x !== "oldname") : [...customIds, "oldname"])} />
                <BadgeBtn label={t("April Fools 2026 - Level 4")} icon="https://cdn.discordapp.com/badge-icons/ca105ad9cfc8580c765101d17bbb2323.png"
                    active={customIds.includes("aprilfools2026")}
                    onClick={() => onCustomIds(customIds.includes("aprilfools2026") ? customIds.filter(x => x !== "aprilfools2026") : [...customIds, "aprilfools2026"])} />
                <BadgeBtn label={t("Gifting Patron")} icon="https://github.com/mezotv/discord-badges/raw/main/assets/gifting/patron.png"
                    active={customIds.includes("giftingpatron")}
                    onClick={() => onCustomIds(customIds.includes("giftingpatron") ? customIds.filter(x => x !== "giftingpatron") : [...customIds, "giftingpatron"])} />
                <BadgeBtn label={t("Gifting Champion")} icon="https://github.com/mezotv/discord-badges/raw/main/assets/gifting/champion.png"
                    active={customIds.includes("giftingchampion")}
                    onClick={() => onCustomIds(customIds.includes("giftingchampion") ? customIds.filter(x => x !== "giftingchampion") : [...customIds, "giftingchampion"])} />
                <BadgeBtn label={t("Gifting Luminary")} icon="https://github.com/mezotv/discord-badges/raw/main/assets/gifting/luminary.png"
                    active={customIds.includes("giftingluminary")}
                    onClick={() => onCustomIds(customIds.includes("giftingluminary") ? customIds.filter(x => x !== "giftingluminary") : [...customIds, "giftingluminary"])} />
                <BadgeBtn label={t("Gifting Icon")} icon="https://github.com/mezotv/discord-badges/raw/main/assets/gifting/icon.png"
                    active={customIds.includes("giftingicon")}
                    onClick={() => onCustomIds(customIds.includes("giftingicon") ? customIds.filter(x => x !== "giftingicon") : [...customIds, "giftingicon"])} />
                <BadgeBtn label={t("Gifting Hero")} icon="https://github.com/mezotv/discord-badges/raw/main/assets/gifting/hero.png"
                    active={customIds.includes("giftinghero")}
                    onClick={() => onCustomIds(customIds.includes("giftinghero") ? customIds.filter(x => x !== "giftinghero") : [...customIds, "giftinghero"])} />
                <BadgeBtn label={t("Gifting Legendary")} icon="https://github.com/mezotv/discord-badges/raw/main/assets/gifting/legend.png"
                    active={customIds.includes("gifting")}
                    onClick={() => onCustomIds(customIds.includes("gifting") ? customIds.filter(x => x !== "gifting") : [...customIds, "gifting"])} />
            </div>
            {hasOldName && (
                <div className="cp-field" style={{ marginTop: 6 }}>
                    <SectionLabel style={{ marginTop: 0 }}>{t("Old username displayed in tooltip")}</SectionLabel>
                    <input className="cp-input" value={oldName} placeholder="OldUser#0000"
                        onChange={e => onOldName(e.target.value)} />
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>
                        {t('Ex: ghxstprey#0666 — will appear as "Old username: ghxstprey#0666" when hovering the badge.')}
                    </div>
                </div>
            )}
            <SectionLabel style={{ marginTop: 8 }}>{t("Boost Badge (Server Booster)")}</SectionLabel>
            <div className="cp-badges">
                <BadgeBtn label={t("None")} active={boostLevel === -1} onClick={() => onBoostLevel(-1)} />
                {BOOST_LABELS.map((lbl, i) => (
                    <BadgeBtn key={i} label={lbl} icon={BOOST_ICONS[i]} active={boostLevel === i} onClick={() => onBoostLevel(i)} />
                ))}
            </div>
        </div>
    );
}

function forceAccountPanelRerender() {
    try {
        const WP = (Vencord as any).Webpack;
        const UserStore = WP?.findByStoreName("UserStore");
        if (UserStore && UserStore.emitChange) UserStore.emitChange();

        // Force UserProfileStore (side profile panel and popouts)
        const UPS = WP?.findByStoreName("UserProfileStore");
        if (UPS && UPS.emitChange) UPS.emitChange();

        // Force MultiAccountStore to re-notify the "Switch Account" switcher
        const MAS = WP?.findByProps?.("getUsers", "getValidUsers", "getHasLoggedInAccounts");
        if (MAS && MAS.emitChange) MAS.emitChange();

        // Dispatch local update without corrupting global store
        // Forces React to re-calculate useCurrentUser hooks
        FluxDispatcher.dispatch({ type: "USER_SETTINGS_PROTO_UPDATE", settings: { type: 1, proto: {} } });

        // Restart full DOM scan
        if (isEnabled) startDomObserver();
        else stopDomObserver();
    } catch { }
}

function CustomProfileModal({ rootProps }: { rootProps: any; }) {
    const myId = AuthenticationStore?.getId?.() || "";
    const [selectedAccountId, setSelectedAccountId] = React.useState(myId);
    const [data, setData] = React.useState<CustomProfileData>(() => ({ ...(allAccountsData[myId] || storedData || {}) }));
    const [saving, setSaving] = React.useState(false);
    const nitroLevel = data.nitroLevel ?? -1;
    const boostLevel = data.boostMonths ?? -1;
    const customIds = data.customBadgeIds ?? [];
    const oldName = data.oldName ?? "";

    // Retrieve all connected accounts
    const accounts = React.useMemo(() => {
        try {
            // Tentative 1: via MultiAccountStore global
            const MAS = (window as any).Vencord?.Webpack?.findByProps?.("getUsers", "getValidUsers");
            if (MAS?.getUsers) {
                const users = MAS.getUsers();
                if (Array.isArray(users) && users.length > 0) return users;
            }

            // Tentative 2: via le store interne
            const internalStore = (window as any).Vencord?.Webpack?.findStore?.("MultiAccountStore");
            if (internalStore?.getUsers) {
                const users = internalStore.getUsers();
                if (Array.isArray(users) && users.length > 0) return users;
            }
        } catch (e) { console.error("[CustomProfile] Failed to fetch accounts:", e); }

        const me = UserStore.getCurrentUser();
        // Pour debug: si on ne trouve qu'un compte, on simule quand même pour voir si la barre s'affiche
        return me ? [me, { ...me, id: "debug-placeholder", username: "Second Account?", globalName: "Simulation" }] : [];
    }, []);

    // When changing selected account, load its data
    React.useEffect(() => {
        const newData = allAccountsData[selectedAccountId] || {};
        setData({ ...newData });
    }, [selectedAccountId]);

    function set<K extends keyof CustomProfileData>(key: K, val: CustomProfileData[K]) {
        setData(d => ({ ...d, [key]: val }));
    }

    async function save() {
        try {
            setSaving(true);
            const savedData = { ...data };

            // Save in multi-accounts storage
            allAccountsData[selectedAccountId] = savedData;
            allAccountsEnabled[selectedAccountId] = true;

            // If it's the active account, update globals
            if (selectedAccountId === myId) {
                storedData = savedData;
                isEnabled = true;
                saveDataSync(storedData, true);
                cachedFakeUser = null;
                cachedOriginalUser = null;
                _dataVersion++;
            }

            // Save all in localStorage + IndexedDB
            saveAllDataSync();
            DataStore.set(DS_ALL_DATA, allAccountsData).catch(() => { });
            DataStore.set(DS_ALL_ENABLED, allAccountsEnabled).catch(() => { });

            updateCachedRealData();
            forceAccountPanelRerender();
        } catch (err) {
            console.error("[CustomProfile] save error:", err);
        } finally {
            setSaving(false);
            rootProps.onClose();
        }
    }

    async function reset() {
        delete allAccountsData[selectedAccountId];
        delete allAccountsEnabled[selectedAccountId];

        if (selectedAccountId === myId) {
            storedData = {};
            isEnabled = false;
            saveDataSync({}, false);
            cachedFakeUser = null;
            cachedOriginalUser = null;
            _trueOriginalUser = null;
            _dataVersion++;
        }

        saveAllDataSync();
        DataStore.set(DS_ALL_DATA, allAccountsData).catch(() => { });
        DataStore.set(DS_ALL_ENABLED, allAccountsEnabled).catch(() => { });
        DataStore.set(DS_KEY, {}).catch(() => { });
        DataStore.set(DS_ENABLED, false).catch(() => { });

        forceAccountPanelRerender();
        rootProps.onClose();
    }

    function repair() {
        try {
            cachedFakeUser = null;
            cachedOriginalUser = null;
            _trueOriginalUser = null;
            _dataVersion++;
            loadDataSync();
            forceAccountPanelRerender();
        } catch (err) {
            console.error("[CustomProfile] repair error:", err);
        }
        rootProps.onClose();
    }

    const accentHex = data.accentColor != null ? "#" + data.accentColor.toString(16).padStart(6, "0") : "";

    return (
        <ModalRootAny {...rootProps} size="medium">
            <ModalHeaderAny separator={false}>
                <div className="cp-header">
                    <EditIcon size={16} />
                    <span className="cp-header-title">{t("Custom Profile")}</span>
                </div>
                <div style={{ marginLeft: "auto", marginRight: 8, minWidth: 200 }}>
                    <Select
                        options={accounts.map((acc: any) => ({
                            value: acc.id,
                            label: acc.globalName || acc.username,
                        }))}
                        isSelected={(v: string) => v === selectedAccountId}
                        select={(v: string) => setSelectedAccountId(v)}
                        serialize={(v: string) => v}
                        renderOptionLabel={(o: any) => (
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <img
                                    src={IconUtils.getUserAvatarURL(accounts.find((a: any) => a.id === o.value), false, 20)}
                                    style={{ borderRadius: "50%", width: 20, height: 20 }}
                                />
                                {o.label}
                            </div>
                        )}
                        renderOptionValue={(selected: any[]) => {
                            const option = selected[0];
                            if (!option) return "Select Account";
                            return (
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <img
                                        src={IconUtils.getUserAvatarURL(accounts.find((a: any) => a.id === option.value), false, 20)}
                                        style={{ borderRadius: "50%", width: 20, height: 20 }}
                                    />
                                    {option.label}
                                </div>
                            );
                        }}
                    />
                </div>
                <ModalCloseButtonAny onClick={rootProps.onClose} />
            </ModalHeaderAny>
            <div className="cp-presets-wrapper">
                <PresetsBar accountId={selectedAccountId} currentData={data} onLoad={d => setData({ ...d })} />
            </div>
            <ModalContentAny className="cp-content">
                {/* Account selector bar removed since it's now a Select in the header */}
                <Field label={t("Username")} value={data.username ?? ""} placeholder="my_username_00" onChange={v => set("username", v)} />
                <Field label={t("Display name")} value={data.globalName ?? ""} placeholder="My Name" onChange={v => set("globalName", v)} />
                <ImageUpload label={t("Profile picture")} value={data.avatar ?? ""} onChange={v => set("avatar", v)} />
                <Toggle label={t("Simulate Nitro")} sublabel={t("Enables banner and profile color")} checked={data.nitro ?? false} onChange={v => set("nitro", v)} />
                {data.nitro && <ImageUpload label={t("Banner")} value={data.banner ?? ""} onChange={v => set("banner", v)} />}
                <div className="cp-divider" />
                <Field label={t("Bio")} value={data.bio ?? ""} placeholder={t("My description...")} onChange={v => set("bio", v)} />
                <Field label={t("Pronouns")} value={data.pronouns ?? ""} placeholder={t("he/him")} onChange={v => set("pronouns", v)} />
                <div className="cp-field">
                    <SectionLabel>{t("Profile color (Nitro — gradient possible)")}</SectionLabel>
                    <div className="cp-color-row" style={{ marginBottom: 6 }}>
                        <span style={{ fontSize: 11, color: "var(--text-muted)", marginRight: 6 }}>{t("Color 1")}</span>
                        <input type="color" value={accentHex || "#5865f2"} onChange={e => { const n = parseInt(e.target.value.replace("#", ""), 16); if (!isNaN(n)) set("accentColor", n); }} className="cp-color-swatch" />
                        <input value={accentHex} placeholder="#5865f2" onChange={e => { const h = e.target.value.replace("#", ""); const n = parseInt(h, 16); if (!isNaN(n) && h.length === 6) set("accentColor", n); else if (!e.target.value || e.target.value === "#") set("accentColor", undefined); }} className="cp-input cp-color-input" />
                        {data.accentColor != null && <button className="cp-clear-btn" onClick={() => set("accentColor", undefined)}><CloseIcon /></button>}
                    </div>
                    <div className="cp-color-row">
                        <span style={{ fontSize: 11, color: "var(--text-muted)", marginRight: 6 }}>{t("Color 2")}</span>
                        {(() => {
                            const hex2 = data.accentColor2 != null ? "#" + data.accentColor2.toString(16).padStart(6, "0") : ""; return (<>
                                <input type="color" value={hex2 || "#eb459e"} onChange={e => { const n = parseInt(e.target.value.replace("#", ""), 16); if (!isNaN(n)) set("accentColor2", n); }} className="cp-color-swatch" />
                                <input value={hex2} placeholder="#eb459e (optional)" onChange={e => { const h = e.target.value.replace("#", ""); const n = parseInt(h, 16); if (!isNaN(n) && h.length === 6) set("accentColor2", n); else if (!e.target.value || e.target.value === "#") set("accentColor2", undefined); }} className="cp-input cp-color-input" />
                                {data.accentColor2 != null && <button className="cp-clear-btn" onClick={() => set("accentColor2", undefined)}><CloseIcon /></button>}
                            </>);
                        })()}
                    </div>
                </div>
                <Field label={t("Account creation date")} value={data.createdAt ?? ""} placeholder="2010-06-29" type="date" onChange={v => set("createdAt", v)} />
                <Field label={t("Email address (local display)")} value={data.email ?? ""} placeholder="exemple@mail.com" onChange={v => set("email", v)} />
                <Field label={t("Phone (local display)")} value={data.phone ?? ""} placeholder="+33 6 00 00 00 00" onChange={v => set("phone", v)} />
                <div className="cp-divider" />
                <BadgePicker
                    selected={data.badgeFlags ?? 0} onChange={v => set("badgeFlags", v)}
                    nitroType={nitroLevel} onNitroType={v => {
                        set("nitroLevel", v as any);
                        // Do NOT automatically enable Simulate Nitro here.
                        // The user controls "Simulate Nitro" independently via the toggle.
                        // This allows selecting a nitro badge (e.g. Opal) without
                        // forcing the gradient/banner on.
                    }}
                    boostLevel={boostLevel} onBoostLevel={v => set("boostMonths", v)}
                    customIds={customIds} onCustomIds={v => set("customBadgeIds", v)}
                    oldName={oldName} onOldName={v => set("oldName", v)}
                />
                <div className="cp-divider" />
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <SectionLabel>{t("Avatar decoration")}</SectionLabel>
                </div>
                <div className="cp-badges" style={{ flexWrap: "wrap", gap: 6 }}>
                    <button onClick={() => set("decorationAsset", undefined)}
                        className={`cp-badge ${!data.decorationAsset ? "cp-badge--on" : ""}`} style={{ minWidth: 60 }}>
                        {t("None")}
                    </button>
                    {AVATAR_DECORATIONS.map(dec => (
                        <button key={dec.id}
                            onClick={() => set("decorationAsset", data.decorationAsset === dec.id ? undefined : dec.id)}
                            className={`cp-badge ${data.decorationAsset === dec.id ? "cp-badge--on" : ""}`}
                            title={dec.label} style={{ padding: 3, lineHeight: 0, width: 52, height: 52, borderRadius: 6 }}>
                            <img src={getDecorationUrl(dec.id)} alt={dec.label}
                                style={{ width: 46, height: 46, objectFit: "contain", display: "block" }} />
                        </button>
                    ))}
                </div>
                <div className="cp-divider" />
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <SectionLabel>{t("Profile Effect")}</SectionLabel>
                </div>
                <div className="cp-badges" style={{ flexWrap: "wrap", gap: 6 }}>
                    <button onClick={() => set("profileEffectId", undefined)}
                        className={`cp-badge ${!data.profileEffectId ? "cp-badge--on" : ""}`} style={{ minWidth: 60 }}>
                        {t("None")}
                    </button>
                    {PROFILE_EFFECTS.map(eff => (
                        <button key={eff.id}
                            onClick={() => set("profileEffectId", data.profileEffectId === eff.id ? undefined : eff.id)}
                            className={`cp-badge ${data.profileEffectId === eff.id ? "cp-badge--on" : ""}`}
                            title={eff.label} style={{ padding: 4, minWidth: 60, fontSize: 11, textAlign: "center" }}>
                            {eff.label}
                        </button>
                    ))}
                </div>
                <div className="cp-hint">{t("Persistent between restarts. Email \"plunt@atomicmail.io\" if bugs pop up, use temp mail if you want, makes zero difference to me.")}</div>
            </ModalContentAny>
            <ModalFooterAny className="cp-footer">
                <button className="cp-btn cp-btn-ghost" onClick={rootProps.onClose}>{t("Cancel")}</button>
                <button className="cp-btn cp-btn-danger" onClick={reset}><TrashIcon /><span>{t("Reset")}</span></button>
                <button
                    className="cp-btn"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "var(--text-normal)" }}
                    onClick={repair}
                    title={t("Re-applies your profile without deleting settings")}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm1 14.93V15a1 1 0 0 0-2 0v1.93A8.001 8.001 0 0 1 4.07 13H6a1 1 0 0 0 0-2H4.07A8.001 8.001 0 0 1 11 4.07V6a1 1 0 0 0 2 0V4.07A8.001 8.001 0 0 1 19.93 11H18a1 1 0 0 0 0 2h1.93A8.001 8.001 0 0 1 13 16.93z" />
                    </svg>
                    <span>{t("Repair")}</span>
                </button>
                <button className="cp-btn cp-btn-primary" onClick={save} disabled={saving}><SaveIcon /><span>{saving ? t("Saving...") : t("Save")}</span></button>
            </ModalFooterAny>
        </ModalRootAny>
    );
}

function CustomProfileButton() {
    return <HeaderBarButton icon={<EditIcon size={18} />} tooltip="Custom Profile" onClick={() => openModal(props => <CustomProfileModal rootProps={props} />)} />;
}


// ── Rich badge tooltips (new Discord-style big tooltip) ───────────────────
function BadgeTooltipContent({ name, rarity, subtitle, icon }: { name: string; rarity?: string; subtitle?: string; icon: string; }) {
    const rarityColor = rarity === "MYTHIC" ? "#b77ee0" : rarity === "RARE" ? "#5865f2" : "#99aab5";
    const rarityBg = rarity === "MYTHIC" ? "rgba(183,126,224,0.15)" : rarity === "RARE" ? "rgba(88,101,242,0.15)" : "rgba(153,170,181,0.1)";
    const rarityIcon = rarity === "MYTHIC"
        ? <path fill="currentColor" d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z" />
        : <path fill="currentColor" d="M10.16 4.06a2.13 2.13 0 0 1 3.68 0l8 13.77c.81 1.41-.2 3.17-1.84 3.17H4a2.11 2.11 0 0 1-1.84-3.17l8-13.77Z" />;

    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "6px 4px", textAlign: "center" }}>
            <img src={icon} alt="" style={{ width: 48, height: 48, objectFit: "contain", borderRadius: "50%" }} />
            {rarity && (
                <div style={{
                    display: "flex", alignItems: "center", gap: 4,
                    fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const,
                    letterSpacing: "0.05em", color: rarityColor,
                    background: rarityBg, borderRadius: 20,
                    padding: "3px 10px", border: `1px solid ${rarityColor}40`,
                }}>
                    <svg width="10" height="10" fill="none" viewBox="0 0 24 24">{rarityIcon}</svg>
                    {rarity}
                </div>
            )}
            <div style={{ fontWeight: 700, fontSize: 15, color: "#fff", lineHeight: 1.2 }}>{name}</div>
            {subtitle && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: -4 }}>{subtitle}</div>}
        </div>
    );
}

const badgeStyle: React.CSSProperties = { borderRadius: "50%", width: "22px", height: "22px" };

function mkBadge(id: string, name: string, icon: string, rarity?: string, subtitle?: string): ProfileBadge {
    if (!rarity && !subtitle) {
        return { id, description: name, iconSrc: icon, position: BadgePosition.START, props: { style: badgeStyle } };
    }

    const Tooltip = (Vencord as any).Webpack.Common?.Tooltip;
    if (!Tooltip) {
        return { id, description: subtitle ? `${name}\n${subtitle}` : name, iconSrc: icon, position: BadgePosition.START, props: { style: badgeStyle } };
    }

    return {
        id,
        description: name,
        iconSrc: icon,
        position: BadgePosition.START,
        component: () => (
            <Tooltip text={<BadgeTooltipContent name={name} rarity={rarity} subtitle={subtitle} icon={icon} />}>
                {(tooltipProps: any) => (
                    <img {...tooltipProps} src={icon} alt={name} style={{ ...badgeStyle, cursor: "pointer" }} />
                )}
            </Tooltip>
        ),
    };
}

export default definePlugin({
    name: "CustomProfile",
    enabledByDefault: true,
    tags: ["Sigil"],
    description: t("Entirely change what your profile looks like, locally only."),
    authors: [doiksubDevs.ghxst],
    dependencies: ["HeaderBarAPI", "ContextMenuAPI"],

    patches: [
        {
            find: ':"SHOULD_LOAD");',
            replacement: {
                match: /\i(?:\?)?.getPreviewBanner\(\i,\i,\i\)(?=.{0,100}"COMPLETE")/,
                replace: "$self.patchBannerUrl(arguments[0])||$&"
            }
        },
        // UserProfileStore patch removed — caused invisible channels for members
        // with high permissions. getUserProfile is called by Discord to calculate
        // VIEW_CHANNEL and other permissions. virtualMerge with premiumType:2 corrupted
        // these calculations even with isMe() guard. DomObserver + fakeCurrentUser are enough.
        {
            find: ".WIDGETS_RTC_UPSELL_COACHMARK)",
            replacement: {
                match: /currentUser:(\i)(?=.{0,200}voiceDb)/,
                replace: "currentUser:$self.fakeCurrentUser($1)"
            }
        },
        {
            find: "DISPLAY_NAME",
            noWarn: true,
            replacement: {
                match: /(?<=currentUser:\i,user:)(\i)/,
                replace: "$self.fakeCurrentUser($1)"
            }
        },
        {
            find: "obfuscatedEmail",
            noWarn: true,
            replacement: [
                {
                    match: /obfuscatedEmail:(\i)/,
                    replace: "obfuscatedEmail:$self.fakeObfuscatedEmail($1)"
                },
                {
                    match: /obfuscatedPhone:(\i)/,
                    replace: "obfuscatedPhone:$self.fakeObfuscatedPhone($1)"
                }
            ]
        },
        {
            find: "isHoveringOrFocusing",
            replacement: [
                {
                    noWarn: true,
                    match: /user:([A-Za-z_$][\w$]*),displayProfile:([A-Za-z_$][\w$]*),themeType/,
                    replace: "user:$self.fakeCurrentUser($1),displayProfile:$2,themeType"
                }
            ]
        },
        {
            find: "AccountPanel",
            replacement: [
                {
                    match: /user:([a-zA-Z0-9_]+),/,
                    replace: "user:$self.fakeCurrentUser($1),"
                }
            ]
        },
        {
            find: "UserAccountSettings",
            replacement: [
                {
                    match: /user:([a-zA-Z0-9_]+),/,
                    replace: "user:$self.fakeCurrentUser($1),"
                },
                {
                    match: /email:([^,}]+),/,
                    replace: "email:$self.fakeObfuscatedEmail($1),"
                }
            ]
        },
        {
            find: "getObfuscatedEmail",
            replacement: [
                {
                    match: /obfuscatedEmail:([^,}]+)/g,
                    replace: "obfuscatedEmail:$self.fakeObfuscatedEmail($1)"
                },
                {
                    match: /obfuscatedPhone:([^,}]+)/g,
                    replace: "obfuscatedPhone:$self.fakeObfuscatedPhone($1)"
                }
            ]
        },
        {
            find: "=!1,canUsePremiumCustomization:",
            replacement: {
                match: /(\i)\.premiumType/,
                replace: "$self.premiumTypeHook($1)||$&"
            }
        }
    ],

    _copiedUserId: null as string | null,

    isCopiedUser(userId: string | null | undefined): boolean {
        if (!isEnabled || !userId || !this._copiedUserId) return false;
        return userId === this._copiedUserId;
    },

    fakeCurrentUser(user: any) {
        if (!user || (!isEnabled && this._forceNative !== true) || !isMe(user.id)) return user;

        // Fast cache: if same user + same data, return existing clone
        if (cachedOriginalUser === user && cachedFakeUser && cachedDataHash === _dataVersion) {
            return cachedFakeUser;
        }

        // Retrieve real original user (never a clone)
        const realUser = (user as any).__cp_isClone ? _trueOriginalUser || user : user;
        if (!realUser.__cp_isClone) _trueOriginalUser = realUser;

        // Read real values once
        const realUsername = realUser.__cp_isClone ? (realUser._realUsername || realUser.username) : realUser.username;
        const realGlobalName = realUser.__cp_isClone ? (realUser._realGlobalName ?? realUser.globalName) : realUser.globalName;
        const realDisplayName = realUser.__cp_isClone ? (realUser._realDisplayName ?? realUser.displayName) : realUser.displayName;

        const clone = Object.create(Object.getPrototypeOf(realUser));

        // Copy properties except username/globalName/displayName
        for (const key of Reflect.ownKeys(realUser)) {
            if (key === "username" || key === "globalName" || key === "displayName" || key === "__cp_isClone") continue;
            const desc = Object.getOwnPropertyDescriptor(realUser, key);
            if (desc) Object.defineProperty(clone, key, desc);
        }
        Object.defineProperty(clone, "__cp_isClone", { value: true, enumerable: false, configurable: true });
        // Store real values on clone for next cycles
        clone._realUsername = realUsername;
        clone._realGlobalName = realGlobalName;
        clone._realDisplayName = realDisplayName;

        if (!isEnabled) {
            clone.username = realUsername;
            clone.globalName = realGlobalName;
            clone.displayName = realDisplayName;
            cachedOriginalUser = user;
            cachedFakeUser = clone;
            cachedDataHash = _dataVersion;
            return clone;
        }

        const fakeUser = storedData.username || realUsername;
        const hasCustomGlobalName = !!storedData.globalName;
        const fakeGlobal = hasCustomGlobalName ? storedData.globalName : realGlobalName;
        const origDisplay = realGlobalName || realDisplayName || realUsername;
        const fakeDisplay = hasCustomGlobalName ? (storedData.globalName || origDisplay) : origDisplay;

        Object.defineProperty(clone, "username", {
            get: () => isEnabled ? fakeUser : realUsername,
            set: () => { }, configurable: true, enumerable: true
        });
        Object.defineProperty(clone, "globalName", {
            get: () => isEnabled ? fakeGlobal : realGlobalName,
            set: () => { }, configurable: true, enumerable: true
        });
        Object.defineProperty(clone, "displayName", {
            get: () => isEnabled ? fakeDisplay : (realDisplayName || realGlobalName || realUsername),
            set: () => { }, configurable: true, enumerable: true
        });

        if (storedData.email) clone.email = storedData.email;
        if (storedData.phone) clone.phone = storedData.phone;

        clone.getTag = () => (storedData.username || realUsername) + "#0000";
        clone.getGlobalName = () => isEnabled ? fakeGlobal : realGlobalName;
        clone.toString = () => fakeDisplay;

        // Override createdAt: Discord calculates it from the Snowflake ID via a prototype getter
        // We redefine it directly on the clone so Discord displays the fake date
        // without needing to scan the DOM.
        if (storedData.createdAt) {
            const fakeCreatedAt = new Date(storedData.createdAt + "T12:00:00Z");
            Object.defineProperty(clone, "createdAt", {
                get: () => fakeCreatedAt,
                configurable: true,
                enumerable: true
            });
        }

        if (storedData.decorationAsset) {
            const decoData = {
                asset: storedData.decorationAsset,
                skuId: storedData.decorationAsset
            };
            clone.avatarDecoration = null;
            clone.avatarDecorationData = decoData;
        }

        // Override flags/nitro/boost so Discord doesn't show real native badges.
        // Only override publicFlags when the user has explicitly selected flag badges
        // (non-zero). When badgeFlags is 0 or undefined, preserve real flags so native
        // badges still show. Custom badges are handled by userProfileBadges.
        if (isEnabled && storedData.badgeFlags) {
            clone.publicFlags = storedData.badgeFlags;
            clone.flags = storedData.badgeFlags;
        }

        if (isEnabled && storedData.nitro) {
            clone.premiumType = 2;
            const LEVEL_MONTHS = [1, 2, 3, 6, 12, 24, 36, 72];
            const since = new Date();
            since.setMonth(since.getMonth() - (LEVEL_MONTHS[storedData.nitroLevel!] ?? 1));
            clone.premiumSince = since;

            const bm = storedData.boostMonths ?? -1;
            if (bm >= 0) {
                const BOOST_M = [1, 2, 3, 6, 9, 12, 15, 18, 24];
                const boostSince = new Date();
                boostSince.setMonth(boostSince.getMonth() - (BOOST_M[bm] ?? 1));
                clone.premiumGuildSince = boostSince;
            } else {
                clone.premiumGuildSince = null;
            }
        } else if (isEnabled) {
            // Si le plugin est activé mais Nitro simulation OFF
            // On force la suppression des badges Nitro/Boost si demandés ou si simulés par erreur
            if (storedData.nitro === false) {
                clone.premiumType = 0;
                clone.premiumSince = null;
                clone.premiumGuildSince = null;
            }
        }

        // Save real values for next cloning cycle
        if (!realUser.__cp_isClone) {
            clone._realPremiumType = realUser.premiumType;
            clone._realPremiumSince = realUser.premiumSince;
            clone._realPremiumGuildSince = realUser.premiumGuildSince;
        }

        cachedOriginalUser = user;
        cachedFakeUser = clone;
        cachedDataHash = _dataVersion;

        return clone;
    },

    _cachedProfile: null as any,
    _cachedProfileInput: null as any,
    _cachedProfileVersion: 0,

    hookUserProfile(profile: any) {
        if (!profile || !isEnabled) return profile;
        // Cache: if same profile + same data version
        if (this._cachedProfileInput === profile && this._cachedProfile && this._cachedProfileVersion === _dataVersion) {
            return this._cachedProfile;
        }
        try {
            const merged: any = {};

            if (storedData.bio) merged.bio = storedData.bio;
            if (storedData.pronouns) merged.pronouns = storedData.pronouns;
            if (storedData.accentColor != null) merged.accentColor = storedData.accentColor;
            if (storedData.banner) merged.banner = storedData.banner;

            if (storedData.decorationAsset) {
                const decoData = {
                    asset: storedData.decorationAsset,
                    skuId: storedData.decorationAsset
                };
                merged.avatarDecoration = null;
                merged.avatarDecorationData = decoData;
            }

            if (storedData.profileEffectId) {
                merged.profileEffectId = storedData.profileEffectId;
                merged.profileEffect = { expireAt: null, skuId: storedData.profileEffectId };
                if (!merged.premiumType) merged.premiumType = 2;
            }

            // Only enter this block when there's actually something to override:
            // - storedData.nitro is true (simulate nitro)
            // - storedData.badgeFlags is truthy (non-zero, user selected flag badges)
            // If badgeFlags is 0 or undefined, skip entirely to preserve real profile values.
            if (isEnabled && (storedData.nitro || storedData.badgeFlags)) {
                merged.premiumType = storedData.nitro ? 2 : 0;

                if (storedData.nitro) {
                    if (storedData.accentColor != null) {
                        const c2 = storedData.accentColor2 ?? storedData.accentColor;
                        merged.themeColors = [storedData.accentColor, c2];
                    }
                    const nl = storedData.nitroLevel ?? 0;
                    const LEVEL_MONTHS = [1, 2, 3, 6, 12, 24, 36, 72];
                    const since = new Date();
                    since.setMonth(since.getMonth() - (LEVEL_MONTHS[nl] ?? 1));
                    merged.premiumSince = since;

                    const bm = storedData.boostMonths ?? -1;
                    if (bm >= 0) {
                        const BOOST_M = [1, 2, 3, 6, 9, 12, 15, 18, 24];
                        const boostSince = new Date();
                        boostSince.setMonth(boostSince.getMonth() - (BOOST_M[bm] ?? 1));
                        merged.premiumGuildSince = boostSince;
                    } else {
                        merged.premiumGuildSince = null;
                    }
                } else {
                    merged.premiumSince = null;
                    merged.premiumGuildSince = null;
                }

                // Only override publicFlags when the user has explicitly selected flag badges
                // (non-zero). When badgeFlags is 0 or undefined, preserve real flags so native
                // badges still show. Custom badges are handled by userProfileBadges.
                if (storedData.badgeFlags) {
                    merged.publicFlags = storedData.badgeFlags;
                }
                // Do NOT set merged.badges = [] here — that would wipe out badges added by
                // userProfileBadges and cause "all badges disappear" when enabling a single badge.
            } else if (isEnabled && storedData.nitro === false) {
                // Si Nitro simulation est OFF, on force la suppression des badges simulés
                merged.premiumType = profile.premiumType ?? 0;
                merged.premiumSince = profile.premiumSince ?? null;
                merged.premiumGuildSince = profile.premiumGuildSince ?? null;
            } else {
                // BACKPORT FIX : Never force to 0 or null if Nitro is not simulated.
                if (profile.premiumType) merged.premiumType = profile.premiumType;
                if (profile.premiumSince) merged.premiumSince = profile.premiumSince;
                if (profile.premiumGuildSince) merged.premiumGuildSince = profile.premiumGuildSince;
            }

            const result = virtualMerge(profile, merged);
            this._cachedProfileInput = profile;
            this._cachedProfile = result;
            this._cachedProfileVersion = _dataVersion;
            return result;
        } catch {
            return profile;
        }
    },

    fakeObfuscatedEmail(real: string | null) {
        if (!isEnabled || !storedData.email || !real) return real;
        // Discord often expects to see s***@d***.com format
        const fake = storedData.email;
        const atIdx = fake.indexOf("@");
        if (atIdx <= 1) return fake;
        return fake[0] + "***" + fake.slice(atIdx - 1);
    },

    fakeObfuscatedPhone(real: string | null) {
        if (!isEnabled || !storedData.phone || !real) return real;
        const fake = storedData.phone;
        if (fake.length < 4) return fake;
        return "***-***-" + fake.slice(-4);
    },

    premiumTypeHook({ userId }: any) {
        try {
            const myId = AuthenticationStore?.getId?.();
            // Always unlock premium UI (display name style, profile customization,
            // premium selectors) for the current user.
            if (myId && userId === myId) return 2;
        } catch { }
        return undefined;
    },

    patchBannerUrl({ displayProfile }: any) {
        if (!isEnabled || !storedData.nitro || !storedData.banner) return null;
        try { return isMe(displayProfile?.userId) ? storedData.banner : null; } catch { return null; }
    },

    toolboxActions: {
        [t("Open Custom Profile")]() { openModal(props => <CustomProfileModal rootProps={props} />); },
    },

    _origGetUserAvatarURL: null as any,
    _origExtractTimestamp: null as any,
    _forceNative: false, // Tool variable for local reset

    async start() {
        applyAvatarPatchEarly();
        addHeaderBarButton("custom-profile-btn", () => <CustomProfileButton />, 10);
        addContextMenuPatch("user-context", userContextMenuPatch);

        // Listen for account changes to sync data
        FluxDispatcher.subscribe("CONNECTION_OPEN", onAccountSwitch);

        // PERFECT AND SECURE NATIVE INTERCEPTION ON USER STORE.
        try {
            const US = (Vencord as any).Webpack?.findByProps?.("getCurrentUser", "getUser");
            if (US && !US._cp_perfect_hook) {
                const origCurrent = US.getCurrentUser.bind(US);

                // Fast-path cache: skip clone work if user object + data version are unchanged
                let _lastRealUser: any = null;
                let _lastFakeResult: any = null;
                let _lastCacheVersion = -1;

                US.getCurrentUser = () => {
                    const realUser = origCurrent();
                    if (realUser) {
                        // Update name cache only when the user object itself changes
                        if (realUser !== _lastRealUser) {
                            if (realUser.username) _realUsername = realUser.username;
                            if (realUser.globalName) _realGlobalName = realUser.globalName;
                        }
                        // Return cached clone if nothing changed
                        if (realUser === _lastRealUser && _lastCacheVersion === _dataVersion && _lastFakeResult) {
                            return _lastFakeResult;
                        }
                        _lastRealUser = realUser;
                        _lastCacheVersion = _dataVersion;
                        _lastFakeResult = this.fakeCurrentUser(realUser);
                        return _lastFakeResult;
                    }
                    return this.fakeCurrentUser(realUser);
                };

                const origGet = US.getUser.bind(US);
                US.getUser = (id: string) => isMe(id) ? this.fakeCurrentUser(origGet(id)) : origGet(id);
                US._cp_perfect_hook = true;
            }
        } catch { }

        // INTERCEPTION ON UserProfileStore (for native Nitro/Boost badges in popout/modal profile)
        try {
            const UPS = (Vencord as any).Webpack?.findByProps?.("getUserProfile", "getGuildMemberProfile");
            if (UPS && !UPS._cp_profile_hook) {
                const origGetProfile = UPS.getUserProfile.bind(UPS);
                UPS.getUserProfile = (userId: string) => {
                    try {
                        const profile = origGetProfile(userId);
                        if (!isEnabled || !userId || !isMe(userId) || !profile) return profile;
                        return this.hookUserProfile(profile);
                    } catch (e) {
                        console.error("[CustomProfile] Error in getUserProfile hook:", e);
                        return origGetProfile(userId);
                    }
                };
                const origGetGuild = UPS.getGuildMemberProfile.bind(UPS);
                UPS.getGuildMemberProfile = (userId: string, guildId: string) => {
                    try {
                        const profile = origGetGuild(userId, guildId);
                        if (!isEnabled || !userId || !isMe(userId) || !profile) return profile;
                        return this.hookUserProfile(profile);
                    } catch (e) {
                        console.error("[CustomProfile] Error in getGuildMemberProfile hook:", e);
                        return origGetGuild(userId, guildId);
                    }
                };
                UPS._cp_profile_hook = true;
            }
        } catch { }

        // INTERCEPTION ON MULTI ACCOUNT STORE (For the "Switch Account" menu)
        // Applies custom usernames for ALL accounts in the switcher
        try {
            const WP = (Vencord as any).Webpack;
            const MAS = WP?.findByProps?.("getUsers", "getValidUsers", "getHasLoggedInAccounts");
            if (MAS && !MAS._cp_perfect_hook) {
                function patchAccountUser(u: any) {
                    if (!u?.id) return u;
                    const acctData = allAccountsData[u.id];
                    const acctEnabled = allAccountsEnabled[u.id];
                    if (!acctData || !acctEnabled) return u;
                    const patched: any = { ...u };
                    if (acctData.username) patched.username = acctData.username;
                    if (acctData.globalName) patched.globalName = acctData.globalName;
                    return patched;
                }

                if (MAS.getUsers) {
                    const origGetUsers = MAS.getUsers.bind(MAS);
                    MAS.getUsers = () => {
                        const users = origGetUsers();
                        if (!users || !Array.isArray(users)) return users;
                        return users.map(patchAccountUser);
                    };
                }

                if (MAS.getValidUsers) {
                    const origGetValid = MAS.getValidUsers.bind(MAS);
                    MAS.getValidUsers = () => {
                        const users = origGetValid();
                        if (!users || !Array.isArray(users)) return users;
                        return users.map(patchAccountUser);
                    };
                }

                MAS._cp_perfect_hook = true;
                try { MAS.emitChange?.(); } catch { }
            }
        } catch { }

        // Patch SnowflakeUtils.extractTimestamp pour faker la date de création
        try {
            if (SnowflakeUtils?.extractTimestamp && !this._origExtractTimestamp) {
                this._origExtractTimestamp = SnowflakeUtils.extractTimestamp;
                const origExtract = this._origExtractTimestamp;
                (SnowflakeUtils as any).extractTimestamp = (snowflake: string) => {
                    if (isEnabled && storedData.createdAt && isMe(snowflake)) {
                        return new Date(storedData.createdAt + "T12:00:00Z").getTime();
                    }
                    return origExtract(snowflake);
                };
            }
        } catch { }

        loadData().then(() => {
            updateCachedRealData();
            applyAvatarPatchEarly();
            if (isEnabled) {
                forceAccountPanelRerender();
                requestAnimationFrame(() => removeHideStyle());
            } else {
                removeHideStyle();
            }
        });

        // Patch getAvatarDecorationURL pour injecter notre déco uniquement sur notre user
        try {
            const decoMod = (Vencord as any).Webpack?.findByProps?.("getAvatarDecorationURL");
            if (decoMod?.getAvatarDecorationURL) {
                const origDeco = decoMod.getAvatarDecorationURL.bind(decoMod);
                decoMod.getAvatarDecorationURL = (opts: any) => {
                    try {
                        if (isEnabled && storedData.decorationAsset) {
                            const { avatarDecoration, userId, canAnimate } = opts ?? {};
                            const myId = UserStore.getCurrentUser()?.id;
                            const isOurs = (avatarDecoration?.skuId === "__fake__")
                                || (avatarDecoration?.asset === storedData.decorationAsset)
                                || (userId && userId === myId);
                            if (isOurs) {
                                const asset = storedData.decorationAsset;
                                const dec = AVATAR_DECORATIONS.find(d => d.id === asset);
                                const passthrough = dec ? dec.passthrough : asset.startsWith("a_");
                                return getDecorationUrl(asset, passthrough);
                            }
                        }
                    } catch { }
                    return origDeco(opts);
                };
            }
        } catch { }

        if (IconUtils?.getUserAvatarURL && !_avatarPatchApplied) {
            this._origGetUserAvatarURL = IconUtils.getUserAvatarURL;
            const orig = this._origGetUserAvatarURL;
            (IconUtils as any).getUserAvatarURL = (user: any, ...args: any[]) => {
                if (isEnabled && storedData.avatar) {
                    const uid = user?.id ?? user?.userId;
                    if (uid && isMe(uid)) return storedData.avatar;
                }
                return orig(user, ...args);
            };
            _avatarPatchApplied = true;
        }
    },

    userProfileBadges: [
        {
            id: "cp-badges",
            getBadges({ userId, badges: nativeBadges }: { userId: string; guildId: string; badges: ProfileBadge[]; }) {
                const pd = getProfileDataFor(userId);
                if (!pd) return nativeBadges || [];

                let badges: ProfileBadge[] = [...(nativeBadges || [])];
                const nl = pd.nitroLevel ?? -1;
                const bm = pd.boostMonths ?? -1;
                const hasNitroFake = nl >= 0 && nl < NITRO_LEVELS.length;
                const hasBoostFake = bm >= 0 && bm < BOOST_ICONS.length;
                const wantedFlags = pd.badgeFlags ?? 0;

                // Duplicate filtering (multi-language safe)
                badges = badges.filter(b => {
                    const desc = (b.description || "").toLowerCase();
                    const icon = (b.iconSrc || "").toLowerCase();
                    const nitroKeywords = ["nitro", "subscriber", "abonn", "premium", "inscrit"];
                    if (nitroKeywords.some(k => desc.includes(k))) return false;
                    if (icon.includes("nitro") || icon.includes("premium")) return false;
                    const boostKeywords = ["booster", "boost"];
                    if (boostKeywords.some(k => desc.includes(k))) return false;
                    if (icon.includes("boost") || icon.includes("leveling")) return false;
                    for (const badge of BADGES) {
                        if (wantedFlags & badge.flag) {
                            const badgeKeywords = badge.label.toLowerCase().split(" ");
                            if (badgeKeywords.some(k => k.length > 3 && desc.includes(k))) return false;
                            const iconParts = badge.icon.split("/");
                            const iconName = iconParts[iconParts.length - 1];
                            if (icon.includes(iconName)) return false;
                        }
                    }
                    return true;
                });

                const badgeList: ProfileBadge[] = [];
                // Only override flags when the user explicitly picked non-zero badges,
                // so native badges are preserved when badgeFlags is 0/undefined.
                const wish = (flag: number) => !!wantedFlags && (wantedFlags & flag) !== 0;

                if (wish(FLAG.STAFF)) badgeList.push(mkBadge("cp-staff", "Discord Staff", "https://cdn.discordapp.com/badge-icons/5e74e9b61934fc1f67c65515d1f7e60d.png"));
                if (wish(FLAG.PARTNER)) badgeList.push(mkBadge("cp-partner", "Partnered Server Owner", "https://cdn.discordapp.com/badge-icons/3f9748e53446a137a052f3454e2de41e.png"));
                if (hasNitroFake) badgeList.push(mkBadge("cp-nitro", `Nitro ${NITRO_LEVELS[nl].label.split(" ")[0]}`, NITRO_LEVELS[nl].icon, "RARE", "Subscriber since 10/22/21"));
                if (wish(FLAG.HYPESQUAD)) badgeList.push(mkBadge("cp-hypesquad", "HypeSquad Events", "https://cdn.discordapp.com/badge-icons/bf01d1073931f921909045f3a39fd264.png", "RARE"));
                if (wish(FLAG.BUG_HUNTER_2)) badgeList.push(mkBadge("cp-bh2", "Pro Bug Hunter", "https://cdn.discordapp.com/badge-icons/848f79194d4be5ff5f81505cbd0ce1e6.png", "RARE"));
                if (wish(FLAG.BALANCE)) badgeList.push(mkBadge("cp-balance", "HypeSquad Balance", "https://cdn.discordapp.com/badge-icons/3aa41de486fa12454c3761e8e223442e.png", "RARE"));
                if (wish(FLAG.BRAVERY)) badgeList.push(mkBadge("cp-bravery", "HypeSquad Bravery", "https://cdn.discordapp.com/badge-icons/8a88d63823d8a71cd5e390baa45efa02.png", "RARE"));
                if (wish(FLAG.BRILLIANCE)) badgeList.push(mkBadge("cp-brilliance", "HypeSquad Brilliance", "https://cdn.discordapp.com/badge-icons/011940fd013da3f7fb926e4a1cd2e618.png", "RARE"));
                if (wish(FLAG.BUG_HUNTER_1)) badgeList.push(mkBadge("cp-bh1", "Bug Hunter", "https://cdn.discordapp.com/badge-icons/2717692c7dca7289b35297368a940dd0.png", "RARE"));
                if (wish(FLAG.DEV_VERIFIED)) badgeList.push(mkBadge("cp-dev", "Early Verified Bot Developer", "https://cdn.discordapp.com/badge-icons/6df5892e0f35b051f8b61eace34f4967.png"));
                if (wish(FLAG.MOD_ALUMNI)) badgeList.push(mkBadge("cp-mod", "Moderator Program Alumni", "https://cdn.discordapp.com/badge-icons/fee1624003e2fee35cb398e125dc479b.png"));
                if (wish(FLAG.EARLY_SUPPORTER)) badgeList.push(mkBadge("cp-early", "Early Supporter", "https://cdn.discordapp.com/badge-icons/7060786766c9c840eb3019e725d2b358.png"));
                if (hasBoostFake) badgeList.push(mkBadge("cp-boost", "Server Booster", BOOST_ICONS[bm], "RARE", BOOST_LABELS[bm]));
                if (wish(FLAG.ACTIVE_DEVELOPER)) badgeList.push(mkBadge("cp-active", "Active Developer", "https://cdn.discordapp.com/badge-icons/6bdc42827a38498929a4920da12695d9.png"));

                const cids = pd.customBadgeIds ?? [];
                if (cids.includes("oldname")) badgeList.push(mkBadge("cp-oldname", "Legacy Username", OLD_NAME_BADGE_ICON, undefined, pd.oldName || "OldUser#0000"));
                if (cids.includes("automod")) badgeList.push(mkBadge("cp-automod", "Automod", "https://raw.githubusercontent.com/ghxstprey/doiksub/raw/main/assets/automod.png"));
                if (cids.includes("has_commands")) badgeList.push(mkBadge("cp-has-commands", "Has Commands", "https://raw.githubusercontent.com/ghxstprey/doiksub/raw/main/assets/has_commands.png"));
                if (cids.includes("quest")) badgeList.push(mkBadge("cp-quest", "Quests", "https://cdn.discordapp.com/badge-icons/7d9ae358c8c5e118768335dbe68b4fb8.png"));
                if (cids.includes("orbs")) badgeList.push(mkBadge("cp-orbs", "Orbs Apprentice", "https://cdn.discordapp.com/badge-icons/83d8a1eb09a8d64e59233eec5d4d5c2d.png"));
                if (cids.includes("aprilfools2026")) badgeList.push(mkBadge("cp-april", "April Fools 2026 - Level 4", "https://cdn.discordapp.com/badge-icons/ca105ad9cfc8580c765101d17bbb2323.png", "RARE", "Level 4 Reached"));
                if (cids.includes("meadow")) badgeList.push(mkBadge("cp-meadow", "Last Meadow", "https://cdn.discordapp.com/badge-icons/ca105ad9cfc8580c765101d17bbb2323.png", "RARE", "Level 100 Reached"));
                if (cids.includes("clown")) badgeList.push(mkBadge("cp-clown", "A Clown", "https://raw.githubusercontent.com/ghxstprey/doiksub/assets/a_clown.png"));
                if (cids.includes("premiumbot")) badgeList.push(mkBadge("cp-premiumbot", "Premium Bot", "https://raw.githubusercontent.com/PandaDevOfficial/badges-discord/5eba6290f524185e5e141fc3262295ad1a4f521f/assets/premiumbot.png"));

                const giftStyle: React.CSSProperties = { width: "24px", height: "24px", objectFit: "contain", mixBlendMode: "screen" as any, borderRadius: 0 };
                const mkGift = (id: string, name: string, icon: string): ProfileBadge => ({ id, description: name, iconSrc: icon, position: BadgePosition.START, props: { style: giftStyle } });
                if (cids.includes("giftingpatron")) badgeList.push(mkGift("cp-g-patron", "Gifting Patron", "https://github.com/mezotv/discord-badges/raw/main/assets/gifting/patron.png"));
                if (cids.includes("giftingchampion")) badgeList.push(mkGift("cp-g-champion", "Gifting Champion", "https://github.com/mezotv/discord-badges/raw/main/assets/gifting/champion.png"));
                if (cids.includes("giftingluminary")) badgeList.push(mkGift("cp-g-luminary", "Gifting Luminary", "https://github.com/mezotv/discord-badges/raw/main/assets/gifting/luminary.png"));
                if (cids.includes("giftingicon")) badgeList.push(mkGift("cp-g-icon", "Gifting Icon", "https://github.com/mezotv/discord-badges/raw/main/assets/gifting/icon.png"));
                if (cids.includes("giftinghero")) badgeList.push(mkGift("cp-g-hero", "Gifting Hero", "https://github.com/mezotv/discord-badges/raw/main/assets/gifting/hero.png"));
                if (cids.includes("gifting")) badgeList.push(mkGift("cp-g-legend", "Gifting Legend", "https://github.com/mezotv/discord-badges/raw/main/assets/gifting/legend.png"));

                badges.push(...badgeList);
                return badges;
            }
        }
    ] as ProfileBadge[],


    stop() {
        removeHeaderBarButton("custom-profile-btn");
        removeContextMenuPatch("user-context", userContextMenuPatch);
        FluxDispatcher.unsubscribe("CONNECTION_OPEN", onAccountSwitch);
        stopDomObserver();
        removeHideStyle();
        if (this._origExtractTimestamp && SnowflakeUtils) {
            (SnowflakeUtils as any).extractTimestamp = this._origExtractTimestamp;
            this._origExtractTimestamp = null;
        }
        if (this._origGetUserAvatarURL && IconUtils) {
            (IconUtils as any).getUserAvatarURL = this._origGetUserAvatarURL;
            this._origGetUserAvatarURL = null;
        }
        // Nettoyer le patch avatarDecoration
        try {
            const myUser = UserStore.getCurrentUser() as any;
            if (myUser) {
                try { delete myUser.avatarDecoration; } catch { }
                try { delete myUser.avatarDecorationData; } catch { }
            }
        } catch { }
    },

    settingsAboutComponent() {
        return <Button onClick={() => openModal(props => <CustomProfileModal rootProps={props} />)}>Open Custom Profile</Button>;
    },
});