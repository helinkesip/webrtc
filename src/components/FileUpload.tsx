import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Paperclip, X, Upload, File, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

const FileUpload = ({ onFileSelect, disabled = false }: FileUploadProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      alert('Dosya boyutu 50MB\'dan küçük olmalıdır.');
      return;
    }
    setSelectedFile(file);
    onFileSelect(file);
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    
    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.startsWith('video/')) return '🎥';
    if (fileType.startsWith('audio/')) return '🎵';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    if (fileType.includes('zip') || fileType.includes('rar')) return '📦';
    return '📎';
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />
      
      {!selectedFile ? (
        <div
          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-primary bg-primary/10'
              : 'border-muted-foreground/25 hover:border-primary/50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Dosya yüklemek için tıklayın veya sürükleyin
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Maksimum dosya boyutu: 50MB
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
          <div className="text-2xl">{getFileIcon(selectedFile.type)}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{selectedFile.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(selectedFile.size)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemoveFile}
            disabled={disabled}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
