#!/bin/bash

# Install llm-manager to system path

SOURCE="/Volumes/Duck_Drive/software-dev/git-toolbox/deepsite/llm-manager"
DEST="/usr/local/bin/llm-manager"

echo "Installing llm-manager..."
echo "Source: $SOURCE"
echo "Destination: $DEST"
echo ""

if [ -L "$DEST" ]; then
    echo "⚠️  Symlink already exists at $DEST"
    echo "Removing old symlink..."
    sudo rm "$DEST"
fi

sudo ln -s "$SOURCE" "$DEST"

if [ -L "$DEST" ]; then
    echo "✅ Successfully installed llm-manager!"
    echo ""
    echo "Test it with: llm-manager status"
else
    echo "❌ Installation failed"
    exit 1
fi
