import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Smile, Paperclip, X } from 'lucide-react';
import FileUpload from './FileUpload';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { useTheme } from '@/components/theme-provider';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onFileSelect?: (file: File) => void;
  disabled?: boolean;
  onTyping?: (isTyping: boolean) => void;
}

const ChatInput = ({ onSendMessage, onFileSelect, disabled, onTyping }: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { theme } = useTheme();
  
  // Typing indicator logic
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setMessage(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);
    
    // Typing indicator logic
    if (onTyping && value.length > 0) {
      onTyping(true);
      
      // Clear existing timeout
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      
      // Set new timeout to stop typing indicator after 2 seconds of inactivity
      const newTimeout = setTimeout(() => {
        onTyping(false);
      }, 2000);
      
      setTypingTimeout(newTimeout);
    } else if (onTyping && value.length === 0) {
      onTyping(false);
      if (typingTimeout) {
        clearTimeout(typingTimeout);
        setTypingTimeout(null);
      }
    }
  };

  return (
    <div className="glass-panel p-4 rounded-t-3xl border-t">
      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        {/* Attachment button */}
        <Button
          type="button"
          variant="ghost" 
          size="icon"
          className="text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setShowFileUpload(!showFileUpload)}
        >
          <Paperclip className="w-5 h-5" />
        </Button>

        {/* Message input */}
        <div className="flex-1 relative">
          <textarea
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Mesajınızı yazın..."
            disabled={disabled}
            rows={1}
            className="w-full resize-none rounded-2xl border-0 py-3 px-4 text-sm leading-6 placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50 transition-all duration-200 max-h-32 overflow-y-auto"
            style={{
              background: 'hsl(var(--input-bg))',
              border: '1px solid hsl(var(--input-border))'
            }}
          />
        </div>

        {/* Emoji button */}
        <div className="relative">
          <Button
            type="button"
            variant="ghost"
            size="icon" 
            className="text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            <Smile className="w-5 h-5" />
          </Button>

          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div className="absolute bottom-full right-0 mb-2 z-50">
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                width={350}
                height={400}
                theme={theme === 'dark' ? Theme.DARK : Theme.LIGHT}
                previewConfig={{
                  showPreview: false
                }}
              />
            </div>
          )}
        </div>

        {/* Send button */}
        <Button
          type="submit"
          disabled={!message.trim() || disabled}
          className="rounded-full w-12 h-12 bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 animate-pulse-glow"
        >
          <Send className="w-5 h-5" />
        </Button>
      </form>

      {/* Encryption notice */}
      <div className="mt-2 text-center">
        <p className="text-xs text-muted-foreground/70 flex items-center justify-center gap-1">
          🔒 Mesajlarınız uçtan uca güvenlidir.
        </p>
      </div>

      {/* File upload section */}
      {showFileUpload && onFileSelect && (
        <div className="mt-3 p-3 bg-muted/30 rounded-lg border relative">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-foreground">Dosya Gönder</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFileUpload(false)}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <FileUpload 
            onFileSelect={(file) => {
              onFileSelect(file);
              setShowFileUpload(false);
            }}
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );
};

export default ChatInput;