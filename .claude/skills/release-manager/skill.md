# Release Manager Skill

## Description

Automates the release process for the Electron app including version bump, build, and GitHub release creation.

## Usage

```
/release [patch|minor|major]
```

## What it does

1. **Version Bump**: Runs `npm version [patch|minor|major]` to update package.json
2. **Git Tag**: Automatically creates and pushes git tag
3. **Build**: Runs `pnpm build:prod:win` to build the production app
4. **GitHub Release**: Creates GitHub release with changelog and uploads artifacts

## Arguments

- `patch` (default): Bump patch version (1.0.0 → 1.0.1)
- `minor`: Bump minor version (1.0.0 → 1.1.0)
- `major`: Bump major version (1.0.0 → 2.0.0)

## Examples

```bash
# Bump patch version (1.0.2 → 1.0.3)
/release patch

# Bump minor version (1.0.2 → 1.1.0)
/release minor

# Bump major version (1.0.2 → 2.0.0)
/release major

# Default to patch if no argument
/release
```

## Instructions for Claude

When the user invokes `/release [type]`, generate a complete shell script that:

### 1. Determine Version Type

- Extract the version type argument (patch/minor/major)
- Default to "patch" if not specified

### 2. Version Bump

```bash
npm version [type] --no-git-tag-version
```

- This updates package.json
- Use `--no-git-tag-version` because we'll handle git ourselves

### 3. Get New Version

```bash
NEW_VERSION=$(node -p "require('./package.json').version")
```

### 4. Git Operations

```bash
# Commit version change
git add package.json
git commit -m "chore: bump version to v${NEW_VERSION}"

# Create and push tag
git tag "v${NEW_VERSION}"
git push origin main
git push origin "v${NEW_VERSION}"
```

### 5. Build Production App

```bash
pnpm build:prod:win
```

### 6. Generate Release Notes

Based on changes since last version, include:

- New features
- Bug fixes
- Technical improvements
- Breaking changes (if major version)

### 7. Create GitHub Release

```bash
gh release create "v${NEW_VERSION}" \
  --title "Open Uploader v${NEW_VERSION}" \
  --notes "[Generated release notes]" \
  ./dist/open-uploader-${NEW_VERSION}-setup.exe \
  ./dist/open-uploader-${NEW_VERSION}-setup.exe.blockmap \
  ./dist/latest.yml
```

## Required Files to Upload

- `open-uploader-[version]-setup.exe` - Windows installer
- `open-uploader-[version]-setup.exe.blockmap` - Delta update file
- `latest.yml` - Update metadata (REQUIRED for auto-update)

## Script Template

Generate a script named `release-[version].sh` with:

1. **Error Handling**: Exit on any error (`set -e`)
2. **Verification**: Check for uncommitted changes
3. **Confirmation**: Ask user to confirm before proceeding
4. **Progress Output**: Show clear status messages
5. **Success/Failure Messages**: Clear feedback at the end

## Example Output Script

```bash
#!/bin/bash
set -e

VERSION_TYPE="${1:-patch}"

echo "=========================================="
echo "Release Manager"
echo "=========================================="
echo ""

# Check for uncommitted changes
if [[ -n $(git status -s) ]]; then
    echo "❌ Error: You have uncommitted changes"
    echo "Please commit or stash them first"
    exit 1
fi

# Bump version
echo "📦 Bumping $VERSION_TYPE version..."
npm version $VERSION_TYPE --no-git-tag-version

# Get new version
NEW_VERSION=$(node -p "require('./package.json').version")
echo "✅ New version: v$NEW_VERSION"
echo ""

# Confirm
read -p "Continue with release v$NEW_VERSION? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Release cancelled"
    git checkout package.json
    exit 1
fi

# Git operations
echo "📌 Committing version bump..."
git add package.json
git commit -m "chore: bump version to v$NEW_VERSION"

echo "📌 Creating git tag..."
git tag "v$NEW_VERSION"

echo "📤 Pushing to remote..."
git push origin main
git push origin "v$NEW_VERSION"

# Build
echo "🔨 Building production app..."
pnpm build:prod:win

# Create release
echo "🚀 Creating GitHub release..."
gh release create "v$NEW_VERSION" \
  --title "Open Uploader v$NEW_VERSION" \
  --notes "Release v$NEW_VERSION" \
  ./dist/open-uploader-$NEW_VERSION-setup.exe \
  ./dist/open-uploader-$NEW_VERSION-setup.exe.blockmap \
  ./dist/latest.yml

echo ""
echo "=========================================="
echo "✅ Release v$NEW_VERSION completed!"
echo "=========================================="
echo ""
echo "🔗 https://github.com/BarrySong97/OpenUploader/releases/tag/v$NEW_VERSION"
```

## Notes

- Always generate a complete, executable script
- Include proper error handling
- Make the script interactive (ask for confirmation)
- Show clear progress messages
- Handle edge cases (uncommitted changes, build failures, etc.)
- Save the script as `release-[version].sh` in the project root
- Make it executable (`chmod +x`)

## Project-Specific Details

- **Package Manager**: pnpm
- **Build Command**: `pnpm build:prod:win`
- **Repository**: BarrySong97/OpenUploader
- **Main Branch**: main
- **Installer Pattern**: `open-uploader-[version]-setup.exe`
- **Required Files**: `.exe`, `.exe.blockmap`, `latest.yml`
