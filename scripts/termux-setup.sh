#!/data/data/com.termux/files/usr/bin/bash

# ==============================================================================
#  NEXA - Automated Termux Setup & Environment Bootstrapper
# ==============================================================================

set -e

echo ""
echo "=========================================="
echo "    🤖 NEXA Termux Environment Setup      "
echo "=========================================="
echo ""

# 1. Update Termux repositories
echo "📦 [1/5] Updating Termux package repositories..."
pkg update -y && pkg upgrade -y

# 2. Install essential dependencies
echo "📦 [2/5] Installing Node.js, Git, and Termux:API..."
pkg install -y nodejs git termux-api coreutils

# 3. Verify Termux:API app is installed
echo "🔍 [3/5] Verifying Termux:API integration..."
if ! command -v termux-battery-status &> /dev/null; then
    echo "⚠️ Warning: 'termux-api' package was installed, but command not found in PATH."
else
    echo "✅ Termux:API command-line tools ready."
fi

echo ""
echo "💡 IMPORTANT ANDROID PERMISSION NOTE:"
echo "   Make sure you have installed the 'Termux:API' companion app from F-Droid"
echo "   and granted Android permissions (Contacts, Phone, SMS, Camera, Storage)."
echo ""

# 4. Install Node packages
echo "📦 [4/5] Installing project dependencies..."
npm install --omit=dev

# 5. Environment configuration check
echo "⚙️ [5/5] Checking environment configuration..."
if [ ! -f .env ]; then
    echo "📄 Creating .env from .env.example..."
    cp .env.example .env
    echo "⚠️ Please add your GEMINI_API_KEY in .env using: nano .env"
fi

# Make binary executable and link locally
chmod +x bin/nexa.js
npm link 2>/dev/null || true

echo ""
echo "=========================================="
echo "    🎉 NEXA is ready to launch!           "
echo "=========================================="
echo ""
echo "To start NEXA, simply run:"
echo "   node index.js"
echo "or (if linked):"
echo "   nexa"
echo ""
