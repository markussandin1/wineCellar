#!/bin/bash

# Script to deploy schema to production Supabase database
# Usage: ./scripts/deploy-schema.sh [database-password]

set -e

if [ -z "$1" ]; then
  echo "❌ Error: Database password required"
  echo "Usage: ./scripts/deploy-schema.sh [your-supabase-password]"
  echo ""
  echo "Get your password from:"
  echo "https://supabase.com/dashboard/project/pktiwlfxgfkkqxzhtaxe/settings/database"
  exit 1
fi

PASSWORD=$1
DATABASE_URL="postgresql://postgres:${PASSWORD}@db.pktiwlfxgfkkqxzhtaxe.supabase.co:5432/postgres"

echo "🚀 Deploying schema to production..."
echo "📦 Database: db.pktiwlfxgfkkqxzhtaxe.supabase.co"
echo ""

# Apply schema
echo "📝 Applying schema..."
DATABASE_URL=$DATABASE_URL npx prisma db push --skip-generate

# Generate Prisma client
echo "⚙️  Generating Prisma client..."
npx prisma generate

echo ""
echo "✅ Schema deployed successfully!"
echo ""
echo "Next steps:"
echo "1. Create wine-labels bucket in Supabase Storage (if not done)"
echo "2. Deploy to Vercel (see QUICK-DEPLOY.md)"
echo "3. Set up GitHub Actions secrets"
