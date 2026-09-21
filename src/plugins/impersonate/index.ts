/*
 * doiksub, a Discord client mod
 * Copyright (c) 2024 ghxst and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ApplicationCommandOptionType, sendBotMessage } from "@api/Commands";
import { ApplicationCommandInputType } from "@api/Commands/types";
import { doiksubDevs } from "@utils/constants";
import { Logger } from "@utils/Logger";
import definePlugin from "@utils/types";
import type { CommandArgument, CommandContext } from "@vencord/discord-types";
import { findByPropsLazy } from "@webpack";
import { DraftType, FluxDispatcher, UploadAttachmentStore, UserStore } from "@webpack/common";

const logger = new Logger("Impersonate");

const UploadStore = findByPropsLazy("getUpload", "getUploads");

const IMAGE_EXTS = new Set(["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg", "avif", "apng", "ico"]);

function parseFileSize(input: string): number | null {
    const m = input.trim().match(/^([\d.]+)\s*(tb|gb|mb|kb|t|g|m|k|b)?$/i);
    if (!m) return null;
    const num = Number(m[1]);
    if (!Number.isFinite(num) || num < 0) return null;
    const unit = (m[2] ?? "b").toLowerCase();
    const mult: Record<string, number> = {
        b: 1,
        k: 1024, kb: 1024,
        m: 1024 ** 2, mb: 1024 ** 2,
        g: 1024 ** 3, gb: 1024 ** 3,
        t: 1024 ** 4, tb: 1024 ** 4,
    };
    return Math.round(num * (mult[unit] ?? 1));
}

function parseList(raw: string): string[] {
    return raw.split(",").map(s => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
}

function isImageFilename(name: string): boolean {
    const ext = name.split(".").pop()?.toLowerCase() ?? "";
    return IMAGE_EXTS.has(ext);
}

function getUploadFile(upload: any): File | null {
    if (!upload) return null;
    if (upload.item?.file instanceof File) return upload.item.file;
    if (upload.file instanceof File) return upload.file;
    if (upload.item instanceof File) return upload.item;
    return null;
}

function resolveFiles(options: CommandArgument[], ctx: CommandContext): File[] {
    const files: File[] = [];
    const slashUploads = UploadAttachmentStore?.getUploads?.(ctx.channel.id, DraftType.SlashCommand) ?? [];
    const uploadStoreUploads = UploadStore?.getUploads?.(ctx.channel.id, DraftType.SlashCommand) ?? [];
    const allUploads = [...slashUploads, ...uploadStoreUploads];

    for (const opt of options) {
        if (opt.name === "image" || opt.name === "file" || opt.type === ApplicationCommandOptionType.ATTACHMENT) {
            let upload = UploadAttachmentStore?.getUpload?.(ctx.channel.id, opt.name, DraftType.SlashCommand)
                ?? UploadStore?.getUpload?.(ctx.channel.id, opt.name, DraftType.SlashCommand);

            if (!upload && opt.value) {
                upload = UploadAttachmentStore?.getUpload?.(ctx.channel.id, String(opt.value), DraftType.SlashCommand)
                    ?? UploadStore?.getUpload?.(ctx.channel.id, String(opt.value), DraftType.SlashCommand);
            }

            if (!upload) {
                upload = allUploads.find(u => u.name === opt.name || u.id === opt.name || u.id === opt.value || u.name === opt.value);
            }

            const file = getUploadFile(upload);
            if (file && !files.includes(file)) {
                files.push(file);
            }
        }
    }

    if (files.length === 0 && allUploads.length > 0) {
        for (const u of allUploads) {
            const file = getUploadFile(u);
            if (file && !files.includes(file)) {
                files.push(file);
            }
        }
    }

    return files;
}

export default definePlugin({
    name: "Impersonate",
    enabledByDefault: true,
    description: "Locally simulates a message sent by any user via the /impersonate command. Only visible to you.",
    authors: [doiksubDevs.sqz],
    tags: ["Sigil"],
    dependencies: ["CommandsAPI"],

    commands: [
        {
            name: "impersonate",
            description: "Impersonate a user.",
            inputType: ApplicationCommandInputType.BUILT_IN,
            options: [
                {
                    type: ApplicationCommandOptionType.USER,
                    name: "user",
                    description: "The user you wish to impersonate.",
                    required: true
                },
                {
                    type: ApplicationCommandOptionType.STRING,
                    name: "message",
                    description: "The message you would like this user to say.",
                    required: false
                },
                {
                    type: ApplicationCommandOptionType.CHANNEL,
                    name: "channel",
                    description: "Channel the impersonated message should be sent in.",
                    required: false
                },
                {
                    type: ApplicationCommandOptionType.INTEGER,
                    name: "delay",
                    description: "Delay for the impersonated message to appear on your client (in seconds).",
                    required: false
                },
                {
                    type: ApplicationCommandOptionType.ATTACHMENT,
                    name: "image",
                    description: "Image to attach to the impersonated message.",
                    required: false
                },
                {
                    type: ApplicationCommandOptionType.ATTACHMENT,
                    name: "file",
                    description: "File to attach to the impersonated message.",
                    required: false
                },
                {
                    type: ApplicationCommandOptionType.STRING,
                    name: "filename",
                    description: 'Fake file name (e.g. notes.txt). Comma-separated for multiple files.',
                    required: false
                },
                {
                    type: ApplicationCommandOptionType.STRING,
                    name: "filesize",
                    description: 'Fake file size (e.g. 7mb, 473mb, 1.5gb). Comma-separated for multiple files.',
                    required: false
                }
            ],
            execute: async (args, ctx) => {
                try {
                    const userArg = args.find(x => x.name === "user") ?? args[0];
                    if (!userArg) {
                        return sendBotMessage(ctx.channel.id, { content: "Please specify a user to impersonate." });
                    }
                    const user = UserStore.getUser(userArg.value);
                    if (!user) {
                        return sendBotMessage(ctx.channel.id, { content: "User not found." });
                    }

                    const messageArg = args.find(x => x.name === "message");
                    const content = messageArg?.value ? String(messageArg.value) : "";
                    const channel = args.find(x => x.name === "channel") ?? { value: ctx.channel.id };
                    const delay = args.find(x => x.name === "delay");

                    const files = resolveFiles(args, ctx);

                    const filenameArg = args.find(x => x.name === "filename");
                    const filesizeArg = args.find(x => x.name === "filesize");
                    const fakeNames = filenameArg?.value ? parseList(String(filenameArg.value)) : [];
                    const fakeSizeInputs = filesizeArg?.value ? parseList(String(filesizeArg.value)) : [];
                    const fakeSizes: (number | null)[] = [];
                    for (const input of fakeSizeInputs) {
                        const parsed = parseFileSize(input);
                        if (parsed == null) {
                            return sendBotMessage(ctx.channel.id, {
                                content: `Invalid file size \`${input}\`. Use a number with optional unit, e.g. \`7mb\`, \`473mb\`, \`1.5gb\`, \`512\`.`
                            });
                        }
                        fakeSizes.push(parsed);
                    }
                    // ponytail: placeholder blob is enough since displayed size is spoofed anyway; opening a faked file just shows the placeholder bytes.
                    for (let i = files.length; i < fakeNames.length; i++) {
                        files.push(new File([" "], fakeNames[i], { type: "text/plain" }));
                    }

                    if (!content && files.length === 0) {
                        return sendBotMessage(ctx.channel.id, {
                            content: "You must provide a message or attach an image/file."
                        });
                    }

                    const fakeAuthor = {
                        id: user.id,
                        username: user.username,
                        avatar: user.avatar,
                        discriminator: user.discriminator,
                        public_flags: user.publicFlags,
                        premium_type: user.premiumType,
                        flags: user.flags,
                        banner: user.banner,
                        accent_color: null,
                        // @ts-ignore
                        global_name: user.globalName,
                        // @ts-ignore
                        avatar_decoration_data: user.avatarDecorationData
                            ? { asset: user.avatarDecorationData.asset, sku_id: user.avatarDecorationData.skuId }
                            : null,
                        banner_color: null
                    };

                    if (delay) {
                        FluxDispatcher.dispatch({
                            type: "TYPING_START",
                            channelId: channel.value,
                            userId: user.id,
                        });
                    }

                    setTimeout(async () => {
                        try {
                            const attachments: any[] = [];
                            for (let i = 0; i < files.length; i++) {
                                const file = files[i];
                                const filename = fakeNames[i] ?? fakeNames[0] ?? file.name;
                                const spoofedName = filename !== file.name;
                                const size = fakeSizes[i] ?? (fakeSizes.length === 1 ? fakeSizes[0] : null) ?? file.size;
                                const objectUrl = URL.createObjectURL(file);
                                const urlWithHash = objectUrl + "#";
                                let width: number | undefined;
                                let height: number | undefined;

                                if (file.type.startsWith("image/") && (!spoofedName || isImageFilename(filename))) {
                                    try {
                                        const img = new Image();
                                        img.src = objectUrl;
                                        await new Promise(resolve => {
                                            img.onload = () => {
                                                width = img.width;
                                                height = img.height;
                                                resolve(null);
                                            };
                                            img.onerror = () => resolve(null);
                                        });
                                    } catch { }
                                }

                                attachments.push({
                                    id: (BigInt(Date.now() - 1420070400000) << 22n).toString(),
                                    filename,
                                    size,
                                    url: urlWithHash,
                                    proxy_url: urlWithHash,
                                    width,
                                    height,
                                    content_type: undefined
                                });
                            }

                            FluxDispatcher.dispatch({
                                type: "MESSAGE_CREATE",
                                channelId: channel.value,
                                message: {
                                    attachments,
                                    author: fakeAuthor,
                                    channel_id: channel.value,
                                    components: [],
                                    content,
                                    edited_timestamp: null,
                                    embeds: [],
                                    flags: 0,
                                    id: (BigInt(Date.now() - 1420070400000) << 22n).toString(),
                                    mention_everyone: false,
                                    mention_roles: [],
                                    mentions: [],
                                    nonce: (BigInt(Date.now() - 1420070400000) << 22n).toString(),
                                    pinned: false,
                                    timestamp: new Date(),
                                    tts: false,
                                    type: 0
                                },
                                optimistic: false,
                                isPushNotification: false
                            });
                        } catch (error) {
                            logger.error("Failed to send message:", error);
                        }
                    }, (Number(delay?.value ?? 0.5) * 1000));
                } catch (error) {
                    sendBotMessage(ctx.channel.id, {
                        content: `Something went wrong: \`${error}\``,
                    });
                }
            }
        }
    ]
});