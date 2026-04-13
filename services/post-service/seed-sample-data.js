// Sample data seeder for post-service
// Run with: node seed-sample-data.js

require('dotenv').config();
const mongoose = require('mongoose');
const { Post, Tag } = require('./src/models');

const sampleTags = [
  { name: 'Chó', slug: 'cho', description: 'Bài viết về chó' },
  { name: 'Mèo', slug: 'meo', description: 'Bài viết về mèo' },
  { name: 'Chăm sóc', slug: 'cham-soc', description: 'Hướng dẫn chăm sóc thú cưng' },
  { name: 'Dinh dưỡng', slug: 'dinh-duong', description: 'Kiến thức về dinh dưỡng' },
  { name: 'Sức khỏe', slug: 'suc-khoe', description: 'Thông tin về sức khỏe thú cưng' }
];

const samplePosts = [
  {
    title: '10 mẹo chăm sóc chó con khỏe mạnh',
    slug: '10-meo-cham-soc-cho-con-khoe-manh',
    excerpt: 'Chia sẻ kinh nghiệm nuôi chó con từ những chuyên gia hàng đầu',
    content: `
# 10 mẹo chăm sóc chó con khỏe mạnh

Chăm sóc chó con là một trách nhiệm quan trọng. Dưới đây là 10 mẹo hữu ích:

## 1. Dinh dưỡng hợp lý
Cho chó con ăn thức ăn chuyên dụng, phù hợp với lứa tuổi...

## 2. Vệ sinh thường xuyên
Vệ sinh chuồng trại, tắm rửa đều đặn...

## 3. Tiêm phòng đầy đủ
Tuân thủ lịch tiêm phòng của bác sĩ thú y...

[... và nhiều mẹo khác]
    `,
    status: 'published',
    publishedAt: new Date()
  },
  {
    title: 'Cách chọn thức ăn phù hợp cho mèo',
    slug: 'cach-chon-thuc-an-phu-hop-cho-meo',
    excerpt: 'Hướng dẫn chi tiết về cách lựa chọn thức ăn tốt nhất cho mèo',
    content: `
# Cách chọn thức ăn phù hợp cho mèo

Dinh dưỡng là yếu tố quan trọng nhất...

## Các loại thức ăn
- Thức ăn khô
- Thức ăn ướt
- Thức ăn tươi sống

## Cách lựa chọn
1. Xem thành phần
2. Kiểm tra hạn sử dụng
3. Phù hợp với lứa tuổi

[... nội dung chi tiết]
    `,
    status: 'published',
    publishedAt: new Date()
  },
  {
    title: 'Những dấu hiệu nhận biết thú cưng bị bệnh',
    slug: 'nhung-dau-hieu-nhan-biet-thu-cung-bi-benh',
    excerpt: 'Nhận biết sớm các dấu hiệu bệnh tật để kịp thời đưa thú cưng đi khám',
    content: `
# Những dấu hiệu nhận biết thú cưng bị bệnh

## Dấu hiệu thường gặp
1. Ăn uống kém
2. Tinh thần uể oải
3. Nôn mửa, tiêu chảy
4. Ho, hắt hơi

## Khi nào cần đến bác sĩ?
- Sốt cao
- Không ăn quá 24h
- Nôn nhiều lần

[... thông tin chi tiết]
    `,
    status: 'draft'
  }
];

async function seed() {
  try {
    console.log('🌱 Starting data seeding...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pawcare_post');
    console.log('✅ Connected to MongoDB\n');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await Tag.deleteMany({});
    await Post.deleteMany({});
    console.log('✅ Cleared existing data\n');

    // Create tags
    console.log('🏷️  Creating tags...');
    const tags = await Tag.insertMany(sampleTags);
    console.log(`✅ Created ${tags.length} tags\n`);

    // Create posts with tag references
    console.log('📝 Creating posts...');
    const postsWithTags = samplePosts.map((post, index) => ({
      ...post,
      // Sample author ID (replace with real user ID in production)
      authorId: new mongoose.Types.ObjectId(),
      // Assign random tags
      tagIds: [
        tags[index % tags.length]._id,
        tags[(index + 1) % tags.length]._id
      ]
    }));

    const posts = await Post.insertMany(postsWithTags);
    console.log(`✅ Created ${posts.length} posts\n`);

    // Display summary
    console.log('📊 Summary:');
    console.log(`   - Total tags: ${tags.length}`);
    console.log(`   - Total posts: ${posts.length}`);
    console.log(`   - Published posts: ${posts.filter(p => p.status === 'published').length}`);
    console.log(`   - Draft posts: ${posts.filter(p => p.status === 'draft').length}`);

    console.log('\n✅ Seeding completed successfully!');
    console.log('\n📍 You can now start the service with: npm run dev');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
