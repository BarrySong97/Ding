# OpenCode Release Command

## ✅ 已创建

OpenCode 自定义命令 `/release` 已创建在 `.opencode/commands/release.md`

## 🎯 使用方式

### 在 OpenCode 中

打开 OpenCode TUI，然后输入：

```bash
/release patch    # 升级 patch 版本 (1.0.1 → 1.0.2)
/release minor    # 升级 minor 版本 (1.0.1 → 1.1.0)
/release major    # 升级 major 版本 (1.0.1 → 2.0.0)
/release          # 默认 patch
```

OpenCode 会自动生成一个完整的 release 脚本！

### 直接使用脚本

项目中已经包含了一个预生成的脚本 `release.sh`：

```bash
# Patch 版本
./release.sh patch

# Minor 版本
./release.sh minor

# Major 版本
./release.sh major

# 默认 patch
./release.sh
```

## 🔧 功能说明

脚本会自动完成以下步骤：

1. ✅ **检查工作区** - 确保没有未提交的更改
2. ✅ **版本升级** - 运行 `npm version [type]`
3. ✅ **用户确认** - 询问是否继续发布
4. ✅ **Git 操作**
   - 提交 package.json
   - 创建 git tag
   - 推送到 GitHub
5. ✅ **构建应用** - 运行 `pnpm build:prod:win`
6. ✅ **验证文件** - 检查所有必需的文件
7. ✅ **创建 Release** - 上传到 GitHub
8. ✅ **显示结果** - 成功消息和 URL

## 📦 上传的文件

- `open-uploader-[version]-setup.exe` - Windows 安装程序
- `open-uploader-[version]-setup.exe.blockmap` - 差分更新文件
- `latest.yml` - ⚠️ **必需！** 自动更新元数据

## 📋 版本类型

| 类型    | 说明                 | 示例          |
| ------- | -------------------- | ------------- |
| `patch` | 补丁版本（bug 修复） | 1.0.1 → 1.0.2 |
| `minor` | 次版本（新功能）     | 1.0.2 → 1.1.0 |
| `major` | 主版本（破坏性更改） | 1.0.2 → 2.0.0 |

## ⚠️ 注意事项

### 使用前确保

1. 所有更改已提交
2. 当前分支是 `main`
3. 已安装 `gh` CLI 工具
4. 已登录 GitHub (`gh auth login`)

### 执行过程

- 脚本会在关键步骤要求确认
- 如果取消，会自动恢复 package.json
- 所有操作都有清晰的进度提示

### 失败处理

如果某个步骤失败：

- 脚本会立即停止（`set -e`）
- 显示错误信息
- 需要手动修复问题

## 🚀 完整示例

```bash
# 当前版本: 1.0.1
# 目标: 发布 1.0.2

$ ./release.sh patch

==========================================
🚀 Release Manager - Open Uploader
==========================================

📋 Version Type: patch

🔍 Checking for uncommitted changes...
✅ Working directory clean

📦 Bumping patch version...
✅ New version: v1.0.2

🤔 Continue with release v1.0.2? (y/n) y

📌 Committing version bump...
✅ Committed

🏷️  Creating git tag v1.0.2...
✅ Tag created

📤 Pushing to remote...
✅ Pushed to GitHub

🔨 Building production app...
Running: pnpm build:prod:win

✅ Build completed

🔍 Verifying build artifacts...
✅ All required artifacts present

🚀 Creating GitHub Release...

==========================================
✅ Release v1.0.2 Complete!
==========================================

🔗 View release:
   https://github.com/BarrySong97/OpenUploader/releases/tag/v1.0.2
```

## 📁 文件位置

- **Command 定义**: `.opencode/commands/release.md`
- **示例脚本**: `release.sh`
- **文档**: `docs/RELEASE_COMMAND.md`

## 💡 提示

- 使用 `/release` 命令可以让 OpenCode 根据当前上下文生成定制化的脚本
- 预生成的 `release.sh` 可以直接使用，无需 OpenCode
- 两种方式功能完全相同，选择你喜欢的即可

---

**需要帮助？** 查看 [OpenCode 文档](https://opencode.ai/docs/commands/)
