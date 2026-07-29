@echo off
echo this script will build and inject for you
echo do you want to continue? (y/n)
set /p choice
if "%choice%"=="y" goto build
if "%choice%"=="n" goto end

:build
pnpm build
pnpm inject
echo start whatever discord u patched now

:end
echo cya