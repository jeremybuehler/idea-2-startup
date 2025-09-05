#!/bin/bash

# WARP Setup Script for I2S Studio
# This script helps WARP AI assistant quickly set up the development environment

set -e

echo "🚀 Setting up I2S Studio for WARP AI Assistant..."

# Check Node.js version
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt "18" ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js $(node --version) detected"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
else
    echo "✅ Dependencies already installed"
fi

# Create .env.local if it doesn't exist
if [ ! -f ".env.local" ]; then
    echo "⚙️ Creating .env.local from .env.example..."
    cp .env.example .env.local
else
    echo "✅ .env.local already exists"
fi

# Run type check
echo "🔍 Running type check..."
npm run type-check

# Run linter
echo "🧹 Running linter..."
npm run lint

echo ""
echo "🎉 WARP setup complete!"
echo ""
echo "Next steps:"
echo "  npm run dev     # Start development server"
echo "  npm run build   # Build for production" 
echo "  npm run start   # Start production server"
echo ""
echo "💡 The application will be available at http://localhost:3000"
echo "📚 See WARP.md for comprehensive documentation"