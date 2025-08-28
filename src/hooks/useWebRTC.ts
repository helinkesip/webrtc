import { useState, useEffect, useCallback, useRef } from 'react';
import { WebRTCService, SimpleMessage, SimpleUser } from '@/lib/webrtc';

export const useWebRTC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [users, setUsers] = useState<SimpleUser[]>([]);
  const [messages, setMessages] = useState<SimpleMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [privateChatRequests, setPrivateChatRequests] = useState<{senderId: string, senderName: string, chatId: string}[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('me');
  
  const webrtcRef = useRef<WebRTCService | null>(null);
  const userNameRef = useRef<string>('');

  // Bağlantı kurma
  const connect = useCallback(async (serverUrl: string, userName: string) => {
    if (isConnecting || isConnected) return;
    
    setIsConnecting(true);
    setError(null);
    userNameRef.current = userName;

    try {
      const webrtc = new WebRTCService();
      webrtcRef.current = webrtc;

      // Event handlers
      webrtc.onUserJoined = (user) => {
        console.log('👤 Kullanıcı katıldı:', user.name);
        setUsers(prev => {
          const existing = prev.find(u => u.id === user.id);
          if (existing) {
            return prev.map(u => u.id === user.id ? user : u);
          }
          return [...prev, user];
        });
      };

      webrtc.onUserLeft = (userId) => {
        console.log('👋 Kullanıcı ayrıldı:', userId);
        setUsers(prev => prev.map(u => 
          u.id === userId ? { ...u, isOnline: false } : u
        ));
      };

      webrtc.onMessage = (message) => {
        console.log('🎯 HOOK: WebRTC mesajı alındı:', {
          text: message.text,
          chatId: message.chatId,
          senderId: message.senderId,
          senderName: message.senderName,
          type: message.type,
          timestamp: message.timestamp
        });
        
        if (message.chatId === 'general') {
          console.log('🌐 GENEL CHAT MESAJI HOOK\'ta ALINDI:', {
            mesajText: message.text,
            senderId: message.senderId,
            senderName: message.senderName,
            timestamp: message.timestamp
          });
        } else {
          console.log('📝 Private/Grup mesajı hook\'ta alındı:', {
            chatId: message.chatId,
            text: message.text,
            senderId: message.senderId
          });
        }
        
        console.log('🆔 MESAJ ALINDI - CHAT ID KONTROL:', {
          mesajChatId: message.chatId,
          mesajText: message.text,
          senderId: message.senderId,
          senderName: message.senderName
        });
        
        // OTOMATIK CHAT OLUŞTURMA için callback
        if (message.chatId.startsWith('private-') && message.senderId !== 'me') {
          console.log('🆕 OTOMATIK CHAT OLUŞTURMA gerekiyor:', {
            chatId: message.chatId,
            senderId: message.senderId,
            senderName: message.senderName
          });
          
          // Otomatik chat oluşturma isteği ekle
          setPrivateChatRequests(prev => {
            const exists = prev.find(req => req.chatId === message.chatId);
            if (!exists) {
              return [...prev, {
                senderId: message.senderId,
                senderName: message.senderName,
                chatId: message.chatId
              }];
            }
            return prev;
          });
        }
        
        console.log('📊 Mevcut mesaj sayısı:', messages.length);
        setMessages(prev => {
          const newMessages = [...prev, message];
          console.log('📊 Yeni mesaj sayısı:', newMessages.length);
          console.log('📊 Eklenen mesaj:', message);
          
          // Mesaj listesindeki tüm chat ID'leri göster
          console.log('🗂️ Tüm mesajlardaki chat ID\'ler:', newMessages.map(m => m.chatId));
          
          return newMessages;
        });
      };

      webrtc.onFile = (fileName, fileData, senderName) => {
        console.log('📁 Dosya alındı:', fileName);
        const fileMessage: SimpleMessage = {
          id: Date.now().toString(),
          type: 'file',
          fileName,
          fileData,
          senderName,
          senderId: 'remote',
          timestamp: new Date(),
          chatId: 'general',
          downloadUrl: fileData
        };
        setMessages(prev => [...prev, fileMessage]);
      };

      await webrtc.connect(serverUrl, userName);
      setIsConnected(true);
      
      // Current user ID'yi ayarla
      setCurrentUserId(webrtc.myId || 'me');
      console.log('👤 Current user ID ayarlandı:', webrtc.myId);
      
      // Kendini kullanıcı listesine ekle
      setUsers(prev => [
        {
          id: 'me',
          name: userName,
          isOnline: true
        },
        ...prev
      ]);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bağlantı hatası');
      console.error('WebRTC bağlantı hatası:', err);
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting, isConnected]);

  // Bağlantıyı kesme
  const disconnect = useCallback(() => {
    if (webrtcRef.current) {
      webrtcRef.current.disconnect();
      webrtcRef.current = null;
    }
    setIsConnected(false);
    setUsers([]);
    setMessages([]);
  }, []);

 // Mesaj gönderme (genel chat)
  const sendMessage = useCallback((text: string) => {
    console.log('📨 useWebRTC sendMessage çağrıldı:', { text, isConnected, hasWebRTC: !!webrtcRef.current });
    
    if (!webrtcRef.current || !isConnected) {
      console.warn('❌ Mesaj gönderilemedi - Bağlantı yok:', { 
        hasWebRTC: !!webrtcRef.current, 
        isConnected 
      });
      return;
    }

    // Kendi mesajını hemen ekle
    const myMessage: SimpleMessage = {
      id: Date.now().toString(),
      type: 'chat',
      text,
      senderName: userNameRef.current,
      senderId: 'me',
      timestamp: new Date(),
      chatId: 'general'
    };
    
    console.log('📝 Kendi mesajı ekleniyor:', myMessage);
    setMessages(prev => {
      console.log('📊 Önceki mesaj sayısı:', prev.length);
      const newMessages = [...prev, myMessage];
      console.log('📊 Yeni mesaj sayısı:', newMessages.length);
      return newMessages;
    });

    // Diğer kullanıcılara gönder
    webrtcRef.current.sendMessage(text);
  }, [isConnected]);

  // Özel mesaj gönderme
  const sendPrivateMessage = useCallback((text: string, targetUserId: string, chatId: string) => {
    if (!webrtcRef.current || !isConnected) return;

    console.log(`💬 Özel mesaj gönderiliyor: "${text}" → ${targetUserId} (chatId: ${chatId})`);

    // Kendi mesajını hemen ekle
    const myMessage: SimpleMessage = {
      id: Date.now().toString(),
      type: 'chat',
      text,
      senderName: userNameRef.current,
      senderId: 'me',
      timestamp: new Date(),
      chatId
    };
    setMessages(prev => [...prev, myMessage]);

    // Belirli kullanıcıya gönder
    webrtcRef.current.sendPrivateMessage(text, targetUserId, chatId);
  }, [isConnected]);

  // Grup mesajı gönderme
  const sendGroupMessage = useCallback((text: string, participantIds: string[], chatId: string) => {
    if (!webrtcRef.current || !isConnected) return;

    console.log(`👥 Grup mesajı gönderiliyor: "${text}" → [${participantIds.join(', ')}] (chatId: ${chatId})`);

    // Kendi mesajını hemen ekle
    const myMessage: SimpleMessage = {
      id: Date.now().toString(),
      type: 'chat',
      text,
      senderName: userNameRef.current,
      senderId: 'me',
      timestamp: new Date(),
      chatId
    };
    setMessages(prev => [...prev, myMessage]);

    // Her grup üyesine ayrı ayrı gönder (kendisi hariç)
    let sentCount = 0;
    participantIds.forEach(participantId => {
      if (participantId !== currentUserId && participantId !== 'me') {
        console.log(`📤 Grup mesajı gönderiliyor: ${participantId}`);
        try {
          webrtcRef.current?.sendPrivateMessage(text, participantId, chatId);
          sentCount++;
        } catch (error) {
          console.error(`❌ Grup mesajı gönderme hatası (${participantId}):`, error);
        }
      }
    });

    console.log(`✅ Grup mesajı ${sentCount}/${participantIds.length - 1} üyeye gönderildi`);
  }, [isConnected, currentUserId]);

  // Dosya gönderme (genel ve özel)
  const sendFile = useCallback(async (file: File, targetUserId?: string, chatId: string = 'general') => {
    if (!webrtcRef.current || !isConnected) return;

    console.log('📁 useWebRTC: Dosya gönderiliyor:', { fileName: file.name, targetUserId, chatId });

    // Kendi dosya mesajını hemen ekle
    const myMessage: SimpleMessage = {
      id: Date.now().toString(),
      type: 'file',
      fileName: file.name,
      fileData: '',
      senderName: userNameRef.current,
      senderId: 'me',
      timestamp: new Date(),
      chatId: chatId,
      fileSize: file.size,
      fileType: file.type
    };
    setMessages(prev => [...prev, myMessage]);

    // Diğer kullanıcılara gönder
    await webrtcRef.current.sendFile(file, targetUserId, chatId);
  }, [isConnected]);

  // Bağlı kullanıcı sayısı
  const getConnectedCount = useCallback(() => {
    return webrtcRef.current?.getConnectedPeersCount() || 0;
  }, []);

  // Real-time mesaj güncellemesi için useEffect
  useEffect(() => {
    if (isConnected && webrtcRef.current) {
      console.log('🔄 Real-time event listener güncellemesi');
      
      // Mevcut event listener'ları güncelle (ezme)
      const currentWebRTC = webrtcRef.current;
      
      // Mesaj listener'ı güncelle
      const originalOnMessage = currentWebRTC.onMessage;
      currentWebRTC.onMessage = (message: SimpleMessage) => {
        console.log('📨 Real-time updated listener: Mesaj alındı:', {
          text: message.text,
          chatId: message.chatId,
          senderId: message.senderId,
          senderName: message.senderName
        });
        
        // Orijinal handler'ı çağır
        if (originalOnMessage) {
          originalOnMessage(message);
        }
      };

      return () => {
        console.log('🧹 Real-time event listener güncellemesi temizlendi');
        // Orijinal handler'ı geri yükle
        if (currentWebRTC) {
          currentWebRTC.onMessage = originalOnMessage;
        }
      };
    }
  }, [isConnected]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (webrtcRef.current) {
        webrtcRef.current.disconnect();
      }
    };
  }, []);

  return {
    // State
    isConnected,
    isConnecting,
    users,
    messages,
    error,
    privateChatRequests,
    currentUserId,
    userName: userNameRef.current,
    
    // Actions
    connect,
    disconnect,
    sendMessage,
    sendPrivateMessage,
    sendGroupMessage,
    sendFile,
    getConnectedCount
  };
};
