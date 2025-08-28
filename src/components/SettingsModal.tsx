import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Palette, Bell, Settings as SettingsIcon } from 'lucide-react';

interface UserProfile {
  displayName: string;
  statusMessage: string;
  profileColor: string;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: UserProfile;
  onProfileUpdate: (profile: UserProfile) => void;
}

const profileColors = [
  { name: 'Mavi', value: '#3b82f6', gradient: 'from-blue-500 to-blue-600' },
  { name: 'Mor', value: '#8b5cf6', gradient: 'from-purple-500 to-purple-600' },
  { name: 'Yeşil', value: '#10b981', gradient: 'from-green-500 to-green-600' },
  { name: 'Kırmızı', value: '#ef4444', gradient: 'from-red-500 to-red-600' },
  { name: 'Sarı', value: '#f59e0b', gradient: 'from-yellow-500 to-yellow-600' },
  { name: 'Pembe', value: '#ec4899', gradient: 'from-pink-500 to-pink-600' },
  { name: 'Turuncu', value: '#f97316', gradient: 'from-orange-500 to-orange-600' },
  { name: 'Cyan', value: '#06b6d4', gradient: 'from-cyan-500 to-cyan-600' },
];

const statusOptions = [
  { label: 'Çevrimiçi', value: 'online', color: 'bg-green-500' },
  { label: 'Uzakta', value: 'away', color: 'bg-yellow-500' },
  { label: 'Meşgul', value: 'busy', color: 'bg-red-500' },
  { label: 'Görünmez', value: 'invisible', color: 'bg-gray-500' },
];

const SettingsModal = ({ isOpen, onClose, currentProfile, onProfileUpdate }: SettingsModalProps) => {
  const [profile, setProfile] = useState<UserProfile>(currentProfile);

  const handleSave = () => {
    onProfileUpdate(profile);
    onClose();
  };

  const handleCancel = () => {
    setProfile(currentProfile); // Reset to original
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" />
            Ayarlar
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Profil
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Görünüm
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Bildirimler
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Profil Bilgileri</h3>
              
              {/* Profile Preview */}
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                <div 
                  className={`w-12 h-12 rounded-full bg-gradient-to-r ${
                    profileColors.find(c => c.value === profile.profileColor)?.gradient || 'from-primary to-accent'
                  } flex items-center justify-center text-white font-semibold text-lg`}
                >
                  {profile.displayName.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="font-medium">{profile.displayName || 'İsimsiz Kullanıcı'}</p>
                  <p className="text-sm text-muted-foreground">{profile.statusMessage || 'Durum mesajı yok'}</p>
                </div>
              </div>

              {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor="displayName">Görünen Ad</Label>
                <Input
                  id="displayName"
                  value={profile.displayName}
                  onChange={(e) => setProfile(prev => ({ ...prev, displayName: e.target.value }))}
                  placeholder="Adınızı girin..."
                  maxLength={50}
                />
              </div>

              {/* Status Message */}
              <div className="space-y-2">
                <Label htmlFor="statusMessage">Durum Mesajı</Label>
                <Input
                  id="statusMessage"
                  value={profile.statusMessage}
                  onChange={(e) => setProfile(prev => ({ ...prev, statusMessage: e.target.value }))}
                  placeholder="Durum mesajınızı girin..."
                  maxLength={100}
                />
              </div>

              {/* Profile Color */}
              <div className="space-y-3">
                <Label>Profil Rengi</Label>
                <div className="grid grid-cols-4 gap-2">
                  {profileColors.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setProfile(prev => ({ ...prev, profileColor: color.value }))}
                      className={`relative p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                        profile.profileColor === color.value 
                          ? 'border-primary ring-2 ring-primary/20' 
                          : 'border-muted'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${color.gradient} mx-auto`} />
                      <p className="text-xs mt-1 font-medium">{color.name}</p>
                      {profile.profileColor === color.value && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Görünüm Ayarları</h3>
              <p className="text-muted-foreground">Tema ayarları zaten mevcut. Gelecekte daha fazla görünüm seçeneği eklenecek.</p>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Bildirim Ayarları</h3>
              <p className="text-muted-foreground">Bildirim ayarları gelecek güncellemede eklenecek.</p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 pt-4">
          <Button onClick={handleSave} className="flex-1">
            Kaydet
          </Button>
          <Button onClick={handleCancel} variant="outline" className="flex-1">
            İptal
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;
