# Icon Placeholder

This directory needs application icons for building the Tauri desktop app.

## Required Icons

Generate icons from a 1024x1024 source PNG using the Tauri CLI:

```bash
npx tauri icon path/to/your/1024x1024-source.png
```

This will generate all required formats:
- `32x32.png` - Small icon
- `128x128.png` - Standard icon
- `128x128@2x.png` - Retina icon
- `icon.icns` - macOS icon bundle
- `icon.ico` - Windows icon
- `icon.png` - Linux / tray icon

## Source Image Guidelines

- Use a 1024x1024 PNG with transparent background
- Keep the design simple and recognizable at small sizes
- For the Arbitrades brand, use the existing logo from the web app
