# 🔧 Fix Prisma Permission Error

## 🔴 Error:
```
EPERM: operation not permitted, rename
'C:\Users\ansha\PGMS\backend\node_modules\.prisma\client\query_engine-windows.dll.node.tmp...'
```

## ✅ Solution:

### Step 1: Stop ALL Node.js Processes
```powershell
# Kill all Node.js processes
taskkill /F /IM node.exe /T

# OR manually:
# Ctrl + C in backend terminal
# Ctrl + C in frontend terminal
```

### Step 2: Clear Prisma Cache
```powershell
cd backend
Remove-Item -Recurse -Force node_modules\.prisma -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules\@prisma -ErrorAction SilentlyContinue
```

### Step 3: Regenerate Prisma Client
```powershell
npx prisma generate
```

### Step 4: Push Schema
```powershell
npx prisma db push
```

### Step 5: Restart Backend
```powershell
npm run dev
```

