# 🚀 Vercel Live Deployment Setup

## Step-by-Step Guide to Deploy Your App Live

### 1️⃣ **Push Your Code to GitHub** ✅ (Already Done!)

Your code is now at: `https://github.com/pepemlv/partysavingrental`

---

### 2️⃣ **Connect to Vercel**

1. **Go to Vercel:**
   - Visit https://vercel.com
   - Click "Sign Up" or "Login"
   - Choose "Continue with GitHub"

2. **Import Your Repository:**
   - Click "Add New..." → "Project"
   - Find and select `partysavingrental` repository
   - Click "Import"

---

### 3️⃣ **Configure Your Project**

#### **Build & Output Settings:**
- **Framework Preset:** Vite
- **Build Command:** `npm run build` (already set)
- **Output Directory:** `dist` (already set)
- **Install Command:** `npm install` (auto-detected)

#### **Root Directory:**
- Leave as `.` (root of repository)

---

### 4️⃣ **Add Environment Variables** ⚠️ CRITICAL

In the "Environment Variables" section, add these:

```env
VITE_SUPABASE_URL=https://hduzoffhigbabuwrvuww.supabase.co

VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkdXpvZmZoaWdiYWJ1d3J2dXd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyODEwNTcsImV4cCI6MjA3OTg1NzA1N30.Fpaq2JbEc0AO6woyawEDYTKYDmoklk9SOXQl8Fz2HfQ

VITE_STRIPE_PUBLISHABLE_KEY=pk_live_51RfKf3AGJ9VOvdss54yJ571gHjYqx6PD2E7TyQCfwsBWcY7JFaRlif9cddDMFg6kubKygzWkWxFKPUwCqHWYEieB00TfkqnrUX

STRIPE_SECRET_KEY=sk_live_YOUR_SECRET_KEY_HERE

NODE_ENV=production

PORT=3001
```

**Important:** Replace `STRIPE_SECRET_KEY` with your actual **live** secret key from Stripe Dashboard.

#### **How to Add Variables:**
- Click "Add" for each variable
- Name: (variable name)
- Value: (variable value)
- Environment: Select all (Production, Preview, Development)
- Click "Add"

---

### 5️⃣ **Deploy**

1. Click **"Deploy"** button
2. Wait 2-3 minutes for build to complete
3. You'll get a live URL like: `https://partysavingrental.vercel.app`

---

### 6️⃣ **Connect Your Custom Domain** (partysavingrental.com)

1. **In Vercel Dashboard:**
   - Go to your project → Settings → Domains
   - Click "Add Domain"
   - Enter: `partysavingrental.com`
   - Click "Add"

2. **Update DNS Settings** (at your domain registrar):
   
   Vercel will show you which DNS records to add. Typically:
   
   **For Root Domain (partysavingrental.com):**
   - Type: `A`
   - Name: `@`
   - Value: `76.76.21.21` (Vercel's IP)
   
   **For WWW Subdomain:**
   - Type: `CNAME`
   - Name: `www`
   - Value: `cname.vercel-dns.com`

3. **Wait for DNS Propagation** (5 minutes to 48 hours)

4. **SSL Certificate:** Vercel automatically provisions SSL (https://)

---

### 7️⃣ **Verify Everything Works**

After deployment, test:

1. **Homepage:** `https://partysavingrental.com`
2. **API Health:** `https://partysavingrental.com/api/health`
   - Should return: `{"status":"ok","message":"Payment server is running"}`
3. **Admin Login:** `https://partysavingrental.com/admin`
   - Credentials: admin / admin123
4. **Test Payment:** Use Stripe test card:
   - Card: 4242 4242 4242 4242
   - Or use a real card in live mode

---

### 8️⃣ **Auto-Deploy Setup** (Already Configured!)

Now whenever you push to GitHub:
```bash
git add .
git commit -m "Your changes"
git push
```

Vercel will automatically:
- Build your app
- Run tests
- Deploy to production
- Update your live site

---

## 🔧 Common Issues & Solutions

### **Issue: "API 404 Not Found"**
**Solution:** 
- Make sure `vercel.json` is committed to GitHub
- Verify environment variables are set
- Redeploy project

### **Issue: "Stripe API Key Error"**
**Solution:**
- Go to Settings → Environment Variables
- Check `STRIPE_SECRET_KEY` is set correctly
- Must start with `sk_live_` for production
- Redeploy after updating

### **Issue: "Domain Not Working"**
**Solution:**
- Check DNS records are correct
- Wait up to 48 hours for DNS propagation
- Use `https://dnschecker.org` to verify

### **Issue: "Build Failed"**
**Solution:**
- Check build logs in Vercel dashboard
- Verify all dependencies in package.json
- Check for TypeScript errors locally first

---

## 📊 **Monitoring Your Live App**

### **Vercel Dashboard:**
- View deployment history
- Check real-time logs
- Monitor bandwidth usage
- See function invocations

### **Stripe Dashboard:**
- Monitor payments at https://dashboard.stripe.com
- View customer transactions
- Check for failed payments
- Export financial reports

### **Firebase Console:**
- View Firestore data
- Monitor database usage
- Check authentication logs
- Review security rules

---

## 🔒 **Security Checklist**

- ✅ `.env` file is in `.gitignore` (secrets not exposed)
- ✅ Environment variables set in Vercel (not in code)
- ✅ Using HTTPS (Vercel auto-enables SSL)
- ✅ Stripe API keys are production keys
- ✅ Admin panel password protected
- ✅ CORS configured for your domain only

---

## 💰 **Vercel Pricing**

- **Hobby (Free):** 
  - Perfect for getting started
  - 100GB bandwidth/month
  - Unlimited projects
  
- **Pro ($20/mo):**
  - When you need more bandwidth
  - Better performance
  - Team collaboration

Start with Free tier, upgrade when needed!

---

## 🎉 **Your Live URLs**

After setup, your app will be available at:
- **Production:** https://partysavingrental.com
- **API:** https://partysavingrental.com/api
- **Admin:** https://partysavingrental.com/admin

---

## 🆘 **Need Help?**

- **Vercel Docs:** https://vercel.com/docs
- **Vercel Support:** support@vercel.com
- **Check deployment logs** in Vercel dashboard for errors

---

## 📝 **Next Steps After Deployment**

1. ✅ Test all payment flows with real transactions
2. ✅ Add cities in admin panel with coordinates
3. ✅ Test form submission and Firestore saving
4. ✅ Verify email receipts from Stripe
5. ✅ Set up Stripe webhooks for payment notifications
6. ✅ Monitor first few transactions closely
7. ✅ Consider adding analytics (Google Analytics, etc.)
