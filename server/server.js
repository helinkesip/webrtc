const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Enable CORS for all routes
app.use(cors());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../dist')));

// WebSocket server for signaling
const wss = new WebSocket.Server({ server });

// Store connected clients with more detailed info
const clients = new Map();
const clientSessions = new Map(); // Track session info

// Handle WebSocket connections
wss.on('connection', (ws, req) => {
  console.log('🔌 New WebSocket connection:', req.socket.remoteAddress);
  
  let clientId = null;
  let sessionId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);

  // Store session info
  clientSessions.set(ws, {
    id: sessionId,
    remoteAddress: req.socket.remoteAddress,
    connectedAt: new Date(),
    clientId: null
  });

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('📨 Received message:', data.type, 'from:', data.from);

      switch (data.type) {
        case 'user-joined':
          clientId = data.from;
          const userName = data.data?.userName || `User-${clientId.slice(-4)}`;
          
          // Update session info
          const session = clientSessions.get(ws);
          if (session) {
            session.clientId = clientId;
            session.userName = userName;
          }
          
          clients.set(clientId, ws);
          
          console.log(`👤 User ${userName} (${clientId}) joined from ${req.socket.remoteAddress}`);
          console.log(`📊 Total active sessions: ${clientSessions.size}, Total clients: ${clients.size}`);
          
          // Send existing users list to the new user
          const existingUsers = Array.from(clients.keys()).filter(id => id !== clientId);
          existingUsers.forEach(existingUserId => {
            const existingSession = Array.from(clientSessions.values()).find(s => s.clientId === existingUserId);
            if (existingSession) {
              ws.send(JSON.stringify({
                type: 'user-joined',
                from: existingUserId,
                data: { peerId: existingUserId, userName: existingSession.userName }
              }));
            }
          });
          
          // Notify all other clients about the new user
          broadcastToOthers(clientId, {
            type: 'user-joined',
            from: clientId,
            data: { peerId: clientId, userName }
          });
          
          break;

        case 'offer':
        case 'answer':
        case 'ice-candidate':
          // Forward the message to the specific recipient
          if (data.to && clients.has(data.to)) {
            const targetClient = clients.get(data.to);
            if (targetClient.readyState === WebSocket.OPEN) {
              targetClient.send(JSON.stringify(data));
              console.log(`📤 Forwarded ${data.type} from ${data.from} to ${data.to}`);
            } else {
              console.warn(`⚠️ Target client ${data.to} not ready (state: ${targetClient.readyState})`);
            }
          } else {
            console.warn(`⚠️ Target client ${data.to} not found`);
          }
          break;
          
        case 'general-message':
          // GENEL CHAT MESAJI BROADCASTING
          console.log(`🌐 GENERAL MESSAGE BROADCASTING:`, {
            from: data.from,
            messageText: data.data?.text,
            activeClients: Array.from(clients.keys()),
            totalClients: clients.size
          });
          
          // Göndereni hariç tutarak tüm kullanıcılara broadcast et
          broadcastToOthers(data.from, {
            type: 'general-message',
            from: data.from,
            data: data.data
          });
          break;

        case 'private-message':
          // ÖZEL MESAJ FORWARDING - Detaylı debug
          console.log(`🔍 PRIVATE MESSAGE FORWARDING:`, {
            from: data.from,
            to: data.to,
            messageText: data.data?.text,
            activeClients: Array.from(clients.keys())
          });
          
          if (data.to && clients.has(data.to)) {
            const targetClient = clients.get(data.to);
            if (targetClient.readyState === WebSocket.OPEN) {
              targetClient.send(JSON.stringify(data));
              console.log(`✅ PRIVATE MESSAGE SENT: ${data.from} → ${data.to} ("${data.data?.text}")`);
            } else {
              console.warn(`⚠️ Target client ${data.to} not ready (state: ${targetClient.readyState})`);
            }
          } else {
            console.warn(`❌ Target client ${data.to} not found! Available clients: ${Array.from(clients.keys())}`);
          }
          break;

        case 'private-file':
          // ÖZEL DOSYA FORWARDING - Detaylı debug
          console.log(`📁 PRIVATE FILE FORWARDING:`, {
            from: data.from,
            to: data.to,
            fileName: data.data?.fileName,
            fileSize: data.data?.fileSize,
            activeClients: Array.from(clients.keys())
          });
          
          if (data.to && clients.has(data.to)) {
            const targetClient = clients.get(data.to);
            if (targetClient.readyState === WebSocket.OPEN) {
              targetClient.send(JSON.stringify(data));
              console.log(`✅ PRIVATE FILE SENT: ${data.from} → ${data.to} ("${data.data?.fileName}")`);
            } else {
              console.warn(`⚠️ Target client ${data.to} not ready (state: ${targetClient.readyState})`);
            }
          } else {
            console.warn(`❌ Target client ${data.to} not found for file! Available clients: ${Array.from(clients.keys())}`);
          }
          break;

        default:
          console.log('❓ Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('❌ Error parsing message:', error);
    }
  });

  ws.on('close', () => {
    console.log(`🔌 WebSocket connection closed for ${clientId || 'unknown'}`);
    
    if (clientId) {
      clients.delete(clientId);
      
      // Notify other clients that this user left
      broadcastToOthers(clientId, {
        type: 'user-left',
        from: clientId
      });
      
      console.log(`👋 User ${clientId} left. Total clients: ${clients.size}`);
    }
    
    // Clean up session
    clientSessions.delete(ws);
    console.log(`🧹 Session cleaned up. Active sessions: ${clientSessions.size}`);
  });

  ws.on('error', (error) => {
    console.error('❌ WebSocket error for', clientId || 'unknown:', error);
  });

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'welcome',
    sessionId: sessionId,
    message: 'Connected to WebRTC signaling server'
  }));
});

// Helper function to broadcast to all clients except the sender
function broadcastToOthers(senderId, message) {
  console.log(`📡 Broadcasting message from ${senderId} to ${clients.size - 1} other clients`);
  let sentCount = 0;
  
  clients.forEach((client, id) => {
    if (id !== senderId && client.readyState === WebSocket.OPEN) {
      try {
        client.send(JSON.stringify(message));
        sentCount++;
        console.log(`✅ Message sent to client ${id}`);
      } catch (error) {
        console.error(`❌ Failed to send message to client ${id}:`, error);
      }
    } else if (id === senderId) {
      console.log(`⏭️ Skipping sender ${senderId}`);
    } else {
      console.log(`⚠️ Client ${id} not ready (state: ${client.readyState})`);
    }
  });
  
  console.log(`📊 Broadcast complete: ${sentCount} messages sent`);
}

// Health check endpoint
app.get('/health', (req, res) => {
  const activeSessions = Array.from(clientSessions.values()).map(session => ({
    sessionId: session.id,
    clientId: session.clientId,
    userName: session.userName,
    remoteAddress: session.remoteAddress,
    connectedAt: session.connectedAt
  }));

  res.json({
    status: 'ok',
    connectedClients: clients.size,
    activeSessions: clientSessions.size,
    sessions: activeSessions,
    timestamp: new Date().toISOString()
  });
});

// Serve the React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0'; // Listen on all network interfaces

server.listen(PORT, HOST, () => {
  console.log(`🚀 WebRTC Signaling Server running on http://${HOST}:${PORT}`);
  console.log(`📡 WebSocket server ready on ws://${HOST}:${PORT}`);
  console.log(`🌐 Local network access: http://${getLocalIP()}:${PORT}`);
});

// Get local IP address for network access
function getLocalIP() {
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  
  return 'localhost';
}
