import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Users, Settings, X } from 'lucide-react';

interface ConnectionSettingsProps {
  isConnected: boolean;
  isConnecting: boolean;
  connectedUsers: Array<{ id: string; name: string; isOnline: boolean }>;
  onConnect: (serverUrl: string, userName: string) => void;
  onDisconnect: () => void;
  onClose: () => void;
  error: string | null;
}

const ConnectionSettings = ({
  isConnected,
  isConnecting,
  connectedUsers,
  onConnect,
  onDisconnect,
  onClose,
  error
}: ConnectionSettingsProps) => {
  const [userName, setUserName] = useState('');

  const handleConnect = () => {
    if (!userName.trim()) return;
    // Auto-detect server URL based on current location
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const port = import.meta.env.PROD ? window.location.port || '80' : '3001';
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const serverUrl = isLocalhost ? 'ws://localhost:3001' : `${protocol}//${window.location.hostname}:${port}`;
    onConnect(serverUrl, userName.trim());
  };

  const onlineUsers = connectedUsers.filter(user => user.isOnline);

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle>
          Hoşgeldiniz
        </CardTitle>
        <CardDescription>
          İsminizi giriniz
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected ? (
          <>
            <div className="space-y-2">
              <Input
                id="user-name"
                type="text"
                placeholder="Adınızı girin"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                disabled={isConnecting}
                className="text-center"
              />
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <Button
              onClick={handleConnect}
              disabled={isConnecting || !userName.trim()}
              className="w-full"
            >
              {isConnecting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Giriş yapılıyor...
                </>
              ) : (
                "Giriş Yap"
              )}
            </Button>
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium">Bağlı</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {onlineUsers.length} kullanıcı
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={onClose}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {onlineUsers.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm">Çevrimiçi Kullanıcılar</Label>
                <div className="space-y-1">
                  {onlineUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-2 p-2 bg-muted/50 rounded-md"
                    >
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-sm">{user.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={onDisconnect}
              variant="outline"
              className="w-full"
            >
              <WifiOff className="w-4 h-4 mr-2" />
              Bağlantıyı Kes
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ConnectionSettings;
