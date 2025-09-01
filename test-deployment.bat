@echo off
echo 🚀 Testing BidNow Deployment...

echo.
echo Enter your deployment URLs:
set /p FRONTEND_URL="Frontend URL (Vercel): "
set /p BACKEND_URL="Backend URL (Render): "

echo.
echo 🧪 Running deployment tests...

echo Testing Frontend...
curl -s -f "%FRONTEND_URL%" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend is accessible
) else (
    echo ❌ Frontend is not accessible
)

echo Testing Backend Health Check...
curl -s -f "%BACKEND_URL%/api/health" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend Health Check is accessible
) else (
    echo ❌ Backend Health Check is not accessible
)

echo Testing Backend Auctions API...
curl -s -f "%BACKEND_URL%/api/auctions" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend Auctions API is accessible
) else (
    echo ❌ Backend Auctions API is not accessible
)

echo.
echo 📋 Manual Tests to Perform:
echo 1. Visit %FRONTEND_URL%
echo 2. Try registering a new user
echo 3. Test login functionality
echo 4. Create an auction (if logged in as seller)
echo 5. Test bidding on auctions
echo 6. Test admin dashboard (if admin user)

echo.
echo 🔧 If tests fail:
echo - Check Render logs for backend issues
echo - Check Vercel logs for frontend issues
echo - Verify environment variables are set correctly
echo - Check MongoDB Atlas connection

echo.
echo 🎉 Deployment test complete!
pause
