const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true 
  },
  slug: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true 
  },
  description: {
    type: String,
    trim: true
  },
  postCount: {
    type: Number,
    default: 0
  }
}, { 
  timestamps: true 
});

// slug already has unique index from schema definition

module.exports = mongoose.model('Tag', tagSchema);
