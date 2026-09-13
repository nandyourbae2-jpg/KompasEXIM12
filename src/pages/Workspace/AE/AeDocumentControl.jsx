import React, { useState, useEffect } from 'react';
import api from '../../../lib/api';
import { FileText, Search, Filter, AlertTriangle, CheckCircle } from 'lucide-react';
import Badge from '../../../components/Badge';

const AeDocumentControl = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await api('/ae/documents');
      if (res.success) {
        setDocuments(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = documents.filter(d => 
    (d.shipment_code || '').toLowerCase().includes(search.toLowerCase()) ||
    (d.document_type || '').toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Verified': return <Badge variant="success" icon={<CheckCircle size={14}/>}>Verified</Badge>;
      case 'Required': return <Badge variant="neutral">Required</Badge>;
      case 'Missing': return <Badge variant="error" icon={<AlertTriangle size={14}/>}>Missing</Badge>;
      case 'Under Review': return <Badge variant="warning">Under Review</Badge>;
      default: return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex justify-between items-end border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Document Control</h1>
          <p className="text-sm text-gray-500 mt-1">Export document completeness monitoring</p>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search shipment or document type..." 
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
                <th className="p-4 font-medium">Shipment</th>
                <th className="p-4 font-medium">Document Type</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Due Date</th>
                <th className="p-4 font-medium">Verified By</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">Loading documents...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-gray-500">
                    <FileText className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                    <p>No document records found.</p>
                  </td>
                </tr>
              ) : (
                filtered.map(d => (
                  <tr key={d.id} className="border-b last:border-0 hover:bg-gray-50 cursor-pointer transition-colors">
                    <td className="p-4 font-medium text-blue-600">{d.shipment_code || 'Unlinked'}</td>
                    <td className="p-4 text-gray-900 font-medium">{d.document_type}</td>
                    <td className="p-4">{getStatusBadge(d.status)}</td>
                    <td className="p-4 text-gray-600">{d.due_date || '-'}</td>
                    <td className="p-4 text-gray-600 text-sm">{d.verified_by_name || '-'}</td>
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

export default AeDocumentControl;
