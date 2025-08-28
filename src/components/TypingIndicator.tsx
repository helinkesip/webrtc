interface TypingIndicatorProps {
  isVisible: boolean;
}

const TypingIndicator = ({ isVisible }: TypingIndicatorProps) => {
  if (!isVisible) return null;

  return (
    <div className="flex items-start gap-3 mb-4 animate-scale-in">
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center text-sm font-semibold text-primary-foreground">
          AI
        </div>
      </div>

      {/* Typing indicator */}
      <div className="typing-indicator">
        <div className="typing-dot"></div>
        <div className="typing-dot"></div>
        <div className="typing-dot"></div>
      </div>
    </div>
  );
};

export default TypingIndicator;