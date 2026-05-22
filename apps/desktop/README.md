# Arbitrades Desktop App

Tauri 2.0 desktop wrapper for the Techub Arbitrades Next.js web application. Runs on Linux, macOS, and Windows.

## Prerequisites

- [Rust](https://rustup.rs/) (stable toolchain)
- [Node.js](https://nodejs.org/) (v18+)
- Platform-specific dependencies for Tauri:
  - **Linux**: `sudo apt install libwebkit2gtk-4.1-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev`
  - **macOS**: Xcode Command Line Tools
  - **Windows**: Microsoft Visual Studio C++ Build Tools, WebView2

## Development

```bash
# Install JS dependencies (from monorepo root)
npm install

# Build and run the desktop app
cd apps/desktop
npm run dev
```

This will:
1. Build the Next.js app to static files (`apps/web/out/`)
2. Bundle everything into a native desktop binary
3. Open a native window loading the embedded web app

## Production Build

```bash
cd apps/desktop
npm run build
```

Output installer/binary to `apps/desktop/target/release/bundle/`

## Architecture

```
apps/desktop/          <- Tauri shell (this directory)
  src/main.rs          <- Rust entry point
  src/lib.rs           <- Tauri commands and app setup
  tauri.conf.json      <- Tauri configuration
  Cargo.toml           <- Rust dependencies

apps/web/              <- Next.js frontend (static export embedded in Tauri)
engine/                <- Rust backend API (hosted on Railway at api.arbitrades.sbs)
packages/shared/       <- Shared types and API client
```

The Next.js static export is embedded directly in the Tauri binary. The app communicates with the engine API at `https://api.arbitrades.sbs`.

## API Communication

The frontend communicates with the engine backend at `https://api.arbitrades.sbs` via the CSP and security configuration in `tauri.conf.json`. All API calls go to the production Railway-hosted engine.
