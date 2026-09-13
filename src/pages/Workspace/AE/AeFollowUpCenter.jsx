import React, { useState, useEffect } from 'react';
import api from '../../../lib/api';
import { PhoneCall, Search, Filter, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import Badge from '../../../components/Badge';

const AeFollowUpCenter = () => {
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchFollowUps();
  }, []);

  const fetchFollowUps = async () => {
    try {
      setLoading(true);
      const res = await api('/ae/followups');
      if (res.success) {
        setFollowUps(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = followUps.filter(f => 
    (f.subject || '').toLowerCase().includes(search.toLowerCase()) ||
    (f.external_party || '').toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Resolved': return <Badge variant="success" icon={<CheckCircle size={14}/>}>Resolved</Badge>;
      case 'Open': return <Badge variant="error">Open</Badge>;
      case 'Waiting Response': return <Badge variant="warning" icon={<Clock size={14}/>}>Waiting Response</Badge>;
      default: return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex justify-between items-end border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Follow-Up Center</h1>
          <p className="text-sm text-gray-500 mt-1">Track external administrative communications</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium">
          New Follow-Up
        </button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search subject or party..." 
            className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-1 focus:ring-blue-500 outline-none"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-50 flex items-center gap-2">
          <Filter size={16} /> Filter
        </button>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b text-sm text-gray-600">
                <th className="p-4 font-medium">Subject</th>
                <th className="p-4 font-medium">External Party</th>
                <th className="p-4 font-medium">Shipment</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Due Date</th>
                <th className="p-4 font-medium">Assigned To</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">Loading follow-ups...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-gray-500">
                    <PhoneCall className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                    <p>No follow-up records found.</p>
                  </td>
                </tr>
              ) : (
                filtered.map(f => (
                  <tr key={f.id} className="border-b last:border-0 hover:bg-gray-50 cursor-pointer transition-colors">
                    <td className="p-4 font-medium text-gray-900">{f.subject}</td>
                    <td className="p-4 text-gray-700">{f.external_party || '-'}</td>
                    <td className="p-4 text-blue-600">{f.shipment_code || '-'}</td>
                    <td className="p-4">{getStatusBadge(f.status)}</td>
                    <td className="p-4 text-gray-600 text-sm">{f.due_date || '-'}</td>
                    <td className="p-4 text-gray-600 text-sm">{f.assigned_name || 'Unassigned'}</td>
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

export default AeFollowUpCenter;
