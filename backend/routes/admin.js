const express = require('express');
const Auction = require('../models/Auction');
const User = require('../models/User');
const Dispute = require('../models/Dispute');
const Bid = require('../models/Bid');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Admin middleware - all routes require admin role
router.use(auth, requireRole(['admin']));

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalAuctions = await Auction.countDocuments();
    const pendingAuctions = await Auction.countDocuments({ status: 'pending' });
    const activeAuctions = await Auction.countDocuments({ status: 'ongoing' });
    const totalBids = await Bid.countDocuments();
    const openDisputes = await Dispute.countDocuments({ status: 'open' });

    // Revenue calculation (sum of all winning bids)
    const endedAuctions = await Auction.find({ status: 'ended' });
    const totalRevenue = endedAuctions.reduce((sum, auction) => sum + (auction.currentBid || 0), 0);

    // User growth over time (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const userGrowth = await User.aggregate([
      {
        $match: { createdAt: { $gte: sixMonthsAgo } }
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json({
      totalUsers,
      totalAuctions,
      pendingAuctions,
      activeAuctions,
      totalBids,
      openDisputes,
      totalRevenue,
      userGrowth
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ message: 'Failed to fetch statistics.' });
  }
});

// Get pending auctions for approval
router.get('/auctions/pending', async (req, res) => {
  try {
    const pendingAuctions = await Auction.find({ status: 'pending' })
      .populate('seller', 'name email')
      .sort({ createdAt: -1 });

    res.json(pendingAuctions);
  } catch (error) {
    console.error('Get pending auctions error:', error);
    res.status(500).json({ message: 'Failed to fetch pending auctions.' });
  }
});

// Approve auction
router.put('/auctions/:id/approve', async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id);
    
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found.' });
    }

    if (auction.status !== 'pending') {
      return res.status(400).json({ message: 'Auction is not pending approval.' });
    }

    // Check if auction should start now or be scheduled
    const now = new Date();
    if (auction.startTime <= now) {
      auction.status = 'ongoing';
    } else {
      // Use 'approved' to represent an upcoming-but-approved auction (enum safe)
      auction.status = 'approved';
    }

    await auction.save();

    res.json({ 
      message: 'Auction approved successfully',
      status: auction.status
    });
  } catch (error) {
    console.error('Approve auction error:', error);
    res.status(500).json({ message: 'Failed to approve auction.' });
  }
});

// Reject auction
router.put('/auctions/:id/reject', async (req, res) => {
  try {
    const { reason } = req.body;
    
    const auction = await Auction.findById(req.params.id);
    
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found.' });
    }

    if (auction.status !== 'pending') {
      return res.status(400).json({ message: 'Auction is not pending approval.' });
    }

    auction.status = 'rejected';
    await auction.save();

    res.json({ message: 'Auction rejected successfully' });
  } catch (error) {
    console.error('Reject auction error:', error);
    res.status(500).json({ message: 'Failed to reject auction.' });
  }
});

// Delete auction
router.delete('/auctions/:id', async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id);
    
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found.' });
    }

    // Can only delete pending or upcoming auctions
    if (auction.status === 'ongoing' || auction.status === 'ended') {
      return res.status(400).json({ message: 'Cannot delete active or ended auctions.' });
    }

    await auction.remove();

    res.json({ message: 'Auction deleted successfully' });
  } catch (error) {
    console.error('Delete auction error:', error);
    res.status(500).json({ message: 'Failed to delete auction.' });
  }
});

// End auction immediately and award winner
router.put('/auctions/:id/end', async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id);

    if (!auction) {
      return res.status(404).json({ message: 'Auction not found.' });
    }

    if (auction.status === 'ended') {
      return res.status(400).json({ message: 'Auction already ended.' });
    }

    // Find highest bid
    const highestBid = await Bid.findOne({ auction: auction._id }).sort({ amount: -1 });

    if (highestBid) {
      auction.winner = highestBid.bidder;
      auction.currentBid = highestBid.amount;
    }

    auction.status = 'ended';
    await auction.save();

    return res.json({
      message: 'Auction ended successfully',
      winner: highestBid ? {
        bidder: highestBid.bidder,
        amount: highestBid.amount
      } : null
    });
  } catch (error) {
    console.error('End auction error:', error);
    res.status(500).json({ message: 'Failed to end auction.' });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, role, blocked } = req.query;
    
    let query = {};
    if (role) query.role = role;
    if (blocked !== undefined) query.isBlocked = blocked === 'true';

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Enhance users with detailed statistics
    const usersWithStats = await Promise.all(users.map(async (user) => {
      const userObj = user.toObject();
      
      // Get auction statistics
      const auctionsCreated = await Auction.countDocuments({ seller: user._id });
      const auctionsWon = await Auction.countDocuments({ winner: user._id });
      
      // Get bidding statistics
      const totalBids = await Bid.countDocuments({ bidder: user._id });
      const activeBids = await Bid.countDocuments({ 
        bidder: user._id,
        auction: { $in: await Auction.find({ status: 'ongoing' }).distinct('_id') }
      });
      
      // Get recent bidding activity (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentBids = await Bid.countDocuments({ 
        bidder: user._id,
        timestamp: { $gte: thirtyDaysAgo }
      });

      // Get total amount bid
      const bids = await Bid.find({ bidder: user._id });
      const totalAmountBid = bids.reduce((sum, bid) => sum + bid.amount, 0);

      // Get average bid amount
      const averageBidAmount = totalBids > 0 ? totalAmountBid / totalBids : 0;

      return {
        ...userObj,
        stats: {
          auctionsCreated,
          auctionsWon,
          totalBids,
          activeBids,
          recentBids,
          totalAmountBid,
          averageBidAmount
        }
      };
    }));

    const total = await User.countDocuments(query);

    res.json({
      users: usersWithStats,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to fetch users.' });
  }
});

// Block/Unblock user
router.put('/users/:id/block', async (req, res) => {
  try {
    const { isBlocked } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot block admin users.' });
    }

    user.isBlocked = isBlocked;
    await user.save();

    res.json({ 
      message: `User ${isBlocked ? 'blocked' : 'unblocked'} successfully`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isBlocked: user.isBlocked
      }
    });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({ message: 'Failed to update user status.' });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot delete admin users.' });
    }

    // Check if user has active auctions
    const activeAuctions = await Auction.countDocuments({ 
      seller: user._id, 
      status: { $in: ['ongoing', 'upcoming'] } 
    });

    if (activeAuctions > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete user with active auctions.' 
      });
    }

    await user.remove();

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Failed to delete user.' });
  }
});

// Get auction analytics
router.get('/analytics/auctions', async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    let startDate = new Date();
    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === 'year') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    }

    const auctionStats = await Auction.aggregate([
      {
        $match: { createdAt: { $gte: startDate } }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          totalValue: { $sum: '$startingBid' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    const categoryStats = await Auction.aggregate([
      {
        $match: { createdAt: { $gte: startDate } }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgStartingBid: { $avg: '$startingBid' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json({
      auctionStats,
      categoryStats
    });
  } catch (error) {
    console.error('Get auction analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch auction analytics.' });
  }
});

// Get user analytics
router.get('/analytics/users', async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    let startDate = new Date();
    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === 'year') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    }

    const userStats = await User.aggregate([
      {
        $match: { createdAt: { $gte: startDate } }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    const roleStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      userStats,
      roleStats
    });
  } catch (error) {
    console.error('Get user analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch user analytics.' });
  }
});

module.exports = router;
