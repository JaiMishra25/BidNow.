const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Auction = require('../models/Auction');

// Sample data
const sampleUsers = [
  {
    name: 'Admin User',
    email: 'admin@bidnow.com',
    password: 'Admin123@',
    role: 'admin',
    phone: '+1234567890',
    address: '123 Admin Street, Admin City'
  },
  {
    name: 'John Seller',
    email: 'seller@bidnow.com',
    password: 'Seller123@',
    role: 'seller',
    phone: '+1234567891',
    address: '456 Seller Avenue, Seller Town'
  },
  {
    name: 'Jane Buyer',
    email: 'buyer@bidnow.com',
    password: 'Buyer123@',
    role: 'buyer',
    phone: '+1234567892',
    address: '789 Buyer Road, Buyer City'
  }
];

const sampleAuctions = [
  {
    title: 'Vintage Rolex Watch',
    description: 'A beautiful vintage Rolex watch in excellent condition. Perfect for collectors.',
    imageUrl: '/uploads/image.png',
    startingBid: 5000,
    minimumBid: 100,
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Start in 1 day
    endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // End in 7 days
    category: 'Watches & Jewelry',
    status: 'pending'
  },
  {
    title: 'Modern Art Painting',
    description: 'Contemporary abstract painting by a renowned artist. Unique and vibrant.',
    imageUrl: '/uploads/digital-art.jpg',
    startingBid: 2000,
    minimumBid: 50,
    startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Start in 2 days
    endTime: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000), // End in 9 days
    category: 'Art & Collectibles',
    status: 'pending'
  },
  {
    title: 'Classic Car Collection',
    description: 'Rare classic car in mint condition. A true collector\'s item.',
    imageUrl: '/uploads/luxury-watch.jpg',
    startingBid: 25000,
    minimumBid: 500,
    startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Start in 3 days
    endTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // End in 10 days
    category: 'Cars & Vehicles',
    status: 'pending'
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bidnow');
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Auction.deleteMany({});
    console.log('Cleared existing data');

    // Create users
    const createdUsers = [];
    for (const userData of sampleUsers) {
      const user = new User(userData);
      await user.save();
      createdUsers.push(user);
      console.log(`Created user: ${user.name} (${user.email})`);
    }

    // Create auctions (assign to seller)
    const seller = createdUsers.find(user => user.role === 'seller');
    for (const auctionData of sampleAuctions) {
      const auction = new Auction({
        ...auctionData,
        seller: seller._id
      });
      await auction.save();
      console.log(`Created auction: ${auction.title}`);
    }

    console.log('\nDatabase seeded successfully!');
    console.log('\nSample login credentials:');
    console.log('Admin: admin@bidnow.com / Admin123@');
    console.log('Seller: seller@bidnow.com / Seller123@');
    console.log('Buyer: buyer@bidnow.com / Buyer123@');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seed function
seedDatabase();
