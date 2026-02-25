# WSBEditor

Windows Sandbox configuration editor built with Vue 3.  
It helps you create, edit, load, and export `.wsb` files in a browser UI.

[Chinese](./README-zh.md) | [English]

## Overview

WSBEditor is a lightweight tool for managing Windows Sandbox profiles:

- Edit common sandbox options in a form UI
- Switch between built-in quick configs
- Load existing `.wsb` files
- Export generated `.wsb` files
- Persist the latest form state in browser cache

This project is based on [leestevetk/WSBEditor](https://github.com/leestevetk/WSBEditor) and is released under GPL-3.0.

## Preview Links

| Environment | URL / Command | Notes |
| --- | --- | --- |
| GitHub | <https://github.com/Start2026/WSBEditor> | Source repository |
| evgo2017.com | <https://evgo2017.com> | Public site entry |
| Local Run | `npm install && npm run dev` | Open the Vite local URL (usually `http://127.0.0.1:5173`) |

![WSBEditor Demo](./docs/images/demo.png)

## Main Features

- Quick configs from files in `src/configs/*.wsb`
- Bilingual interface (`en` / `zh`)
- Tri-state controls for sandbox switches (`Default`, `Enable`, `Disable`)
- Mapped folder management
- Memory limit validation (positive integer MB)
- Logon command editor (multiple commands supported)
- Safe filename normalization before download

## Built-in Quick Configs

- `Windows Default`
- `Cloud Download Folder`
- `Isolated Analysis`

Config definitions are managed in:

- `src/configs/configs.json`
- `src/configs/*.wsb`

## Config Maintenance

Quick configs are file-driven. Each item in `src/configs/configs.json` should map to one `.wsb` file.

### Add a quick config

1. Create a new `.wsb` file in `src/configs/` (for example: `my-profile.wsb`).
2. Add an item to `src/configs/configs.json` with:
   - `id` (unique key, such as `my_profile`)
   - `category` (`baseline` / `files` / `security`)
   - `name.en` and `name.zh`
   - `description.en` and `description.zh`
   - `icon`
   - `file` (for example `configs/my-profile.wsb`)
3. Run tests:
   ```bash
   npm run test
   ```

### Modify an existing quick config

1. Update the corresponding `src/configs/*.wsb`.
2. If needed, update metadata in `src/configs/configs.json`.
3. Run tests:
   ```bash
   npm run test
   ```

### Remove a quick config

1. Remove the config item from `src/configs/configs.json`.
2. Delete the related `.wsb` file in `src/configs/`.
3. Run tests:
   ```bash
   npm run test
   ```

### Notes

- Keep `id` stable to avoid breaking UI tests and automation selectors.
- Keep both `en` and `zh` texts updated together.

## Compatibility Notes

- Generated files target Windows Sandbox `.wsb` format.
- Running sandbox profiles requires Windows with Windows Sandbox enabled.

## License

GPL-3.0. See [LICENSE](./LICENSE).

Important: if you distribute modified code, you must comply with GPL-3.0 obligations.
