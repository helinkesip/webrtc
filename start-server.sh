#!/bin/bash

# WebRTC Signaling Server Starter Script
echo "🚀 Starting WebRTC Signaling Server..."

# Check if server directory exists
if [ ! -d "server" ]; then
    echo "❌ Server directory not found!"
    exit 1
fi

# Navigate to server directory
cd server

# Check if node_modules exists, install if not
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if port 3001 is already in use
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 3001 is already in use. Stopping existing process..."
    pkill -f "node.*server.js"
    sleep 2
fi

# Start the server
echo "🔌 Starting server on port 3001..."
echo "📡 WebSocket server will be available at ws://localhost:3001"
echo "🌐 Health check available at http://localhost:3001/health"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

node server.js
