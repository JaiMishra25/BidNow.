# 🚀 **Local Testing Guide - BidNow Project**

This guide will help you set up and test both the backend and frontend locally before deploying to Render/Vercel.

## 📋 **Prerequisites**

1. **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
2. **MongoDB** - Install locally or use MongoDB Atlas
3. **Angular CLI** - Install globally: `npm install -g @angular/cli`

## 🗄️ **Step 1: Set Up MongoDB**

### Option A: Local MongoDB Installation
1. Download and install MongoDB Community Server
2. Start MongoDB service
3. Create database: `bidnow`

### Option B: MongoDB Atlas (Recommended for testing)
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create free cluster
3. Get connection string
4. Update `backend/env.local` with your connection string

## 🔧 **Step 2: Backend Setup**

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   - Copy `env.local` to `.env`:
   ```bash
   cp env.local .env
   ```
   
   - Edit `.env` with your MongoDB connection:
   ```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/bidnow
   JWT_SECRET=bidnow_local_secret_key_for_testing_12345
   EMAIL_USER=test@example.com
   EMAIL_PASS=test_password
   EMAIL_FROM=BidNow <test@example.com>
   FRONTEND_URL=http://localhost:4200
   ```

4. **Start the backend server:**
   ```bash
   npm run dev
   ```
   
   You should see:
   ```
   Server running on port 3000
   Connected to MongoDB
   Auction statuses updated
   ```

## 🌐 **Step 3: Frontend Setup**

1. **Open a new terminal and navigate to project root:**
   ```bash
   cd ..  # Go back to project root
   ```

2. **Install Angular dependencies:**
   ```bash
   npm install
   ```

3. **Start the Angular development server:**
   ```bash
   ng serve
   ```
   
   You should see:
   ```
   Compiled successfully.
   ** Angular Live Development Server is listening on localhost:4200 **
   ```

## 🧪 **Step 4: Test the Connection**

### **Test Backend API:**
1. Open browser and go to: `http://localhost:3000/api/auth`
2. You should see a response (even if it's an error, it means the server is running)

### **Test Frontend:**
1. Open browser and go to: `http://localhost:4200`
2. You should see the BidNow homepage

### **Test Registration:**
1. Click "Register" or go to `/register`
2. Fill out the form with test data:
   - Name: `Test User`
   - Email: `test@example.com`
   - Password: `Test123!@`
   - Role: `buyer`
3. Submit the form
4. Check backend console for successful user creation
5. Check MongoDB for the new user

### **Test Login:**
1. Go to `/login`
2. Use the credentials you just created
3. You should be redirected to the dashboard

## 🔐 **Step 5: Seed Database (Optional)**

If you want to test with sample data:

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Run the seed script:**
   ```bash
   npm run seed
   ```

3. **Sample login credentials:**
   - Admin: `admin@bidnow.com` / `Admin123@`
   - Seller: `seller@bidnow.com` / `Seller123@`
   - Buyer: `buyer@bidnow.com` / `Buyer123@`

## 🚨 **Troubleshooting**

### **Backend Issues:**

1. **Port already in use:**
   ```bash
   # Kill process using port 3000
   npx kill-port 3000
   # Or change port in .env file
   ```

2. **MongoDB connection failed:**
   - Check if MongoDB is running
   - Verify connection string in `.env`
   - Check MongoDB logs

3. **Dependencies not found:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

### **Frontend Issues:**

1. **Port already in use:**
   ```bash
   # Kill process using port 4200
   npx kill-port 4200
   # Or use different port
   ng serve --port 4201
   ```

2. **Build errors:**
   ```bash
   npm install
   ng serve
   ```

3. **CORS issues:**
   - Ensure backend is running on port 3000
   - Check CORS configuration in `backend/server.js`

### **Database Issues:**

1. **MongoDB not running:**
   ```bash
   # Start MongoDB service
   sudo systemctl start mongod
   # Or start manually
   mongod
   ```

2. **Database not found:**
   - MongoDB will create the database automatically
   - Check connection string includes database name

## 📱 **Testing Different User Roles**

### **Buyer Testing:**
1. Register as a buyer
2. Browse auctions
3. Place bids (if auctions are available)
4. View bid history

### **Seller Testing:**
1. Register as a seller
2. Create auctions
3. Upload images
4. Manage your auctions

### **Admin Testing:**
1. Use seeded admin account: `admin@bidnow.com`
2. Approve/reject auctions
3. Manage users
4. View analytics

## 🔄 **Real-time Features Testing**

1. **Open multiple browser tabs/windows**
2. **Join the same auction room**
3. **Place bids from different accounts**
4. **Verify real-time updates**

## 📊 **Monitoring and Logs**

### **Backend Logs:**
- Watch terminal where backend is running
- Check for API calls and errors
- Monitor Socket.IO connections

### **Frontend Logs:**
- Open browser Developer Tools (F12)
- Check Console tab for errors
- Check Network tab for API calls

### **Database Logs:**
- Check MongoDB logs
- Use MongoDB Compass for visual database management

## 🚀 **Next Steps After Local Testing**

Once everything works locally:

1. **Deploy Backend to Render:**
   - Follow `backend/DEPLOYMENT.md`
   - Update environment variables
   - Test deployed API endpoints

2. **Deploy Frontend to Vercel:**
   - Update API URLs to point to Render backend
   - Build and deploy
   - Test live deployment

3. **Update CORS Settings:**
   - Update `backend/server.js` with your Vercel domain
   - Redeploy backend

## 📞 **Support**

If you encounter issues:

1. Check the troubleshooting section above
2. Verify all services are running
3. Check console logs and error messages
4. Ensure ports are not blocked by firewall
5. Verify MongoDB connection and permissions

## 🎯 **Quick Test Checklist**

- [ ] Backend server running on port 3000
- [ ] Frontend running on port 4200
- [ ] MongoDB connected
- [ ] User registration works
- [ ] User login works
- [ ] API endpoints responding
- [ ] Real-time features working
- [ ] No console errors

---

**Happy Testing! 🎉**
