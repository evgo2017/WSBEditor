# WSBEditor

基于 Vue 3 的 Windows Sandbox 配置编辑器。  
用于在浏览器中创建、编辑、加载并导出 `.wsb` 配置文件。

[中文] | [English](./README.md)

## 项目简介

WSBEditor 提供可视化表单来管理沙盒配置：

- 编辑常见沙盒开关与参数
- 选择内置常用配置
- 打开已有 `.wsb` 文件
- 导出生成的 `.wsb` 文件
- 自动缓存最近一次编辑状态

本项目基于 [leestevetk/WSBEditor](https://github.com/leestevetk/WSBEditor) 改造，许可证为 GPL-3.0。

## 预览地址

| 环境 | 地址 / 命令 | 说明 |
| --- | --- | --- |
| GitHub | <https://github.com/Start2026/WSBEditor> | 项目仓库 |
| evgo2017.com | <https://evgo2017.com> | 对外预览入口 |
| 本地运行 | `npm install && npm run dev` | 打开 Vite 输出的本地地址（通常为 `http://127.0.0.1:5173`） |

![WSBEditor 演示](./docs/images/demo.png)

## 主要功能

- 常用配置由 `src/configs/*.wsb` 文件驱动
- 中英文双语界面（`en` / `zh`）
- 三态选项（`默认 / 启用 / 禁用`）
- 映射文件夹管理
- 内存限制校验（MB，正整数）
- 启动命令编辑（支持多行命令）
- 下载前自动规范化文件名

## 当前内置配置

- `Windows 默认`
- `网盘资源下载`
- `隔离分析`

配置来源：

- `src/configs/configs.json`
- `src/configs/*.wsb`

## 配置维护

常用配置采用“文件驱动”方式：`src/configs/configs.json` 中每一项都必须对应一个 `.wsb` 文件。

### 新增一个常用配置

1. 在 `src/configs/` 新建一个 `.wsb` 文件（例如 `my-profile.wsb`）。
2. 在 `src/configs/configs.json` 增加一项，包含：
   - `id`（唯一标识，例如 `my_profile`）等
3. 运行测试确认引用关系正确：
   ```bash
   npm run test
   ```

### 修改已有配置

1. 修改对应的 `src/configs/*.wsb` 文件内容。
2. 如需更新展示文案或图标，再修改 `src/configs/configs.json`。
3. 执行测试：
   ```bash
   npm run test
   ```

### 删除一个配置

1. 从 `src/configs/configs.json` 删除对应配置项。
2. 删除对应 `.wsb` 文件。
3. 运行测试确认没有孤立文件或缺失引用：
   ```bash
   npm run test
   ```

### 维护注意事项

- `id` 尽量保持稳定，避免影响 UI 测试定位与自动化逻辑。
- 中英文文案建议同时维护，避免界面显示不一致。

## 兼容性说明

- 生成文件遵循 Windows Sandbox `.wsb` 格式。
- 运行 `.wsb` 需要 Windows 并启用 Windows Sandbox 功能。

## 许可证

GPL-3.0，详见 [LICENSE](./LICENSE)。

重要：若分发修改版本，需遵守 GPL-3.0 的开源义务。
