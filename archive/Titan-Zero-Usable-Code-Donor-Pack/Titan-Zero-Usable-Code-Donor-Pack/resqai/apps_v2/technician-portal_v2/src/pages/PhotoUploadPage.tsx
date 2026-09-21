import { useState, useRef, type FC } from 'react';
import { Card, Button, Skeleton, ErrorState } from '@resqai/foundation';
import { useJobDetail } from '../hooks/useJobDetail';
import { technicianService } from '../services/technician-service';
import { useAppContext } from '../state/AppContext';

interface PhotoUploadPageProps { jobId: string; }

export const PhotoUploadPage: FC<PhotoUploadPageProps> = ({ jobId }) => {
  const { detail, loading, error, refetch } = useJobDetail(jobId);
  const { addNotification, networkStatus } = useAppContext();
  const [caption, setCaption] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(selectedFile);
      });
      await technicianService.uploadEvidence(jobId, {
        type: 'photo',
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        mimeType: selectedFile.type,
        data: base64,
        caption: caption || undefined,
      });
      addNotification({ type: 'success', title: 'Photo uploaded', message: 'Photo evidence has been saved.' });
      setSelectedFile(null);
      setPreview(null);
      setCaption('');
      if (fileRef.current) fileRef.current.value = '';
      refetch();
    } catch {
      addNotification({ type: 'error', title: 'Upload failed', message: 'Could not upload photo.' });
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div style={{ padding: 24 }}><Skeleton variant="rectangular" height={300} /></div>;
  if (error) return <div style={{ padding: 24 }}><ErrorState title="Failed to load" message={error} onRetry={refetch} /></div>;

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
      <Button size="sm" variant="ghost" onClick={() => { window.location.hash = `#/jobs/${jobId}`; }} style={{ marginBottom: 12 }}>
        &larr; Back to Job
      </Button>
      <h1 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 700, color: '#e6ecf5' }}>Upload Photos</h1>

      <Card variant="bordered" style={{ marginBottom: 16 }}>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          aria-label="Select photo file"
        />
        <div style={{ textAlign: 'center', padding: 24 }}>
          {preview ? (
            <img src={preview} alt="Preview" style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 8, marginBottom: 12 }} />
          ) : (
            <div style={{
              border: '2px dashed #243049', borderRadius: 8, padding: 40, marginBottom: 12,
              color: '#5a6a85', cursor: 'pointer',
            }} onClick={() => fileRef.current?.click()}>
              <p style={{ margin: 0, fontSize: 14 }}>Tap to take a photo or select from gallery</p>
            </div>
          )}
          <Button size="sm" variant="ghost" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {preview ? 'Change Photo' : 'Select Photo'}
          </Button>
        </div>

        {preview && (
          <div style={{ padding: '0 16px 16px' }}>
            <input
              type="text"
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="Add a caption (optional)..."
              style={{
                width: '100%', padding: '8px 12px', background: '#131c2f', color: '#e6ecf5',
                border: '1px solid #243049', borderRadius: 6, fontSize: 13, marginBottom: 8,
                boxSizing: 'border-box', fontFamily: 'inherit',
              }}
              aria-label="Photo caption"
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <Button onClick={handleUpload} disabled={uploading} loading={uploading}>Upload Photo</Button>
              {networkStatus === 'offline' && (
                <span style={{ fontSize: 11, color: '#f0c040', alignSelf: 'center' }}>Will sync when online</span>
              )}
            </div>
          </div>
        )}
      </Card>

      <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5', margin: '0 0 12px' }}>Uploaded Photos</h3>
      {detail?.evidence.filter(e => e.type === 'photo').map(ev => (
        <Card key={ev.id} variant="bordered" style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {ev.thumbnailUrl && (
              <img src={ev.thumbnailUrl} alt={ev.caption || 'Photo'} style={{ width: 64, height: 64, borderRadius: 6, objectFit: 'cover' }} />
            )}
            <div>
              <p style={{ margin: 0, fontSize: 13, color: '#e6ecf5' }}>{ev.caption || ev.fileName}</p>
              <span style={{ fontSize: 11, color: '#5a6a85' }}>{new Date(ev.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </Card>
      ))}
      {detail?.evidence.filter(e => e.type === 'photo').length === 0 && (
        <p style={{ fontSize: 13, color: '#5a6a85', fontStyle: 'italic' }}>No photos uploaded yet.</p>
      )}
    </div>
  );
};
