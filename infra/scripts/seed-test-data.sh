#!/bin/bash

# Exit on error
set -e

echo "🌱 Seeding database with test data..."
pnpm --filter "@edgebook/db" db:seed

echo "✅ Seeding complete."
