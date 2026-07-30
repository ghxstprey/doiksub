@echo off
setlocal enabledelayedexpansion
echo.

echo [1/4] checking for Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH.
    echo please install Node.js ^>= 22 from https://nodejs.org/en/download
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -e "process.stdout.write(process.version)"') do set NODE_VERSION=%%i
echo found Node.js !NODE_VERSION!

set NODE_MAJOR=!NODE_VERSION:v=!
for /f "tokens=1 delims=." %%a in ("!NODE_MAJOR!") do set NODE_MAJOR=%%a

if !NODE_MAJOR! lss 22 (
    echo ERROR: Node.js version !NODE_VERSION! is too old. please install Node.js ^>= 22.
    echo download from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js version OK.
echo.

echo [2/4] checking for pnpm...
where pnpm >nul 2>nul
if %errorlevel% neq 0 (
    echo       pnpm not found. installing pnpm globally...
    call npm install -g pnpm @REM i think this is correct
    if %errorlevel% neq 0 (
        echo ERROR: failed to install pnpm. please install it manually.
        pause
        exit /b 1
    )
    echo       pnpm installed successfully.
) else (
    echo       pnpm is already installed.
)
echo.

echo [3/4] checking dependencies...
if not exist "node_modules" (
    echo       node_modules not found. Installing dependencies...
    echo      this may take a few minutes on first run.
    call pnpm install --frozen-lockfile
    if %errorlevel% neq 0 (
        echo ERROR: failed to install dependencies.
        pause
        exit /b 1
    )
    echo       dependencies installed successfully.
) else (
    echo       dependencies already installed.
)
echo.

echo [4/4] building and injecting doiksub...
call pnpm build
if %errorlevel% neq 0 (
    echo ERROR: build failed.
    pause
    exit /b 1
)

node scripts/runInstaller.mjs -- --install

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Installation failed.
    pause
    exit /b 1
)

echo.
echo start whatever discord u patched now
echo cya
echo.