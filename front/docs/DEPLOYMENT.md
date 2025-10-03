# Immortal Nexus Deployment Guide

This guide covers deploying the Immortal Nexus monorepo to production using Netlify (frontend) and Render (backend).

## 🏗️ **Monorepo Structure**

```
Nexus/
├── front/              # Frontend (Netlify)
├── back/               # Backend (Render)
├── netlify.toml        # Netlify configuration
├── CNAME              # Domain configuration
└── .github/workflows/ # CI/CD pipelines
```

---

## 🌐 **Frontend Deployment (Netlify)**

### **1. Update Netlify Site Settings**

1. **Go to Netlify Dashboard**: https://app.netlify.com
2. **Select your site** (currently pointing to old Immortal Nexus repo)
3. **Site settings → Build & deploy → Repository**
4. **Update repository**: 
   - Repository: `https://github.com/ImmortalAl/Nexus`
   - Branch: `main`
   - Base directory: `front/`
   - Publish directory: `front/`
   - Build command: `echo "Static site - no build required"`

### **2. Environment Variables (if needed)**

```bash
# In Netlify Dashboard → Site settings → Environment variables
NODE_VERSION=18
```

### **3. Domain Configuration**

- **Primary domain**: `immortal.nexus`
- **HTTPS**: Enabled (automatic)
- **Branch deploys**: Only from `main` branch

---

## 🔧 **Backend Deployment (Render)**

### **1. Update Render Service Settings**

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Select your backend service** (currently pointing to old nexus-auth repo)
3. **Settings → Repository**
4. **Update repository settings**:
   - Repository: `https://github.com/ImmortalAl/Nexus`
   - Branch: `main`
   - Root directory: `back/`
   - Build command: `npm install`
   - Start command: `npm start`

### **2. Environment Variables**

**Update these in Render Dashboard → Environment**:

```bash
# Database
MONGO_URI=mongodb+srv://your-cluster-url

# Authentication  
JWT_SECRET=your-jwt-secret

# Server
PORT=3001
NODE_ENV=production

# Email (optional)
EMAIL_HOST=smtp.provider.com
EMAIL_PORT=465
EMAIL_USER=email@domain.com
EMAIL_PASS=app_password

# CORS
FRONTEND_URL=https://immortal.nexus
```

### **3. Custom Domain (Backend)**

If you want a custom API domain:
- **Primary domain**: `api.immortal.nexus`
- **Update DNS**: Point to Render's provided URL

---

## 🚀 **Deployment Process**

### **Automatic Deployment**

Both services deploy automatically when you push to the `main` branch:

```bash
# Deploy both frontend and backend
git add .
git commit -m "Deploy: Your changes"
git push origin main
```

### **Frontend-only Deployment**

Changes to `front/` directory will trigger frontend deployment:

```bash
# Only frontend changes
git add front/
git commit -m "Frontend: Your changes"
git push origin main
```

### **Backend-only Deployment**

Changes to `back/` directory will trigger backend deployment:

```bash
# Only backend changes  
git add back/
git commit -m "Backend: Your changes"
git push origin main
```

---

## 🔧 **Manual Deployment**

### **Manual Netlify Deploy**

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login and deploy
netlify login
netlify deploy --prod --dir=front
```

### **Manual Render Deploy**

1. Go to Render Dashboard
2. Select your service
3. Click "Manual Deploy" → "Deploy latest commit"

---

## 🔍 **Monitoring & Testing**

### **URLs to Test**

- **Frontend**: https://immortal.nexus
- **Backend API**: https://immortal-nexus-backend.onrender.com/api
- **Health check**: https://immortal-nexus-backend.onrender.com/api/health

### **Deployment Logs**

- **Netlify**: Dashboard → Deploys → [Latest deploy] → View logs
- **Render**: Dashboard → [Service] → Logs
- **GitHub Actions**: Repository → Actions tab

### **Quick Health Check**

```bash
# Test frontend
curl -I https://immortal.nexus

# Test backend API
curl -I https://immortal-nexus-backend.onrender.com/api/health
```

---

## 🛠️ **Troubleshooting**

### **Common Issues**

1. **Build fails**: Check logs for dependency issues
2. **404 errors**: Verify routing configuration in `netlify.toml`
3. **API connection**: Check CORS settings and environment variables
4. **Custom domain**: Verify DNS settings and SSL certificates

### **Rollback Strategy**

1. **Netlify**: Dashboard → Deploys → Select previous deploy → "Publish deploy"
2. **Render**: Dashboard → Service → Deploys → Select previous deploy → "Redeploy"
3. **Git**: `git revert <commit-hash>` and push

---

## ✅ **Post-Deployment Checklist**

- [ ] Frontend loads at https://immortal.nexus
- [ ] Backend responds at API endpoints
- [ ] Authentication flow works
- [ ] Database connections established
- [ ] Custom domain redirects properly
- [ ] SSL certificates active
- [ ] Environment variables set correctly
- [ ] Error pages display properly
- [ ] Performance metrics acceptable

---

*Last updated: December 2024* 