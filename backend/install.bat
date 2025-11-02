@echo off
REM PG Management System - Quick Install Script for Windows
REM This script automates the backend setup process

echo ========================================
echo PG Management System - Backend Installation
echo ========================================
echo.

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js v16 or higher.
    exit /b 1
)

echo [OK] Node.js version:
node --version

REM Check npm
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm is not installed.
    exit /b 1
)

echo [OK] npm version:
npm --version

echo.
echo [INFO] Installing dependencies...
call npm install

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install dependencies
    exit /b 1
)

echo [OK] Dependencies installed successfully
echo.

REM Check if .env exists
if not exist .env (
    echo [INFO] Creating .env file from template...
    if exist .env.template (
        copy .env.template .env
        echo [OK] .env file created
        echo [WARNING] IMPORTANT: Edit .env file with your configuration before proceeding
        echo.
        pause
    ) else (
        echo [ERROR] .env.template not found
        exit /b 1
    )
) else (
    echo [OK] .env file already exists
)

echo.
echo [INFO] Setting up database...
echo [INFO] 1. Generating Prisma Client...
call npm run prisma:generate

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to generate Prisma client
    exit /b 1
)

echo [OK] Prisma client generated
echo.

echo [INFO] 2. Running database migrations...
call npm run prisma:migrate

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to run migrations
    echo [INFO] Make sure your DATABASE_URL in .env is correct
    exit /b 1
)

echo [OK] Database migrations completed
echo.

echo [INFO] 3. Seeding database with sample data...
call npm run prisma:seed

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to seed database
    exit /b 1
)

echo [OK] Database seeded successfully
echo.

REM Create upload directories
echo [INFO] Creating upload directories...
if not exist uploads\kyc mkdir uploads\kyc
if not exist uploads\meter-images mkdir uploads\meter-images
if not exist uploads\maintenance mkdir uploads\maintenance
echo [OK] Upload directories created
echo.

echo ========================================
echo Installation completed successfully!
echo ========================================
echo.
echo Test Credentials:
echo   Owner: owner@pgmanagement.com / password123
echo   Tenant 1: tenant1@example.com / password123
echo   Tenant 2: tenant2@example.com / password123
echo.
echo To start the development server, run:
echo   npm run dev
echo.
echo API Documentation will be available at:
echo   http://localhost:5000/api-docs
echo.
echo Happy coding!
pause

