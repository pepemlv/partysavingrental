# 🔄 Render Backup Server Setup

## Why Use Render as Backup?

- ✅ **Redundancy**: If Vercel goes down, payments still work
- ✅ **Separate backend**: Independent API server
- ✅ **Free tier available**: Good for backup/failover
- ✅ **Auto-deploy**: Updates automatically from GitHub

---

## 🚀 Deploy to Render

### 1. **Create Render Account**
   - Go to https://render.com
   - Sign up with GitHub

### 2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select your project

### 3. **Configure the Service**
   Render will auto-detect `render.yaml`, or manually set:
   - **Name**: `partysavingrental-api`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: Free (or paid for better performance)

### 4. **Add Environment Variables**
   In Render Dashboard → Environment:
   ```
   NODE_ENV=production
   STRIPE_SECRET_KEY=sk_live_your_secret_key_here
   PORT=3001
   ```

### 5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (2-3 minutes)
   - You'll get a URL like: `https://partysavingrental-api.onrender.com`

---

## 🔧 Configure Frontend to Use Render

### **Option A: Use Render as Primary Backend**

In Vercel environment variables, add:
```
VITE_API_URL=https://partysavingrental-api.onrender.com
```

### **Option B: Use as Failover (Automatic Retry)**

Update `CheckoutForm.tsx` with retry logic:

```typescript
const API_URLS = [
  '', // Try Vercel first (same domain)
  'https://partysavingrental-api.onrender.com', // Fallback to Render
];

for (const apiUrl of API_URLS) {
  try {
    const response = await fetch(`${apiUrl}/api/create-payment-intent`, {...});
    if (response.ok) break; // Success, stop trying
  } catch (error) {
    if (apiUrl === API_URLS[API_URLS.length - 1]) throw error; // Last attempt failed
  }
}
```

---

## 📊 Backend Options Comparison

| Feature | Vercel (Primary) | Render (Backup) |
|---------|-----------------|-----------------|
| **Setup** | Single repo | Separate service |
| **Domain** | partysavingrental.com/api | onrender.com subdomain |
| **Cold starts** | Very fast | ~30s on free tier |
| **Cost** | Free (Hobby) | Free tier available |
| **Deployment** | Auto with frontend | Independent |

---

## ✅ Recommended Setup

**1. Primary: Vercel** (fastest, same domain)
   - Deploy full app with backend
   - API at: `https://partysavingrental.com/api`

**2. Backup: Render** (failover if Vercel API fails)
   - Independent API server
   - API at: `https://partysavingrental-api.onrender.com/api`
   - Set `VITE_API_URL` in Vercel to use Render

**3. Choose one approach:**
   - **Simple**: Use Render only, set `VITE_API_URL` in Vercel
   - **Advanced**: Implement retry logic to try both

---

## 🧪 Testing Your Render Deployment

Once deployed, test the health endpoint:

```bash
curl https://partysavingrental-api.onrender.com/api/health
```

Should return:
```json
{"status":"ok","message":"Payment server is running"}
```

---

## 🔒 Security Notes

- ✅ Render provides free SSL certificates
- ✅ CORS already configured in server.js
- ✅ Environment variables are encrypted
- ✅ Separate from frontend for better security

---

## 💡 Pro Tip

For production, consider:
- **Render Paid Plan** (~$7/mo) - Eliminates cold starts
- **Or use both**: Vercel primary + Render backup for redundancy
- **Monitor both**: Set up health check alerts

---

## Next Steps

1. Deploy to Render following steps above
2. Get your Render URL
3. Add `VITE_API_URL` to Vercel environment variables
4. Rebuild and test payments
