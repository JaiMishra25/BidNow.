# 🚀 BidNow Deployment Guide

This guide will help you deploy your BidNow auction platform to production.

## 📋 Prerequisites

- GitHub account
- Vercel account (free)
- Render account (free)
- MongoDB Atlas account (free)

## 🎯 Deployment Overview

- **Frontend**: Vercel (Angular app)
- **Backend**: Render (Node.js/Express API)
- **Database**: MongoDB Atlas (cloud database)

---

## 🔧 Step 1: Prepare Your Code

### 1.1 Push to GitHub
```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit - ready for deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/bidnow.git
git push -u origin main
```

### 1.2 Update Environment Configuration
The environment files have been created:
- `src/environments/environment.ts` (development)
- `src/environments/environment.prod.ts` (production)

---

## 🗄️ Step 2: Set Up MongoDB Atlas

### 2.1 Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account
3. Create a new cluster (free tier)

### 2.2 Configure Database Access
1. Go to "Database Access" → "Add New Database User"
2. Create a user with read/write permissions
3. Note down the username and password

### 2.3 Configure Network Access
1. Go to "Network Access" → "Add IP Address"
2. Add `0.0.0.0/0` for all IPs (or your specific IPs)

### 2.4 Get Connection String
1. Go to "Clusters" → "Connect"
2. Choose "Connect your application"
3. Copy the connection string
4. Replace `<password>` with your database user password

---

## ⚙️ Step 3: Deploy Backend to Render

### 3.1 Create Render Account
1. Go to [Render](https://render.com)
2. Sign up with GitHub

### 3.2 Deploy Web Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Select your repository

### 3.3 Configure Service
- **Name**: `bidnow-backend`
- **Environment**: `Node`
- **Build Command**: `cd backend && npm install`
- **Start Command**: `cd backend && npm start`
- **Plan**: Free

### 3.4 Set Environment Variables
In Render dashboard, add these environment variables:

```
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/bidnow?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_FROM=BidNow <your_gmail@gmail.com>
```

### 3.5 Deploy
1. Click "Create Web Service"
2. Wait for deployment to complete
3. Note your backend URL: `https://your-app-name.onrender.com`

---

## 🌐 Step 4: Deploy Frontend to Vercel

### 4.1 Update Production Environment
Update `src/environments/environment.prod.ts`:
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-app-name.onrender.com/api'
};
```

### 4.2 Create Vercel Account
1. Go to [Vercel](https://vercel.com)
2. Sign up with GitHub

### 4.3 Deploy Project
1. Click "New Project"
2. Import your GitHub repository
3. Configure build settings:
   - **Framework Preset**: Angular
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist/bidnow`
   - **Install Command**: `npm install`

### 4.4 Environment Variables (Optional)
If you need any frontend environment variables, add them in Vercel dashboard.

### 4.5 Deploy
1. Click "Deploy"
2. Wait for deployment to complete
3. Your app will be available at: `https://your-app-name.vercel.app`

---

## 🔐 Step 5: Configure Email (Optional)

### 5.1 Gmail App Password
1. Enable 2-factor authentication on Gmail
2. Go to Google Account settings
3. Generate an "App Password" for your application
4. Use this password in `EMAIL_PASS` environment variable

---

## ✅ Step 6: Test Your Deployment

### 6.1 Test Backend
```bash
# Test your backend API
curl https://your-app-name.onrender.com/api/health
```

### 6.2 Test Frontend
1. Visit your Vercel URL
2. Try registering a new user
3. Test login functionality
4. Create an auction
5. Test bidding

---

## 🔧 Troubleshooting

### Common Issues:

1. **CORS Errors**
   - Make sure your backend CORS is configured for your frontend domain

2. **Database Connection Issues**
   - Check MongoDB Atlas network access settings
   - Verify connection string format

3. **Build Failures**
   - Check build logs in Vercel/Render
   - Ensure all dependencies are in package.json

4. **Environment Variables**
   - Double-check all environment variables are set correctly
   - Restart services after changing environment variables

---

## 📊 Monitoring

### Render Dashboard
- Monitor backend performance
- Check logs for errors
- Monitor resource usage

### Vercel Dashboard
- Monitor frontend performance
- Check build logs
- Monitor bandwidth usage

---

## 🎉 Success!

Your BidNow auction platform is now live! 

- **Frontend**: `https://your-app-name.vercel.app`
- **Backend**: `https://your-app-name.onrender.com`
- **Database**: MongoDB Atlas (managed)

## 🔄 Updates

To update your deployment:
1. Push changes to GitHub
2. Vercel and Render will automatically redeploy
3. Test the changes in production

---

## 📞 Support

If you encounter issues:
1. Check the logs in Render/Vercel dashboards
2. Verify environment variables
3. Test locally first
4. Check MongoDB Atlas connection

Happy bidding! 🎯
