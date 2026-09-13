import React, { useState } from 'react';
import ManagementWorkspace from '../../../../components/ManagementWorkspace';
import { Ship, Anchor, DollarSign, CheckCircle, ChevronRight, X, Clock, MapPin, Package, User, AlertTriangle, MessageSquare, Send } from 'lucide-react';
import useAuthStore from '../../../../store/useAuthStore';
import useSPVData from '../../../../hooks/useSPVData';
import { StageBadge } from '../../../../components/SPV/SPVSharedComponents';
import { api } from '../../../../lib/api';
import { useAppleModal } from '../../../../contexts/AppleModalContext';

const SpvShipmentMonitoring = () => {
  const { user } = useAuthStore();
  const { data: shipments, loading, error, refetch } = useSPVData('/api/status-shipment');
  const { data: realStaffList } = useSPVData('/api/users/assignable');
  const staffList = realStaffList || [];
  
  const [selectedShipment, setSelectedShipment] = useState(null);
  
  // Drawer state
  const [isAssigning, setIsAssigning] = useState(false);
  const [picInput, setPicInput] = useState('');
  const [commentInput, setCommentInput] = useState('');
  const { alert } = useAppleModal();

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Memuat Shipment Master Data...</div>;
  if (error) return <div style={{ padding: '40px', color: 'red' }}>Error: {error}</div>;

  const byStage = {
    active: (shipments || []).filter(s => s.stage === 'Shipment Active').length,
    delivery: (shipments || []).filter(s => s.stage === 'Delivery Active').length,
    settlement: (shipments || []).filter(s => s.stage === 'Financial Settlement').length,
    complete: (shipments || []).filter(s => s.stage === 'Status Complete').length,
  };

  const calculateProgress = (stage) => {
    switch (stage) {
      case 'Shipment Active': return 25;
      case 'Delivery Active': return 50;
      case 'Financial Settlement': return 75;
      case 'Status Complete': return 100;
      default: return 10;
    }
  };

  const handleAssignPIC = async () => {
    if (!picInput.trim()) return;
    try {
      setIsAssigning(true);
      const staff = staffList.find(s => s.id.toString() === picInput);
      if (!staff) throw new Error("Staff tidak ditemukan");

      await api('/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: `Penugasan Khusus Shipment ${selectedShipment.un}`,
          assignee_id: parseInt(picInput),
          tenggat: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString().split('T')[0], // 2 days from now
          status: 'Backlog',
          sumber_tugas: 'Escalation',
          departemen: user?.departemen,
          task_code: `TSK-ESK-${Math.floor(Math.random() * 1000)}`,
          assigned_by_id: user?.id,
          deskripsi: `Penugasan PIC operasional untuk Shipment UN: ${selectedShipment.un}`
        })
      });
      await alert(`PIC assigned successfully to ${staff.nama}`);
      setSelectedShipment({...selectedShipment, pic: staff.nama});
      setPicInput('');
    } catch (e) {
      await alert("Failed to assign PIC: " + e.message);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentInput.trim()) return;
    try {
      await api('/reports', {
        method: 'POST',
        body: JSON.stringify({
          tipe: 'Progress Update',
          judul: `SPV Directive: ${selectedShipment.un}`,
          isi: commentInput,
          departemen: user?.departemen
        })
      });
      await alert(`Comment added and stored as Progress Update`);
      setCommentInput('');
    } catch (e) {
      await alert("Failed to add comment");
    }
  };

  return (
    <>
    <ManagementWorkspace
      title={`Shipment Master Data`}
      subtitle="Pemantauan end-to-end Master Data Pengiriman (PIB, Operasional, Finance, Vendor)."
      summaryCards={[
        { label: 'Shipment Active', value: byStage.active.toString(), trend: 'On Sea', trendColor: '#0066cc', icon: <Ship size={20} /> },
        { label: 'Delivery Active', value: byStage.delivery.toString(), trend: 'Trucking', trendColor: '#34c759', icon: <Anchor size={20} /> },
        { label: 'Financial Settlement', value: byStage.settlement.toString(), trend: 'Finance', trendColor: '#ff9500', icon: <DollarSign size={20} /> },
        { label: 'Status Complete', value: byStage.complete.toString(), trend: 'Done', trendColor: '#34c759', icon: <CheckCircle size={20} /> },
      ]}
      tableConfig={{
        headers: ['UN / Container', 'Progress %', 'Current Activity', 'Stage', 'ETA', 'Aksi'],
        data: shipments || [],
        renderRow: (item) => {
          const progress = calculateProgress(item.stage);
          
          return (
            <tr key={item.id} style={{ borderBottom: '1px solid var(--color-hairline)', '&:hover': { backgroundColor: '#f9f9f9' } }}>
              <td style={{ padding: '16px 24px' }}>
                <div style={{ fontWeight: '600', color: 'var(--color-primary)' }}>{item.un || `UN-${item.id}`}</div>
                <div style={{ fontSize: '11px', color: 'var(--color-ink-muted-80)', marginTop: '4px' }}>{item.supplier}</div>
              </td>
              <td style={{ padding: '16px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ flex: 1, height: '6px', background: 'var(--color-hairline)', borderRadius: '3px' }}>
                    <div style={{ width: `${progress}%`, height: '100%', background: progress === 100 ? '#34c759' : 'var(--color-primary)', borderRadius: '3px' }} />
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: '600' }}>{progress}%</span>
                </div>
              </td>
              <td style={{ padding: '16px 24px' }}>
                <div style={{ fontSize: '13px', fontWeight: '600' }}>{item.stage === 'Shipment Active' ? 'Waiting ATA' : item.stage === 'Delivery Active' ? 'Trucking' : item.stage === 'Financial Settlement' ? 'Settlement' : 'Closed'}</div>
                <div style={{ fontSize: '11px', color: 'var(--color-ink-muted-80)' }}>{item.mode_transport || 'Sea Freight'}</div>
              </td>
              <td style={{ padding: '16px 24px' }}>
                <StageBadge stage={item.stage} />
              </td>
              <td style={{ padding: '16px 24px' }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-status-danger)' }}>{item.eta || '-'}</div>
              </td>
              <td style={{ padding: '16px 24px' }}>
                <button 
                  onClick={() => setSelectedShipment(item)}
                  style={{ border: 'none', backgroundColor: 'transparent', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center' }}
                >
                  Action <ChevronRight size={14} />
                </button>
              </td>
            </tr>
          );
        }
      }}
    />

    {/* SPV Control Tower Drawer */}
    {selectedShipment && (
      <>
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 998 }} onClick={() => setSelectedShipment(null)} />
        <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '450px', backgroundColor: 'white', zIndex: 999, boxShadow: '-4px 0 24px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' }}>
          
          <div style={{ padding: '24px', borderBottom: '1px solid var(--color-hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fafafa' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--color-ink)' }}>Control Tower Panel</h2>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--color-ink-muted-80)' }}>Shipment UN: {selectedShipment.un}</p>
            </div>
            <button onClick={() => setSelectedShipment(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-ink-muted-80)' }}><X size={20} /></button>
          </div>

          <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
            {/* SPV ACTIONS: ASSIGN PIC */}
            <div style={{ marginBottom: '24px', backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: '12px', padding: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}><User size={16} /> Update PIC Operasional</h3>
              <div style={{ display: 'flex', gap: '12px' }}>
                <select 
                  value={picInput}
                  onChange={(e) => setPicInput(e.target.value)}
                  style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--color-hairline)', fontSize: '13px', backgroundColor: 'var(--color-canvas)' }} 
                >
                  <option value="">Pilih PIC (Staff)...</option>
                  {staffList.map(staff => (
                    <option key={staff.id} value={staff.id}>{staff.nama}</option>
                  ))}
                </select>
                <button 
                  onClick={handleAssignPIC}
                  disabled={isAssigning}
                  style={{ padding: '0 16px', backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                >
                  {isAssigning ? 'Memproses...' : 'Assign'}
                </button>
              </div>
            </div>

            {/* SPV ACTIONS: ESCALATION & COMMENTS */}
            <div style={{ marginBottom: '24px', backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: '12px', padding: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}><MessageSquare size={16} /> SPV Notes & Directives</h3>
              <textarea 
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Berikan instruksi atau catatan khusus untuk shipment ini kepada staff..."
                style={{ width: '100%', height: '100px', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-hairline)', fontSize: '13px', resize: 'none', marginBottom: '12px' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button 
                  style={{ padding: '10px 16px', backgroundColor: 'var(--color-status-danger-bg)', color: 'var(--color-status-danger)', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <AlertTriangle size={14} /> Eskalasi Issue
                </button>
                <button 
                  onClick={handleAddComment}
                  style={{ padding: '10px 16px', backgroundColor: 'var(--color-ink)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Send size={14} /> Post Note
                </button>
              </div>
            </div>

            {/* Quick Summary View (Read Only Data from Staff) */}
            <h3 style={{ fontSize: '14px', fontWeight: '700', margin: '32px 0 16px' }}>Master Data (Read-Only)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <p style={{ fontSize: '11px', color: 'var(--color-ink-muted-80)', margin: '0 0 4px' }}>SUPPLIER</p>
                <p style={{ fontSize: '13px', fontWeight: '600', margin: 0 }}>{selectedShipment.supplier || 'N/A'}</p>
              </div>
              <div>
                <p style={{ fontSize: '11px', color: 'var(--color-ink-muted-80)', margin: '0 0 4px' }}>ETA / ATA</p>
                <p style={{ fontSize: '13px', fontWeight: '600', margin: 0 }}>{selectedShipment.eta || '-'} / {selectedShipment.ata || '-'}</p>
              </div>
              <div>
                <p style={{ fontSize: '11px', color: 'var(--color-ink-muted-80)', margin: '0 0 4px' }}>PIB NUMBER</p>
                <p style={{ fontSize: '13px', fontWeight: '600', margin: 0 }}>{selectedShipment.no_pib || '-'}</p>
              </div>
              <div>
                <p style={{ fontSize: '11px', color: 'var(--color-ink-muted-80)', margin: '0 0 4px' }}>MODE OF TRANSPORT</p>
                <p style={{ fontSize: '13px', fontWeight: '600', margin: 0 }}>{selectedShipment.mode_transport || 'Sea'}</p>
              </div>
            </div>
          </div>
        </div>
      </>
    )}
    </>
  );
};

export default SpvShipmentMonitoring;
