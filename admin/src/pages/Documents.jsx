import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Upload, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function Documents() {
  const [uploading, setUploading] = useState(false);

  const { data: documents = [], isLoading, refetch } = useQuery({
    queryKey: ['documents'],
    queryFn: () => api.get('/documents').then((r) => r.data.data),
  });

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name);
    formData.append('documentType', file.type.includes('pdf') ? 'legal' : 'image');
    try {
      await api.post('/documents/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Document uploaded');
      refetch();
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy">Document Management</h1>
          <p className="text-gray-500">Upload and manage property documents</p>
        </div>
        <label className="admin-btn flex items-center gap-2 cursor-pointer">
          <Upload size={18} /> {uploading ? 'Uploading...' : 'Upload Document'}
          <input type="file" className="hidden" onChange={handleUpload} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? <p>Loading...</p> : documents.length === 0 ? (
          <div className="col-span-full stat-card text-center py-10 text-gray-400">
            <FileText size={48} className="mx-auto mb-4 opacity-30" />
            No documents uploaded yet
          </div>
        ) : documents.map((d) => (
          <div key={d._id} className="stat-card">
            <div className="flex items-start gap-3">
              <FileText className="text-royal mt-1" size={20} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-navy truncate">{d.title}</p>
                <p className="text-xs text-gray-400 capitalize">{d.documentType?.replace('_', ' ')}</p>
                <p className="text-xs text-gray-400">{new Date(d.createdAt).toLocaleDateString()}</p>
                <a href={d.fileUrl} target="_blank" rel="noreferrer" className="text-sm text-royal hover:underline mt-2 inline-block">View</a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
