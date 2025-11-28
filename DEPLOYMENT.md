# 🚀 Production Deployment Guide

## Current Issue
Your frontend is deployed but the backend API server is not accessible at `https://partysavingrental.com/api/create-payment-intent`

## 📋 Deployment Options

### **Option 1: Deploy Both on Vercel (Recommended)**

#### Steps:
1. **Add environment variables in Vercel Dashboard:**
   - Go to your Vercel project settings
   - Add these environment variables:
     ```
     STRIPE_SECRET_KEY=sk_live_your_secret_key
     VITE_STRIPE_PUBLISHABLE_KEY=pk_live_51RfKf3AGJ9VOvdss54yJ571gHjYqx6PD2E7TyQCfwsBWcY7JFaRlif9cddDMFg6kubKygzWkWxFKPUwCqHWYEieB00TfkqnrUX
     NODE_ENV=production
     ```

2. **Redeploy your project:**
   ```bash
   git add .
   git commit -m "Add backend API for Stripe payments"
   git push
   ```

3. **Vercel will automatically:**
   - Build your frontend
   - Deploy your backend API
   - Route `/api/*` requests to the backend

---

### **Option 2: Separate Backend Deployment**

If you want to deploy backend separately:

#### **Deploy backend to Railway/Render/Heroku:**

1. **Create new project on Railway/Render**
2. **Connect your GitHub repo**
3. **Set build command:** `npm install`
4. **Set start command:** `node server.js`
5. **Add environment variables:**
   ```
   STRIPE_SECRET_KEY=sk_live_your_secret_key
   PORT=3001
   NODE_ENV=production
   ```

6. **Update frontend environment variable:**
   - Add to Vercel: `VITE_API_URL=https://your-backend.railway.app`

7. **Update CheckoutForm.tsx** to use the API URL:
   ```typescript
   const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/create-payment-intent`, {
   ```

---

## ✅ Quick Fix for Vercel (Current Setup)

Since you already have `vercel.json` configured, just need to:

1. **Add environment variables in Vercel:**
   - Log in to Vercel Dashboard
   - Go to your project → Settings → Environment Variables
   - Add:
     - `STRIPE_SECRET_KEY` = your sk_live_... key
     - `VITE_STRIPE_PUBLISHABLE_KEY` = pk_live_51RfKf3AGJ9VOvdss54yJ571gHjYqx6PD2E7TyQCfwsBWcY7JFaRlif9cddDMFg6kubKygzWkWxFKPUwCqHWYEieB00TfkqnrUX
     - `NODE_ENV` = production

2. **Redeploy:**
   ```bash
   git add vercel.json server.js
   git commit -m "Configure backend API"
   git push
   ```

The API will be available at: `https://partysavingrental.com/api/create-payment-intent`

---

## 🧪 Testing After Deployment

1. **Test the API endpoint directly:**
   ```bash
   curl https://partysavingrental.com/api/health
   ```
   Should return: `{"status":"ok","message":"Payment server is running"}`

2. **Test a payment:**
   - Use a real card or Stripe test card (if in test mode)
   - Check Stripe Dashboard for the transaction
   - Verify payment saved in Firestore

---

## 🔍 Troubleshooting

**"404 Not Found" on /api/***
- ✅ Verify `vercel.json` is in your repo
- ✅ Check environment variables are set in Vercel
- ✅ Redeploy after adding files

**"STRIPE_SECRET_KEY is not set"**
- ✅ Add the environment variable in Vercel Dashboard
- ✅ Use your live secret key (sk_live_...)

**CORS errors:**
- ✅ Backend already configured for partysavingrental.com
- ✅ Make sure domain matches exactly

---

## 📝 Checklist

- [ ] `vercel.json` committed to repo
- [ ] `server.js` committed to repo
- [ ] Environment variables added in Vercel Dashboard
- [ ] Redeployed project
- [ ] Tested /api/health endpoint
- [ ] Tested a payment transaction
