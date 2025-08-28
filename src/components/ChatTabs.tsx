import { useState } from 'react';
import { X, Hash, MessageCircle, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type ChatType = 'general' | 'private' | 'group';

export interface ChatTab {
  id: string;
  name: string;
  type: ChatType;
  participants?: string[];
  unreadCount?: number;
  isActive?: boolean;
}

interface ChatTabsProps {
  tabs: ChatTab[];
  activeTabId: string;
  onTabChange: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
}

const ChatTabs = ({ tabs, activeTabId, onTabChange, onTabClose }: ChatTabsProps) => {
  const getTabIcon = (type: ChatType) => {
    switch (type) {
      case 'general': return <Hash className="w-4 h-4" />;
      case 'private': return <MessageCircle className="w-4 h-4" />;
      case 'group': return <Users className="w-4 h-4" />;
    }
  };

  const getTabColor = (type: ChatType) => {
    switch (type) {
      case 'general': return 'text-accent';
      case 'private': return 'text-primary';
      case 'group': return 'text-secondary-foreground';
    }
  };

  return (
    <div className="flex items-center gap-1 overflow-x-auto p-2 border-b border-glass-border bg-glass/30">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer group transition-all duration-200 min-w-0 ${
            activeTabId === tab.id
              ? 'bg-primary/20 text-primary'
              : 'hover:bg-glass-hover/50 text-muted-foreground hover:text-foreground'
          }`}
        >
          <button
            onClick={() => onTabChange(tab.id)}
            className="flex items-center gap-2 min-w-0 flex-1"
          >
            <span className={activeTabId === tab.id ? 'text-primary' : getTabColor(tab.type)}>
              {getTabIcon(tab.type)}
            </span>
            <span className="font-medium truncate text-sm">{tab.name}</span>
            

          </button>

          {/* Close button (only for non-general tabs) */}
          {tab.type !== 'general' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(tab.id);
              }}
              className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
};

export default ChatTabs;