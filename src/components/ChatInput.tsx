import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Smile, Paperclip } from 'lucide-react';
import FileUpload from './FileUpload';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { useTheme } from '@/components/theme-provider';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onFileSelect?: (file: File) => void;
  disabled?: boolean;
}

const ChatInput = ({ onSendMessage, onFileSelect, disabled }: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { theme } = useTheme();

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
            onChange={(e) => setMessage(e.target.value)}
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

      {/* File upload section */}
      {showFileUpload && onFileSelect && (
        <div className="mt-3 p-3 bg-muted/30 rounded-lg border">
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