# doiksub

![image](assets/doiksub.ico)

## overview

doiksub is a fork of [Vencord](https://github.com/Vendicated/Vencord) with a curated plugin set, custom feature packs, and plugins ported from Equicord.

### requirements to install

- pnpm
- node.js

(or run `RunOnWindows.bat`)

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
| favGifSearch | lets you search through your favorited gifs, useful for named-file gifs |
| fixImagesQuality | loads higher quality images if available |
| fixSpotifyEmbeds.desktop | lets you modify embedded spotify songs volume |
| fixYoutubeEmbeds.desktop | fixes youtube videos being blocked |
| iLoveSpam | don't hide dms from potential scammers |
| impersonate | /impersonate command that's basically a better fakeDM, works in servers too |
| injectAs | right click version, used for places you can't type |
| messageLogger | exactly what it says |
| mimic | sends the same message someone else did in the same channel that they did |
| noF1 | removes the f1 help bind |
| noNitroUpsell | tricks the client into thinking you have nitro, differs from fakeNitro |
| noOnboardingDelay | skips animations during onboarding (servers) |
| noTypingAnimation | removes the typing animation |
| pauseInvitesForever | lets you pause invites from working indefinitely instead of the max limit discord set |
| permissionFreeWill | don't get warnings about stuff that can mess with permissions (i think i lwk forgot) |
| pinDms | pin dms to the top of the list |
| platformIndicators | shows what platforms people are on. can be inaccurate if it's spoofed (see below) |
| platformSpoofer | changes what discord thinks youre using |
| previewMessage | preview a message before sending via a chat button |
| quickReply | keyboard shutcut to reply to latest message |
| readAllNotificationsButton | places a button below the discord logo to read all servers, not dms |
| replyHistory | W.I.P., it shows all replies on one message instead of just one (good for screenshots) |
| reverseImageSearch | come on now |
| serverInfo | shows various info abt a server |
| shikiCodeblocks.desktop | makes codeblocks look like shiki's (colored syntax) |
| showHiddenThings | view channels and stuff you normally wouldn't have accesss to; can't view stuff though |
| silentTyping | stop typing heartbeats so people don't get notified |
| spotifyCrack | listen along with no ads |
| spotifyShareCommands | adds a couple cmds that make it easier to share songs or artists |
| stickyVoiceChannel | locks you to a voice channel, can help when people try messing with you and moving |
| userVoiceShow | show if a user is in a vc in a mutual server |
| validReply | use REST api to show a message that might not have loaded |
| validUser | same thing, just for pings instead of replies |
| viewIcons | makes pfps and server icons clickable |
| voiceDownload | download vms |
| youtubeAdblock.desktop | use the youtube activity with no ads |

## license

GPL-3.0-or-later - see [LICENSE](./LICENSE).
doiksub is a fork of [Vencord](https://github.com/Vendicated/Vencord) which is Copyright (c) 2022 Vendicated and contributors.