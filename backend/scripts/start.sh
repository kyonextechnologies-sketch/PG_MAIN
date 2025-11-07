#!/bin/bash

# Production startup script that runs migrations before starting the server

echo "🚀 Starting PG Management Backend..."

# Run database migrations
echo "📦 Running database migrations..."
npx prisma migrate deploy

if [ $? -ne 0 ]; then
  echo "⚠️  Migration failed, but continuing startup..."
  echo "   This might be expected if migrations were already applied."
fi

# Start the server
echo "✅ Starting server..."
node dist/server.js

