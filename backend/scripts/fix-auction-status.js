const mongoose = require('mongoose');
const Auction = require('../models/Auction');
require('dotenv').config();

async function fixAuctionStatuses() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bidnow');
    console.log('Connected to MongoDB');

    const now = new Date();

    // Update pending auctions to appropriate status
    const pendingAuctions = await Auction.find({ status: 'pending' });
    
    for (const auction of pendingAuctions) {
      let newStatus;
      
      if (auction.startTime <= now && auction.endTime > now) {
        newStatus = 'ongoing';
      } else if (auction.startTime > now) {
        newStatus = 'approved';
      } else if (auction.endTime <= now) {
        newStatus = 'ended';
      }
      
      if (newStatus) {
        auction.status = newStatus;
        await auction.save();
        console.log(`Updated auction "${auction.title}" to status: ${newStatus}`);
      }
    }

    console.log('All auction statuses updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing auction statuses:', error);
    process.exit(1);
  }
}

fixAuctionStatuses();
