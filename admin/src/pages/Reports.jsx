import { Download, FileText, Users, ArrowRightLeft, Scale, History, DollarSign } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const reports = [
  { id: 'properties', label: 'Property Report', icon: FileText, formats: ['pdf', 'excel'] },
  { id: 'customers', label: 'Customer Report', icon: Users, formats: ['pdf', 'excel'] },
  { id: 'transfers', label: 'Transfer Report', icon: ArrowRightLeft, formats: ['pdf'] },
  { id: 'cases', label: 'Case Report', icon: Scale, formats: ['pdf'] },
  { id: 'ownership', label: 'Ownership Report', icon: History, formats: ['pdf'] },
  { id: 'revenue', label: 'Revenue Report', icon: DollarSign, formats: ['pdf'] },
];

export default function Reports() {
  const downloadReport = async (type, format = 'pdf') => {
    try {
      const response = await api.get(`/reports/${type}?format=${format}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type}-report.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      link.click();
      toast.success('Report downloaded');
    } catch {
      toast.error('Failed to download report');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy mb-2">Reports & Analytics</h1>
      <p className="text-gray-500 mb-8">Generate and export system reports</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => (
          <div key={report.id} className="stat-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-royal/10 flex items-center justify-center">
                <report.icon className="text-royal" size={20} />
              </div>
              <h3 className="font-semibold text-navy">{report.label}</h3>
            </div>
            <div className="flex gap-2">
              {report.formats.map((format) => (
                <button key={format} onClick={() => downloadReport(report.id, format)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50">
                  <Download size={14} /> {format.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
