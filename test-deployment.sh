#!/bin/bash

# BidNow Deployment Test Script
echo "🚀 Testing BidNow Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to test URL
test_url() {
    local url=$1
    local name=$2
    
    echo -e "${YELLOW}Testing $name...${NC}"
    
    if curl -s -f "$url" > /dev/null; then
        echo -e "${GREEN}✅ $name is accessible${NC}"
        return 0
    else
        echo -e "${RED}❌ $name is not accessible${NC}"
        return 1
    fi
}

# Get URLs from user
echo "Enter your deployment URLs:"
read -p "Frontend URL (Vercel): " FRONTEND_URL
read -p "Backend URL (Render): " BACKEND_URL

echo ""
echo "🧪 Running deployment tests..."

# Test frontend
test_url "$FRONTEND_URL" "Frontend (Vercel)"

# Test backend health endpoint
test_url "$BACKEND_URL/api/health" "Backend Health Check"

# Test backend API endpoints
test_url "$BACKEND_URL/api/auctions" "Backend Auctions API"

echo ""
echo "📋 Manual Tests to Perform:"
echo "1. Visit $FRONTEND_URL"
echo "2. Try registering a new user"
echo "3. Test login functionality"
echo "4. Create an auction (if logged in as seller)"
echo "5. Test bidding on auctions"
echo "6. Test admin dashboard (if admin user)"

echo ""
echo "🔧 If tests fail:"
echo "- Check Render logs for backend issues"
echo "- Check Vercel logs for frontend issues"
echo "- Verify environment variables are set correctly"
echo "- Check MongoDB Atlas connection"

echo ""
echo "🎉 Deployment test complete!"
