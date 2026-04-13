// Simple test script for post-service
// Run with: node test.js

const mongoose = require('mongoose');

async function testConnection() {
  try {
    console.log('🔍 Testing MongoDB connection...');
    
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/pawcare_post';
    
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connected successfully!');
    
    // Test models
    const Post = require('./src/models/Post');
    const Tag = require('./src/models/Tag');
    
    const postCount = await Post.countDocuments();
    const tagCount = await Tag.countDocuments();
    
    console.log(`📊 Database stats:`);
    console.log(`   - Posts: ${postCount}`);
    console.log(`   - Tags: ${tagCount}`);
    
    await mongoose.connection.close();
    console.log('✅ Test completed successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testConnection();
