@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo [1/3] checking for Node.js ^>= 22...
where node >nul 2>nul || call :fail "Node.js is not installed or not in PATH. get it from https://nodejs.org/en/download"
for /f "delims=" %%i in ('node -p process.version') do set NODE_VERSION=%%i
for /f "tokens=1 delims=." %%a in ("!NODE_VERSION:v=!") do if %%a lss 22 call :fail "Node.js !NODE_VERSION! is too old, need ^>= 22. update from https://nodejs.org/"
echo       found !NODE_VERSION!

echo [2/3] checking for pnpm and dependencies...
where pnpm >nul 2>nul || npm install -g pnpm || call :fail "failed to install pnpm. please install it manually."
if not exist node_modules (
    echo       installing dependencies, this may take a few minutes on first run...
    call pnpm install --frozen-lockfile || call :fail "failed to install dependencies."
)

echo [3/3] building and injecting doiksub...
call pnpm buildWeb || call :fail "web extension build failed."
call pnpm build || call :fail "build failed."
call pnpm inject || call :fail "installation failed."

echo.
echo done. start whatever discord u patched now. cya
exit /b 0

:fail
echo ERROR: %~1
pause
exit /b 1