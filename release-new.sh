#!/bin/bash
set -e

VERSION_TYPE="${1:-patch}"

echo "=========================================="
echo "🚀 Release Manager - Open Uploader"
echo "=========================================="
echo ""
echo "📋 Version Type: $VERSION_TYPE"
echo ""

# Step 1: Check for uncommitted changes
echo "🔍 Checking for uncommitted changes..."
if [[ -n $(git status -s) ]]; then
    echo "❌ Error: You have uncommitted changes"
    echo "Please commit or stash them first"
    echo ""
    git status -s
    exit 1
fi
echo "✅ Working directory clean"
echo ""

# Step 2: Bump version
echo "📦 Bumping $VERSION_TYPE version..."
npm version $VERSION_TYPE --no-git-tag-version

# Step 3: Extract new version
NEW_VERSION=$(node -p "require('./package.json').version")
echo "✅ New version: v$NEW_VERSION"
echo ""

# Step 4: Ask user for confirmation
read -p "🤔 Continue with release v$NEW_VERSION? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Release cancelled, reverting package.json..."
    git checkout package.json
    exit 1
fi
echo ""

# Step 5: Git operations
echo "📌 Committing version bump..."
git add package.json
git commit -m "chore: bump version to v$NEW_VERSION"
echo "✅ Committed"
echo ""

echo "🏷️  Creating git tag v$NEW_VERSION..."
git tag "v$NEW_VERSION"
echo "✅ Tag created"
echo ""

echo "📤 Pushing to remote..."
git push origin main
git push origin "v$NEW_VERSION"
echo "✅ Pushed to GitHub"
echo ""

# Step 6: Build
echo "🔨 Building production app..."
echo "Running: pnpm build:prod:win"
echo ""
pnpm build:prod:win
echo ""
echo "✅ Build completed"
echo ""

# Step 7: Verify artifacts exist
echo "🔍 Verifying build artifacts..."

if [[ ! -f "./dist/open-uploader-$NEW_VERSION-setup.exe" ]]; then
    echo "❌ Error: Installer not found at ./dist/open-uploader-$NEW_VERSION-setup.exe"
    exit 1
fi

if [[ ! -f "./dist/open-uploader-$NEW_VERSION-setup.exe.blockmap" ]]; then
    echo "❌ Error: Blockmap not found at ./dist/open-uploader-$NEW_VERSION-setup.exe.blockmap"
    exit 1
fi

if [[ ! -f "./dist/latest.yml" ]]; then
    echo "❌ Error: latest.yml not found (CRITICAL for auto-update!)"
    exit 1
fi

echo "✅ All required artifacts present:"
echo "   - open-uploader-$NEW_VERSION-setup.exe"
echo "   - open-uploader-$NEW_VERSION-setup.exe.blockmap"
echo "   - latest.yml"
echo ""

# Step 8: Create GitHub Release
echo "🚀 Creating GitHub Release..."
gh release create "v$NEW_VERSION" \
  --title "Open Uploader v$NEW_VERSION" \
  --generate-notes \
  ./dist/open-uploader-$NEW_VERSION-setup.exe \
  ./dist/open-uploader-$NEW_VERSION-setup.exe.blockmap \
  ./dist/latest.yml

# Step 9: Show success message
if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "✅ Release v$NEW_VERSION Complete!"
    echo "=========================================="
    echo ""
    echo "📦 Files uploaded:"
    echo "   - open-uploader-$NEW_VERSION-setup.exe"
    echo "   - open-uploader-$NEW_VERSION-setup.exe.blockmap"
    echo "   - latest.yml"
    echo ""
    echo "🔗 View release:"
    echo "   https://github.com/BarrySong97/OpenUploader/releases/tag/v$NEW_VERSION"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Test the installer"
    echo "   2. Verify auto-update works from v1.0.1"
    echo "   3. Check release notes are correct"
    echo "   4. Announce the release!"
    echo ""
else
    echo ""
    echo "❌ Failed to create GitHub release"
    exit 1
fi
