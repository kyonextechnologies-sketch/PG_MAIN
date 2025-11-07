# 📮 Postman Testing Guide - API Routes

## ✅ Available Routes Summary

### Base URL
- **Local**: `http://localhost:5000`
- **Production**: `https://pg-backend-4cen.onrender.com`

### API Version
All routes are prefixed with: `/api/v1`

---

## 🔓 Public Routes (No Authentication Required)

### 1. Root & Health Check
```
GET  /                    → { message: "API is running" }
GET  /health              → { success: true, message: "Server is running" }
```

### 2. Authentication Routes (`/api/v1/auth`)
```
POST /api/v1/auth/register          → Register new user
POST /api/v1/auth/login             → Login user
POST /api/v1/auth/refresh           → Refresh access token
POST /api/v1/auth/forgot-password   → Request password reset
POST /api/v1/auth/reset-password    → Reset password with token
```

### 3. Room Diagnostic (Public)
```
GET  /api/v1/rooms/diagnostic       → Diagnostic endpoint (no auth)
```

---

## 🔒 Protected Routes (Authentication Required)

### Authentication Routes (Protected)
```
POST /api/v1/auth/logout            → Logout (requires token)
POST /api/v1/auth/logout-all        → Logout from all devices
GET  /api/v1/auth/me                 → Get current user profile
POST /api/v1/auth/change-password   → Change password
```

### Properties (`/api/v1/properties`)
**All routes require: Owner role + Authentication**
```
POST   /api/v1/properties              → Create property
GET    /api/v1/properties               → Get all properties (paginated)
GET    /api/v1/properties/:id           → Get property by ID
PUT    /api/v1/properties/:id           → Update property
DELETE /api/v1/properties/:id           → Delete property
GET    /api/v1/properties/:id/stats     → Get property statistics
```

### Rooms (`/api/v1/rooms`)
**All routes require: Owner role + Authentication**
```
POST   /api/v1/rooms                      → Create room
GET    /api/v1/rooms/property/:propertyId → Get rooms by property
POST   /api/v1/rooms/fix-beds             → Fix missing beds
GET    /api/v1/rooms/id/:id               → Get room by ID
PUT    /api/v1/rooms/id/:id               → Update room
DELETE /api/v1/rooms/id/:id               → Delete room
POST   /api/v1/rooms/beds                 → Create bed
GET    /api/v1/rooms/beds/:roomId         → Get beds by room
PUT    /api/v1/rooms/beds/:id             → Update bed
DELETE /api/v1/rooms/beds/:id             → Delete bed
```

### Tenants (`/api/v1/tenants`)
**Mixed: Some require Owner, some are for Tenant role**
```
GET    /api/v1/tenants/profile/me        → Get own profile (Tenant role)
POST   /api/v1/tenants                   → Create tenant (Owner only)
GET    /api/v1/tenants                   → Get all tenants (Owner only)
GET    /api/v1/tenants/:id               → Get tenant by ID (Owner only)
PUT    /api/v1/tenants/:id               → Update tenant (Owner only)
POST   /api/v1/tenants/:id/checkout      → Checkout tenant (Owner only)
DELETE /api/v1/tenants/:id               → Delete tenant (Owner only)
```

### Electricity (`/api/v1/electricity`)
**Mixed: Settings require Owner, Bills accessible to all authenticated**
```
GET    /api/v1/electricity/settings      → Get settings (Owner only)
PUT    /api/v1/electricity/settings      → Update settings (Owner only)
POST   /api/v1/electricity/bills         → Submit bill
GET    /api/v1/electricity/bills         → Get all bills (paginated)
GET    /api/v1/electricity/bills/:id     → Get bill by ID
POST   /api/v1/electricity/bills/:id/approve → Approve bill (Owner only)
POST   /api/v1/electricity/bills/:id/reject  → Reject bill (Owner only)
DELETE /api/v1/electricity/bills/:id     → Delete bill
```

### Invoices (`/api/v1/invoices`)
**All routes require: Authentication**
```
POST   /api/v1/invoices                  → Generate invoice (Owner only)
GET    /api/v1/invoices                   → Get all invoices (paginated)
GET    /api/v1/invoices/:id               → Get invoice by ID
PUT    /api/v1/invoices/:id               → Update invoice (Owner only)
DELETE /api/v1/invoices/:id               → Delete invoice (Owner only)
POST   /api/v1/invoices/update-overdue    → Update overdue invoices (Owner only)
```

### Payments (`/api/v1/payments`)
**All routes require: Authentication**
```
POST   /api/v1/payments                  → Create payment
GET    /api/v1/payments                   → Get all payments (paginated)
GET    /api/v1/payments/:id               → Get payment by ID
PUT    /api/v1/payments/:id/status        → Update payment status
DELETE /api/v1/payments/:id               → Delete payment
```

### Maintenance (`/api/v1/maintenance`)
**All routes require: Authentication**
```
POST   /api/v1/maintenance                → Create ticket
GET    /api/v1/maintenance                → Get all tickets (paginated)
GET    /api/v1/maintenance/stats          → Get ticket stats (Owner only)
GET    /api/v1/maintenance/:id            → Get ticket by ID
PUT    /api/v1/maintenance/:id            → Update ticket
DELETE /api/v1/maintenance/:id            → Delete ticket
```

### Reports (`/api/v1/reports`)
**All routes require: Authentication**
```
GET    /api/v1/reports/dashboard          → Get dashboard stats
GET    /api/v1/reports/revenue            → Get revenue report
GET    /api/v1/reports/occupancy          → Get occupancy report
GET    /api/v1/reports/payments           → Get payment report
GET    /api/v1/reports/electricity        → Get electricity report
```

