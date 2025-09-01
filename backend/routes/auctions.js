const express = require('express');
const multer = require('multer');
const Auction = require('../models/Auction');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.jpg');
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Get all auctions (public)
router.get('/', async (req, res) => {
  try {
    const { status, category, page = 1, limit = 10 } = req.query;
    
    let query = {};
    if (status) query.status = status;
    if (category) query.category = category;

    const auctions = await Auction.find(query)
      .populate('seller', 'name email')
      .populate('winner', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Auction.countDocuments(query);

    res.json({
      auctions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get auctions error:', error);
    res.status(500).json({ message: 'Failed to fetch auctions.' });
  }
});

// Get single auction by ID
router.get('/:id', async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id)
      .populate('seller', 'name email')
      .populate('winner', 'name email')
      .populate('bids.bidder', 'name email');

    if (!auction) {
      return res.status(404).json({ message: 'Auction not found.' });
    }

    res.json(auction);
  } catch (error) {
    console.error('Get auction error:', error);
    res.status(500).json({ message: 'Failed to fetch auction.' });
  }
});

// Create new auction (sellers only)
router.post('/', auth, requireRole(['seller']), upload.single('image'), async (req, res) => {
  try {
    const { title, description, startingBid, minimumBid, startTime, endTime, category } = req.body;

    // Validate auction dates
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start <= now) {
      return res.status(400).json({ message: 'Start time must be in the future.' });
    }

    if (end <= start) {
      return res.status(400).json({ message: 'End time must be after start time.' });
    }

    if (minimumBid < startingBid) {
      return res.status(400).json({ message: 'Minimum bid must be at least equal to starting bid.' });
    }

    // All new auctions start as pending and require admin approval
    const status = 'pending';

    const auction = new Auction({
      title,
      description,
      imageUrl: req.file ? `/uploads/${req.file.filename}` : '',
      startingBid,
      minimumBid,
      seller: req.user._id,
      startTime: start,
      endTime: end,
      category,
      status: status
    });

    await auction.save();

    res.status(201).json({
      message: 'Auction created successfully and pending admin approval',
      auction
    });
  } catch (error) {
    console.error('Create auction error:', error);
    res.status(500).json({ message: 'Failed to create auction.' });
  }
});

// Update auction (seller only)
router.put('/:id', auth, requireRole(['seller']), async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id);
    
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found.' });
    }

    // Check if seller owns this auction
    if (auction.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this auction.' });
    }

    // Can only update if auction is pending or not started
    if (auction.status !== 'pending' && auction.status !== 'upcoming') {
      return res.status(400).json({ message: 'Cannot update auction that has started or ended.' });
    }

    const { title, description, startingBid, minimumBid, startTime, endTime, category } = req.body;

    if (title) auction.title = title;
    if (description) auction.description = description;
    if (startingBid) auction.startingBid = startingBid;
    if (minimumBid) auction.minimumBid = minimumBid;
    if (startTime) auction.startTime = startTime;
    if (endTime) auction.endTime = endTime;
    if (category) auction.category = category;

    await auction.save();

    res.json({ message: 'Auction updated successfully', auction });
  } catch (error) {
    console.error('Update auction error:', error);
    res.status(500).json({ message: 'Failed to update auction.' });
  }
});

// Delete auction (seller only)
router.delete('/:id', auth, requireRole(['seller']), async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id);
    
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found.' });
    }

    // Check if seller owns this auction
    if (auction.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this auction.' });
    }

    // Can only delete if auction is pending or not started
    if (auction.status !== 'pending' && auction.status !== 'upcoming') {
      return res.status(400).json({ message: 'Cannot delete auction that has started or ended.' });
    }

    await auction.remove();

    res.json({ message: 'Auction deleted successfully' });
  } catch (error) {
    console.error('Delete auction error:', error);
    res.status(500).json({ message: 'Failed to delete auction.' });
  }
});

// Get user's auctions (seller only)
router.get('/my-auctions', auth, requireRole(['seller']), async (req, res) => {
  try {
    const auctions = await Auction.find({ seller: req.user._id })
      .sort({ createdAt: -1 });

    res.json(auctions);
  } catch (error) {
    console.error('Get my auctions error:', error);
    res.status(500).json({ message: 'Failed to fetch auctions.' });
  }
});

// Get auctions by category
router.get('/category/:category', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const auctions = await Auction.find({ 
      category: req.params.category,
      status: { $in: ['ongoing', 'upcoming'] }
    })
      .populate('seller', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Auction.countDocuments({ 
      category: req.params.category,
      status: { $in: ['ongoing', 'upcoming'] }
    });

    res.json({
      auctions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get auctions by category error:', error);
    res.status(500).json({ message: 'Failed to fetch auctions.' });
  }
});

module.exports = router;
