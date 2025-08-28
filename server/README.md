# WebRTC Signaling Server

Bu server, ortak ağdaki kullanıcıların WebRTC üzerinden gerçek zamanlı sohbet yapabilmesi için signaling hizmeti sağlar.

## Özellikler

- WebSocket tabanlı signaling server
- Otomatik peer discovery
- Ortak ağ erişimi (0.0.0.0 binding)
- CORS desteği
- Health check endpoint'i

## Kurulum

```bash
cd server
npm install
```

## Çalıştırma

### Geliştirme modu
```bash
npm run dev
```

### Production modu
```bash
npm start
```

## Kullanım

Server varsayılan olarak `3001` portunda çalışır. Ortak ağdaki diğer cihazlardan erişmek için:

1. Bilgisayarınızın IP adresini öğrenin
2. Diğer cihazlardan `http://[IP_ADRESI]:3001` adresine gidin
3. Chat uygulamasında WebSocket URL'sini `ws://[IP_ADRESI]:3001` olarak ayarlayın

## Endpoints

- `GET /health` - Server durumu ve bağlı kullanıcı sayısı
- `WebSocket /` - Signaling mesajları için

## Güvenlik

Bu server sadece yerel ağ kullanımı için tasarlanmıştır. Production ortamında kullanmadan önce güvenlik önlemleri ekleyin.
