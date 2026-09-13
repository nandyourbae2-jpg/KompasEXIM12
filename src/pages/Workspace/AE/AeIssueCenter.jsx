import React, { useState, useEffect } from 'react';
import api from '../../../lib/api';
import { AlertOctagon, Search, Filter, CheckCircle, AlertTriangle } from 'lucide-react';
import Badge from '../../../components/Badge';

const AeIssueCenter = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const res = await api('/ae/issues');
      if (res.success) {
        setIssues(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = issues.filter(i => 
    (i.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (i.shipment_code || '').toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Resolved': return <Badge variant="success" icon={<CheckCircle size={14}/>}>Resolved</Badge>;
      case 'Open': return <Badge variant="error" icon={<AlertTriangle size={14}/>}>Open</Badge>;
      case 'In Progress': return <Badge variant="warning">In Progress</Badge>;
      default: return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const getPriorityBadge = (prio) => {
    switch (prio) {
      case 'Critical': return <Badge variant="error">Critical</Badge>;
      case 'High': return <Badge variant="warning">High</Badge>;
      case 'Medium': return <Badge variant="neutral">Medium</Badge>;
      case 'Low': return <Badge variant="neutral">Low</Badge>;
      default: return <Badge variant="neutral">{prio}</Badge>;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex justify-between items-end border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Issues & Exceptions</h1>
          <p className="text-sm text-gray-500 mt-1">Track and resolve administrative discrepancies</p>
        </div>
        <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium">
          Log Issue
        </button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search issue title or shipment..." 
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
                <th className="p-4 font-medium">Title</th>
                <th className="p-4 font-medium">Shipment</th>
                <th className="p-4 font-medium">Priority</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Due Date</th>
                <th className="p-4 font-medium">Reported By</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">Loading issues...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-gray-500">
                    <AlertOctagon className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                    <p>No open issues found.</p>
                  </td>
                </tr>
              ) : (
                filtered.map(i => (
                  <tr key={i.id} className="border-b last:border-0 hover:bg-gray-50 cursor-pointer transition-colors">
                    <td className="p-4 font-medium text-gray-900">{i.title}</td>
                    <td className="p-4 text-blue-600">{i.shipment_code || '-'}</td>
                    <td className="p-4">{getPriorityBadge(i.priority)}</td>
                    <td className="p-4">{getStatusBadge(i.status)}</td>
                    <td className="p-4 text-gray-600 text-sm">{i.due_date || '-'}</td>
                    <td className="p-4 text-gray-600 text-sm">{i.reported_name || '-'}</td>
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

export default AeIssueCenter;
