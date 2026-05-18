const express = require('express')
const router = express.Router()
const Book = require('../models/Book')

// GET /api/search?q=...
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q
    if (!query) return res.status(400).json({ error: 'Paramètre q manquant' })

    const response = await fetch(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=6&fields=key,title,author_name,first_publish_year,cover_i`
    )
    const data = await response.json()

    const books = data.docs.map(doc => ({
      openLibraryKey: doc.key,
      title: doc.title,
      author: doc.author_name ? doc.author_name[0] : 'Auteur inconnu',
      year: doc.first_publish_year || null,
      coverId: doc.cover_i || null,
      coverUrl: doc.cover_i
        ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
        : null,
    }))

    res.json(books)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/books
router.get('/books', async (req, res) => {
  try {
    const books = await Book.find().sort({ createdAt: -1 })
    res.json(books)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/books
router.post('/books', async (req, res) => {
  try {
    const book = new Book({
      title: req.body.title,
      author: req.body.author,
      year: req.body.year || null,
      coverId: req.body.coverId || null,
      openLibraryKey: req.body.openLibraryKey || null,
    })
    await book.save()
    res.status(201).json(book)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// PATCH /api/books/:id/status
router.patch('/books/:id/status', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id)
    if (!book) return res.status(404).json({ error: 'Livre non trouvé' })
    const cycle = { 'à lire': 'en cours', 'en cours': 'lu', 'lu': 'à lire' }
    book.status = cycle[book.status]
    await book.save()
    res.json(book)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/books/:id
router.delete('/books/:id', async (req, res) => {
  try {
    await Book.findByIdAndDelete(req.params.id)
    res.json({ message: 'Livre supprimé' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router