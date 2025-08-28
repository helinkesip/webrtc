// Basit WebRTC Chat Uygulaması
export interface SimpleMessage {
  id: string;
  type: 'chat' | 'file';
  text?: string;
  fileName?: string;
  fileData?: string;
  senderName: string;
  senderId: string;
  timestamp: Date;
  chatId: string;
  isUser?: boolean;
  fileSize?: number;
  fileType?: string;
  downloadUrl?: string;
}

export interface SimpleUser {
  id: string;
  name: string;
  isOnline: boolean;
}

export class WebRTCService {
  private ws: WebSocket | null = null;
  private peers = new Map<string, RTCPeerConnection>();
  private dataChannels = new Map<string, RTCDataChannel>();
  public myId = '';
  private myName = '';
  private pendingOffers = new Set<string>(); // Bekleyen offer'ları takip et
  
  // Event handlers
  onUserJoined?: (user: SimpleUser) => void;
  onUserLeft?: (userId: string) => void;
  onMessage?: (message: SimpleMessage) => void;
  onFile?: (fileName: string, fileData: string, senderName: string) => void;
  onPrivateChatReceived?: (senderId: string, senderName: string, chatId: string) => void;

  // Bağlantı kurma
  async connect(serverUrl: string, userName: string): Promise<void> {
    this.myName = userName;
    this.myId = 'peer-' + Math.random().toString(36).substr(2, 9);
    
    return new Promise((resolve, reject) => {
      // WebSocket bağlantısı
      this.ws = new WebSocket(serverUrl);
      
      this.ws.onopen = () => {
        console.log('✅ WebSocket bağlandı');
        this.sendToServer({ 
            type: 'user-joined',
          from: this.myId,
          data: { peerId: this.myId, userName } 
          });
          resolve();
        };

      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log(`📥 WebSocket mesajı alındı:`, {
          type: data.type,
          from: data.from,
          to: data.to,
          dataKeys: Object.keys(data.data || {})
        });
        this.handleServerMessage(data);
      };
      
      this.ws.onerror = (error) => {
        console.error('❌ WebSocket hatası:', error);
          reject(error);
        };

      this.ws.onclose = () => {
        console.log('🔌 WebSocket kapandı');
      };
    });
  }

  // Server mesajlarını işleme
  private handleServerMessage(data: { type: string; from: string; to?: string; data?: unknown }) {
    switch (data.type) {
      case 'user-joined':
        if (data.from !== this.myId) {
          this.createPeerConnection(data.from);
          const userData = data.data as { userName?: string } | undefined;
          this.onUserJoined?.({
            id: data.from,
            name: userData?.userName || `User-${data.from.slice(-4)}`,
            isOnline: true
          });
        }
        break;

      case 'user-left':
        this.removePeer(data.from);
        this.onUserLeft?.(data.from);
        break;

      case 'offer':
        this.handleOffer(data.from, data.data as RTCSessionDescriptionInit);
        break;

      case 'answer':
        this.handleAnswer(data.from, data.data as RTCSessionDescriptionInit);
        break;

      case 'ice-candidate':
        this.handleIceCandidate(data.from, data.data as RTCIceCandidateInit);
        break;
        
      case 'general-message': {
        const messageData = data.data as { text?: string; senderName?: string; timestamp?: string | number } | undefined;
        console.log(`🌐 WebSocket üzerinden genel mesaj alındı:`, {
          from: data.from,
          to: data.to,
          text: messageData?.text,
          senderName: messageData?.senderName,
          myId: this.myId,
          fullData: data
        });
        
        // Kendi mesajımızı atlayalım
        if (data.from === this.myId) {
          console.log(`⏭️ Kendi mesajım, atlıyorum: ${data.from}`);
          break;
        }
        
        // Genel mesajı işle
        const generalMessage: SimpleMessage = {
          id: Date.now().toString(),
          type: 'chat',
          text: (typeof messageData?.text === 'string' ? messageData.text : ''),
          senderName: (typeof messageData?.senderName === 'string' ? messageData.senderName : `User-${data.from.slice(-4)}`),
          senderId: data.from,
          timestamp: new Date(messageData?.timestamp || Date.now()),
          chatId: 'general'
        };
        
        console.log(`✅ Genel mesaj işleniyor:`, generalMessage);
        console.log(`🎯 onMessage callback çağrılıyor...`);
        this.onMessage?.(generalMessage);
        break;
      }
        
      case 'private-message':
        // WebSocket fallback ile gelen özel mesaj
        console.log(`📡 WebSocket fallback mesajı alındı: ${data.from} → ${data.to}`, data);
        this.handleWebSocketMessage(data.data as SimpleMessage, data.from);
        break;
        
      case 'private-file':
        // WebSocket fallback ile gelen özel dosya
        console.log(`📁 WebSocket fallback dosyası alındı: ${data.from} → ${data.to}`, data);
        this.handleWebSocketFile(data.data as SimpleMessage, data.from);
        break;
    }
  }

  // Peer bağlantısı oluşturma
  private async createPeerConnection(peerId: string) {
    console.log(`🔗 ${peerId} ile bağlantı kuruluyor... (myId: ${this.myId})`);
    
    // RACE CONDITION ÖNLEYİCİ: ID karşılaştırması ile kim offer göndereceğine karar ver
    if (this.myId > peerId) {
      console.log(`🚫 RACE CONDITION ENGELLEME: ${this.myId} > ${peerId} - Bu peer offer göndermeyecek, karşı taraftan offer bekleyecek`);
      return;
    }
    
    // Eğer zaten bu peer ile bağlantı varsa, yeni bağlantı oluşturma
    if (this.peers.has(peerId)) {
      console.log(`⚠️ ${peerId} ile zaten bağlantı var, yeni bağlantı oluşturulmuyor`);
      return;
    }
    
    // Eğer bu peer için bekleyen offer varsa, yeni offer oluşturma
    if (this.pendingOffers.has(peerId)) {
      console.log(`⚠️ ${peerId} için bekleyen offer var, yeni offer oluşturulmuyor`);
      return;
    }
    
    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun.cloudflare.com:3478' },
        // TURN sunucusu (localhost test için)
        { 
          urls: 'turn:openrelay.metered.ca:80',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        }
      ],
      iceCandidatePoolSize: 10,
      iceTransportPolicy: 'all',
      bundlePolicy: 'balanced'
    });
    
    // Data channel oluştur
    const dataChannel = peer.createDataChannel('chat');
    this.setupDataChannel(dataChannel, peerId);
    
    // ICE candidate gönder
    peer.onicecandidate = (event) => {
      if (event.candidate) {
        console.log(`🧊 ICE candidate gönderiliyor: ${peerId}`, {
          type: event.candidate.type,
          protocol: event.candidate.protocol,
          address: event.candidate.address
        });
        this.sendToServer({
          type: 'ice-candidate',
          from: this.myId,
          to: peerId,
          data: event.candidate
        });
      } else {
        console.log(`✅ ICE gathering tamamlandı: ${peerId}`);
      }
    };

    // Connection state değişikliklerini izle
    peer.onconnectionstatechange = () => {
      console.log(`🔄 Peer ${peerId} connection state: ${peer.connectionState}`);
      if (peer.connectionState === 'connected') {
        console.log(`✅ Peer ${peerId} bağlantısı kuruldu!`);
      } else if (peer.connectionState === 'failed') {
        console.log(`❌ Peer ${peerId} bağlantısı başarısız: failed - 3 saniye sonra tekrar denenecek`);
        setTimeout(() => {
          console.log(`🔄 Peer ${peerId} için bağlantı tekrar deneniyor...`);
          this.removePeer(peerId);
          this.createPeerConnection(peerId);
        }, 3000);
      } else if (peer.connectionState === 'disconnected') {
        console.log(`❌ Peer ${peerId} bağlantısı kesildi: disconnected`);
      }
    };
    
    // Gelen data channel'ı yakala
    peer.ondatachannel = (event) => {
      console.log(`📨 Data channel alındı: ${peerId}`);
      this.setupDataChannel(event.channel, peerId);
    };
    
    this.peers.set(peerId, peer);
    
    // Offer oluştur ve gönder
    try {
      this.pendingOffers.add(peerId);
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      
      this.sendToServer({
        type: 'offer',
        from: this.myId,
        to: peerId,
        data: offer
      });
    } catch (error) {
      console.error('Offer oluşturma hatası:', error);
      this.pendingOffers.delete(peerId);
    }
  }

  // Data channel ayarları
  private setupDataChannel(channel: RTCDataChannel, peerId: string) {
    console.log(`🔧 Data channel kurulumu başlatılıyor: ${peerId}, state: ${channel.readyState}`);
    
    channel.onopen = () => {
      console.log(`✅ ${peerId} ile data channel açıldı! State: ${channel.readyState}`);
      this.dataChannels.set(peerId, channel);
      console.log(`📊 Aktif data channel sayısı: ${this.dataChannels.size}`);
    };
    
    channel.onclose = () => {
      console.log(`❌ ${peerId} ile data channel kapandı`);
      this.dataChannels.delete(peerId);
    };
    
    channel.onerror = (error) => {
      console.error(`💥 ${peerId} data channel hatası:`, error);
    };
    
    channel.onmessage = (event) => {
      const message: SimpleMessage = JSON.parse(event.data);
      console.log(`📨 Peer ${peerId} mesajı alındı:`, message);
      this.handlePeerMessage(message, peerId);
    };
  }

  // WebSocket fallback mesajını işleme
  private handleWebSocketMessage(message: SimpleMessage, fromPeerId: string) {
    console.log(`📡 WebSocket fallback mesajı işleniyor:`, {
      text: message.text,
      chatId: message.chatId,
      fromPeer: fromPeerId
    });

    // Chat ID'yi normalize et (aynı mantık)
    let normalizedChatId = message.chatId;
    if (message.chatId.startsWith('private-')) {
      normalizedChatId = `private-${fromPeerId}`;
      console.log(`🔄 WebSocket fallback chatId normalize: ${message.chatId} → ${normalizedChatId}`);
    }

    const correctedMessage = {
      ...message,
      senderId: fromPeerId,
      chatId: normalizedChatId,
      isUser: false
    };

    console.log(`✅ WebSocket fallback mesajı işlendi:`, correctedMessage);
    this.onMessage?.(correctedMessage);
  }

  // WebSocket ile gelen dosyayı işle
  private handleWebSocketFile(fileMessage: SimpleMessage, fromPeerId: string) {
    console.log('📁 WebSocket fallback dosyası işleniyor:', {
      fileName: fileMessage.fileName,
      chatId: fileMessage.chatId,
      fromPeer: fromPeerId
    });

    // Chat ID'yi normalize et
    let normalizedChatId = fileMessage.chatId;
    if (fileMessage.chatId.startsWith('private-')) {
      normalizedChatId = `private-${fromPeerId}`;
      console.log('🔄 WebSocket fallback dosya chatId normalize:', `${fileMessage.chatId} → ${normalizedChatId}`);
    }
    
    const processedFileMessage: SimpleMessage = {
      ...fileMessage,
      senderId: fromPeerId,
      isUser: false,
      chatId: normalizedChatId,
      downloadUrl: fileMessage.fileData // fileData'yı downloadUrl olarak ayarla
    };
    
    console.log('✅ WebSocket fallback dosyası işlendi:', processedFileMessage);
    this.onMessage?.(processedFileMessage);
  }

  // Peer mesajlarını işleme
  private handlePeerMessage(message: SimpleMessage, fromPeerId: string) {
    console.log(`🔄 handlePeerMessage: mesaj işleniyor`, {
      type: message.type,
      text: message.text,
      originalChatId: message.chatId,
      originalSenderId: message.senderId,
      fromPeer: fromPeerId,
      myId: this.myId
    });

    // MESAJ CHAT ID DEBUG
    console.log(`🆔 CHAT ID DEBUG:`, {
      originalChatId: message.chatId,
      fromPeerId: fromPeerId,
      myId: this.myId,
      messageType: message.type,
      messageText: message.text
    });

    // Özel mesaj için chatId'yi normalize et
    let normalizedChatId = message.chatId;
    if (message.chatId.startsWith('private-')) {
      // Eğer gelen mesaj özel mesaj ise, chatId'yi alıcı perspektifinden düzenle
      // Örnek: gönderen "private-peer-abc" gönderirse, alıcıda "private-peer-xyz" olmalı
      normalizedChatId = `private-${fromPeerId}`;
      console.log(`🔄 Özel mesaj chatId normalize edildi: ${message.chatId} → ${normalizedChatId}`);
    }
    
    console.log(`🎯 FINAL CHAT ID: ${normalizedChatId}`);

    // Gelen mesajlarda senderId'yi düzelt
    const correctedMessage = {
      ...message,
      senderId: fromPeerId, // Gerçek gönderen peer ID'si
      chatId: normalizedChatId, // Normalize edilmiş chatId
      isUser: false // Bu mesaj bizden değil
    };

    console.log(`✅ Düzeltilmiş mesaj:`, correctedMessage);

    if (message.type === 'chat') {
      console.log(`💬 Chat mesajı işleniyor:`, correctedMessage);
      this.onMessage?.(correctedMessage);
    } else if (message.type === 'file') {
      console.log(`📁 Dosya mesajı işleniyor:`, correctedMessage);
      this.onFile?.(message.fileName!, message.fileData!, message.senderName);
    }
  }

  // Offer işleme
  private async handleOffer(peerId: string, offer: RTCSessionDescriptionInit) {
    console.log(`📨 Offer alındı: ${peerId} (myId: ${this.myId})`);
    
    // RACE CONDITION ÖNLEYİCİ: Eğer ben daha büyük ID'ye sahipsem, offer göndermem gerekir, alma yapmamalıyım
    if (this.myId > peerId) {
      console.log(`✅ RACE CONDITION ÇÖZÜMÜ: ${this.myId} > ${peerId} - Bu peer offer alacak (RECEIVER role)`);
    } else {
      console.log(`⚠️ RACE CONDITION TESPİTİ: ${this.myId} < ${peerId} - Bu peer offer göndermeli, almamalı. Offer ignore ediliyor.`);
      return;
    }
    
    // Eğer zaten bu peer ile bağlantı varsa, eski bağlantıyı kapat ve yenisini oluştur
    if (this.peers.has(peerId)) {
      console.log(`⚠️ ${peerId} ile zaten bağlantı var, eski bağlantı kapatılıyor ve yeni oluşturuluyor`);
      this.removePeer(peerId);
    }
    
    console.log(`🆕 ${peerId} için yeni peer connection oluşturuluyor (RECEIVER)`);
    
    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun.cloudflare.com:3478' },
        // TURN sunucusu (localhost test için)
        { 
          urls: 'turn:openrelay.metered.ca:80',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        }
      ],
      iceCandidatePoolSize: 10,
      iceTransportPolicy: 'all',
      bundlePolicy: 'balanced'
    });
    
    // Connection state monitoring ekleme
    peer.onconnectionstatechange = () => {
      console.log(`🔄 Peer ${peerId} (RECEIVER) connection state: ${peer.connectionState}`);
      if (peer.connectionState === 'connected') {
        console.log(`✅ Peer ${peerId} (RECEIVER) bağlantısı kuruldu!`);
      } else if (peer.connectionState === 'failed') {
        console.log(`❌ Peer ${peerId} (RECEIVER) bağlantısı başarısız: failed`);
        this.removePeer(peerId);
      } else if (peer.connectionState === 'disconnected') {
        console.log(`❌ Peer ${peerId} (RECEIVER) bağlantısı kesildi: disconnected`);
      }
    };
    
    peer.ondatachannel = (event) => {
      console.log(`📨 Data channel alındı (RECEIVER): ${peerId}`);
      this.setupDataChannel(event.channel, peerId);
    };
    
    peer.onicecandidate = (event) => {
      if (event.candidate) {
        console.log(`🧊 ICE candidate gönderiliyor (RECEIVER): ${peerId}`, {
          type: event.candidate.type,
          protocol: event.candidate.protocol,
          address: event.candidate.address
        });
        this.sendToServer({
          type: 'ice-candidate',
          from: this.myId,
          to: peerId,
          data: event.candidate
        });
      } else {
        console.log(`✅ ICE gathering tamamlandı (RECEIVER): ${peerId}`);
      }
    };

    this.peers.set(peerId, peer);
    
    try {
      console.log(`🔧 Remote description (offer) ayarlanıyor: ${peerId}`);
      await peer.setRemoteDescription(offer);
      console.log(`✅ Remote description (offer) ayarlandı: ${peerId}, signaling state: ${peer.signalingState}`);
      
      console.log(`🔧 Answer oluşturuluyor: ${peerId}`);
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      console.log(`✅ Local description (answer) ayarlandı: ${peerId}, signaling state: ${peer.signalingState}`);
      
      console.log(`📤 Answer gönderiliyor: ${peerId}`);
      this.sendToServer({
        type: 'answer',
        from: this.myId,
        to: peerId,
        data: answer
      });
      console.log(`✅ Answer gönderildi: ${peerId}`);
    } catch (error) {
      console.error(`💥 Offer işleme hatası (${peerId}):`, error);
      this.removePeer(peerId);
    }
  }

  // Answer işleme
  private async handleAnswer(peerId: string, answer: RTCSessionDescriptionInit) {
    const peer = this.peers.get(peerId);
    if (peer) {
      console.log(`📨 Answer alındı: ${peerId}, signaling state: ${peer.signalingState}`);
      
      try {
        // Pending offer'ı temizle
        this.pendingOffers.delete(peerId);
        
        // Answer sadece have-local-offer state'inde set edilmeli
        if (peer.signalingState === 'have-local-offer') {
          console.log(`🔧 Remote description (answer) ayarlanıyor: ${peerId}`);
          await peer.setRemoteDescription(answer);
          console.log(`✅ Answer başarıyla set edildi: ${peerId}`);
        } else {
          console.log(`⚠️ Peer ${peerId} yanlış signaling state: ${peer.signalingState}, answer ignore ediliyor`);
        }
      } catch (error) {
        console.error(`💥 Answer ayarlama hatası (${peerId}):`, error);
        // Hata durumunda peer'ı temizle
        this.removePeer(peerId);
      }
    } else {
      console.warn(`⚠️ No peer connection found for answer from ${peerId}`);
    }
  }

  // ICE candidate işleme
  private async handleIceCandidate(peerId: string, candidate: RTCIceCandidateInit) {
    const peer = this.peers.get(peerId);
    if (peer) {
      console.log(`🧊 ICE candidate işleniyor: ${peerId}, peer state: ${peer.connectionState}, signaling: ${peer.signalingState}`);
      
      try {
        // Remote description set edilmişse ICE candidate ekle
        if (peer.remoteDescription) {
          await peer.addIceCandidate(candidate);
          console.log(`✅ ICE candidate eklendi: ${peerId}`);
        } else {
          console.log(`⚠️ Remote description not set for peer ${peerId}, ICE candidate bekletiliyor`);
          // ICE candidate'ı 2 saniye sonra tekrar dene
          setTimeout(async () => {
            if (peer.remoteDescription) {
              try {
                await peer.addIceCandidate(candidate);
                console.log(`✅ ICE candidate gecikmeli eklendi: ${peerId}`);
      } catch (error) {
                console.error('Gecikmeli ICE candidate hatası:', error);
              }
            }
          }, 2000);
        }
      } catch (error) {
        console.error('💥 ICE candidate ekleme hatası:', error);
      }
    } else {
      console.warn(`⚠️ No peer connection found for ICE candidate from ${peerId}`);
    }
  }

  // Mesaj gönderme (genel chat)
  sendMessage(text: string) {
    const message: SimpleMessage = {
      id: Date.now().toString(),
      type: 'chat',
      text: text,
      senderName: this.myName,
      senderId: this.myId,
      timestamp: new Date(),
      chatId: 'general'
    };
    
    console.log('📤 WebRTC sendMessage:', {
      text: message.text,
      senderId: message.senderId,
      senderName: message.senderName,
      chatId: message.chatId
    });
    
    // Hybrid approach: P2P + WebSocket fallback
    this.sendGeneralMessage(message);
  }

  // Genel mesaj gönderme (Sadece WebSocket - Güvenilir broadcast)
  private sendGeneralMessage(message: SimpleMessage) {
    console.log(`🌐 Genel mesaj gönderiliyor: "${message.text}"`);
    console.log(`🔗 WebSocket durumu: ${this.ws?.readyState} (1=OPEN)`);
    console.log(`🆔 Kendi ID'm: ${this.myId}`);
    
    // Genel mesajları SADECE WebSocket üzerinden gönder
    // Bu garanti eder ki tüm bağlı kullanıcılara ulaşır
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const wsMessage = {
        type: 'general-message',
        from: this.myId,
        data: {
          text: message.text,
          senderName: message.senderName,
          timestamp: message.timestamp,
          chatId: message.chatId,
          messageType: message.type
        }
      };
      
      console.log(`📤 WebSocket genel mesajı hazırlandı:`, wsMessage);
      
      try {
        this.ws.send(JSON.stringify(wsMessage));
        console.log(`✅ WebSocket ile genel mesaj tüm kullanıcılara gönderildi`);
      } catch (error) {
        console.error(`❌ WebSocket genel mesaj hatası:`, error);
      }
    } else {
      console.error(`❌ WebSocket bağlantısı yok veya kapalı! Durum: ${this.ws?.readyState}`);
      console.error(`🚨 Genel mesaj gönderilemedi!`);
    }
    
    console.log(`📊 Genel mesaj: WebSocket=${this.ws?.readyState === 1 ? 'SENT' : 'FAILED'}`);
  }

  // Özel mesaj gönderme (belirli peer'a)
  sendPrivateMessage(text: string, targetPeerId: string, chatId: string) {
    const message: SimpleMessage = {
      id: Date.now().toString(),
      type: 'chat',
      text,
      senderName: this.myName,
      senderId: this.myId,
      timestamp: new Date(),
      chatId
    };
    
    console.log(`💬 Özel mesaj gönderiliyor: "${text}" → ${targetPeerId} (chatId: ${chatId})`);
    
    // FALLBACK: Eğer WebRTC data channel açık değilse, WebSocket üzerinden gönder
    const dataChannel = this.dataChannels.get(targetPeerId);
    if (dataChannel && dataChannel.readyState === 'open') {
      console.log(`🎯 WebRTC data channel ile gönderiliyor`);
      this.sendToPeer(message, targetPeerId);
    } else {
      console.log(`📡 FALLBACK: WebSocket ile gönderiliyor`);
      this.sendViaWebSocket(message, targetPeerId);
    }
  }

  // Dosya gönderme
  async sendFile(file: File, targetPeerId?: string, chatId: string = 'general') {
    console.log('📁 Dosya gönderiliyor:', { fileName: file.name, targetPeerId, chatId });
    
    const reader = new FileReader();
    
    reader.onload = () => {
      const fileData = reader.result as string;
      const message: SimpleMessage = {
        id: Date.now().toString(),
        type: 'file',
        fileName: file.name,
        fileData: fileData,
        senderName: this.myName,
        senderId: 'me',
        timestamp: new Date(),
        chatId: chatId,
        fileSize: file.size,
        fileType: file.type
      };
      
      if (targetPeerId && chatId.startsWith('private-')) {
        // Özel dosya gönderme
        console.log('📂 Özel dosya gönderiliyor:', targetPeerId);
        this.sendPrivateFile(message, targetPeerId);
      } else {
        // Genel dosya gönderme
        console.log('📢 Genel dosya gönderiliyor');
        this.broadcastToPeers(message);
      }
    };
    
    reader.readAsDataURL(file);
  }

  // Özel dosya gönderme
  private sendPrivateFile(message: SimpleMessage, targetPeerId: string) {
    const dataChannel = this.dataChannels.get(targetPeerId);
    
    if (dataChannel && dataChannel.readyState === 'open') {
      console.log('📂 WebRTC ile özel dosya gönderiliyor:', targetPeerId);
      dataChannel.send(JSON.stringify(message));
      console.log('✅ Özel dosya WebRTC ile gönderildi:', targetPeerId);
    } else {
      console.log('📡 FALLBACK: WebSocket ile özel dosya gönderiliyor');
      this.sendFileViaWebSocket(message, targetPeerId);
    }
    
    // Kendi mesaj listesine ekle
    this.onMessage?.(message);
  }

  // WebSocket ile dosya gönderme fallback
  private sendFileViaWebSocket(message: SimpleMessage, targetPeerId: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const payload = {
        type: 'private-file',
        from: this.myId,
        to: targetPeerId,
        data: message
      };
      
      this.ws.send(JSON.stringify(payload));
      console.log('✅ WebSocket fallback dosyası gönderildi:', targetPeerId);
    } else {
      console.error('❌ WebSocket bağlantısı mevcut değil, dosya gönderilemedi');
    }
  }

  // Belirli peer'a mesaj gönderme
  private sendToPeer(message: SimpleMessage, targetPeerId: string) {
    const messageStr = JSON.stringify(message);
    const channel = this.dataChannels.get(targetPeerId);
    
    console.log(`🎯 Özel mesaj gönderiliyor: "${message.text}" → ${targetPeerId}`);
    console.log(`📊 Data channel durumu: ${channel?.readyState || 'undefined'}`);
    
    if (channel && channel.readyState === 'open') {
      try {
        channel.send(messageStr);
        console.log(`✅ Özel mesaj ${targetPeerId} peer'ına gönderildi`);
      } catch (error) {
        console.error(`❌ ${targetPeerId} için özel mesaj gönderme hatası:`, error);
        console.log(`🔄 WebSocket fallback'a geçiliyor...`);
        this.sendViaWebSocket(message, targetPeerId);
      }
    } else {
      const channelState = channel ? channel.readyState : 'no-channel';
      console.log(`⚠️ Peer ${targetPeerId} data channel mevcut değil veya kapalı (${channelState})`);
      console.log(`📡 Otomatik WebSocket fallback'a geçiliyor...`);
      this.sendViaWebSocket(message, targetPeerId);
    }
  }

  // Tüm peer'lara mesaj gönderme
  private broadcastToPeers(message: SimpleMessage) {
    const messageStr = JSON.stringify(message);
    let sentCount = 0;
    
    console.log(`📤 Mesaj gönderiliyor: ${message.text}`);
    console.log(`📊 Aktif data channel sayısı: ${this.dataChannels.size}`);
    
    this.dataChannels.forEach((channel, peerId) => {
      console.log(`🔍 Peer ${peerId} data channel durumu:`, channel.readyState);
      
      if (channel.readyState === 'open') {
        try {
          channel.send(messageStr);
          sentCount++;
          console.log(`✅ Mesaj ${peerId} peer'ına gönderildi`);
        } catch (error) {
          console.error(`${peerId} için mesaj gönderme hatası:`, error);
        }
      } else {
        console.log(`⚠️ Peer ${peerId} data channel kapalı (state: ${channel.readyState})`);
      }
    });
    
    console.log(`📊 Toplam ${sentCount} peer'a mesaj gönderildi`);
  }

  // WebSocket üzerinden direkt mesaj gönderme (FALLBACK)
  private sendViaWebSocket(message: SimpleMessage, targetPeerId: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const data = {
        type: 'private-message',
        from: this.myId,
        to: targetPeerId,
        data: message
      };
      this.ws.send(JSON.stringify(data));
      console.log(`✅ WebSocket fallback mesajı gönderildi: ${targetPeerId}`);
    } else {
      console.error(`❌ WebSocket bağlantısı yok, mesaj gönderilemedi`);
    }
  }

  // Server'a mesaj gönderme
  private sendToServer(data: object) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  // Peer'ı kaldırma
  private removePeer(peerId: string) {
    const peer = this.peers.get(peerId);
    if (peer) {
      peer.close();
      this.peers.delete(peerId);
    }
    
    const channel = this.dataChannels.get(peerId);
    if (channel) {
      channel.close();
      this.dataChannels.delete(peerId);
    }
  }

  // Bağlantıyı kesme
  disconnect() {
    this.peers.forEach(peer => peer.close());
    this.peers.clear();
    this.dataChannels.clear();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  // Bağlı peer sayısı
  getConnectedPeersCount(): number {
    return this.dataChannels.size;
  }
  
  // Server'daki toplam kullanıcı sayısını öğrenmek için
  getTotalUserCount(): number {
    // Bu bilgiyi server'dan almamız gerekiyor, şimdilik data channel sayısı + 1 (kendimiz)
    return this.dataChannels.size + 1;
  }
}
