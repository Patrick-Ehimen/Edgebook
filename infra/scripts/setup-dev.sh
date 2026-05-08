#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting Edgebook development setup..."

# 1. Check for pnpm
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Please install it first: https://pnpm.io/installation"
    exit 1
fi

# 2. Install dependencies
echo "📦 Installing workspace dependencies..."
pnpm install

# 3. Setup Environment Variables
if [ ! -f infra/docker/.env ]; then
    echo "📝 Creating .env from .env.example in infra/docker..."
    cp infra/docker/.env.example infra/docker/.env
else
    echo "✅ .env already exists in infra/docker"
fi

# 4. Spin up core infrastructure (DB & Redis)
echo "🐳 Starting core infrastructure (Postgres & Redis)..."
cd infra/docker
docker compose up -d db redis
cd ../..

# 5. Database Setup
echo "🏗️  Running database migrations and generating client..."
pnpm --filter "@edgebook/db" db:generate
pnpm --filter "@edgebook/db" db:migrate:dev

echo "✨ Setup complete! You can now run 'pnpm dev' to start the application."
