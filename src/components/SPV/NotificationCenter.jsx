import React, { useState, useEffect } from 'react';
import { Bell, X, AlertTriangle, Clock, Info } from 'lucide-react';
import useSpvStore from '../../store/useSpvStore';

const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { shipments, tasks, fetchShipmentMonitoring, fetchAssignmentCenter } = useSpvStore();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (isOpen) {
      // Re-fetch when opening to ensure freshest data
      fetchShipmentMonitoring();
      fetchAssignmentCenter();
    }
  }, [isOpen, fetchShipmentMonitoring, fetchAssignmentCenter]);

  useEffect(() => {
    // Generate notifications based on current data
    const generateNotifications = () => {
      const notifs = [];
      
      // 1. Shipment Delays
      (shipments || []).forEach(s => {
        if (s.eta && new Date(s.eta) < new Date() && s.status !== 'Completed') {
          notifs.push({
            id: `shp-${s.id}`,
            type: 'alert',
            title: 'Shipment Terlambat',
            message: `ETA untuk BL ${s.bl_number} telah terlewat.`,
            time: 'Baru saja'
          });
        }
      });

      // 2. Overdue Tasks
      (tasks || []).filter(t => t.status !== 'Selesai').forEach(t => {
        if (t.dueDate && new Date(t.dueDate) < new Date()) {
          notifs.push({
            id: `tsk-${t.id}`,
            type: 'warning',
            title: 'Tugas Overdue',
            message: `Tugas "${t.title}" sudah melewati tenggat waktu.`,
            time: 'Hari ini'
          });
        }
      });

      // Mock random system notifications
      notifs.push({ id: 'sys-1', type: 'info', title: 'Sistem Terbarui', message: 'Koneksi database Staff berhasil disinkronisasi.', time: '1 jam lalu' });

      setNotifications(notifs);
    };

    generateNotifications();
  }, [shipments, tasks]);

  return (
    <div style={{ position: 'relative' }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          background: 'none', border: 'none', cursor: 'pointer', position: 'relative',
          padding: '8px', borderRadius: '50%', backgroundColor: isOpen ? 'var(--color-canvas-parchment)' : 'transparent',
          transition: 'background-color 0.2s'
        }}
      >
        <Bell size={20} color="var(--color-ink)" />
        {notifications.length > 0 && (
          <span style={{
            position: 'absolute', top: '4px', right: '4px', width: '10px', height: '10px',
            backgroundColor: '#ff3b30', borderRadius: '50%', border: '2px solid white'
          }} />
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute', top: '100%', right: '0', marginTop: '8px',
          width: '320px', backgroundColor: 'white', borderRadius: '12px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.15)', border: '1px solid var(--color-hairline)',
          zIndex: 1000, overflow: 'hidden'
        }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--color-hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', margin: 0 }}>Notification Center</h3>
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <X size={16} color="var(--color-ink-muted-48)" />
            </button>
          </div>
          
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-ink-muted-48)', fontSize: '13px' }}>
                Tidak ada notifikasi baru.
              </div>
            ) : (
              notifications.map(n => (
                <div key={n.id} style={{ padding: '16px', borderBottom: '1px solid var(--color-hairline)', display: 'flex', gap: '12px' }}>
                  <div style={{ flexShrink: 0 }}>
                    {n.type === 'alert' ? <AlertTriangle size={18} color="#ff3b30" /> : 
                     n.type === 'warning' ? <Clock size={18} color="#ff9500" /> : 
                     <Info size={18} color="#0066cc" />}
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>{n.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-80)', marginBottom: '8px' }}>{n.message}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-ink-muted-48)' }}>{n.time}</div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {notifications.length > 0 && (
            <div style={{ padding: '12px', textAlign: 'center', borderTop: '1px solid var(--color-hairline)', backgroundColor: 'var(--color-canvas-parchment)' }}>
              <button style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                Tandai semua dibaca
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
