import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../lib/api';
import useAuthStore from '../../../store/useAuthStore';
import { Package, Clock, AlertTriangle, FileText, Activity, AlertCircle, ArrowRight } from 'lucide-react';

const AeDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api('/ae/dashboard');
      if (res.success) {
        setData(res.data);
      } else {
        setError(res.error || 'Failed to load dashboard data');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="grid grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-32 bg-gray-100 rounded-lg"></div>)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full text-gray-500">
        <AlertCircle size={48} className="text-red-400 mb-4" />
        <h2 className="text-xl font-medium mb-2">Unable to load data</h2>
        <p className="mb-4">{error}</p>
        <button onClick={fetchDashboard} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Retry</button>
      </div>
    );
  }

  const { summary } = data || {};

  return (
    <div className="p-8 pb-20 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-end border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-3xl font-light tracking-tight text-gray-900">Administrasi Export</h1>
          <p className="text-sm text-gray-500 mt-1">Staff Workspace • Welcome back, {user?.nama}</p>
        </div>
        <button onClick={fetchDashboard} className="text-sm text-blue-600 hover:text-blue-800">
          Refresh
        </button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard title="Active Tasks" value={summary?.active_tasks} icon={<Activity />} color="blue" onClick={() => navigate('/workspace/tasks')} />
        <KpiCard title="Due Today" value={summary?.due_today} icon={<Clock />} color="yellow" onClick={() => navigate('/workspace/tasks')} />
        <KpiCard title="Overdue" value={summary?.overdue} icon={<AlertTriangle />} color="red" onClick={() => navigate('/workspace/tasks')} />
        <KpiCard title="Pending Docs" value={summary?.pending_documents} icon={<FileText />} color="indigo" onClick={() => navigate('/workspace/ae/documents')} />
        <KpiCard title="Follow-Ups" value={summary?.followups} icon={<Package />} color="purple" onClick={() => navigate('/workspace/ae/follow-ups')} />
        <KpiCard title="Open Issues" value={summary?.open_issues} icon={<AlertCircle />} color="orange" onClick={() => navigate('/workspace/ae/issues')} />
      </div>

      {/* Action Center */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h2 className="text-lg font-medium text-gray-900">Today's Action Center</h2>
        </div>
        <div className="p-6">
          {(!summary?.overdue && !summary?.due_today && !summary?.pending_documents && !summary?.followups) ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <p>No immediate actions required today.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Task Actions */}
              {(summary?.overdue > 0 || summary?.due_today > 0) && (
                <div className="border border-red-100 bg-red-50/30 rounded-lg p-4">
                  <h3 className="font-medium text-red-800 mb-2 flex items-center gap-2">
                    <AlertTriangle size={16} /> Task Attention Required
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">You have {summary?.overdue} overdue and {summary?.due_today} due today tasks.</p>
                  <button onClick={() => navigate('/workspace/tasks')} className="text-sm text-red-700 font-medium flex items-center gap-1 hover:underline">
                    View Tasks <ArrowRight size={14} />
                  </button>
                </div>
              )}

              {/* Doc Actions */}
              {summary?.pending_documents > 0 && (
                <div className="border border-indigo-100 bg-indigo-50/30 rounded-lg p-4">
                  <h3 className="font-medium text-indigo-800 mb-2 flex items-center gap-2">
                    <FileText size={16} /> Document Attention
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">{summary?.pending_documents} documents pending your review/verification.</p>
                  <button onClick={() => navigate('/workspace/ae/documents')} className="text-sm text-indigo-700 font-medium flex items-center gap-1 hover:underline">
                    Review Documents <ArrowRight size={14} />
                  </button>
                </div>
              )}

              {/* Followups */}
              {summary?.followups > 0 && (
                <div className="border border-purple-100 bg-purple-50/30 rounded-lg p-4">
                  <h3 className="font-medium text-purple-800 mb-2 flex items-center gap-2">
                    <Activity size={16} /> Active Follow-Ups
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">{summary?.followups} open follow-up tickets need attention.</p>
                  <button onClick={() => navigate('/workspace/ae/follow-ups')} className="text-sm text-purple-700 font-medium flex items-center gap-1 hover:underline">
                    Open Follow-Ups <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const KpiCard = ({ title, value, icon, color, onClick }) => {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    yellow: 'bg-amber-50 text-amber-600 border-amber-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
  };
  
  return (
    <div 
      onClick={onClick}
      className={`p-4 rounded-xl border cursor-pointer hover:shadow-md transition-shadow flex flex-col justify-between ${colorMap[color]}`}
    >
      <div className="flex justify-between items-start mb-4">
        <span className="p-2 rounded-lg bg-white bg-opacity-60">{icon}</span>
      </div>
      <div>
        <div className="text-2xl font-bold">{value || 0}</div>
        <div className="text-xs font-medium uppercase tracking-wider opacity-80 mt-1">{title}</div>
      </div>
    </div>
  );
};

export default AeDashboard;
