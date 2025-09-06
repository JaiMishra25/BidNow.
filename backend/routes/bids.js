const express = require('express');
const Auction = require('../models/Auction');
const Bid = require('../models/Bid');
const { auth, requireRole } = require('../middleware/auth');
const { getSocketIO } = require('../services/socketService');

const router = express.Router();

// Place a bid
router.post('/', auth, requireRole(['buyer']), async (req, res) => {
  try {
    const { auctionId, amount } = req.body;

    // Validate auction exists and is active
    const auction = await Auction.findById(auctionId);
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found.' });
    }

    // Allow bidding on both ongoing and approved auctions
    // Approved auctions are approved but haven't started yet
    if (auction.status !== 'ongoing' && auction.status !== 'approved') {
      return res.status(400).json({ message: 'Auction is not active for bidding.' });
    }

    // Check if auction has ended
    if (new Date() > auction.endTime) {
      return res.status(400).json({ message: 'Auction has ended.' });
    }

    // Check if user is not bidding on their own auction
    if (auction.seller.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot bid on your own auction.' });
    }

    // Validate bid amount
    const currentBid = auction.currentBid || auction.startingBid;
    if (amount <= currentBid) {
      return res.status(400).json({ 
        message: `Bid must be higher than current bid of $${currentBid}` 
      });
    }

    if (amount < auction.minimumBid) {
      return res.status(400).json({ 
        message: `Bid must be at least $${auction.minimumBid}` 
      });
    }

    // Create new bid
    const bid = new Bid({
      auction: auctionId,
      bidder: req.user._id,
      amount: amount
    });

    await bid.save();

    // Update auction with new bid
    auction.currentBid = amount;
    auction.bids.push({
      bidder: req.user._id,
      amount: amount,
      timestamp: new Date()
    });

    await auction.save();

    // Emit real-time update via Socket.IO
    const io = getSocketIO();
    if (io) {
      io.to(`auction-${auctionId}`).emit('bid-update', {
        auctionId: auctionId,
        currentBid: amount,
        bidder: req.user.name,
        timestamp: new Date(),
        bidId: bid._id
      });
    }

    res.status(201).json({
      message: 'Bid placed successfully',
      bid: {
        _id: bid._id,
        amount: bid.amount,
        timestamp: bid.timestamp
      },
      updatedAuction: auction,
      auction: {
        currentBid: auction.currentBid,
        totalBids: auction.bids.length
      }
    });

  } catch (error) {
    console.error('Place bid error:', error);
    res.status(500).json({ message: 'Failed to place bid.' });
  }
});

// Get bid history for an auction
router.get('/auction/:auctionId', async (req, res) => {
  try {
    const bids = await Bid.find({ auction: req.params.auctionId })
      .populate('bidder', 'name email')
      .sort({ amount: -1, timestamp: -1 });

    res.json(bids);
  } catch (error) {
    console.error('Get bid history error:', error);
    res.status(500).json({ message: 'Failed to fetch bid history.' });
  }
});

// Get user's bidding history
router.get('/my-bids', auth, async (req, res) => {
  try {
    const bids = await Bid.find({ bidder: req.user._id })
      .populate('auction', 'title imageUrl status endTime')
      .sort({ timestamp: -1 });

    res.json(bids);
  } catch (error) {
    console.error('Get my bids error:', error);
    res.status(500).json({ message: 'Failed to fetch bidding history.' });
  }
});

// Get current highest bid for an auction
router.get('/highest/:auctionId', async (req, res) => {
  try {
    const highestBid = await Bid.findOne({ auction: req.params.auctionId })
      .populate('bidder', 'name email')
      .sort({ amount: -1 });

    if (!highestBid) {
      return res.json({ message: 'No bids yet' });
    }

    res.json(highestBid);
  } catch (error) {
    console.error('Get highest bid error:', error);
    res.status(500).json({ message: 'Failed to fetch highest bid.' });
  }
});

// Cancel a bid (only if auction hasn't started)
router.delete('/:bidId', auth, async (req, res) => {
  try {
    const bid = await Bid.findById(req.params.bidId);
    
    if (!bid) {
      return res.status(404).json({ message: 'Bid not found.' });
    }

    // Check if user owns this bid
    if (bid.bidder.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this bid.' });
    }

    // Check if auction has started
    const auction = await Auction.findById(bid.auction);
    if (auction.status === 'ongoing') {
      return res.status(400).json({ message: 'Cannot cancel bid on active auction.' });
    }

    await bid.remove();

    res.json({ message: 'Bid cancelled successfully' });
  } catch (error) {
    console.error('Cancel bid error:', error);
    res.status(500).json({ message: 'Failed to cancel bid.' });
  }
});

module.exports = router;
