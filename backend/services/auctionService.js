const cron = require('node-cron');
const Auction = require('../models/Auction');
const Bid = require('../models/Bid');

class AuctionService {
  constructor() {
    this.initializeCronJobs();
  }

  // Initialize cron jobs for auction management
  initializeCronJobs() {
    // Check and update auction statuses every minute
    cron.schedule('* * * * *', () => {
      this.updateAuctionStatuses();
    });

    // End auctions and determine winners every minute
    cron.schedule('* * * * *', () => {
      this.endExpiredAuctions();
    });
  }

  // Update auction statuses based on time
  async updateAuctionStatuses() {
    try {
      const now = new Date();

      // Only update approved auctions to ongoing when start time arrives
      // Pending auctions require admin approval
      await Auction.updateMany(
        {
          status: 'approved',
          startTime: { $lte: now }
        },
        {
          $set: { status: 'ongoing' }
        }
      );

      console.log('Auction statuses updated');
    } catch (error) {
      console.error('Error updating auction statuses:', error);
    }
  }

  // End expired auctions and determine winners
  async endExpiredAuctions() {
    try {
      const now = new Date();

      // Find auctions that have ended
      const expiredAuctions = await Auction.find({
        status: 'ongoing',
        endTime: { $lte: now }
      });

      for (const auction of expiredAuctions) {
        await this.endAuction(auction);
      }

      if (expiredAuctions.length > 0) {
        console.log(`Ended ${expiredAuctions.length} auctions`);
      }
    } catch (error) {
      console.error('Error ending expired auctions:', error);
    }
  }

  // End a specific auction and determine winner
  async endAuction(auction) {
    try {
      // Find the highest bid
      const highestBid = await Bid.findOne({ auction: auction._id })
        .sort({ amount: -1 });

      if (highestBid) {
        // Set winner and final bid
        auction.winner = highestBid.bidder;
        auction.currentBid = highestBid.amount;
        auction.status = 'ended';
      } else {
        // No bids, mark as ended without winner
        auction.status = 'ended';
      }

      await auction.save();

      // Mark the winning bid
      if (highestBid) {
        highestBid.isWinning = true;
        await highestBid.save();
      }

      console.log(`Auction "${auction.title}" ended. Winner: ${highestBid ? highestBid.bidder : 'None'}`);
    } catch (error) {
      console.error(`Error ending auction ${auction._id}:`, error);
    }
  }

  // Get auction statistics
  async getAuctionStats() {
    try {
      const stats = await Auction.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalValue: { $sum: '$currentBid' }
          }
        }
      ]);

      return stats;
    } catch (error) {
      console.error('Error getting auction stats:', error);
      return [];
    }
  }

  // Get popular categories
  async getPopularCategories() {
    try {
      const categories = await Auction.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            avgStartingBid: { $avg: '$startingBid' }
          }
        },
        {
          $sort: { count: -1 }
        },
        {
          $limit: 10
        }
      ]);

      return categories;
    } catch (error) {
      console.error('Error getting popular categories:', error);
      return [];
    }
  }

  // Get recent activity
  async getRecentActivity(limit = 10) {
    try {
      const recentBids = await Bid.find()
        .populate('bidder', 'name')
        .populate('auction', 'title')
        .sort({ timestamp: -1 })
        .limit(limit);

      const recentAuctions = await Auction.find()
        .populate('seller', 'name')
        .sort({ createdAt: -1 })
        .limit(limit);

      return {
        recentBids,
        recentAuctions
      };
    } catch (error) {
      console.error('Error getting recent activity:', error);
      return { recentBids: [], recentAuctions: [] };
    }
  }
}

module.exports = new AuctionService();
