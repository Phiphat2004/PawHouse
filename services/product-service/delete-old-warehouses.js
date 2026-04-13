// Script xóa tất cả warehouse cũ trong database và drop indexes
const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://127.0.0.1:27017/pawcare';

async function deleteOldWarehouses() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Drop all indexes first
    try {
      await mongoose.connection.db.collection('warehouses').dropIndexes();
      console.log('✅ Dropped all warehouse indexes!');
    } catch (err) {
      console.log('⚠️ No indexes to drop');
    }

    // Delete all documents
    const result = await mongoose.connection.db.collection('warehouses').deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} warehouses!`);

    await mongoose.connection.close();
    console.log('Done!');
    process.exit(0);
  } catch (error) {
    if (error.message.includes('ns not found')) {
      console.log('✅ Collection not found - already clean!');
    } else {
      console.error('Error:', error.message);
    }
    process.exit(0);
  }
}

deleteOldWarehouses();
