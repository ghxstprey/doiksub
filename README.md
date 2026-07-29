# doiksub

![image](assets/doiksub.ico)

## overview

doiksub is a fork of [Vencord](https://github.com/Vendicated/Vencord) with a curated plugin set, custom feature packs, and plugins ported from Equicord.

## structure

- `src/plugins/` — all plugins and feature packs
- `src/utils/constants.ts` — `doiksubDevs` for developer identities
- `scripts/` — build tools, plugin generator

## schizo devs (one guy)

| Short | Author | Focus |
|------|-------------|-------|
| `ghxst` | ghxstprey | stealth stuff |
| `oddy` | OddyNuff | qol n cosmetics |
| `sqz` | sqzass | i be sqzing azz |
| `god` | yungpharaoh | misc / random |

## building & injecting

```bash
pnpm install --frozen-lockfile
pnpm build && node scripts/runInstaller.mjs -- --install        # optionally, -auto for automatic injection
```

### creating a new plugin

```bash
pnpm new-plugin myPluginName
```

## plugins

| name | desc |
| --- | --- |
| accountPanelServerProfile | makes it automatically open server profile instead of main when viewing a guild |
| anonymiseFileNames | does what it says, replaces all uploaded file names with random strings |
| autoReact | automatically reacts to messages with a emoji, custom supported (if nitro) |
| autoTranslateNightcord | provides translations for certain plugins, however this will eventually be phased out and unused/deleted |
| betterSessions | enhances the devices/session menu |
| biggerStreamPreview | allows you to make the stream preview bigger than normally allowed |
| callTimer | what do u think |
| clearURLs | removes tracking links and data from sent links |
| clientTheme | lets you set custom themes |
| copyEmojiMarkdown | optionally gets emoji markdown when right clicking an emoji |
| copyFileContents | lets you copy uploaded files contents |
| copyStickerLinks | exactly as it says |
| copyUserURLs | copies a link to a discord user's profile |
| crashHandler | says no to crashes and attempts to recover |
| customProfile | lets you set custom profile, such as pronouns, usernames, acc creation date, badges, etc |
| customRPC | sets a custom rich presence, fully customizable |
| decor | popular pfp decoration plugin, others can see this |
| devCompanion.dev | developer tools |
| disableCallIdle | doesn't kick you after five minutes alone |
| doiksubToolbox | dependancy for other plugins, button that sits in the nav bar for other plugins to utilize |
| experiments | use hidden discord stuff |
| expressionCloner | steal emojis n stickers |
| fakeAccount | add someone's account to your acc switcher (obv cosmetic only) |
| fakeDM | spoof dms |
| fakeEdit | right click to add a invisible char at the end of a msg, making it say edited but nothing change |
| fakeFriends | spoof friends and requests, works on singular and guilds |
| fakeGhost | appear muted or deafened but not actually be either |
| fakeNitro | spoofs nitro |
| fakeProfileThemes | have two colored profiles like nitro, others with this plugin can see |
| fakeSystemMessage | sends system messages like boosts, community updates, joins, etc |
| fakeTyping | appear as though you're constantly typing in a channel via sending heartbeats |
| ImTooTiredToKeepTyping | I'llAddMoreLater |
| placeholder | placeholder |
| placeholder | placeholder |
| placeholder | placeholder |
| placeholder | placeholder |
| placeholder | placeholder |
| placeholder | placeholder |
| placeholder | placeholder |
| placeholder | placeholder |
| placeholder | placeholder |
| placeholder | placeholder |
| placeholder | placeholder |
| placeholder | placeholder |
| placeholder | placeholder |
| placeholder | placeholder |
| placeholder | placeholder |
| placeholder | placeholder |
| placeholder | placeholder |

## license

GPL-3.0-or-later - see [LICENSE](./LICENSE).
doiksub is a fork of [Vencord](https://github.com/Vendicated/Vencord) which is Copyright (c) 2022 Vendicated and contributors.