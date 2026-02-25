# WSBEditor

[中文] | [英文]

## 关于此项目

本项目基于 [leestevetk/WSBEditor](https://github.com/leestevetk/WSBEditor) 修改而来。

原项目使用 **GNU General Public License v3.0 (GPL-3.0)** 许可证。
因此，本项目同样在 GPL-3.0 条款下发布。

### 与原项目的差异
- 增加了多语言，补充了中文
- **配置外置化**：所有的“常用配置”现在都存储在 `configs/` 目录下（`.json` 和 `.wsb` 文件），更方便通过 Git 进行版本管理和阅读。
## 开发与构建

本项目已升级为现代化的 **Vue SFC (Single File Component)** 开发模式，并支持自动化编译打包。

### 目录结构
- **`src/`**：Vue 源码目录。
  - `App.vue`：主要业务逻辑与页面模板。
  - `style.css`：核心样式表。
  - `components/`：可复用的 Vue 组件。
- **`dist/`**：构建后的产物，包含最终的单文件 HTML。

### 开发流程

1. **安装依赖**：
   ```bash
   npm install
   ```

2. **本地开发预览**：
   ```bash
   npm run dev
   ```

3. **构建发布版**：
   运行以下命令，会自动完成 Vue 编译、资源内联以及数据打包：
   ```bash
   npm run build
   ```
   完成后，**`dist/index.html`** 即为最终的单文件版本。
**[Launch the latest version of WSBEditor](https://leestevetk.github.io/WSBEditor/WSBEditor-Latest.html).**

WSBEditor is a web-based [Windows Sandbox](https://docs.microsoft.com/en-us/windows/security/threat-protection/windows-sandbox/windows-sandbox-overview) configuration file (*.wsb) editor.

- Lightweight (_everything in one file_)
- Runs directly from browser
- No installation required
- Includes [new configuration options introduced in Windows 10 Version 2004 (aka the May 2020 update)](https://docs.microsoft.com/en-us/windows/whats-new/whats-new-windows-10-version-2004#windows-sandbox).

## Functions
- Create Sandbox configuration files
- Templates for Sandbox configuration
- Open (and edit) your configuration files

## Available Versions
You may choose between:
- [WSBEditor-Latest.html](https://leestevetk.github.io/WSBEditor/WSBEditor-Latest.html) (Latest Release) **(Recommended)**
- [WSBEditor.html](https://leestevetk.github.io/WSBEditor/WSBEditor.html) (Nightly builds)
- [Browse older releases](https://github.com/leestevetk/WSBEditor/releases)

## How to Use

### Option 1: Launch Directly (Recommended)
You may **[launch the latest version of WSBEditor directly from here](https://leesteve.tk/WSBEditor/WSBEditor.html)** - simple.

### Option 2: Download WSBEditor
You may also **[download WSBEditor onto your device](https://github.com/leestevetk/WSBEditor/releases)**, then double-click the file to launch it in your browser.  This is particularly useful if you want to use WSBEditor while you go offline.

> **For the tech-savvy reader like you:** WSBEditor uses only plain vanilla JavaScript (i.e. no jQuery or other fancy JS frameworks/libraries).  Therefore, a **downloaded copy of WSBEditor works perfectly while your device is offline**, except that you may see old-school Arial and miss out [my favourite font Ubuntu](https://design.ubuntu.com/font/) (_spot the irony here?_).  This beauty of vanilla JS excuses me for being lazy and not learning jQuery.

## Compatibility

WSBEditor creates Windows Sandbox configuration files, which are compatible with any system:
- Running **Windows 10 build 18342** or later; and
- With **Windows Sandbox feature** enabled.

Please note that **certain configuration options (e.g. printer redirection) require newer versions of Windows 10.**  If certain configuration options are incompatible with your system, you can still run the configuration file, but the incompatible options will of course be ineffective. 

> WSBEditor itself is a simple web app - it runs on **any browser** (including on your phone!!).  But after all you will need a PC to launch a Windows Sandbox.

## Support or Contact

WSBEditor is a work in progress (actually my little attempt at coding while staying-at-home during the [COVID-19 pandemic](https://en.wikipedia.org/wiki/COVID-19_pandemic)).

Please feel free to support the project or report any issue at the project's [GitHub page](https://github.com/leestevetk/WSBEditor).

## Licence

Copyright (C) 2020 Steve's Toolkit

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

> Windows, Windows Sandbox and/or WSB is/are/may be registered trademarks of their respective owner(s).

> A sidenote: the author happens to a little law student in Hong Kong and is a bit curious about the legal force of GPL in English law jurisdictions.  Please reach me out if you know any English/Commonwealth court rulings on the subject.

### 许可证
此项目基于GPL-3.0许可证。详细信息请查看 [LICENSE](LICENSE) 文件。

**重要**: 使用本项目的代码必须遵守GPL-3.0许可证的要求，
包括开源你的修改版本。
