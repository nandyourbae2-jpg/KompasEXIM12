import React, { useState, useEffect } from 'react';
import api from '../../../lib/api';
import { History, Search } from 'lucide-react';

const AeActivityHistory = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const res = await api('/ae/activities');
      if (res.success) {
        setActivities(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = activities.filter(a => 
    (a.action || '').toLowerCase().includes(search.toLowerCase()) ||
    (a.reference || '').toLowerCase().includes(search.toLowerCase()) ||
    (a.user_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex justify-between items-end border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Activity History</h1>
          <p className="text-sm text-gray-500 mt-1">Audit log of administrative actions</p>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search action, reference, or user..." 
            className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-1 focus:ring-blue-500 outline-none"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b text-sm text-gray-600">
                <th className="p-4 font-medium">Timestamp</th>
                <th className="p-4 font-medium">User</th>
                <th className="p-4 font-medium">Action</th>
                <th className="p-4 font-medium">Entity</th>
                <th className="p-4 font-medium">Reference</th>
                <th className="p-4 font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">Loading activities...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-gray-500">
                    <History className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                    <p>No activity records found.</p>
                  </td>
                </tr>
              ) : (
                filtered.map(a => (
                  <tr key={a.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-gray-600 text-sm whitespace-nowrap">{new Date(a.created_at).toLocaleString()}</td>
                    <td className="p-4 text-gray-900 font-medium">{a.user_name || 'System'}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium uppercase">{a.action}</span>
                    </td>
                    <td className="p-4 text-gray-600 text-sm">{a.entity_type}</td>
                    <td className="p-4 text-blue-600 font-medium text-sm">{a.reference || '-'}</td>
                    <td className="p-4 text-gray-700 text-sm">{a.description}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AeActivityHistory;
