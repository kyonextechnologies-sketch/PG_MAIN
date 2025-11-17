# 🔧 Restore .env File - URGENT FIX

## 🔴 Problem
`.env` file missing! Backend can't start without it.

**Errors:**
- ❌ Database connection failed: Environment variable not found: DATABASE_URL
- ⚠️ SMTP credentials not configured
- ⚠️ Twilio not configured

---

## ✅ Solution - Create .env File

### Step 1: Create .env File

**In your terminal (backend folder):**
```bash
cd backend
notepad .env
```

**Or right-click in backend folder → New File → name it `.env`**

---

### Step 2: Copy & Paste This Content

```env
# Database
DATABASE_URL="postgresql://postgre:O4dcVH8I9tDufLA56zygul9N8dgcPCOO@dpg-d472nmpr0fns73bj3s9g-a.oregon-postgres.render.com/pgms_database_6g4p"

# JWT Secrets
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production-12345"
JWT_REFRESH_SECRET="your-super-secret-jwt-refresh-key-change-this-in-production-67890"
JWT_EXPIRY="24h"
JWT_REFRESH_EXPIRY="7d"

# Server
PORT=5000
NODE_ENV=development

# CORS
CORS_ORIGIN="http://localhost:3000,http://localhost:3001"

# Email (Gmail SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="anshaj852@gmail.com"
SMTP_PASSWORD=""
EMAIL_FROM="anshaj852@gmail.com"

# Twilio (Optional - Leave empty for dev mode, OTP will show in console)
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_PHONE_NUMBER=""

# Firebase (Optional)
GOOGLE_APPLICATION_CREDENTIALS="./firebase-service-account.json"

# Redis (Optional)
REDIS_URL="redis://localhost:6379"

# Admin Portal
ADMIN_PORTAL_URL="http://localhost:3000/admin"

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR="./uploads"
```

---

### Step 3: Save & Backend Will Auto-Restart

Backend (nodemon) will automatically detect the `.env` file and restart!

**You'll see:**
```
[nodemon] restarting due to changes...
✅ Database connected successfully
✅ Server started successfully on port 5000
```

---

## 🎯 What Will Happen

### ✅ With .env File:
- ✅ Database connection works
- ✅ OTP service works (console mode)
- ✅ Server starts properly
- ✅ All APIs functional

### ⚠️ Optional Services (Can stay empty):
- **SMTP_PASSWORD** - Email not required for OTP
- **TWILIO_*** - OTP will show in console
- **REDIS_URL** - Job queues optional

---

## 📝 Quick Commands

### Windows (PowerShell):
```powershell
cd C:\Users\ansha\PGMS\backend
notepad .env
# Paste content above
# Save (Ctrl + S)
# Close
```

### Alternative (Create in VS Code):
1. Open backend folder in VS Code
2. Right-click → New File
3. Name: `.env`
4. Paste content
5. Save (Ctrl + S)

---

## 🚀 Test After Creating .env

### Backend Should Show:
```
✅ Database connected successfully
⚠️ Twilio not configured - OTP will be logged to console only
✅ Server started successfully on port 5000
```

### Test Registration:
1. Open: http://localhost:3000/register
2. Enter phone: 9876543210
3. Click "Send OTP"
4. Check backend console:
   ```
   ============================================================
   📱 DEV MODE - OTP for +919876543210: 123456
   💡 Copy this OTP and use it in the frontend
   ============================================================
   ```
5. Enter OTP
6. ✅ Success!

---

## ⚡ Status After Fix

| Component | Status |
|-----------|--------|
| Database | ✅ Connected |
| Backend Server | ✅ Running |
| OTP Service | ✅ Working (console mode) |
| Phone Verification | ✅ **READY** |

---

**Create the .env file NOW and everything will work!** 🚀

