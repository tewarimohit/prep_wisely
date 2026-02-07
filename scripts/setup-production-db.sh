#!/bin/bash
# Production Database Setup Script
# Run this after creating a managed PostgreSQL database

set -e

echo "🚀 Setting up production database..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please create it from .env.example first."
    exit 1
fi

# Check if DATABASE_URL is set
if ! grep -q "DATABASE_URL=" .env || grep -q "DATABASE_URL=\"postgresql://user:password@" .env; then
    echo "⚠️  Please update DATABASE_URL in .env with your production database URL"
    exit 1
fi

echo "✅ .env file found"

# Generate Prisma Client
echo "📦 Generating Prisma Client..."
npx prisma generate

# Deploy migrations
echo "🗄️  Deploying migrations to production database..."
npx prisma migrate deploy

echo "✅ Migrations deployed successfully!"

# Verify connection
echo "🔍 Verifying database connection..."
npx prisma db execute --stdin <<< "SELECT 1;" > /dev/null 2>&1 || {
    echo "❌ Failed to connect to database. Please check your DATABASE_URL"
    exit 1
}

echo "✅ Database connection verified!"

echo ""
echo "🎉 Production database setup complete!"
echo ""
echo "Next steps:"
echo "1. Open Prisma Studio: npm run db:studio"
echo "2. Verify tables exist"
echo "3. Test app: npm run dev"
echo "4. Create a test plan and verify it persists"
