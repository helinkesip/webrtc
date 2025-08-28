import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, File, Image, Video, Music, FileText, Archive } from 'lucide-react';
import { SimpleMessage } from '@/lib/webrtc';

interface FileMessageProps {
  fileMessage: SimpleMessage;
  isUser: boolean;
}

const FileMessage = ({ fileMessage, isUser }: FileMessageProps) => {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="w-5 h-5" />;
    if (fileType.startsWith('video/')) return <Video className="w-5 h-5" />;
    if (fileType.startsWith('audio/')) return <Music className="w-5 h-5" />;
    if (fileType.includes('pdf') || fileType.includes('text/')) return <FileText className="w-5 h-5" />;
    if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('tar')) return <Archive className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  const handleDownload = () => {
    if (fileMessage.downloadUrl) {
      const link = document.createElement('a');
      link.href = fileMessage.downloadUrl;
      link.download = fileMessage.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const isImage = fileMessage.fileType.startsWith('image/');
  const isVideo = fileMessage.fileType.startsWith('video/');

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-xs lg:max-w-md ${isUser ? 'order-2' : 'order-1'}`}>
        <div className={`rounded-lg p-3 ${
          isUser 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-muted text-foreground'
        }`}>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              {getFileIcon(fileMessage.fileType)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-medium truncate">
                  {fileMessage.fileName}
                </p>
                <Badge variant="secondary" className="text-xs">
                  {formatFileSize(fileMessage.fileSize)}
                </Badge>
              </div>
              
              {!isUser && (
                <p className="text-xs opacity-80 mb-2">
                  {fileMessage.senderName}
                </p>
              )}
              
              {isImage && fileMessage.downloadUrl && (
                <div className="mb-2">
                  <img 
                    src={fileMessage.downloadUrl} 
                    alt={fileMessage.fileName}
                    className="rounded max-w-full h-auto max-h-48 object-cover"
                  />
                </div>
              )}
              
              {isVideo && fileMessage.downloadUrl && (
                <div className="mb-2">
                  <video 
                    src={fileMessage.downloadUrl} 
                    controls
                    className="rounded max-w-full h-auto max-h-48"
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              )}
              
              <Button
                variant={isUser ? "secondary" : "default"}
                size="sm"
                onClick={handleDownload}
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                İndir
              </Button>
            </div>
          </div>
        </div>
        
        <div className={`text-xs text-muted-foreground mt-1 ${
          isUser ? 'text-right' : 'text-left'
        }`}>
          {new Date(fileMessage.timestamp).toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>
    </div>
  );
};

export default FileMessage;
