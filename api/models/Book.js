const mongoose = require('mongoose')

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    author: { type: String, required: true, trim: true },
    year: { type: Number, default: null },
    coverId: { type: Number, default: null },
    openLibraryKey: { type: String, default: null },
    status: {
      type: String,
      enum: ['à lire', 'en cours', 'lu'],
      default: 'à lire',
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Book', bookSchema)