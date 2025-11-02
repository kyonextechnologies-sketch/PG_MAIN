#!/bin/bash

# PG Management System - Quick Install Script
# This script automates the backend setup process

echo "🚀 PG Management System - Backend Installation"
echo "=============================================="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16 or higher."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi

echo "✅ npm version: $(npm --version)"

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL CLI not found. Make sure PostgreSQL is installed."
else
    echo "✅ PostgreSQL is installed"
fi

echo ""
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    if [ -f .env.template ]; then
        cp .env.template .env
        echo "✅ .env file created"
        echo "⚠️  IMPORTANT: Edit .env file with your configuration before proceeding"
        echo ""
        read -p "Press Enter after you've updated the .env file..."
    else
        echo "❌ .env.template not found"
        exit 1
    fi
else
    echo "✅ .env file already exists"
fi

echo ""
echo "🗄️  Setting up database..."
echo "1. Generating Prisma Client..."
npm run prisma:generate

if [ $? -ne 0 ]; then
    echo "❌ Failed to generate Prisma client"
    exit 1
fi

echo "✅ Prisma client generated"
echo ""

echo "2. Running database migrations..."
npm run prisma:migrate

if [ $? -ne 0 ]; then
    echo "❌ Failed to run migrations"
    echo "   Make sure your DATABASE_URL in .env is correct"
    exit 1
fi

echo "✅ Database migrations completed"
echo ""

echo "3. Seeding database with sample data..."
npm run prisma:seed

if [ $? -ne 0 ]; then
    echo "❌ Failed to seed database"
    exit 1
fi

echo "✅ Database seeded successfully"
echo ""

# Create upload directories
echo "📁 Creating upload directories..."
mkdir -p uploads/kyc
mkdir -p uploads/meter-images
mkdir -p uploads/maintenance
echo "✅ Upload directories created"
echo ""

echo "🎉 Installation completed successfully!"
echo ""
echo "📝 Test Credentials:"
echo "   Owner: owner@pgmanagement.com / password123"
echo "   Tenant 1: tenant1@example.com / password123"
echo "   Tenant 2: tenant2@example.com / password123"
echo ""
echo "🚀 To start the development server, run:"
echo "   npm run dev"
echo ""
echo "📚 API Documentation will be available at:"
echo "   http://localhost:5000/api-docs"
echo ""
echo "✨ Happy coding!"

