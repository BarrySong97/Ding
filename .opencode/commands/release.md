---
description: Generate release script for version bump, build, and GitHub publish
---

Generate a complete bash script that automates the release process with the following steps:

**Version Type**: Use argument $1 (patch/minor/major), default to 'patch' if not provided

**Script Requirements**:

1. Check for uncommitted changes - exit if found
2. Run `npm version $VERSION_TYPE --no-git-tag-version` to bump version
3. Extract new version: `NEW_VERSION=$(node -p "require('./package.json').version")`
4. Ask user for confirmation before proceeding
5. Git operations:
   - Commit package.json: `git commit -m "chore: bump version to v$NEW_VERSION"`
   - Create tag: `git tag "v$NEW_VERSION"`
   - Push: `git push origin main && git push origin "v$NEW_VERSION"`
6. Build: `pnpm build:prod:win`
7. Verify artifacts exist:
   - `./dist/open-uploader-$NEW_VERSION-setup.exe`
   - `./dist/open-uploader-$NEW_VERSION-setup.exe.blockmap`
   - `./dist/latest.yml` (CRITICAL for auto-update)
8. Create GitHub Release:
   ```bash
   gh release create "v$NEW_VERSION" \
     --title "Open Uploader v$NEW_VERSION" \
     --generate-notes \
     ./dist/open-uploader-$NEW_VERSION-setup.exe \
     ./dist/open-uploader-$NEW_VERSION-setup.exe.blockmap \
     ./dist/latest.yml
   ```
9. Show success message with release URL

**Script Features**:

- Use `set -e` for error handling
- Include progress emojis (🔍 📦 ✅ ❌ etc.)
- Save as `release-v$NEW_VERSION.sh`
- Make executable with `chmod +x`
- Repository: BarrySong97/OpenUploader
- Main branch: main

**Example Usage**:

```bash
./release-v1.0.3.sh patch  # 1.0.2 → 1.0.3
./release-v1.1.0.sh minor  # 1.0.2 → 1.1.0
./release-v2.0.0.sh major  # 1.0.2 → 2.0.0
```

Generate the complete, production-ready script now.
