#!/bin/bash

# Exit on error
set -e

NAME=$1

if [ -z "$NAME" ]; then
    echo "🔄 Running all pending migrations..."
    pnpm --filter "@edgebook/db" db:migrate:dev
else
    echo "🏗️  Creating new migration: $NAME..."
    pnpm --filter "@edgebook/db" exec prisma migrate dev --name "$NAME"
fi
