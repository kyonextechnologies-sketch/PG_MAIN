# 🔐 Admin Login - Step by Step Guide

## Issue: `/admin` redirects to `/login`

यह normal behavior है! Admin portal access करने के लिए पहले login करना जरूरी है।

---

## ✅ Solution - 3 Steps

### Step 1: Backend Server Start करें
```bash
cd backend
npm run dev
```
Server चलेगा: `http://localhost:5000`

### Step 2: Frontend Server Start करें  
```bash
cd PGM
npm run dev
```
Frontend चलेगा: `http://localhost:3000`

### Step 3: Admin Login करें

#### Option A: सीधे Login Page पर जाएं
1. जाएं: `http://localhost:3000/login`
2. Login करें:
   ```
   Email: anshaj.admin@pgms.com
   Password: Anshaj@2307
   ```
3. Login के बाद, जाएं: `http://localhost:3000/admin`

#### Option B: Admin portal directly (auto-redirect)
1. जाएं: `http://localhost:3000/admin`
2. Automatically `/login` पर redirect होगा
3. Login करें (credentials ऊपर देखें)
4. Login के बाद automatically `/admin` पर redirect होगा ✅

---

## 🔍 Troubleshooting

### Issue 1: Admin user नहीं है database में

**Check करें:**
```bash
cd backend
npx prisma studio
```
Prisma Studio खुलेगा → `User` table में देखें

**Admin user manually create करें (if not exists):**

1. Register page से normal registration करें
2. Database में directly role update करें:
   ```sql
   UPDATE "User" 
   SET role = 'ADMIN' 
   WHERE email = 'your-email@gmail.com';
   ```

### Issue 2: Database में tables नहीं हैं (Notification, AuditLog, etc.)

**Local Database Use करें:**

1. `.env` file update करें:
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/pgms_local"
   ```

2. Local PostgreSQL install करें (if not installed)
   - Download: https://www.postgresql.org/download/windows/

3. Database create करें:
   ```bash
   # PostgreSQL में login करें
   psql -U postgres
   
   # Database create करें
   CREATE DATABASE pgms_local;
   \q
   ```

4. Migrations run करें:
   ```bash
   cd backend
   npx prisma migrate dev
   npx prisma db seed
   ```

### Issue 3: Session persist नहीं हो रहा

**NextAuth Secret check करें:**

`PGM/.env.local` में:
```env
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

**Generate new secret:**
```bash
openssl rand -base64 32
```

---

## 🎯 Quick Test

### Test 1: Backend Running?
```bash
curl http://localhost:5000/api/v1/health
```
Expected: `{"success": true, "message": "Server is running"}`

### Test 2: Can Login?
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "anshaj.admin@pgms.com",
    "password": "Anshaj@2307"
  }'
```
Expected: Response with `accessToken` and `user` data

### Test 3: Frontend Running?
Browser में जाएं: `http://localhost:3000`
Expected: Homepage दिखना चाहिए

---

## 📝 Important Notes

1. **Admin portal हमेशा authentication require करता है**
   - यह security feature है
   - Bina login के admin access नहीं मिलेगा

2. **Role ADMIN होना चाहिए**
   - OWNER या TENANT role से admin portal access नहीं होगा
   - Only ADMIN role users can access `/admin`

3. **Session expire होने पर**
   - Automatically `/login` पर redirect होगा
   - Re-login करना होगा

---

## 🔐 Default Admin Credentials

```
Email: anshaj.admin@pgms.com
Password: Anshaj@2307
Role: ADMIN
```

⚠️ **Production में इन credentials को बदलें!**

---

## 🚀 Alternative: Direct Admin User Create करें

अगर database में admin user नहीं है, तो आप manually create कर सकते हैं:

```typescript
// backend/scripts/create-admin.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  const hashedPassword = await bcrypt.hash('Anshaj@2307', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'anshaj.admin@pgms.com' },
    update: {
      role: 'ADMIN',
      password: hashedPassword,
    },
    create: {
      email: 'anshaj.admin@pgms.com',
      password: hashedPassword,
      name: 'Admin',
      role: 'ADMIN',
      isActive: true,
    },
  });
  
  console.log('✅ Admin user created:', admin.email);
}

createAdmin()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Run करें:
```bash
npx ts-node backend/scripts/create-admin.ts
```

---

## ✅ Summary

1. Backend चलाएं (`http://localhost:5000`)
2. Frontend चलाएं (`http://localhost:3000`)
3. Login करें: `http://localhost:3000/login`
4. Credentials use करें:
   - Email: `anshaj.admin@pgms.com`
   - Password: `Anshaj@2307`
5. Login के बाद navigate करें: `http://localhost:3000/admin`

या simply `/admin` पर जाएं, auto-redirect होकर login करवाएगा! 🎉

