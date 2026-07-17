import React from 'react';
import useAuthStore from '../../store/useAuthStore';
import { LayoutDashboard } from 'lucide-react';

const PlaceholderDashboard = ({ title, message }) => {
  const { user } = useAuthStore();
  const deptName = user?.departemen || 'Departemen';
  
  const displayTitle = title || `Halaman Supervisor ${deptName} masih dalam tahap pengembangan.`;
  const displayMessage = message || "Fitur analitik makro dan eskalasi tugas untuk area operasional Anda sedang dibangun. Silakan akses menu lainnya di sidebar.";

  return (
    <div className="min-h-screen bg-slate-50 p-10 font-sans flex flex-col items-center justify-center">
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-12 flex flex-col items-center max-w-lg text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-6">
          <LayoutDashboard size={32} className="text-slate-400" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900 mb-3">
          {displayTitle}
        </h2>
        <p className="text-slate-500 text-[15px] leading-relaxed">
          {displayMessage}
        </p>
      </div>
    </div>
  );
};

export default PlaceholderDashboard;
