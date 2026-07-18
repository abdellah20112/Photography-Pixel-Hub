#!/bin/bash
# ============================================
# Production Migration Script
# Run this after deploying to Vercel.
# Uses prisma migrate deploy (NOT db push).
# ============================================

set -e

echo "📋 Running Prisma migrations..."
npx prisma migrate deploy

echo "✅ Migrations complete."
echo ""
echo "To create the first OWNER account:"
echo "  1. Visit /bootstrap on your deployed site"
echo "  2. Create the owner account"
echo "  3. Bootstrap will be automatically disabled after creation"
