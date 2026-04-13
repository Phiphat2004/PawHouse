const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const config = require('./config');
const postRoutes = require('./routes/post.routes');
const tagRoutes = require('./routes/tag.routes');
const { errorHandler } = require('./middlewares/error.middleware');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/posts', postRoutes);
app.use('/api/tags', tagRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'post-service',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint
app.get('/api/test', async (req, res) => {
  try {
    const { Post, Tag } = require('./models');
    const [postCount, tagCount] = await Promise.all([
      Post.countDocuments(),
      Tag.countDocuments()
    ]);
    res.json({ 
      message: 'Test OK', 
      postCount, 
      tagCount 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Error handler
app.use(errorHandler);

// Connect DB & Start server
async function start() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('[DB] Connected to MongoDB');

    app.listen(config.port, () => {
      console.log(`
========================================
  POST-SERVICE running on port ${config.port}
========================================
  Endpoints:
  
  📝 Posts:
  GET    /api/posts/public        - Get published posts
  GET    /api/posts/slug/:slug    - Get post by slug
  GET    /api/posts/my-posts      - Get current user's posts
  POST   /api/posts               - Create post
  PUT    /api/posts/my-posts/:id  - Update own post
  DELETE /api/posts/my-posts/:id  - Delete own post
  
  Admin only:
  GET    /api/posts               - Get all posts
  GET    /api/posts/:id           - Get post by ID
  PUT    /api/posts/:id           - Update post
  PUT    /api/posts/:id/toggle-status - Toggle status
  DELETE /api/posts/:id           - Delete post
  GET    /api/posts/stats         - Get statistics
  
  🏷️  Tags:
  GET    /api/tags                - Get all tags
  GET    /api/tags/:id            - Get tag by ID
  GET    /api/tags/slug/:slug     - Get tag by slug
  GET    /api/tags/:id/posts      - Get posts by tag
  POST   /api/tags                - Create tag (admin)
  PUT    /api/tags/:id            - Update tag (admin)
  DELETE /api/tags/:id            - Delete tag (admin)
  
  🔧 Utilities:
  GET    /api/health              - Health check
  GET    /api/test                - Test connection
========================================
      `);
    });
  } catch (err) {
    console.error('[ERROR] Failed to start:', err.message);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION]', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('[UNHANDLED REJECTION]', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[SIGTERM] Shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

start();
