# Sample Kit

An Ableton Live extension that exports arrangement segments between locators as device-ready WAV files.

Right-click an audio track → **Export Locator Samples…** to render pre-FX audio for each locator range and save named samples to your Live project or extension storage.

## Requirements

- **Ableton Live 12.4.5** or later with Extensions enabled (public beta)
- For building from source: **Node.js 24.16.0** LTS or higher

## Installing

### Option A — Download a release (recommended)

No Node.js required.

1. Open [Releases](https://github.com/lfieldprojects/sample-kit/releases) and download the latest `.ablx` file (e.g. `Sample-Kit-0.1.0.ablx`).
2. In Live: **Settings → Extensions**.
3. Drag the `.ablx` file into the Extensions window.
4. Right-click an **audio track** in Arrangement View → **Export Locator Samples…**

### Option B — Build a package yourself

```bash
git clone https://github.com/lfieldprojects/sample-kit.git
cd sample-kit
npm install
npm run package
```

Then drag the generated `Sample-Kit-0.1.0.ablx` into **Settings → Extensions**.

### Option C — Load the project folder (development)

```bash
npm install
npm run build
```

In Live: **Settings → Extensions** → **Developer Mode OFF** → add this project folder → **Reload**.

## Building from source

This repo vendors the Ableton Extensions SDK tarballs under `vendor/` so `npm install` works after cloning. If you replace them with a newer SDK release, keep the filenames in sync with `package.json`.

```bash
npm install
npm run build      # outputs dist/extension.cjs
npm run package    # outputs Sample-Kit-<version>.ablx
```

Live development bridge (optional):

```bash
npm start
```

Requires **Ableton Live 12 Beta** running with Developer Mode enabled. See [Troubleshooting](#troubleshooting) if the terminal does not connect.

## Usage

1. Add at least **two locators** in Arrangement View, including an end locator after the last section.
2. Right-click an **audio track** title bar, or select multiple audio tracks in Arrangement View.
3. Choose **Export Locator Samples…**
4. Select which segments to export, pick a device preset, then click **Export**.

Exported filenames include the locator name, track name, key, and BPM, for example:

`Verse 1 - Bass - C Major - 128bpm.wav`

## Save locations

- **Live project folder** — imports samples into the current Live Set project
- **Extension storage** — saves to the extension’s persistent storage directory

## Limitations (SDK beta)

- Audio tracks only (freeze MIDI tracks first)
- Pre-FX render only (no sends/master)
- WAV output only
- No native macOS/Windows folder picker yet

## Troubleshooting

### Developer Mode: it won't appear in Settings (that's normal)

With **Developer Mode ON**, your extension is **not** listed in **Settings → Extensions**. `npm start` injects it directly while the terminal is running.

**How you know it's working:**

1. Terminal shows `FlipMessageStreamSocket send success` (within ~1 second of `Started: Extension Host`)
2. Terminal shows `[Sample Kit] Extension activated.`
3. Right-click an **audio track** title bar in Arrangement View → **Export Locator Samples…**

### No `send success`? Live is not connected

`Started: Extension Host` only means the CLI launched — **not** that Live accepted the connection.

Do this **full reset** (order matters):

1. **Quit** `npm start` (Ctrl+C in the terminal)
2. **Quit Ableton Live completely** (both Beta and Suite if either is open)
3. Open **only** `Ableton Live 12 Beta` — confirm the app name in the menu bar says **Beta**, not Suite
4. **Settings → Extensions** → turn **Developer Mode OFF**, then **ON** again
5. Leave Live running and the Extensions settings page open for a moment
6. In Terminal:
  ```bash
   cd sample-kit
   npm start
  ```
7. Wait up to 5 seconds for `FlipMessageStreamSocket send success`

**Common causes:**


| Problem                                  | Fix                                      |
| ---------------------------------------- | ---------------------------------------- |
| Live Suite open instead of Beta          | Quit Suite, use Beta only                |
| `npm start` ran before Live was open     | Start Live first, then `npm start`       |
| Developer Mode off                       | Turn it on in Beta's Extensions settings |
| Stale connection after toggling Dev Mode | Full reset above                         |


### Installed mode (recommended if dev mode won't connect)

Skip Developer Mode and the terminal entirely:

1. `npm run build` or download a release `.ablx`
2. In **Ableton Live 12 Beta**: **Settings → Extensions** → **Developer Mode OFF**
3. Drag in the `.ablx` file, or add this project folder and click **Reload**
4. Right-click an audio track → **Export Locator Samples…**

Installed mode also fixes the `Temp directory is unavailable` error, because Live provides temp/storage paths itself.

### Export fails with "Temp directory is unavailable" (dev mode only)

When using `npm start`, the CLI must pass temp/storage paths. This project's `npm start` script includes:

```
--temp-directory .dev-runtime/temp --storage-directory .dev-runtime/storage
```

Restart `npm start` after pulling the latest changes, or switch to installed mode above.

## Publishing a release

```bash
npm run package
```

Upload the generated `Sample-Kit-<version>.ablx` to GitHub Releases. Bump `version` in `manifest.json` before packaging.

## License

Sample Kit is released under the [MIT License](LICENSE).

The Ableton Extensions SDK in `vendor/` is provided by Ableton and subject to its own terms. Download the latest SDK from [ableton.github.io/extensions-sdk](https://ableton.github.io/extensions-sdk/).
