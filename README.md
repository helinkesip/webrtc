# 💬 Chat Vibes - Real-time Chat Application

A modern, real-time chat application built with React, TypeScript, and WebRTC for peer-to-peer communication.

## ✨ Features

- **🔥 Real-time Messaging**: Instant messaging with WebRTC and WebSocket fallback
- **👥 Multi-user Support**: Support for multiple users with online/offline status
- **💬 Chat Types**: General chat, private messaging, and group chats
- **📁 File Sharing**: Drag & drop file sharing with P2P transfer
- **😀 Emoji Support**: Built-in emoji picker for expressive messaging
- **🌙 Dark/Light Mode**: Beautiful theme switching
- **📱 Responsive Design**: Works on desktop and mobile devices
- **🔒 Type Safe**: Built with TypeScript for reliability
- **⚡ Performance**: Optimized bundle size and fast loading

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks
- **TypeScript** - Type safety and better DX
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **ShadCN/UI** - Beautiful and accessible components
- **Lucide React** - Modern icon library
- **emoji-picker-react** - Emoji picker component

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **WebSocket (ws)** - Real-time communication
- **CORS** - Cross-origin resource sharing

### Communication
- **WebRTC** - Peer-to-peer communication
- **WebSocket** - Signaling and fallback messaging

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/chat-vibes-dynamic.git
   cd chat-vibes-dynamic
   ```

2. **Install dependencies**
   ```bash
   # Install frontend dependencies
   npm install
   
   # Install server dependencies
   cd server
   npm install
   cd ..
   ```

3. **Start the development servers**
   
   **Terminal 1 - Start the signaling server:**
   ```bash
   cd server
   npm start
   ```
   
   **Terminal 2 - Start the frontend:**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   - Frontend: `http://localhost:8080`
   - Server runs on: `http://localhost:3001`

## 📱 Usage

1. **Join the Chat**
   - Enter your name
   - Click "Giriş Yap" to connect

2. **Start Messaging**
   - Use the general chat to message everyone
   - Click on user names to start private conversations
   - Create group chats with multiple users

3. **Share Files**
   - Click the paperclip icon to upload files
   - Drag and drop files directly into the chat

4. **Customize Experience**
   - Toggle between dark and light themes
   - Use emojis to express yourself

## 🏗️ Project Structure

```
chat-vibes-dynamic/
├── src/                    # Frontend source code
│   ├── components/         # React components
│   │   ├── ui/            # ShadCN UI components
│   │   ├── ChatInterface.tsx
│   │   ├── ChatInput.tsx
│   │   └── ...
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities and WebRTC logic
│   └── pages/             # Page components
├── server/                # Backend server
│   ├── server.js          # Express + WebSocket server
│   └── package.json       # Server dependencies
├── dist/                  # Production build output
└── README.md
```

## 🌐 Deployment

### Frontend (Static Hosting)
```bash
npm run build
# Upload dist/ folder to your hosting provider
```

### Server (Node.js Hosting)
```bash
cd server
npm start
# Deploy to your Node.js hosting provider
```

### Environment Variables
- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment mode

## 🔧 Development

### Available Scripts

**Frontend:**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

**Server:**
- `npm start` - Start production server
- `npm run dev` - Start with nodemon (auto-restart)

## 📋 Features in Detail

### Real-time Communication
- **WebRTC**: Direct peer-to-peer communication for low latency
- **WebSocket Fallback**: Ensures message delivery when P2P fails
- **Hybrid Architecture**: Best of both worlds

### User Experience
- **Instant Feedback**: Messages appear immediately
- **Typing Indicators**: See when others are typing
- **Online Status**: Real-time user presence
- **Unread Counts**: Never miss a message

### File Sharing
- **P2P Transfer**: Direct file transfer between users
- **Drag & Drop**: Intuitive file upload
- **File Preview**: Support for images and common files

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [React](https://reactjs.org/) - Frontend framework
- [WebRTC](https://webrtc.org/) - Real-time communication
- [ShadCN/UI](https://ui.shadcn.com/) - UI components
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework

---

**Built with ❤️ by Helin**