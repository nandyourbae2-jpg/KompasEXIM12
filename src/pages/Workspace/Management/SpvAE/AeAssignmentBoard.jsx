import React, { useState, useEffect } from 'react';
import { getToken } from '../../../../utils/authToken';
const apiBaseUrl = import.meta.env.VITE_API_URL || '/api/v2';

const AeAssignmentBoard = () => {
  const [unassignedJobs, setUnassignedJobs] = useState([]);
  const [staffWorkload, setStaffWorkload] = useState([]);
  const [loading, setLoading] = useState(true);

  // Assignment Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [assignmentReason, setAssignmentReason] = useState('');

  const token = getToken();

  const fetchData = async () => {
    setLoading(true);
    try {
      const resJobs = await fetch(`${apiBaseUrl}/ae-assignment/unassigned`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const dataJobs = await resJobs.json();
      
      const resStaff = await fetch(`${apiBaseUrl}/ae-assignment/staff-workload`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const dataStaff = await resStaff.json();

      if (dataJobs.success) setUnassignedJobs(dataJobs.data);
      if (dataStaff.success) setStaffWorkload(dataStaff.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssignClick = (job) => {
    setSelectedJob(job);
    setSelectedStaff('');
    setAssignmentReason('');
    setShowModal(true);
  };

  const handleConfirmAssignment = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/ae-assignment/assign`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          export_job_id: selectedJob.id,
          staff_id: selectedStaff,
          reason: assignmentReason
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        fetchData();
      } else {
        alert(data.message || 'Gagal menugaskan pekerjaan');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan');
    }
  };

  if (loading) return <div className="p-6 text-gray-500">Loading Assignment Board...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">AE Assignment Board</h1>
        <p className="text-sm text-gray-600">Assign unassigned jobs to AE staff based on their current workload.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* UNASSIGNED JOBS */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Unassigned Jobs</h2>
            </div>
            <div className="p-0">
              {unassignedJobs.length === 0 ? (
                <div className="p-6 text-center text-gray-500">No unassigned jobs currently.</div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job / Invoice</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Buyer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Template</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {unassignedJobs.map((job) => (
                      <tr key={job.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                          {job.invoice_number || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {job.buyer || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {job.template_name ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              {job.template_name}
                            </span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                              Resolution Required
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleAssignClick(job)}
                            className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1 rounded"
                            disabled={!job.template_name}
                          >
                            {job.template_name ? 'Assign' : 'Resolve First'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* STAFF WORKLOAD */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Staff Workload</h2>
            </div>
            <div className="p-4 space-y-4">
              {staffWorkload.map((staff) => (
                <div key={staff.id} className="flex justify-between items-center p-3 bg-gray-50 rounded border border-gray-100">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{staff.nama}</div>
                    <div className="text-xs text-gray-500">{staff.departemen}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-blue-600">{staff.active_jobs} Active</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ASSIGNMENT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Assign Job</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-500">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Invoice</label>
                <div className="text-sm text-gray-900">{selectedJob?.invoice_number}</div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Staff</label>
                <select 
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={selectedStaff}
                  onChange={(e) => setSelectedStaff(e.target.value)}
                >
                  <option value="">-- Choose AE Staff --</option>
                  {staffWorkload.map(s => (
                    <option key={s.id} value={s.id}>{s.nama} ({s.active_jobs} active)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason / Note</label>
                <textarea 
                  className="mt-1 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                  rows={3}
                  value={assignmentReason}
                  onChange={(e) => setAssignmentReason(e.target.value)}
                  placeholder="E.g., Based on workload balance..."
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3 rounded-b-lg">
              <button 
                onClick={() => setShowModal(false)}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmAssignment}
                disabled={!selectedStaff}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AeAssignmentBoard;
