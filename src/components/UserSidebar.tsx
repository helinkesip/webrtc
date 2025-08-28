import { useState } from 'react';
import { Users, MessageCircle, Plus, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface User {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'away' | 'offline';
  lastSeen?: Date;
  unreadCount?: number;
}

interface UserSidebarProps {
  users: User[];
  selectedUsers: string[];
  onUserSelect: (userId: string) => void;
  onUserToggle: (userId: string) => void;
  onCreateGroup: (userIds: string[], groupName: string) => void;
  onStartPrivateChat: (userId: string) => void;
}

const UserSidebar = ({ 
  users, 
  selectedUsers, 
  onUserSelect, 
  onUserToggle, 
  onCreateGroup,
  onStartPrivateChat 
}: UserSidebarProps) => {
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const handleCreateGroup = () => {
    if (selectedUsers.length >= 2 && groupName.trim()) {
      onCreateGroup(selectedUsers, groupName.trim());
      setGroupName('');
      setShowGroupForm(false);
      setIsMultiSelectMode(false);
    }
  };

  const handleUserClick = (userId: string) => {
    if (isMultiSelectMode) {
      onUserToggle(userId);
    } else {
      onStartPrivateChat(userId);
    }
  };

  return (
    <div className="w-80 glass-panel border-r h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-glass-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Users className="w-5 h-5" />
            Aktif Kullanıcılar ({users.filter(u => u.status === 'online').length})
          </h2>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMultiSelectMode(!isMultiSelectMode)}
            className={`${isMultiSelectMode ? 'bg-primary/20 text-primary' : 'text-muted-foreground'} hover:text-foreground`}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Multi-select actions */}
        {isMultiSelectMode && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Grup oluşturmak için kullanıcıları seçin ({selectedUsers.length} seçili)
            </p>
            {selectedUsers.length >= 2 && (
              <Button
                onClick={() => setShowGroupForm(true)}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Grup Oluştur
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Users list */}
      <div className="flex-1 overflow-y-auto">
        {/* Active Users Section */}
        {users.filter(user => user.status === 'online').length > 0 && (
          <>
            <div className="px-3 py-2 bg-green-500/10 border-b border-green-500/20">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-600">
                  Çevrimiçi ({users.filter(user => user.status === 'online').length})
                </span>
              </div>
            </div>
            {users.filter(user => user.status === 'online').map((user) => (
              <div
                key={user.id}
                onClick={() => handleUserClick(user.id)}
                className={`p-3 border-b border-glass-border/50 cursor-pointer hover:bg-glass-hover/30 transition-colors group ${
                  selectedUsers.includes(user.id) ? 'bg-primary/10' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Multi-select checkbox */}
                  {isMultiSelectMode && (
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      selectedUsers.includes(user.id) 
                        ? 'bg-primary border-primary text-primary-foreground' 
                        : 'border-muted-foreground'
                    }`}>
                      {selectedUsers.includes(user.id) && <Check className="w-3 h-3" />}
                    </div>
                  )}

                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center text-sm font-semibold text-primary-foreground">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${getStatusColor(user.status)}`} />
                  </div>

                  {/* User info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground truncate">{user.name}</p>
                      {/* Unread count badge */}
                      {user.unreadCount && user.unreadCount > 0 && (
                        <span className="bg-destructive text-destructive-foreground text-xs rounded-full px-2 py-1 min-w-[20px] h-5 flex items-center justify-center">
                          {user.unreadCount > 99 ? '99+' : user.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-green-600 font-medium">
                      Çevrimiçi
                    </p>
                  </div>

                  {/* Private chat indicator */}
                  {!isMultiSelectMode && (
                    <MessageCircle className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                  
                  {/* Click hint */}
                  {!isMultiSelectMode && (
                    <div className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                      Sohbet
                    </div>
                  )}
                </div>
              </div>
            ))}
          </>
        )}

        {/* Offline Users Section */}
        {users.filter(user => user.status !== 'online').length > 0 && (
          <>
            <div className="px-3 py-2 bg-gray-500/10 border-b border-gray-500/20">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-600">
                  Çevrimdışı ({users.filter(user => user.status !== 'online').length})
                </span>
              </div>
            </div>
            {users.filter(user => user.status !== 'online').map((user) => (
              <div
                key={user.id}
                onClick={() => handleUserClick(user.id)}
                className={`p-3 border-b border-glass-border/50 cursor-pointer hover:bg-glass-hover/30 transition-colors group ${
                  selectedUsers.includes(user.id) ? 'bg-primary/10' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Multi-select checkbox */}
                  {isMultiSelectMode && (
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      selectedUsers.includes(user.id) 
                        ? 'bg-primary border-primary text-primary-foreground' 
                        : 'border-muted-foreground'
                    }`}>
                      {selectedUsers.includes(user.id) && <Check className="w-3 h-3" />}
                    </div>
                  )}

                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-gray-400 to-gray-600 flex items-center justify-center text-sm font-semibold text-white opacity-70">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${getStatusColor(user.status)}`} />
                  </div>

                  {/* User info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-muted-foreground truncate">{user.name}</p>
                      {/* Unread count badge */}
                      {user.unreadCount && user.unreadCount > 0 && (
                        <span className="bg-destructive text-destructive-foreground text-xs rounded-full px-2 py-1 min-w-[20px] h-5 flex items-center justify-center">
                          {user.unreadCount > 99 ? '99+' : user.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {user.status === 'away' ? 'Uzakta' : 'Çevrimdışı'}
                    </p>
                  </div>

                  {/* Private chat indicator */}
                  {!isMultiSelectMode && (
                    <MessageCircle className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                  
                  {/* Click hint */}
                  {!isMultiSelectMode && (
                    <div className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                      Sohbet
                    </div>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Group creation form */}
      {showGroupForm && (
        <div className="p-4 border-t border-glass-border bg-glass/50">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-foreground">Grup Adı</label>
              <Input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Grup adı girin..."
                className="mt-1"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={handleCreateGroup}
                disabled={!groupName.trim() || selectedUsers.length < 2}
                className="flex-1"
                size="sm"
              >
                <Check className="w-4 h-4 mr-2" />
                Oluştur
              </Button>
              <Button
                onClick={() => {
                  setShowGroupForm(false);
                  setGroupName('');
                }}
                variant="outline"
                size="sm"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSidebar;