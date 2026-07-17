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
| `god` | yungpharaoh | developer tooling |

## building & injecting

```bash
pnpm install
pnpm build          # build for Discord Desktop
pnpm inject         # inject into Discord
```

## development

```bash
pnpm dev            # watch mode (rebuild upon file edits)
pnpm lint           # eslint + stylelint checks
pnpm testTsc        # type checking
```

### creating a new plugin

```bash
pnpm new-plugin myPluginName
```

## License

GPL-3.0-or-later — see [LICENSE](./LICENSE).
doiksub is a fork of [Vencord](https://github.com/Vendicated/Vencord) which is Copyright (c) 2022 Vendicated and contributors.