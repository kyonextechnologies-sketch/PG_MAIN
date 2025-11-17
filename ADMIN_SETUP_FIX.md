# 🔐 Admin Access - Quick Fix Guide

## Problem
`/admin` → redirects to `/login` क्योंकि admin user नहीं है या role set नहीं है।

---

## ✅ Solution (Choose One)

### Method 1: Prisma Studio से (सबसे आसान! ✨)

**Prisma Studio अभी खुला है** (`http://localhost:5555`)

#### Steps:
1. **Browser में Prisma Studio खोलें**: `http://localhost:5555`

2. **Left sidebar में "User" table पर click करें**

3. **अगर कोई user पहले से है:**
   - उस user के row पर click करें
   - `role` field में `ADMIN` type करें
   - "Save 1 change" button पर click करें
   - ✅ Done!

4. **अगर कोई user नहीं है:**
   - "Add record" button पर click करें
   - Fill करें:
     ```
     email: anshaj.admin@pgms.com
     password: (कोई भी temporary value, बाद में update करेंगे)
     name: Admin
     role: ADMIN
     isActive: true
     ```
   - Save करें

5. **Password hash करने के लिए** (if created new user):
   ```bash
   # Terminal में:
   node -e "const bcrypt = require('bcrypt'); bcrypt.hash('Anshaj@2307', 10).then(console.log)"
   ```
   - Output copy करें (hash)
   - Prisma Studio में वापस जाएं
   - Admin user के `password` field में paste करें
   - Save करें

6. **अब login करें!**
   - जाएं: `http://localhost:3000/login`
   - Email: `anshaj.admin@pgms.com`
   - Password: `Anshaj@2307`
   - ✅ Login होने के बाद `/admin` access कर सकते हैं!

---

### Method 2: Direct SQL Query (Advanced)

**अगर database access है:**

```sql
-- 1. First, check if user exists
SELECT * FROM "User" WHERE email = 'anshaj.admin@pgms.com';

-- 2. If user exists, update role
UPDATE "User" 
SET role = 'ADMIN' 
WHERE email = 'anshaj.admin@pgms.com';

-- 3. If user doesn't exist, insert new
INSERT INTO "User" (id, email, password, name, role, "isActive", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(), 
  'anshaj.admin@pgms.com',
  '$2b$10$xYourHashedPasswordHere', -- See below for hash
  'Admin',
  'ADMIN',
  true,
  NOW(),
  NOW()
);
```

**Password hash generate करें:**
```bash
cd backend
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('Anshaj@2307', 10).then(h => console.log('Hash:', h))"
```

---

### Method 3: Register से + Manual Update (सबसे आसान अगर UI काम कर रहा है)

1. **Normal registration करें**:
   - जाएं: `http://localhost:3000/register`
   - अपनी email से register करें
   - Role: **OWNER** select करें (ADMIN option नहीं होगा UI में)

2. **Prisma Studio में role update करें**:
   - Open: `http://localhost:5555`
   - User table में जाएं
   - अपनी email find करें
   - `role` को `ADMIN` में change करें
   - Save करें

3. **Logout और फिर login करें**:
   - Logout करें
   - Login करें (same credentials)
   - ✅ अब `/admin` access होगा!

---

## 🔍 Verify Admin Access

### Test करें कि admin role set हुआ या नहीं:

1. **Prisma Studio में check करें**:
   - Open `http://localhost:5555`
   - User table
   - अपनी email find करें
   - `role` column में `ADMIN` दिखना चाहिए

2. **Login करके check करें**:
   ```
   1. जाएं: http://localhost:3000/login
   2. Login करें
   3. Browser console खोलें (F12)
   4. Type करें: localStorage.getItem('user')
   5. Output में role: "ADMIN" दिखना चाहिए
   ```

3. **Admin portal access करें**:
   ```
   जाएं: http://localhost:3000/admin
   
   ✅ Success: Dashboard दिखेगा
   ❌ Redirect to /login: Role set नहीं है, ऊपर के steps फिर से follow करें
   ```

---

## 📋 Quick Checklist

- [ ] Backend running है: `http://localhost:5000`
- [ ] Frontend running है: `http://localhost:3000`
- [ ] Prisma Studio खुला है: `http://localhost:5555`
- [ ] User table में admin user है
- [ ] Admin user का role = `ADMIN`
- [ ] Admin user का isActive = `true`
- [ ] Password correctly hashed है
- [ ] Login page पर जा सकते हैं
- [ ] Admin credentials से login हो सकता है
- [ ] Login के बाद `/admin` access होता है

---

## 🎯 Recommended Flow

1. ✅ **Prisma Studio खोलें** (Already open!): `http://localhost:5555`
2. ✅ **User table में जाएं**
3. ✅ **Existing user को ADMIN बनाएं** या **नया admin user create करें**
4. ✅ **Login करें**: `http://localhost:3000/login`
5. ✅ **Admin portal खोलें**: `http://localhost:3000/admin`

---

## 💡 Common Issues

### Issue: "Invalid credentials" error
**Solution**: Password hash सही से set किया है?
```bash
# Generate correct hash:
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('Anshaj@2307', 10).then(console.log)"
```

### Issue: Still redirects to /login
**Solution**:
- Logout करके फिर से login करें
- Browser cache clear करें
- Incognito mode में try करें

### Issue: "Cannot find role ADMIN"
**Solution**: Database में `User` table के `role` column में `ADMIN` value manually type करें Prisma Studio में

---

## 🎉 Final Result

Login करने के बाद, आपको ये सब access होना चाहिए:

```
✅ http://localhost:3000/admin              → Dashboard
✅ http://localhost:3000/admin/owners       → Owners List
✅ http://localhost:3000/admin/properties   → Properties
✅ http://localhost:3000/admin/maintenance  → Maintenance Tickets
✅ http://localhost:3000/admin/audit-logs   → Audit Logs
```

---

**अभी Prisma Studio में जाकर admin user create/update करें!** 🚀

`http://localhost:5555`

