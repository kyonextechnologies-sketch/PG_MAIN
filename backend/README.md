# PG Management System - Backend API

A comprehensive REST API backend for managing Paying Guest (PG) accommodations with advanced features including property management, tenant management, electricity billing, payment processing, and maintenance tracking.

## 🚀 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **File Upload**: Multer
- **Email Service**: Nodemailer
- **API Documentation**: Swagger
- **Language**: TypeScript

## 📋 Features

### Authentication & Authorization
- JWT-based authentication with access and refresh tokens
- Role-based access control (OWNER and TENANT roles)
- Secure password hashing
- Token refresh mechanism

### Property Management
- Create, read, update, delete properties
- Track property amenities
- Property-wise statistics
- Occupancy tracking

### Room & Bed Management
- Multi-level room and bed organization
- Real-time occupancy status
- Capacity management
- Automated bed assignment

### Tenant Management
- Complete tenant lifecycle management
- KYC document storage
- Move-in/move-out tracking
- Tenant profile management
- Automated bed allocation and release

### Electricity Management
- Configurable electricity billing settings
- Meter reading submission with image upload
- Approval/rejection workflow
- Automatic bill calculation
- Late fee management

### Billing & Invoicing
- Automated monthly invoice generation
- Combined billing (rent + electricity + other charges)
- Late fee calculation
- Due date management
- Receipt generation

### Payment Processing
- Multiple payment methods (UPI, Card, NetBanking, Wallet, Cash)
- Payment tracking
- Partial payment support
- Automatic invoice status updates
- Payment confirmation emails

### Maintenance Tickets
- Ticket creation and management
- Priority-based categorization
- Status tracking (Open, In Progress, Resolved, Closed)
- Image attachment support
- Email notifications

### Reports & Analytics
- Dashboard statistics
- Revenue reports
- Occupancy reports
- Payment reports
- Electricity consumption reports

## 🛠️ Installation

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v13 or higher)
- npm or yarn

### Setup Steps

1. **Clone the repository**
```bash
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**

Create a `.env` file in the backend directory:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
API_VERSION=v1

# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/pg_management_db?schema=public"

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_EXPIRE=1h
JWT_REFRESH_EXPIRE=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./uploads

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@pgmanagement.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Bcrypt Salt Rounds
BCRYPT_SALT_ROUNDS=10

# Application URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000
```

4. **Set up the database**

```bash
# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed the database with sample data
npm run prisma:seed
```

5. **Start the development server**
```bash
npm run dev
```

The API will be available at `http://localhost:5000`

## 📚 API Documentation

Once the server is running, access the interactive API documentation at:

```
http://localhost:5000/api-docs
```

## 🔑 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout user
- `POST /api/v1/auth/logout-all` - Logout from all devices
- `GET /api/v1/auth/me` - Get current user profile
- `POST /api/v1/auth/change-password` - Change password

### Properties
- `POST /api/v1/properties` - Create property
- `GET /api/v1/properties` - Get all properties
- `GET /api/v1/properties/:id` - Get property by ID
- `PUT /api/v1/properties/:id` - Update property
- `DELETE /api/v1/properties/:id` - Delete property
- `GET /api/v1/properties/:id/stats` - Get property statistics

### Rooms
- `POST /api/v1/rooms` - Create room
- `GET /api/v1/rooms/property/:propertyId` - Get rooms by property
- `GET /api/v1/rooms/:id` - Get room by ID
- `PUT /api/v1/rooms/:id` - Update room
- `DELETE /api/v1/rooms/:id` - Delete room

### Beds
- `POST /api/v1/rooms/beds` - Create bed
- `GET /api/v1/rooms/:roomId/beds` - Get beds by room
- `PUT /api/v1/rooms/beds/:id` - Update bed
- `DELETE /api/v1/rooms/beds/:id` - Delete bed

### Tenants
- `POST /api/v1/tenants` - Create tenant
- `GET /api/v1/tenants` - Get all tenants
- `GET /api/v1/tenants/:id` - Get tenant by ID
- `PUT /api/v1/tenants/:id` - Update tenant
- `POST /api/v1/tenants/:id/checkout` - Checkout tenant
- `DELETE /api/v1/tenants/:id` - Delete tenant

