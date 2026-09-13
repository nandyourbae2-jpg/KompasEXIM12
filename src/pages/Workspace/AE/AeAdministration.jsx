import React, { useState, useEffect } from 'react';
import api from '../../../lib/api';
import { Package, Search, Filter, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import Badge from '../../../components/Badge';

const AeShipmentMonitoring = () => {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    try {
      setLoading(true);
      const res = await api('/ae/shipments');
      if (res.success) {
        setShipments(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = shipments.filter(s => 
    (s.shipment_code || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.customer || '').toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status) => {
    switch (status) {
      case 'READY': return <Badge variant="success" icon={<CheckCircle size={14}/>}>Ready</Badge>;
      case 'ATTENTION': return <Badge variant="warning" icon={<Clock size={14}/>}>Attention</Badge>;
      case 'BLOCKED': return <Badge variant="error" icon={<AlertCircle size={14}/>}>Blocked</Badge>;
      default: return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex justify-between items-end border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Export Shipment Monitoring</h1>
          <p className="text-sm text-gray-500 mt-1">Administrative tracker for export logistics</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium">
          Register Shipment
        </button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search shipment code or customer..." 
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
                <th className="p-4 font-medium">Shipment Code</th>
                <th className="p-4 font-medium">Customer</th>
                <th className="p-4 font-medium">Destination</th>
                <th className="p-4 font-medium">ETD / ETA</th>
                <th className="p-4 font-medium">Admin Status</th>
                <th className="p-4 font-medium">Assigned To</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">Loading shipments...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-gray-500">
                    <Package className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                    <p>No export shipments found.</p>
                  </td>
                </tr>
              ) : (
                filtered.map(s => (
                  <tr key={s.id} className="border-b last:border-0 hover:bg-gray-50 cursor-pointer transition-colors">
                    <td className="p-4 font-medium text-blue-600">{s.shipment_code}</td>
                    <td className="p-4 text-gray-700">{s.customer || '-'}</td>
                    <td className="p-4 text-gray-600">{s.destination || '-'}</td>
                    <td className="p-4 text-sm">
                      <div className="text-gray-900">{s.etd || '-'}</div>
                      <div className="text-gray-500">{s.eta || '-'}</div>
                    </td>
                    <td className="p-4">{getStatusBadge(s.administrative_status)}</td>
                    <td className="p-4 text-gray-600 text-sm">{s.assignee_name || 'Unassigned'}</td>
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

export default AeShipmentMonitoring;
