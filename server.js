import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);

// Allow WebSockets from our Vite frontend test port (and others if needed)
const io = new Server(httpServer, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Endpoint for the Modem software or VoIP (Netgsm/3CX/etc.) to send Webhook data to
app.post('/api/incoming-call', (req, res) => {
  const { phone } = req.body;
  
  if (!phone) {
    return res.status(400).json({ error: "Phone number is required in JSON body (e.g. {'phone': '05551234567'})" });
  }

  console.log(`[CallerID] Incoming call detected from: ${phone}`);
  
  // Instantly broadcast the incoming number to all connected POS screens
  io.emit('ring', { phone });

  res.json({ success: true, message: `Call from ${phone} broadcasted to POS screens.` });
});

io.on('connection', (socket) => {
  console.log(`[WebSocket] A POS screen connected. (${socket.id})`);
  socket.on('disconnect', () => {
    console.log(`[WebSocket] POs screen disconnected. (${socket.id})`);
  });
});

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log('==============================================');
  console.log(`📡 Dönerci Caller ID Backend Çalışıyor! (Port: ${PORT})`);
  console.log('----------------------------------------------');
  console.log('Aramayı test etmek için CMD üzerinden şu komutu çalıştırabilirsiniz:');
  console.log(`curl -X POST http://localhost:3001/api/incoming-call -H "Content-Type: application/json" -d "{\\"phone\\":\\"0555 444 33 22\\"}"`);
  console.log('==============================================');
});
