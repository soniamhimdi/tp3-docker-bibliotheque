if (!process.env.MONGO_URL) {
  require('dotenv').config()
}
const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

app.use('/api', require('./routes/books'))

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API Bibliothèque fonctionnelle' })
})

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log('✅ Connecté à MongoDB')
    app.listen(PORT, () => {
      console.log(`🚀 API démarrée sur le port ${PORT}`)
    })
  })
  .catch((err) => {
    console.error('❌ Erreur MongoDB :', err.message)
    process.exit(1)
  })