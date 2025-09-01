# BidNow Backend Deployment Guide

## Deploy to Render

### Step 1: Prepare Repository
1. Push your code to GitHub
2. Make sure all environment variables are documented in `env.example`

### Step 2: Deploy to Render
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `bidnow-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

### Step 3: Environment Variables
Set these in Render dashboard:
- `NODE_ENV`: `production`
- `MONGODB_URI`: Your MongoDB Atlas connection string
- `JWT_SECRET`: Generate a strong secret key
- `EMAIL_USER`: Your Gmail address
- `EMAIL_PASS`: Your Gmail app password
- `EMAIL_FROM`: `BidNow <your_email@gmail.com>`

### Step 4: Database Setup
1. Create a MongoDB Atlas cluster
2. Get the connection string
3. Add it to environment variables

### Step 5: Update Frontend
After deployment, update `src/environments/environment.prod.ts` with your Render URL.

## Local Testing
```bash
cd backend
npm install
npm start
```

## Production URL
Your backend will be available at: `https://your-app-name.onrender.com`