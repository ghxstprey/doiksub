@echo off
echo this script will build and inject for you

pnpm install && pnpm build && node scripts/runInstaller.mjs -- --install

echo start whatever discord u patched now
echo cya