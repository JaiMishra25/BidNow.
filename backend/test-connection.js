const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  try {
    console.log('🔌 Testing MongoDB connection...');
    console.log('📡 Connection string:', process.env.MONGODB_URI || 'mongodb://localhost:27017/bidnow');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bidnow', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB connected successfully!');
    console.log('🗄️ Database:', mongoose.connection.name);
    console.log('🔗 Host:', mongoose.connection.host);
    console.log('🚪 Port:', mongoose.connection.port);
    
    // Test basic operations
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📚 Collections found:', collections.length);
    
    if (collections.length > 0) {
      collections.forEach(collection => {
        console.log(`   - ${collection.name}`);
      });
    }
    
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    console.log('\n🎉 Backend connection test passed!');
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('1. Make sure MongoDB is running');
    console.log('2. Check your .env file');
    console.log('3. Verify MongoDB connection string');
    console.log('4. Check if MongoDB port is accessible');
    
    process.exit(1);
  }
}

// Run the test
testConnection();
