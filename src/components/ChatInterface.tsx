import { useState, useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import FileMessage from './FileMessage';
import ChatInput from './ChatInput';
import TypingIndicator from './TypingIndicator';
import UserSidebar from './UserSidebar';
import ChatTabs, { ChatTab, ChatType } from './ChatTabs';
import ConnectionSettings from './ConnectionSettings';
import SettingsModal from './SettingsModal';
import { ThemeToggle } from './theme-toggle';
import { MessageCircle, Settings, Wifi, WifiOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWebRTC } from '@/hooks/useWebRTC';

interface User {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'away' | 'offline';
  lastSeen?: Date;
  unreadCount?: number;
}

interface UserProfile {
  displayName: string;
  statusMessage: string;
  profileColor: string;
}

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  chatId: string;
  senderId?: string;
  senderName?: string;
  type: 'chat' | 'file';
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  downloadUrl?: string;
}

interface Chat {
  id: string;
  name: string;
  type: ChatType;
  participants: string[];
  messages: Message[];
}

const ChatInterface = () => {
  const {
    isConnected,
    isConnecting,
    users: connectedUsers,
    messages: webrtcMessages,
    error,
    privateChatRequests,
    userName,
    currentUserId: webrtcCurrentUserId,
    typingUsers,
    connect,
    disconnect,
    sendMessage: sendWebRTCMessage,
    sendPrivateMessage: sendWebRTCPrivateMessage,
    sendGroupMessage: sendWebRTCGroupMessage,
    sendFile: sendWebRTCFile,
    sendTypingStatus,
    updateUserProfile
  } = useWebRTC();

  // Mock users data (fallback when not connected)
  const [users] = useState<User[]>([
    { id: '1', name: 'Ahmet Yılmaz', avatar: '', status: 'online' },
    { id: '2', name: 'Fatma Demir', avatar: '', status: 'online' },
    { id: '3', name: 'Mehmet Kaya', avatar: '', status: 'away' },
    { id: '4', name: 'Ayşe Şahin', avatar: '', status: 'online' },
    { id: '5', name: 'Can Özkan', avatar: '', status: 'offline' },
    { id: '6', name: 'Zeynep Akar', avatar: '', status: 'online' },
  ]);

  // Show connection settings if not connected
  const [showConnectionSettings, setShowConnectionSettings] = useState(true);
  
  // Settings modal
  const [showSettings, setShowSettings] = useState(false);
  
  // User profile settings
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('chat-user-profile');
    return saved ? JSON.parse(saved) : {
      displayName: userName || '',
      statusMessage: '',
      profileColor: '#8b5cf6'
    };
  });

  const [chats, setChats] = useState<Chat[]>([
    {
      id: 'general',
      name: 'Genel Sohbet',
      type: 'general',
      participants: [],
      messages: []
    }
  ]);

  const [activeTabId, setActiveTabId] = useState('general');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [userUnreadCounts, setUserUnreadCounts] = useState<Record<string, number>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Current user info - use real WebRTC ID when connected
  const currentUserId = isConnected ? webrtcCurrentUserId : 'current-user';
  const currentUserName = userName || 'Sen';

  const activeChat = chats.find(chat => chat.id === activeTabId);
  
  // Combine local chat messages with WebRTC messages
  const activeChatMessages = isConnected 
    ? [
        ...activeChat?.messages || [],
        ...webrtcMessages
          .filter(msg => msg.chatId === activeTabId) // Filter by active chat ID
          .map(msg => ({
            id: msg.id,
            text: msg.text || '',
            isUser: msg.senderId === 'me' || msg.senderId === currentUserId, // Check if it's from current user
            timestamp: msg.timestamp,
            chatId: msg.chatId,
            senderId: msg.senderId,
            senderName: msg.senderName,
            type: msg.type || 'chat',
            fileName: msg.fileName,
            fileSize: msg.fileSize,
            fileType: msg.fileType,
            downloadUrl: msg.downloadUrl
          }))
      ]
    : activeChat?.messages || [];

  // Sort all messages by timestamp to maintain chronological order
  const sortedMessages = activeChatMessages.sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Debug: Mesaj sayısını logla
  console.log('🔍 DEBUG - Mesaj Durumu:', {
    webrtcMesajSayisi: webrtcMessages.length,
    aktiveChatMesajSayisi: activeChatMessages.length,
    siralanmisMesajSayisi: sortedMessages.length,
    aktiveChatId: activeTabId,
    webrtcMesajlari: webrtcMessages,
    filtrelenmisMetajlar: webrtcMessages.filter(msg => msg.chatId === activeTabId),
    tumChatIdler: [...new Set(webrtcMessages.map(m => m.chatId))]
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Real-time mesaj güncellemesi ve grup creation handling
  useEffect(() => {
    if (isConnected && webrtcMessages.length > 0) {
      console.log('🔄 ChatInterface: Real-time mesaj güncellemesi');
      console.log('📊 Yeni mesaj sayısı:', webrtcMessages.length);
      
      // Check for group creation messages
      webrtcMessages.forEach(message => {
        console.log('🔍 Mesaj kontrol ediliyor:', {
          chatId: message.chatId,
          senderId: message.senderId,
          text: message.text?.substring(0, 50) + '...',
          isSystemMessage: message.chatId === 'system',
          isGroupCreated: message.text?.startsWith('{"type":"group-created"')
        });
        
        if (message.chatId === 'system' && message.text?.startsWith('{"type":"group-created"')) {
          try {
            const groupInfo = JSON.parse(message.text);
            console.log('📨 GRUP CREATION MESAJI ALINDI:', groupInfo);
            console.log('📨 Mesaj gönderen:', message.senderId);
            console.log('📨 Benim ID\'im:', currentUserId);
            console.log('📨 Katılımcılar:', groupInfo.participants);
            
            // Check if this user is in the participants
            const currentUser = currentUserId;
            const isParticipant = groupInfo.participants?.includes(currentUser);
            console.log('📨 Ben katılımcı mıyım?', isParticipant);
            
            if (isParticipant) {
              // Create the group chat if it doesn't exist
              const existingGroup = chats.find(chat => chat.id === groupInfo.groupId);
              console.log('📨 Var olan grup:', existingGroup ? 'VAR' : 'YOK');
              
              if (!existingGroup) {
                console.log('✅ Yeni grup chat oluşturuluyor:', groupInfo.groupName);
                const newGroupChat: Chat = {
                  id: groupInfo.groupId,
                  name: groupInfo.groupName,
                  type: 'group',
                  participants: groupInfo.participants,
                  messages: []
                };
                
                setChats(prev => [...prev, newGroupChat]);
                
                // Add a system message about group creation
                const systemMessage: Message = {
                  id: `system-${Date.now()}`,
                  text: `"${groupInfo.groupName}" grubu ${groupInfo.createdByName} tarafından oluşturuldu.`,
                  isUser: false,
                  timestamp: new Date(),
                  chatId: groupInfo.groupId,
                  senderId: 'system',
                  senderName: 'Sistem',
                  type: 'chat'
                };
                
                // Add system message to the group
                setTimeout(() => {
                  setChats(prev => prev.map(chat => 
                    chat.id === groupInfo.groupId 
                      ? { ...chat, messages: [...chat.messages, systemMessage] }
                      : chat
                  ));
                }, 100);
              }
            }
          } catch (error) {
            console.error('❌ Grup creation mesajı parse hatası:', error);
          }
        }
      });
      
      // Mesajlar geldiğinde otomatik scroll
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [webrtcMessages, isConnected, chats, currentUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [activeChatMessages, isTyping]);

  // Auto-hide connection settings when connected
  useEffect(() => {
    if (isConnected) {
      setShowConnectionSettings(false);
    }
  }, [isConnected]);

  // Track unread messages for each user
  useEffect(() => {
    if (!isConnected) return;

    webrtcMessages.forEach(message => {
      // Sadece private mesajlar ve kendi mesajımız değilse
      if (message.chatId.startsWith('private-') && message.senderId !== 'me') {
        const senderId = message.senderId;
        const chatId = `private-${senderId}`;
        
        // Eğer aktif chat bu değilse unread count artır
        if (activeTabId !== chatId) {
          setUserUnreadCounts(prev => {
            const messageKey = `${senderId}-${message.id}`;
            
            // Bu mesaj daha önce sayıldı mı kontrol et
            if (localStorage.getItem(`counted-${messageKey}`)) {
              return prev;
            }
            
            // Mesajı sayıldı olarak işaretle
            localStorage.setItem(`counted-${messageKey}`, 'true');
            
            return {
              ...prev,
              [senderId]: (prev[senderId] || 0) + 1
            };
          });
        }
      }
    });
  }, [webrtcMessages, activeTabId, isConnected]);

  // Aktif tab değiştiğinde o kullanıcının unread count'unu sıfırla
  useEffect(() => {
    if (activeTabId.startsWith('private-')) {
      const userId = activeTabId.replace('private-', '');
      setUserUnreadCounts(prev => ({
        ...prev,
        [userId]: 0
      }));
    }
  }, [activeTabId]);

  // OTOMATIK CHAT OLUŞTURMA - Gelen mesajlar için
  useEffect(() => {
    privateChatRequests.forEach(request => {
      const { senderId, senderName, chatId } = request;
      
      console.log('🆕 Otomatik chat oluşturuluyor:', { senderId, senderName, chatId });
      
      // Chat zaten var mı kontrol et
      const existingChat = chats.find(chat => chat.id === chatId);
      if (!existingChat) {
        const newChat: Chat = {
          id: chatId,
          name: senderName,
          type: 'private',
          participants: [senderId],
          messages: []
        };
        
        console.log('✅ Yeni chat otomatik oluşturuldu:', newChat);
        setChats(prev => [...prev, newChat]);
        
        // İlk mesaj geldiğinde otomatik bu chat'e geç
        setActiveTabId(chatId);
      }
    });
  }, [privateChatRequests, chats]);

  const createTab = (chatId: string, name: string, type: ChatType, participants: string[] = []): ChatTab => ({
    id: chatId,
    name,
    type,
    participants,
    unreadCount: 0
  });

  const tabs: ChatTab[] = chats.map(chat => 
    createTab(chat.id, chat.name, chat.type, chat.participants)
  );

  const handleStartPrivateChat = (userId: string) => {
    console.log('🔥 ÖZEL CHAT BAŞLATILIYOR:', {
      targetUserId: userId,
      isConnected,
      connectedUsers: connectedUsers.map(u => u.id),
      mockUsers: users.map(u => u.id)
    });
    
    // Find user from connected users if WebRTC is connected
    const connectedUser = isConnected ? connectedUsers.find(u => u.id === userId) : null;
    const mockUser = users.find(u => u.id === userId);
    
    const user = connectedUser || mockUser;
    if (!user) {
      console.warn('❌ User not found:', userId);
      return;
    }

    const chatId = `private-${userId}`;
    console.log('🆔 Oluşturulan chat ID:', chatId);
    
    // Check if chat already exists
    if (chats.find(chat => chat.id === chatId)) {
      console.log('✅ Chat zaten var, geçiş yapılıyor:', chatId);
      setActiveTabId(chatId);
      return;
    }

    // Create new private chat
    const newChat: Chat = {
      id: chatId,
      name: user.name,
      type: 'private',
      participants: [userId],
      messages: []
    };

    console.log('🆕 Yeni özel chat oluşturuluyor:', newChat);
    setChats(prev => [...prev, newChat]);
    setActiveTabId(chatId);
  };



  const handleUserToggle = (userId: string) => {
    console.log('🔄 handleUserToggle:', {
      userId,
      currentSelectedUsers: selectedUsers,
      connectedUsers: connectedUsers.map(u => ({ id: u.id, name: u.name })),
      action: selectedUsers.includes(userId) ? 'REMOVE' : 'ADD'
    });
    
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleProfileUpdate = (newProfile: UserProfile) => {
    setUserProfile(newProfile);
    localStorage.setItem('chat-user-profile', JSON.stringify(newProfile));
    
    // Update WebRTC service with new profile info
    if (isConnected && newProfile.displayName !== userProfile.displayName) {
      console.log('👤 Profil güncellendi, WebRTC ile diğer kullanıcılara gönderiliyor:', newProfile);
      updateUserProfile(newProfile.displayName, newProfile.statusMessage, newProfile.profileColor);
    }
  };

  const handleTyping = (isTyping: boolean) => {
    console.log(`⌨️ ${userProfile.displayName || userName} ${isTyping ? 'yazıyor...' : 'yazmayı bıraktı'}`);
    console.log(`🔍 TYPING DEBUG: activeTabId=${activeTabId}`);
    
    // Send typing status to other users via WebRTC
    if (isConnected) {
      // GEÇICI FIX: Eğer activeTabId yanlışsa, general chat için 'general' gönder
      const correctChatId = activeTabId === 'general' ? 'general' : activeTabId;
      console.log(`📤 Gönderilen chatId: ${correctChatId}`);
      sendTypingStatus(isTyping, correctChatId);
    }
  };

  const handleCreateGroup = (userIds: string[], groupName: string) => {
    const groupId = `group-${Date.now()}`;
    
    // Add current user to participants if not already included
    const allParticipants = userIds.includes(currentUserId) 
      ? userIds 
      : [...userIds, currentUserId];
    
    console.log('👥 GRUP OLUŞTURULUYOR:', { 
      groupId, 
      groupName, 
      originalUserIds: userIds,
      allParticipants,
      currentUserId,
      isConnected,
      connectedUsers: connectedUsers.map(u => ({ id: u.id, name: u.name }))
    });
    
    // Create group chat locally
    const newGroupChat: Chat = {
      id: groupId,
      name: groupName,
      type: 'group',
      participants: allParticipants,
      messages: []
    };
    
    setChats(prev => [...prev, newGroupChat]);
    setActiveTabId(groupId);
    setSelectedUsers([]);
    
    // Send group creation notification to all participants via WebRTC
    if (isConnected) {
      const groupInfo = {
        type: 'group-created',
        groupId,
        groupName,
        participants: allParticipants,
        createdBy: currentUserId,
        createdByName: currentUserName
      };
      
      console.log('📤 GRUP BİLGİSİ GÖNDERİLİYOR:', groupInfo);
      console.log('📤 Target userIds:', userIds);
      console.log('📤 All participants:', allParticipants);
      console.log('📤 My currentUserId:', currentUserId);
      
      // Send to all OTHER participants (not including myself)
      userIds.forEach(userId => {
        if (userId !== currentUserId) {
          console.log(`📤 Grup bilgisi gönderiliyor → ${userId} (from ${currentUserId})`);
          // Send via WebRTC private message with special type
          sendWebRTCPrivateMessage(JSON.stringify(groupInfo), userId, 'system');
        } else {
          console.log(`⏭️ Kendi ID'mi atlıyorum: ${userId}`);
        }
      });
    }
  };

  const handleTabClose = (tabId: string) => {
    if (tabId === 'general') return; // Can't close general chat
    
    setChats(prev => prev.filter(chat => chat.id !== tabId));
    
    if (activeTabId === tabId) {
      setActiveTabId('general');
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!activeChat) return;

    if (isConnected) {
      if (activeTabId === 'general') {
        // Send via WebRTC to all users
        sendWebRTCMessage(text);
      } else if (activeChat.type === 'private' && activeChat.participants.length > 0) {
        // Send private message via WebRTC
        const targetUserId = activeChat.participants[0];
        console.log(`🚀 ÖZEL MESAJ GÖNDERİLİYOR:`, {
          text: text,
          targetUserId: targetUserId,
          chatId: activeTabId,
          activeChat: activeChat,
          participants: activeChat.participants
        });
        sendWebRTCPrivateMessage(text, targetUserId, activeTabId);
      } else if (activeChat.type === 'group' && activeChat.participants.length > 0) {
        // Group message - send to all participants
        console.log(`👥 ChatInterface GRUP MESAJI GÖNDERİLİYOR:`, {
          text: text,
          participants: activeChat.participants,
          chatId: activeTabId,
          activeChat: activeChat,
          currentUserId: currentUserId,
          isConnected: isConnected,
          connectedUsers: connectedUsers.map(u => ({ id: u.id, name: u.name }))
        });
        sendWebRTCGroupMessage(text, activeChat.participants, activeTabId);
      }
    } else {
      // Fallback to local chat
      const userMessage: Message = {
        id: Date.now().toString(),
        text,
        isUser: true,
        timestamp: new Date(),
        chatId: activeTabId,
        senderId: 'current-user',
        senderName: 'Sen',
        type: 'chat'
      };

      setChats(prev => prev.map(chat => 
        chat.id === activeTabId 
          ? { ...chat, messages: [...chat.messages, userMessage] }
          : chat
      ));

      // Simulate response only for general chat
      if (activeTabId === 'general') {
        setIsTyping(true);
        
        setTimeout(() => {
          const responses = [
            'Harika bir mesaj!',
            'Katılıyorum bu görüşe.',
            'Bu konuda daha fazla konuşalım.',
            'Çok ilginç bir bakış açısı.',
            'Teşekkürler bu bilgi için!'
          ];
          
          const randomUser = users[Math.floor(Math.random() * users.length)];
          const aiResponse: Message = {
            id: (Date.now() + 1).toString(),
            text: responses[Math.floor(Math.random() * responses.length)],
            isUser: false,
            timestamp: new Date(),
            chatId: activeTabId,
            senderId: randomUser.id,
            senderName: randomUser.name,
            type: 'chat'
          };
          
          setChats(prev => prev.map(chat => 
            chat.id === activeTabId 
              ? { ...chat, messages: [...chat.messages, aiResponse] }
              : chat
          ));
          setIsTyping(false);
        }, 1500);
      }
    }
  };

  const handleFileSelect = async (file: File) => {
    if (!activeChat) return;

    console.log('📁 DOSYA GÖNDERİLİYOR:', {
      fileName: file.name,
      activeTabId,
      chatType: activeChat.type,
      isConnected
    });

    if (isConnected) {
      if (activeTabId === 'general') {
        // Genel sohbete dosya gönder
        console.log('📢 Genel dosya gönderiliyor');
        await sendWebRTCFile(file);
      } else if (activeChat.type === 'private') {
        // Özel sohbete dosya gönder
        const targetUserId = activeChat.participants[0];
        console.log('📂 Özel dosya gönderiliyor:', { targetUserId, chatId: activeTabId });
        await sendWebRTCFile(file, targetUserId, activeTabId);
      }
    } else {
      console.warn('❌ WebRTC bağlantısı yok, dosya gönderilemedi');
    }
  };

  const getChatHeaderTitle = () => {
    if (!activeChat) return 'Chat';
    
    if (activeChat.type === 'group') {
      const participantNames = activeChat.participants
        .map(id => users.find(u => u.id === id)?.name)
        .filter(Boolean)
        .join(', ');
      return `${activeChat.name} • ${participantNames}`;
    }
    
    return activeChat.name;
  };



  // Show connection settings if not connected
  if (showConnectionSettings) {
    return (
      <div className="flex h-screen w-full items-center justify-center p-6">
        <ConnectionSettings
          isConnected={isConnected}
          isConnecting={isConnecting}
          connectedUsers={connectedUsers}
          onConnect={connect}
          onDisconnect={disconnect}
          onClose={() => setShowConnectionSettings(false)}
          error={error}
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full">
      {/* Left Sidebar */}
      <UserSidebar
        users={isConnected ? connectedUsers.map(u => ({
          id: u.id,
          name: u.name,
          avatar: '',
          status: u.isOnline ? 'online' : 'offline',
          unreadCount: userUnreadCounts[u.id] > 0 ? userUnreadCounts[u.id] : undefined
        } as User)) : users.map(u => ({
          ...u,
          unreadCount: userUnreadCounts[u.id] > 0 ? userUnreadCounts[u.id] : undefined
        }))}
        selectedUsers={selectedUsers}
        onUserSelect={setActiveTabId}
        onUserToggle={handleUserToggle}
        onCreateGroup={handleCreateGroup}
        onStartPrivateChat={handleStartPrivateChat}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Tabs */}
        <ChatTabs
          tabs={tabs}
          activeTabId={activeTabId}
          onTabChange={setActiveTabId}
          onTabClose={handleTabClose}
        />

        {/* Chat Header */}
        <div className="glass-panel p-4 border-b border-glass-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-semibold text-foreground">{getChatHeaderTitle()}</h1>
                <p className="text-sm text-muted-foreground">
                  {activeChat?.type === 'general' ? 'Herkese açık sohbet' :
                   activeChat?.type === 'private' ? 'Özel konuşma' :
                   `${activeChat?.participants.length} kişi`}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {isConnected && (userProfile.displayName || userName) && (
                <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-md">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-white"
                    style={{ backgroundColor: userProfile.profileColor }}
                  >
                    {(userProfile.displayName || userName).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-primary">
                      {userProfile.displayName || userName}
                    </span>
                    {userProfile.statusMessage && (
                      <span className="text-xs text-muted-foreground">
                        {userProfile.statusMessage}
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              {isConnected && (
                <div className="flex items-center gap-1 px-2 py-1 bg-green-500/10 border border-green-500/20 rounded-md">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-xs text-green-500 font-medium">
                    {connectedUsers.filter(u => u.isOnline).length} çevrimiçi
                  </span>
                </div>
              )}
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setShowConnectionSettings(true)}
              >
                {isConnected ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
              </Button>
              
              <ThemeToggle />
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setShowSettings(true)}
              >
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{
          background: 'linear-gradient(135deg, transparent, hsla(240, 30%, 15%, 0.1))'
        }}>
          {sortedMessages.map((message) => (
            message.type === 'file' ? (
              <FileMessage
                key={message.id}
                fileMessage={{
                  id: message.id,
                  type: message.type,
                  fileName: message.fileName || '',
                  fileSize: message.fileSize || 0,
                  fileType: message.fileType || '',
                  senderId: message.senderId || '',
                  senderName: message.senderName || '',
                  timestamp: message.timestamp,
                  chatId: message.chatId,
                  downloadUrl: message.downloadUrl
                }}
                isUser={message.isUser}
              />
            ) : (
              <ChatMessage
                key={message.id}
                message={message.text}
                isUser={message.isUser}
                timestamp={message.timestamp}
                senderName={message.senderName}
              />
            )
          ))}
          
          <TypingIndicator isVisible={isTyping} />
          
          {/* Other users typing indicators */}
          {(() => {
            console.log('🔍 TYPING UI DEBUG:', {
              activeTabId,
              typingUsers,
              filteredUsers: Object.entries(typingUsers).filter(([, user]) => user.chatId === activeTabId)
            });
            return Object.entries(typingUsers).filter(([, user]) => user.chatId === activeTabId);
          })().map(([userId, user]) => (
            <div key={userId} className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground">
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center text-xs font-semibold text-white">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span>{user.name} yazıyor...</span>
              <div className="flex gap-1">
                <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          ))}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <ChatInput 
          onSendMessage={handleSendMessage} 
          onFileSelect={handleFileSelect}
          disabled={isTyping}
          onTyping={handleTyping}
        />
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        currentProfile={userProfile}
        onProfileUpdate={handleProfileUpdate}
      />
    </div>
  );
};

export default ChatInterface;