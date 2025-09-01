const express = require('express');
const Dispute = require('../models/Dispute');
const Auction = require('../models/Auction');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all disputes (admin only)
router.get('/', auth, requireRole(['admin']), async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    let query = {};
    if (status) query.status = status;

    const disputes = await Dispute.find(query)
      .populate('auction', 'title imageUrl')
      .populate('complainant', 'name email')
      .populate('resolvedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Dispute.countDocuments(query);

    res.json({
      disputes,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get disputes error:', error);
    res.status(500).json({ message: 'Failed to fetch disputes.' });
  }
});

// Create new dispute (buyers and sellers)
router.post('/', auth, async (req, res) => {
  try {
    const { auctionId, reason, description } = req.body;

    // Validate auction exists
    const auction = await Auction.findById(auctionId);
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found.' });
    }

    // Check if user is involved in the auction
    if (auction.seller.toString() !== req.user._id.toString() && 
        !auction.bids.some(bid => bid.bidder.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'You can only create disputes for auctions you are involved in.' });
    }

    // Check if dispute already exists
    const existingDispute = await Dispute.findOne({
      auction: auctionId,
      complainant: req.user._id,
      status: { $in: ['open', 'investigating'] }
    });

    if (existingDispute) {
      return res.status(400).json({ message: 'You already have an open dispute for this auction.' });
    }

    const dispute = new Dispute({
      auction: auctionId,
      complainant: req.user._id,
      reason,
      description
    });

    await dispute.save();

    res.status(201).json({
      message: 'Dispute created successfully',
      dispute
    });
  } catch (error) {
    console.error('Create dispute error:', error);
    res.status(500).json({ message: 'Failed to create dispute.' });
  }
});

// Get dispute by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const dispute = await Dispute.findById(req.params.id)
      .populate('auction', 'title imageUrl seller')
      .populate('complainant', 'name email')
      .populate('resolvedBy', 'name email');

    if (!dispute) {
      return res.status(404).json({ message: 'Dispute not found.' });
    }

    // Check if user has access to this dispute
    if (req.user.role !== 'admin' && 
        dispute.complainant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this dispute.' });
    }

    res.json(dispute);
  } catch (error) {
    console.error('Get dispute error:', error);
    res.status(500).json({ message: 'Failed to fetch dispute.' });
  }
});

// Update dispute status (admin only)
router.put('/:id/status', auth, requireRole(['admin']), async (req, res) => {
  try {
    const { status, adminNotes, resolution } = req.body;
    
    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) {
      return res.status(404).json({ message: 'Dispute not found.' });
    }

    dispute.status = status;
    if (adminNotes) dispute.adminNotes = adminNotes;
    if (resolution) dispute.resolution = resolution;
    
    if (status === 'resolved' || status === 'closed') {
      dispute.resolvedAt = new Date();
      dispute.resolvedBy = req.user._id;
    }

    await dispute.save();

    res.json({
      message: 'Dispute status updated successfully',
      dispute
    });
  } catch (error) {
    console.error('Update dispute status error:', error);
    res.status(500).json({ message: 'Failed to update dispute status.' });
  }
});

// Get user's disputes
router.get('/my-disputes', auth, async (req, res) => {
  try {
    const disputes = await Dispute.find({ complainant: req.user._id })
      .populate('auction', 'title imageUrl')
      .sort({ createdAt: -1 });

    res.json(disputes);
  } catch (error) {
    console.error('Get my disputes error:', error);
    res.status(500).json({ message: 'Failed to fetch disputes.' });
  }
});

// Get dispute statistics (admin only)
router.get('/stats/overview', auth, requireRole(['admin']), async (req, res) => {
  try {
    const totalDisputes = await Dispute.countDocuments();
    const openDisputes = await Dispute.countDocuments({ status: 'open' });
    const investigatingDisputes = await Dispute.countDocuments({ status: 'investigating' });
    const resolvedDisputes = await Dispute.countDocuments({ status: 'resolved' });
    const closedDisputes = await Dispute.countDocuments({ status: 'closed' });

    // Disputes by reason
    const disputesByReason = await Dispute.aggregate([
      {
        $group: {
          _id: '$reason',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Disputes over time (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const disputesOverTime = await Dispute.aggregate([
      {
        $match: { createdAt: { $gte: sixMonthsAgo } }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json({
      totalDisputes,
      openDisputes,
      investigatingDisputes,
      resolvedDisputes,
      closedDisputes,
      disputesByReason,
      disputesOverTime
    });
  } catch (error) {
    console.error('Get dispute stats error:', error);
    res.status(500).json({ message: 'Failed to fetch dispute statistics.' });
  }
});

module.exports = router;