### Upload (`/api/v1/upload`)
**All routes require: Authentication**
```
POST   /api/v1/upload/kyc                 → Upload KYC document
POST   /api/v1/upload/meter-image         → Upload meter image
POST   /api/v1/upload/maintenance-images  → Upload maintenance images
```

---

## 🔑 How to Test in Postman

### Step 1: Test Public Routes First

**Test Root Endpoint:**
```
Method: GET
URL: http://localhost:5000/
Expected: 200 OK
Response: { "message": "API is running", "version": "v1", ... }
```

**Test Health Check:**
```
Method: GET
URL: http://localhost:5000/health
Expected: 200 OK
```

### Step 2: Register/Login to Get Token

**Register a User:**
```
Method: POST
URL: http://localhost:5000/api/v1/auth/register
Headers: Content-Type: application/json
Body (JSON):
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123",
  "role": "OWNER"
}
```

**Login to Get Token:**
```
Method: POST
URL: http://localhost:5000/api/v1/auth/login
Headers: Content-Type: application/json
Body (JSON):
{
  "email": "test@example.com",
  "password": "password123"
}
```

**Response will contain:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { ... }
  }
}
```

### Step 3: Use Token for Protected Routes

**In Postman:**
1. Go to **Authorization** tab
2. Select **Type: Bearer Token**
3. Paste the `accessToken` from login response
4. OR manually add header:
   ```
   Authorization: Bearer <your-token-here>
   ```

**Example: Get Properties**
```
Method: GET
URL: http://localhost:5000/api/v1/properties
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Expected: 200 OK (if Owner role) or 403 Forbidden (if Tenant role)
```

---

## ❌ Common Mistakes & Solutions

### Mistake 1: Wrong URL Format
❌ **Wrong**: `http://localhost:5000/properties`
✅ **Correct**: `http://localhost:5000/api/v1/properties`

### Mistake 2: Missing Authentication Token
❌ **Error**: `401 Unauthorized - No valid authentication found`
✅ **Solution**: Add Bearer token in Authorization header

### Mistake 3: Wrong Token Format
❌ **Wrong**: `Authorization: <token>` or `Authorization: Token <token>`
✅ **Correct**: `Authorization: Bearer <token>`

### Mistake 4: Using Wrong Role
❌ **Error**: `403 Forbidden` when accessing Owner-only routes as Tenant
✅ **Solution**: Login with Owner account or use Tenant-accessible routes

### Mistake 5: Missing Content-Type Header
❌ **Error**: Request body not parsed
✅ **Solution**: Add `Content-Type: application/json` header for POST/PUT requests

### Mistake 6: Wrong HTTP Method
❌ **Wrong**: Using GET for creating resources
✅ **Correct**: Use POST for create, PUT for update, DELETE for delete

---

## 📋 Quick Test Checklist

### ✅ Public Routes (No Token Needed)
- [ ] `GET /` → Should return API status
- [ ] `GET /health` → Should return health status
- [ ] `POST /api/v1/auth/register` → Should create user
- [ ] `POST /api/v1/auth/login` → Should return token
- [ ] `GET /api/v1/rooms/diagnostic` → Should return diagnostic info

### ✅ Protected Routes (Token Required)
- [ ] `GET /api/v1/auth/me` → Should return user profile
- [ ] `GET /api/v1/properties` → Should return properties (Owner only)
- [ ] `GET /api/v1/tenants` → Should return tenants (Owner only)
- [ ] `GET /api/v1/invoices` → Should return invoices
- [ ] `GET /api/v1/payments` → Should return payments

---

## 🐛 Troubleshooting

### Issue: 404 Not Found
**Possible Causes:**
1. Wrong URL path (missing `/api/v1` prefix)
2. Wrong HTTP method
3. Route doesn't exist

**Solution:**
- Check URL format: `http://localhost:5000/api/v1/{route-name}`
- Verify HTTP method matches route definition
- Check server logs for route registration

### Issue: 401 Unauthorized
**Possible Causes:**
1. Missing Authorization header
2. Invalid or expired token
3. Token format incorrect

**Solution:**
- Add `Authorization: Bearer <token>` header
- Re-login to get fresh token
- Check token hasn't expired

### Issue: 403 Forbidden
**Possible Causes:**
1. Wrong user role (e.g., Tenant trying to access Owner routes)
2. User account inactive

**Solution:**
- Login with correct role account
- Check user account is active
- Verify route permissions

### Issue: 500 Internal Server Error
**Possible Causes:**
1. Database connection issue
2. Missing environment variables
3. Server-side code error

**Solution:**
- Check server logs
- Verify database connection
- Check all environment variables are set

---

## 📝 Postman Collection Setup

### Environment Variables (Recommended)
Create a Postman environment with:
```
base_url: http://localhost:5000
api_version: v1
access_token: (will be set after login)
```

### Pre-request Script (Auto-set Token)
```javascript
// Auto-set token from environment variable
if (pm.environment.get("access_token")) {
    pm.request.headers.add({
        key: "Authorization",
        value: "Bearer " + pm.environment.get("access_token")
    });
}
```

### Test Script (Save Token After Login)
```javascript
// Save token after login
if (pm.response.code === 200) {
    const jsonData = pm.response.json();
    if (jsonData.data && jsonData.data.accessToken) {
        pm.environment.set("access_token", jsonData.data.accessToken);
    }
}
```

---

## 🎯 Testing Workflow

1. **Start Server**: `npm run dev` or `npm start`
2. **Test Root**: `GET /` → Should work
3. **Register User**: `POST /api/v1/auth/register`
4. **Login**: `POST /api/v1/auth/login` → Save token
5. **Test Protected Route**: `GET /api/v1/auth/me` with token
6. **Test Other Routes**: Use saved token for all protected routes

---

**Note**: Always check server console logs for detailed error messages!

