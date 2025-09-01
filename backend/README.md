# BidNow Backend

A simple and efficient backend for the BidNow auction platform built with Node.js, Express, and MongoDB.

## Features

- **User Management**: Registration, login, and password recovery for buyers and sellers
- **Auction Management**: Create, update, delete, and approve auctions
- **Live Bidding**: Real-time bidding with Socket.IO
- **Admin Panel**: Approve/reject auctions, manage users, view analytics
- **Dispute Resolution**: Handle disputes between users
- **File Uploads**: Image uploads for auction items
- **Automatic Processes**: Cron jobs for auction status updates

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Real-time**: Socket.IO
- **Authentication**: JWT with bcrypt
- **File Uploads**: Multer
- **Email**: Nodemailer
- **Scheduling**: node-cron

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `env.example`:
   ```bash
   cp env.example .env
   ```

4. Configure your environment variables:
   - `PORT`: Server port (default: 3000)
   - `MONGODB_URI`: MongoDB connection string
   - `JWT_SECRET`: Secret key for JWT tokens
   - `EMAIL_USER`: Gmail address for sending emails
   - `EMAIL_PASS`: Gmail app password
   - `EMAIL_FROM`: From address for emails

5. Start the server:
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Auctions
- `GET /api/auctions` - Get all auctions
- `GET /api/auctions/:id` - Get auction by ID
- `POST /api/auctions` - Create new auction (sellers only)
- `PUT /api/auctions/:id` - Update auction (seller only)
- `DELETE /api/auctions/:id` - Delete auction (seller only)
- `GET /api/auctions/my-auctions` - Get seller's auctions
- `GET /api/auctions/category/:category` - Get auctions by category

### Bidding
- `POST /api/bids` - Place a bid
- `GET /api/bids/auction/:auctionId` - Get bid history
- `GET /api/bids/my-bids` - Get user's bidding history
- `GET /api/bids/highest/:auctionId` - Get highest bid
- `DELETE /api/bids/:bidId` - Cancel bid

### Admin
- `GET /api/admin/stats` - Get dashboard statistics
- `GET /api/admin/auctions/pending` - Get pending auctions
- `PUT /api/admin/auctions/:id/approve` - Approve auction
- `PUT /api/admin/auctions/:id/reject` - Reject auction
- `DELETE /api/admin/auctions/:id` - Delete auction
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id/block` - Block/unblock user
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/analytics/auctions` - Get auction analytics
- `GET /api/admin/analytics/users` - Get user analytics

### Disputes
- `GET /api/disputes` - Get all disputes (admin only)
- `POST /api/disputes` - Create dispute
- `GET /api/disputes/:id` - Get dispute by ID
- `PUT /api/disputes/:id/status` - Update dispute status (admin only)
- `GET /api/disputes/my-disputes` - Get user's disputes
- `GET /api/disputes/stats/overview` - Get dispute statistics

## Database Models

### User
- Basic info (name, email, password)
- Role (buyer, seller, admin)
- Account status (blocked/unblocked)
- Password reset functionality

### Auction
- Item details (title, description, image)
- Bidding parameters (starting bid, minimum bid)
- Time management (start/end times)
- Status tracking (pending, approved, ongoing, ended)
- Bid history

### Bid
- Bid amount and timestamp
- Bidder and auction references
- Winning bid tracking

### Dispute
- Complaint details
- Status tracking
- Admin resolution notes

## Real-time Features

The backend uses Socket.IO to provide real-time updates for:
- Live bid updates
- Auction status changes
- User notifications

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Input validation and sanitization
- File upload restrictions

## Deployment

### Render (Backend)
1. Connect your GitHub repository
2. Set environment variables
3. Build command: `npm install`
4. Start command: `npm start`

### Vercel (Frontend)
1. Connect your GitHub repository
2. Set build command: `ng build`
3. Set output directory: `dist/bid-now`
4. Set environment variables for API URL

## Environment Variables

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/bidnow
JWT_SECRET=your_jwt_secret_key_here
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
EMAIL_FROM=BidNow <your_email@gmail.com>
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

## File Structure

```
backend/
├── models/          # Database models
├── routes/          # API route handlers
├── middleware/      # Authentication and authorization
├── services/        # Business logic services
├── uploads/         # File uploads directory
├── server.js        # Main server file
├── package.json     # Dependencies
└── README.md        # This file
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details
