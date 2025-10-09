import express from 'express'
import { WebSocketServer } from 'ws'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 8080

app.use(express.static(path.join(__dirname, 'public')))

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

const server = app.listen(PORT, () => {
  console.log(`🚀 WebSocket Server running on port ${PORT}`)
})

const wss = new WebSocketServer({ server, path: '/ws' })

wss.on('connection', (ws, req) => {
  // Get role from URL: sender or receiver
  const params = new URLSearchParams(req.url.split('?')[1])
  ws.role = params.get('role') || 'unknown'

  console.log(`✅ ${ws.role} connected:`, req.socket.remoteAddress)

  ws.on('message', (message) => {
    console.log(`📨 Message from ${ws.role}:`, message.toString())

    // Only sender messages are forwarded to receivers
    if (ws.role === 'sender') {
      wss.clients.forEach((client) => {
        if (client.readyState === ws.OPEN && client.role === 'receiver') {
          client.send(message.toString())
        }
      })
    }
  })

  ws.on('close', () => console.log(`❌ ${ws.role} disconnected`))
})
