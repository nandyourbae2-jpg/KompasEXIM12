import React, { useState } from 'react';
import { X } from 'lucide-react';
import { api } from '../../lib/api';
import useSpvStore from '../../store/useSpvStore';
import useAuthStore from '../../store/useAuthStore';
import useSPVData from '../../hooks/useSPVData';

const AssignTaskModal = ({ isOpen, onClose }) => {
  const { user } = useAuthStore();
  const { fetchAssignmentCenter, notifyUpdate } = useSpvStore();
  
  const [formData, setFormData] = useState({
    title: '',
    assignee_id: '',
    tenggat: '',
    priority: 'Sedang',
    deskripsi: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { data: realStaffList } = useSPVData('/api/users/assignable');
  const staffList = realStaffList || [];

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api('/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: formData.title,
          assigneeId: parseInt(formData.assignee_id),
          dueDate: formData.tenggat,
          status: 'Backlog',
          sumber_tugas: 'Escalation',
          department: user?.departemen || 'Import',
          task_code: `TSK-ESK-${Math.floor(Math.random() * 1000)}`,
          priority: formData.priority,
          assigned_by_id: user?.id,
          notes: formData.deskripsi || '',
          deskripsi: formData.deskripsi || '',
          catatan_progress: formData.deskripsi || ''
        })
      });
      
      // Update local state and notify other tabs
      fetchAssignmentCenter();
      notifyUpdate();
      
      onClose();
      // Reset form
      setFormData({ title: '', assignee_id: '', tenggat: '', priority: 'Sedang', deskripsi: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: 'white', borderRadius: '12px', width: '100%', maxWidth: '500px', padding: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700' }}>Assign New Task</h2>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}><X size={20} color="var(--color-ink-muted-48)" /></button>
        </div>
        
        {error && <div style={{ padding: '12px', backgroundColor: '#ffebee', color: '#f44336', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>Judul Tugas</label>
            <input type="text" name="title" value={formData.title} onChange={handleChange} required style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--color-hairline)', borderRadius: '6px', fontSize: '14px' }} placeholder="Contoh: Follow up Demurrage PI-1092" />
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>Tugaskan Kepada (Staff)</label>
            <select name="assignee_id" value={formData.assignee_id} onChange={handleChange} required style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--color-hairline)', borderRadius: '6px', fontSize: '14px' }}>
              <option value="">Pilih Staff...</option>
              {staffList.map(staff => (
                <option key={staff.id} value={staff.id}>{staff.nama}</option>
              ))}
            </select>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>Tenggat Waktu</label>
              <input type="date" name="tenggat" value={formData.tenggat} onChange={handleChange} required style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--color-hairline)', borderRadius: '6px', fontSize: '14px' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>Prioritas</label>
              <select name="priority" value={formData.priority} onChange={handleChange} style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--color-hairline)', borderRadius: '6px', fontSize: '14px' }}>
                <option value="Rendah">Rendah</option>
                <option value="Sedang">Sedang</option>
                <option value="Tinggi">Tinggi</option>
                <option value="Kritis">Kritis</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>Instruksi / Catatan Tambahan (Opsional)</label>
            <textarea
              name="deskripsi"
              value={formData.deskripsi}
              onChange={handleChange}
              rows={3}
              placeholder="Berikan instruksi atau catatan khusus untuk staff..."
              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--color-hairline)', borderRadius: '6px', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box' }}
            />
          </div>
          
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 16px', border: '1px solid var(--color-hairline)', background: 'white', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>Batal</button>
            <button type="submit" disabled={loading} style={{ padding: '10px 16px', border: 'none', background: 'var(--color-primary)', color: 'white', borderRadius: '6px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Menyimpan...' : 'Tugaskan Sekarang'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignTaskModal;