### Electricity
- `GET /api/v1/electricity/settings` - Get electricity settings
- `PUT /api/v1/electricity/settings` - Update electricity settings
- `POST /api/v1/electricity/bills` - Submit electricity bill
- `GET /api/v1/electricity/bills` - Get all bills
- `GET /api/v1/electricity/bills/:id` - Get bill by ID
- `POST /api/v1/electricity/bills/:id/approve` - Approve bill
- `POST /api/v1/electricity/bills/:id/reject` - Reject bill
- `DELETE /api/v1/electricity/bills/:id` - Delete bill

### Invoices
- `POST /api/v1/invoices` - Generate invoice
- `GET /api/v1/invoices` - Get all invoices
- `GET /api/v1/invoices/:id` - Get invoice by ID
- `PUT /api/v1/invoices/:id` - Update invoice
- `DELETE /api/v1/invoices/:id` - Delete invoice
- `POST /api/v1/invoices/update-overdue` - Update overdue invoices

### Payments
- `POST /api/v1/payments` - Create payment
- `GET /api/v1/payments` - Get all payments
- `GET /api/v1/payments/:id` - Get payment by ID
- `PUT /api/v1/payments/:id/status` - Update payment status
- `DELETE /api/v1/payments/:id` - Delete payment

### Maintenance
- `POST /api/v1/maintenance` - Create ticket
- `GET /api/v1/maintenance` - Get all tickets
- `GET /api/v1/maintenance/stats` - Get ticket statistics
- `GET /api/v1/maintenance/:id` - Get ticket by ID
- `PUT /api/v1/maintenance/:id` - Update ticket
- `DELETE /api/v1/maintenance/:id` - Delete ticket

### Reports
- `GET /api/v1/reports/dashboard` - Get dashboard statistics
- `GET /api/v1/reports/revenue` - Get revenue report
- `GET /api/v1/reports/occupancy` - Get occupancy report
- `GET /api/v1/reports/payments` - Get payment report
- `GET /api/v1/reports/electricity` - Get electricity report

### File Upload
- `POST /api/v1/upload/kyc` - Upload KYC document
- `POST /api/v1/upload/meter-image` - Upload meter image
- `POST /api/v1/upload/maintenance-images` - Upload maintenance images

## 🧪 Testing

The database seed script creates test users with the following credentials:

**Owner Account:**
- Email: `owner@pgmanagement.com`
- Password: `password123`

**Tenant Accounts:**
- Email: `tenant1@example.com` / Password: `password123`
- Email: `tenant2@example.com` / Password: `password123`
- Email: `tenant3@example.com` / Password: `password123`

## 📁 Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts            # Database seed script
├── src/
│   ├── config/
│   │   ├── database.ts    # Prisma client configuration
│   │   └── swagger.ts     # Swagger documentation config
│   ├── controllers/       # Request handlers
│   ├── middleware/        # Custom middleware
│   ├── routes/           # API routes
│   ├── types/            # TypeScript types
│   ├── utils/            # Utility functions
│   ├── validators/       # Request validators
│   └── server.ts         # Application entry point
├── uploads/              # File uploads directory
├── .env                  # Environment variables
├── package.json
├── tsconfig.json
└── README.md
```

## 🔒 Security Features

- JWT authentication with access and refresh tokens
- Password hashing using bcrypt
- Role-based access control (RBAC)
- Request rate limiting
- Input validation and sanitization
- CORS configuration
- Helmet.js security headers
- SQL injection prevention (Prisma parameterized queries)

## 📧 Email Notifications

The system sends automated emails for:
- Welcome emails for new tenants
- Invoice generation
- Payment confirmations
- Payment reminders
- Overdue payment alerts
- Electricity bill approval/rejection
- Maintenance ticket updates

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Variables for Production
Ensure all environment variables are properly configured for production, especially:
- `NODE_ENV=production`
- Secure JWT secrets
- Production database URL
- SMTP credentials for email service

## 📝 License

MIT License

## 👥 Support

For support and queries, please contact the development team.

---

**Built with ❤️ for efficient PG management**

