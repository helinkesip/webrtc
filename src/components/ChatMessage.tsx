interface ChatMessageProps {
  message: string;
  isUser: boolean;
  timestamp: Date;
  senderName?: string;
  avatar?: string;
}

const ChatMessage = ({ message, isUser, timestamp, senderName }: ChatMessageProps) => {
  return (
    <div className={`flex items-start gap-3 mb-4 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center text-sm font-semibold text-primary-foreground">
          {senderName?.charAt(0).toUpperCase() || (isUser ? 'U' : 'G')}
        </div>
      </div>

      {/* Message bubble */}
      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[75%]`}>
        {/* Sender name for group chats */}
        {!isUser && senderName && (
          <span className="text-xs text-muted-foreground mb-1 px-2">
            {senderName}
          </span>
        )}
        
        <div className={isUser ? 'chat-message-user' : 'chat-message-other'}>
          <p className="text-sm leading-relaxed">{message}</p>
        </div>
        
        {/* Timestamp */}
        <span className="text-xs text-muted-foreground mt-1 px-2">
          {new Date(timestamp).toLocaleTimeString('tr-TR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </span>
      </div>
    </div>
  );
};

export default ChatMessage;