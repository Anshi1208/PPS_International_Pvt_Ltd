import express from 'express'
import { WebSocketServer } from 'ws'

import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = 8080

// MongoDB connection (local)



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



    // Broadcast to all connected browser clients
    wss.clients.forEach((client) => {
      if (client.readyState === ws.OPEN) {
        client.send(message.toString())
      }
    })
  })

  ws.on('close', () => console.log('❌ Sender disconnected'))
})
