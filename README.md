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
| accountPanelServerProfile | right click your account panel in the bottom left to view your profile in the current server |
| anonymiseFileNames | anonymise uploaded file names |
| autoReact | automatically reacts with emojis to messages from specific users. configure multiple user:emoji pairs |
| autoTranslateNightcord | automatic translation for nightcord |
| avatarGrabber | /avatar grabs the full-resolution avatar of any user (or yourself) |
| betterSessions | check for new sessions in the background, and display notifications when they are detected |
| biggerStreamPreview | allows you to enlarge stream previews |
| calculator | /calc does quick maths right in the chat box |
| callTimer | adds a timer to vcs |
| clearURLs | automatically removes tracking elements from URLs you send |
| clientTheme | recreation of the old client theme experiment. add a color to your discord client theme |
| copyEmojiMarkdown | copy the raw unicode character instead of :name: for default emojis |
| copyFileContents | adds a button to text file attachments to copy their contents |
| copyStickerLinks | adds the ability to copy & open sticker links |
| copyUserURLs | adds a 'copy user URL' option to the user context menu |
| crashHandler | utility plugin for handling and possibly recovering from crashes without a restart |
| customProfile | entirely change what your profile looks like, only you until i figure out how to make it server-sided |
| customRPC | add a fully customisable rich presence (game status) to your discord profile |
| decor | create and use your own custom avatar decorations, or pick your favorite from the presets |
| devCompanion.dev | dev companion plugin |
| disableCallIdle | disables automatically getting kicked from a DM voice call after 3 minutes and being moved to an AFK voice channel |
| doiksubToolbox | adds a button to the titlebar that houses doiksub quick actions, built off vencord's |
| experiments | changes the help (?) toolbar button (top right in chat) to discord's developer menu |
| expressionCloner | allows you to clone emotes & stickers to your own server (right click them) |
| fakeAccount | right-click → add a user to the switcher. click in the switcher → your profile takes their appearance locally |
| fakeDM | injects fake local messages into a DM or group DM. button in the text bar. persists across restarts |
| fakeEdit | fake edit messages by adding a zero-width space |
| fakeFriends | locally simulates discord friends and requests. persistent between reloads |
| fakeGhost | appear muted or deaf |
| fakeNitro | allows you to send fake emojis/stickers, use nitro themes, and stream in nitro quality |
| fakeProfileThemes | allows profile theming by hiding the colors in your bio thanks to invisible 3y3 encoding |
| fakeSystemMessage | inject fake system messages into channels. only visible to you, useful for mockups. use /fakesysmsg |
| fakeTag | show the fake tag next to your name |
| fakeTyping | simulate infinite typing in channels. use /infinitype |
| favGifSearch | adds a search bar to favorite gifs |
| fixImagesQuality | improves quality of images by loading them at their original resolution |
| fixSpotifyEmbeds.desktop | fixes spotify embeds being incredibly loud by letting you customise the volume |
| fixYoutubeEmbeds.desktop | bypasses youtube videos being blocked from display on discord (for example by UMG) |
| iLoveSpam | do not hide messages from 'likely spammers' |
| impersonate | locally simulates a message sent by any user via the /impersonate command. only visible to you |
| injectAs | right-click any message to inject a fake local reply as that user. used in cases such as discord where you can't type in chat |
| messageLogger | temporarily logs deleted and edited messages. merges vencord's logger with equicord's (enhanced) logger |
| mimic | automatically sends messages that a specified user sends. currently doesnt work as well and i do not care enough to patch |
| noBadges| plugin that's supposed to remove badges from users, but it doesnt work lol |
| noF1 | disables F1 help bind |
| noNitroUpsell | removes all of discord's nitro upsells by tricking the client into thinking you have nitro |
| noOnboardingDelay | skips the slow and annoying onboarding delay |
| noRPC | disables discord's RPC server |
| noTypingAnimation | disables the CPU-intensive typing dots animation |
| pauseInvitesForever | brings back the option to pause invites indefinitely that stupit discord removed |
| permissionFreeWill | disables the client-side restrictions for channel permission management |
| pinDms | allows you to pin private channels to the top of your DM list. to pin/unpin or re-order pins, right click DMs |
| platformIndicators | adds platform indicators (desktop, mobile, web...) to users |
| platformSpoofer | spoof what platform or device you're on (default: mobile) |
| previewMessage | lets you preview your message before sending it |
| quickReply | reply to (ctrl + up/down) and edit (ctrl + shift + up/down) messages via keybinds |
| readAllNotificationsButton | read all server notifications with a single button click |
| replyHistory | shows the full chain of reply history above a message, useful for screenshots or context. bugged out rn, fix it later xx |
| reverseImageSearch | adds imagesearch to image context menus |
| serverInfo | allows you to view info about a server |
| shikiCodeblocks.desktop | brings vscode-style codeblocks into discord, powered by shiki |
| showHiddenThings | displays various hidden & moderator-only things regardless of permissions |
| silentTyping | hide that you are typing |
| spotifyCrack | free listen along, no auto-pausing in voice chat, and allows activity to continue playing when idling |
| spotifyShareCommands | share your current spotify track, album or artist via slash command (/track, /album, /artist) |
| stickyVoiceChannel | lock yourself to a voice channel and automatically reconnect if moved or disconnected |
| userVoiceShow | shows an indicator when a user is in a voice channel |
| validReply | fixes "message could not be loaded" upon hovering over the reply |
| validUser | fix mentions for unknown users showing up as '@unknown-user' (hover over a mention to fix it) |
| viewIcons | makes avatars and banners in user profiles clickable, adds view icon/banner entries in the user, server and group channel context menu |
| viewRaw | copy and view the raw content/data of any message, channel or guild |
| voiceDownload | adds a download to voice messages (opens a new browser tab) |
| voiceMessages | allows you to send voice messages like on mobile. to do so, right click the upload button and click send voice message |
| youtubeAdblock.desktop | block ads in youtube embeds and the WatchTogether activity via adguard |

## license

GPL-3.0-or-later - see [LICENSE](./LICENSE).
doiksub is a fork of [Vencord](https://github.com/Vendicated/Vencord) which is Copyright (c) 2022 Vendicated and contributors.