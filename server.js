import express from 'express'
import { WebSocketServer } from 'ws'
import mongoose from 'mongoose'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = 8080

// MongoDB connection (local)
mongoose
  .connect(
    'mongodb+srv://pps:pps@data.e6q7082.mongodb.net/websocketDB?retryWrites=true&w=majority'
  )
  .then(() => console.log('✅ Connected to local MongoDB'))
  .catch((err) => console.error('❌ MongoDB connection error:', err))

// Schema for messages
const messageSchema = new mongoose.Schema({
  text: String,
  receivedAt: { type: Date, default: Date.now },
})

const Message = mongoose.model('Message', messageSchema)

app.use(express.static(path.join(__dirname, 'public')))

// Redirect root to receiver page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

// Start HTTP server
const server = app.listen(PORT, () => {
  console.log(`🚀 Receiver server running on port ${PORT}`)
})

// WebSocket server
const wss = new WebSocketServer({ server, path: '/ws' })

wss.on('connection', (ws, req) => {
  console.log('📡 New sender connected:', req.socket.remoteAddress)

  ws.on('message', async (message) => {
    console.log('📨 Received (terminal):', message.toString())

    // Save to MongoDB
    try {
      await Message.create({ text: message.toString() })
      console.log('💾 Saved to MongoDB')
    } catch (err) {
      console.error('❌ Error saving to MongoDB:', err)
    }

    // Broadcast to all connected browser clients
    wss.clients.forEach((client) => {
      if (client.readyState === ws.OPEN) {
        client.send(message.toString())
      }
    })
  })

  ws.on('close', () => console.log('❌ Sender disconnected'))
})
