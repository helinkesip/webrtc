# Bağlantı Sorunları Giderme Rehberi

## Bağlantı Hatası Çözümleri

### 1. WebRTC Signaling Server Çalışmıyor

**Belirtiler:**
- "Bağlantı hatası" mesajı
- Kullanıcı adı girildikten sonra bağlantı kurulamıyor
- Console'da WebSocket bağlantı hataları

**Çözüm:**
```bash
# Server'ı başlatmak için:
./start-server.sh

# Veya manuel olarak:
cd server
npm install
node server.js
```

### 2. Port 3001 Kullanımda

**Belirtiler:**
- "Port 3001 is already in use" hatası
- Server başlatılamıyor

**Çözüm:**
```bash
# Mevcut process'i durdur:
pkill -f "node.*server.js"

# Veya port'u kontrol et:
lsof -i :3001
```

### 3. Ağ Bağlantısı Sorunları

**Belirtiler:**
- WebRTC bağlantısı kurulamıyor
- ICE candidate hataları
- Peer bağlantıları başarısız

**Çözüm:**
- Firewall ayarlarını kontrol edin
- Aynı ağda olduğunuzdan emin olun
- STUN server'ları çalışıyor mu kontrol edin

### 4. Browser Uyumluluğu

**Desteklenen Browser'lar:**
- Chrome 56+
- Firefox 52+
- Safari 11+
- Edge 79+

**Çözüm:**
- Browser'ınızı güncelleyin
- WebRTC desteğini kontrol edin: `chrome://webrtc-internals/`

### 5. Debug İpuçları

**Otomatik Test Script'i:**
```javascript
// Browser console'da test-connection.js dosyasını çalıştırın:
// 1. test-connection.js dosyasını açın
// 2. Tüm içeriği kopyalayın
// 3. Browser console'da yapıştırın
// 4. testWebRTCConnection() komutunu çalıştırın
```

**Manuel Console Kontrolleri:**
```javascript
// WebRTC bağlantı durumu
navigator.mediaDevices.getUserMedia({video: false, audio: false})
  .then(() => console.log('WebRTC destekleniyor'))
  .catch(err => console.log('WebRTC hatası:', err));

// WebSocket bağlantısı
const ws = new WebSocket('ws://localhost:3001');
ws.onopen = () => console.log('WebSocket bağlı');
ws.onerror = (err) => console.log('WebSocket hatası:', err);

// STUN server testi
const pc = new RTCPeerConnection({
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
});
pc.onicecandidate = (e) => {
  if (e.candidate) console.log('STUN server çalışıyor');
};
pc.createOffer().then(offer => pc.setLocalDescription(offer));
```

**Server log'larını kontrol et:**
```bash
# Server çalışırken console'da görünen log'lar:
# ✅ Connected to signaling server
# 👤 User [username] joined
# 🔗 Creating peer connection
# ✅ WebRTC connection established
```

### 6. Yaygın Hata Mesajları

| Hata | Açıklama | Çözüm |
|------|----------|-------|
| "Bağlantı hatası" | Signaling server çalışmıyor | Server'ı başlat |
| "WebSocket connection failed" | Port 3001 kapalı | Server'ı kontrol et |
| "ICE connection failed" | Ağ/firewall sorunu | Ağ ayarlarını kontrol et |
| "Peer connection failed" | WebRTC uyumluluk sorunu | Browser güncelle |
| "Data channel error" | WebRTC data channel sorunu | Otomatik yeniden bağlanma aktif |
| "RTCErrorEvent" | WebRTC bağlantı hatası | Ağ ayarlarını kontrol et |

### 7. Test Etme

**Server durumunu kontrol et:**
```bash
curl http://localhost:3001/health
```

**Beklenen çıktı:**
```json
{
  "status": "ok",
  "connectedClients": 1,
  "activeSessions": 1,
  "sessions": [...],
  "timestamp": "..."
}
```

### 8. İletişim

Sorun devam ederse:
1. Console log'larını kontrol edin
2. Server log'larını kontrol edin
3. Browser'ı yeniden başlatın
4. Server'ı yeniden başlatın
