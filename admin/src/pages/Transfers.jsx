import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export default function Transfers() {
  const { data: transfers = [], isLoading } = useQuery({
    queryKey: ['transfers'],
    queryFn: () => api.get('/transfers').then((r) => r.data.data),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy mb-2">Property Transfers</h1>
      <p className="text-gray-500 mb-6">Ownership transfer history and records</p>

      <div className="stat-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="pb-3 pr-4">Transfer #</th>
              <th className="pb-3 pr-4">Property</th>
              <th className="pb-3 pr-4">Previous Owner</th>
              <th className="pb-3 pr-4">New Owner</th>
              <th className="pb-3 pr-4">Date</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="py-10 text-center">Loading...</td></tr>
            ) : transfers.length === 0 ? (
              <tr><td colSpan={5} className="py-10 text-center text-gray-400">No transfers recorded</td></tr>
            ) : transfers.map((t) => (
              <tr key={t._id} className="border-b border-gray-50">
                <td className="py-3 pr-4 font-mono text-xs">{t.transferNumber}</td>
                <td className="py-3 pr-4">{t.property?.propertyNumber} - {t.property?.blockName}</td>
                <td className="py-3 pr-4">{t.previousOwnerName}</td>
                <td className="py-3 pr-4">{t.newOwnerName}</td>
                <td className="py-3 pr-4">{new Date(t.transferDate).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
