# 🚀 Render Par Email Setup - Step by Step Guide

## Render Dashboard mein Environment Variables Add karne ka Process

### Step 1: Render Dashboard mein Login karein

1. Browser mein jayein: **https://dashboard.render.com**
2. Apne account se **login** karein

### Step 2: Apni Service Select karein

1. Dashboard par **"Services"** ya **"Web Services"** section mein jayein
2. Apni backend service click karein (e.g., `pg-backend-4cen`)

### Step 3: Environment Tab Open karein

1. Service page par **top menu** mein dekhein:
   - **Settings**
   - **Environment** ← Yahan click karein
   - **Events**
   - **Logs**

2. **Environment** tab par click karein

### Step 4: Environment Variables Add karein

Ab aapko **6 environment variables** add karni hain:

#### Variable 1: SMTP_HOST
1. **"Add Environment Variable"** button click karein
2. **Key** field mein type karein: `SMTP_HOST`
3. **Value** field mein type karein: `smtp.gmail.com`
4. **Save Changes** button click karein

#### Variable 2: SMTP_PORT
1. **"Add Environment Variable"** button click karein
2. **Key**: `SMTP_PORT`
3. **Value**: `587`
4. **Save Changes**

#### Variable 3: SMTP_SECURE
1. **"Add Environment Variable"** button click karein
2. **Key**: `SMTP_SECURE`
3. **Value**: `false`
4. **Save Changes**

#### Variable 4: SMTP_USER
1. **"Add Environment Variable"** button click karein
2. **Key**: `SMTP_USER`
3. **Value**: Apna Gmail address (e.g., `yourname@gmail.com`)
4. **Save Changes**

#### Variable 5: SMTP_PASSWORD
1. **"Add Environment Variable"** button click karein
2. **Key**: `SMTP_PASSWORD`
3. **Value**: Gmail App Password (16 characters, spaces ke bina)
4. **Save Changes**

**⚠️ Important**: Gmail App Password kaise generate karein:
- Google Account → Security → 2-Step Verification (enable)
- "App passwords" search karein
- "Mail" select karein
- 16-character password copy karein

#### Variable 6: EMAIL_FROM
1. **"Add Environment Variable"** button click karein
2. **Key**: `EMAIL_FROM`
3. **Value**: `noreply@pgmanagement.com` (ya apna email)
4. **Save Changes**

### Step 5: Final Check

Aapke paas total **6 variables** hone chahiye:

```
✅ SMTP_HOST = smtp.gmail.com
✅ SMTP_PORT = 587
✅ SMTP_SECURE = false
✅ SMTP_USER = your-email@gmail.com
✅ SMTP_PASSWORD = xxxxxxxxxxxxxxxx
✅ EMAIL_FROM = noreply@pgmanagement.com
```

### Step 6: Service Redeploy

1. Variables add karne ke baad, **top right corner** mein **"Manual Deploy"** button dikhega
2. Ya service **automatically redeploy** ho jayegi
3. **"Events"** tab par jake deployment status check karein

### Step 7: Verify Email Service

1. **"Logs"** tab par click karein
2. Deployment complete hone ke baad logs check karein
3. Agar sab sahi hai to yeh message dikhega:

```
✅ Email service is ready
```

Agar error aaye to:
- Check karein ki sabhi variables sahi se add hui hain
- Gmail App Password correct hai
- Variables ke values mein extra spaces nahi hain

## Quick Reference - Copy Paste ke liye

Agar aap ek saath sab variables add karna chahte hain, to yeh format use karein:

### Gmail Configuration:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password
EMAIL_FROM=noreply@pgmanagement.com
```

## Troubleshooting

### Problem: Variables add karne ke baad bhi email error aata hai

**Solution:**
1. **Logs** tab mein check karein exact error kya hai
2. Gmail App Password verify karein (regular password nahi)
3. 2-Step Verification enabled hai ya nahi check karein
4. Variables ke values mein spaces ya special characters nahi hone chahiye

### Problem: "Connection timeout" error

**Solution:**
1. `SMTP_HOST` sahi hai ya nahi check karein
2. `SMTP_PORT` 587 hai ya nahi verify karein
3. Firewall restrictions check karein

### Problem: "Authentication failed" error

**Solution:**
1. Gmail App Password regenerate karein
2. Password mein spaces remove karein
3. `SMTP_USER` correct email address hai ya nahi check karein

## Alternative: Render CLI se Variables Add karna

Agar aap command line prefer karte hain:

```bash
# Render CLI install karein
npm install -g render-cli

# Login karein
render login

# Environment variable add karein
render env:set SMTP_HOST=smtp.gmail.com --service your-service-name
render env:set SMTP_PORT=587 --service your-service-name
render env:set SMTP_SECURE=false --service your-service-name
render env:set SMTP_USER=your-email@gmail.com --service your-service-name
render env:set SMTP_PASSWORD=your-app-password --service your-service-name
render env:set EMAIL_FROM=noreply@pgmanagement.com --service your-service-name
```

## Video Guide (Visual Reference)

1. **Render Dashboard** → Services
2. **Service select** karein
3. **Environment** tab
4. **Add Environment Variable** button
5. **Key aur Value** fill karein
6. **Save Changes**
7. **Repeat** for all 6 variables
8. **Manual Deploy** (if needed)

## Success Indicators

Email service successfully setup hone ke baad:

✅ Logs mein: `✅ Email service is ready`
✅ No timeout errors
✅ Email sending functionality work karega

---

**Note**: Environment variables add karne ke baad service automatically redeploy hoti hai. Deployment complete hone tak wait karein (usually 1-2 minutes).

