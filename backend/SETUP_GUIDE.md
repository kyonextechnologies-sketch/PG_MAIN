# PG Management System - Setup Guide

## Quick Start Guide

Follow these steps to get the backend API up and running on your local machine.

### Step 1: Prerequisites Check

Make sure you have the following installed:
- **Node.js** v16 or higher ([Download](https://nodejs.org/))
- **PostgreSQL** v13 or higher ([Download](https://www.postgresql.org/download/))
- **npm** or **yarn** (comes with Node.js)

Verify installations:
```bash
node --version
npm --version
psql --version
```

### Step 2: PostgreSQL Database Setup

1. **Start PostgreSQL service**
   - Windows: Services → PostgreSQL
   - Mac: `brew services start postgresql`
   - Linux: `sudo systemctl start postgresql`

2. **Create database**
```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE pg_management_db;

# Create user (optional)
CREATE USER pgadmin WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE pg_management_db TO pgadmin;

# Exit
\q
```

### Step 3: Backend Installation

1. **Navigate to backend directory**
```bash
cd backend
```

2. **Install dependencies**
```bash
npm install
```

This will install all required packages including:
- Express.js
- Prisma
- JWT libraries
- Multer
- Nodemailer
- And more...

### Step 4: Environment Configuration

1. **Copy the template file**
```bash
cp .env.template .env
```

2. **Edit .env file** and update the following:

**Required Changes:**
```env
# Update with your PostgreSQL credentials
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/pg_management_db?schema=public"

# Change these secrets (use a random string generator)
JWT_SECRET=your-random-secret-key-here
JWT_REFRESH_SECRET=your-random-refresh-secret-here

# For email functionality (Gmail example)
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password
```

**Gmail App Password Setup:**
1. Go to Google Account → Security
2. Enable 2-Step Verification
3. Search for "App passwords"
4. Generate new app password for "Mail"
5. Copy and paste in `.env` file

### Step 5: Database Migration

1. **Generate Prisma Client**
```bash
npm run prisma:generate
```

2. **Run migrations**
```bash
npm run prisma:migrate
```

When prompted for migration name, enter: `init`

3. **Seed database with sample data**
```bash
npm run prisma:seed
```

This creates:
- 1 Owner account
- 3 Tenant accounts
- 2 Properties
- Multiple rooms and beds
- Sample invoices and bills

### Step 6: Start the Server

**Development Mode (with auto-reload):**
```bash
npm run dev
```

**Production Build:**
```bash
npm run build
npm start
```

The server will start at: `http://localhost:5000`

### Step 7: Verify Installation

1. **Health Check**
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-..."
}
```

2. **API Documentation**

Open in browser: `http://localhost:5000/api-docs`

3. **Test Login**
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@pgmanagement.com",
    "password": "password123"
  }'
```

## Default Login Credentials

After seeding, use these credentials:

**Owner:**
- Email: `owner@pgmanagement.com`
- Password: `password123`

**Tenants:**
- Email: `tenant1@example.com` / Password: `password123`
- Email: `tenant2@example.com` / Password: `password123`
- Email: `tenant3@example.com` / Password: `password123`

## Common Issues & Solutions

### Issue 1: Database Connection Failed
**Error:** `Can't reach database server`

**Solution:**
- Ensure PostgreSQL is running
- Check DATABASE_URL in .env
- Verify database exists: `psql -l`

### Issue 2: Port Already in Use
**Error:** `Port 5000 is already in use`

**Solution:**
Change PORT in .env file:
```env
PORT=5001
```

### Issue 3: Prisma Migration Errors
**Error:** Migration failed

**Solution:**
```bash
# Reset database
npm run prisma:migrate reset

# Run migrations again
npm run prisma:migrate
```

### Issue 4: Email Not Sending
**Error:** Email service not working

**Solution:**
- Verify SMTP credentials
- Check Gmail app password
- Test with a simple email first

### Issue 5: File Upload Errors
**Error:** File upload failed

**Solution:**
```bash
# Create uploads directory
mkdir -p uploads/kyc
mkdir -p uploads/meter-images
mkdir -p uploads/maintenance
```

## Useful Commands

### Database Management
```bash
# Open Prisma Studio (Database GUI)
npm run prisma:studio

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Generate new migration
npx prisma migrate dev --name your_migration_name

# View database
psql -d pg_management_db
```

### Development
```bash
# Start with auto-reload
npm run dev

# Build TypeScript
npm run build

# Run production server
npm start

# Run tests
npm test
```

### Cleanup
```bash
# Remove node_modules
rm -rf node_modules

# Remove build files
rm -rf dist

# Reinstall dependencies
npm install
```

## Database Schema Overview

The system uses 10 main tables:

1. **Users** - Authentication and user accounts
2. **RefreshTokens** - JWT token management
3. **Properties** - PG properties
4. **Rooms** - Rooms within properties
5. **Beds** - Individual beds in rooms
6. **TenantProfile** - Tenant information
7. **ElectricitySettings** - Billing configuration
8. **ElectricityBills** - Meter readings and bills
9. **Invoices** - Monthly invoices
10. **Payments** - Payment records
11. **MaintenanceTickets** - Support tickets

## Next Steps

1. **Explore API Documentation**
   - Visit: `http://localhost:5000/api-docs`
   - Try different endpoints
   - Test with sample data

2. **Connect Frontend**
   - Update CORS_ORIGIN if needed
   - Configure frontend API URL

3. **Customize**
   - Modify email templates in `src/utils/email.ts`
   - Adjust business logic as needed
   - Add custom endpoints

4. **Deploy**
   - Choose hosting (Heroku, AWS, DigitalOcean)
   - Set production environment variables
   - Configure production database

## Support

For issues or questions:
1. Check this setup guide
2. Review error logs
3. Check API documentation
4. Contact development team

---

**Happy Coding! 🚀**

