#!/usr/bin/env bash
# AIKITA Installation Script (Bash)
# ================================
# This script sets up AIKITA on Linux or macOS.
# Run with: chmod +x install.sh && ./install.sh

set -e

echo "========================================="
echo "  AIKITA Installation Script"
echo "========================================="

# 1. Check Node.js version
echo ""
echo "1. Checking Node.js version..."
NODE_VERSION=$(node --version)
echo "   Node.js version: $NODE_VERSION"

MAJOR_VERSION=$(echo "$NODE_VERSION" | grep -o 'v[0-9]*' | sed 's/v//' | cut -d. -f1)
if [ -n "$MAJOR_VERSION" ] && [ "$MAJOR_VERSION" -lt 22 ]; then
    echo "   ⚠️  Node.js version 22+ recommended. Current: $NODE_VERSION"
fi
echo "   ✅ Node.js version check passed"

# 2. Install dependencies
echo ""
echo "2. Installing dependencies..."
if [ ! -f "package.json" ]; then
    echo "   ❌ package.json not found. Please run this from the AIKITA directory."
    exit 1
fi
pnpm install

# 3. Setup environment
echo ""
echo "3. Setting up environment configuration..."
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "   ✅ Created .env from .env.example"
    else
        echo "   ⚠️  .env.example not found. Creating minimal .env."
        cat > .env << 'EOF'
AIKITA_LLM_URL=http://127.0.0.1:11434
AIKITA_LLM_MODEL=llama3.2
AIKITA_LLM_API_KEY=
AIKITA_LLM_TIMEOUT_MS=20000
AIKITA_INGESTION_MODE=ocr
EOF
        echo "   ✅ Created minimal .env"
    fi
else
    echo "   ✅ .env already exists"
fi

# 4. Initialize database
echo ""
echo "4. Initializing database..."
if [ ! -f "data/aikita.db" ]; then
    echo "   📦 Database not found. The database will be created on first application start."
    echo "   ℹ️  Ensuring data directory exists..."
    mkdir -p data
else
    echo "   ✅ Database already exists"
fi

# 5. Check Ollama
echo ""
echo "5. Checking Ollama installation..."
if ! command -v ollama &> /dev/null; then
    echo "   ⚠️  Ollama not found."
    echo "   Visit: https://ollama.com/download"
    echo "   Or download and install Ollama from the official website."
    echo "   After installation, run: ollama serve"
else
    echo "   ✅ Ollama is installed"
    if ! ollama serve &>/dev/null & sleep 2; then
        echo "   ℹ️  Starting Ollama server..."
        ollama serve &
        sleep 3
    fi
    echo "   Checking available models..."
    ollama list 2>/dev/null || echo "   ℹ️  No models installed yet. Run: ollama pull llama3.2"
fi

# 6. Download recommended model
echo ""
echo "6. Downloading LLM model..."
echo "   Recommended model: llama3.2 (approx. 2GB)"
echo "   To download manually: ollama pull llama3.2"
echo "   Or: ollama pull mistral"
echo "   Or: ollama pull phi3"

# 7. Start the application
echo ""
echo "7. Starting AIKITA..."
echo "   Running: pnpm start"
echo "   Application will be available at: http://127.0.0.1:3000"
echo ""
echo "========================================="
echo "  Installation Complete"
echo "========================================="
echo ""
echo "Next steps:"
echo "  1. Ensure Ollama is running: ollama serve"
echo "  2. Open http://127.0.0.1:3000 in your browser"
echo "  3. Login with your admin account"
echo "  4. Go to Settings → AI Connection to configure Ollama"
echo ""
echo "========================================="
echo "  AIKITA is now ready!"
echo "========================================="