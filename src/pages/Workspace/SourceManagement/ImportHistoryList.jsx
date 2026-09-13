import React, { useState, useEffect } from 'react';
import Badge from '../../../components/Badge';
import { Eye, Trash2, Shield, Archive, XCircle, CheckCircle } from 'lucide-react';
import ImportDetailModal from './ImportDetailModal';
import DeleteConfirmDialog from '../../../components/DeleteConfirmDialog';

const ImportHistoryList = ({ apiBaseUrl, token }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  
  const [selectedImportId, setSelectedImportId] = useState(null);
  
  // Custom Modals & Toasts
  const [deleteConfig, setDeleteConfig] = useState({ item: null, force: false });
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: '' }

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  useEffect(() => {
    fetchHistory();
  }, [showArchived]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/source/imports?archived=${showArchived}&_t=${Date.now()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setHistory(json.data || []);
    } catch (err) {
      setError('Gagal mengambil history log: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (item, force = false) => {
    setDeleteConfig({ item, force });
  };

  const executeDelete = async () => {
    const { item, force } = deleteConfig;
    setDeleteConfig({ item: null, force: false });
    
    try {
      const url = force ? `${apiBaseUrl}/source/imports/${item.id}?force=true` : `${apiBaseUrl}/source/imports/${item.id}`;
      const res = await fetch(url, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      
      if (!json.success) {
        showToast('error', 'Gagal: ' + json.message);
      } else {
        showToast('success', `Berhasil: ${json.message}`);
        fetchHistory();
      }
    } catch (err) {
      showToast('error', 'Error: ' + err.message);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) return <div style={{ padding: '24px', color: 'var(--color-ink-muted)' }}>Memuat history...</div>;
  if (error) return <div style={{ padding: '24px', color: '#ef4444' }}>{error}</div>;

  return (
    <>
      <div style={{ padding: '12px 24px', display: 'flex', justifyContent: 'flex-end', backgroundColor: '#fff', borderBottom: '1px solid var(--color-hairline)' }}>
        <button
          onClick={() => setShowArchived(!showArchived)}
          style={{
            padding: '8px 12px',
            backgroundColor: showArchived ? '#f1f5f9' : 'transparent',
            border: '1px solid var(--color-hairline)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            color: 'var(--color-ink-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Archive size={16} />
          {showArchived ? 'Sembunyikan Archived' : 'Show Archived'}
        </button>
      </div>
      
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left', tableLayout: 'fixed' }}>
          <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--color-hairline)' }}>
            <tr>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-ink-muted)', width: '180px' }}>Source Log Code</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-ink-muted)', width: '140px' }}>Date</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-ink-muted)' }}>File</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-ink-muted)', textAlign: 'right', width: '60px' }}>Rows</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-ink-muted)', textAlign: 'right', width: '60px' }}>New</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-ink-muted)', textAlign: 'right', width: '80px' }}>Updated</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-ink-muted)', width: '100px' }}>Status</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-ink-muted)', width: '120px' }}>Uploaded By</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-ink-muted)', textAlign: 'center', width: '120px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {history.map((item) => {
              const isTest = item.records_new === 0 && item.records_updated === 0;
              return (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--color-hairline)', backgroundColor: '#fff', opacity: item.is_archived ? 0.6 : 1 }}>
                  <td style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-primary)', wordBreak: 'break-all' }}>
                    {item.import_code}
                    {item.is_archived === 1 && <span style={{ marginLeft: '8px', fontSize: '11px', backgroundColor: '#e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>Archived</span>}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--color-ink-muted)' }}>{formatDate(item.created_at)}</td>
                  <td style={{ padding: '12px 16px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.file_name}>
                    {item.file_name}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>{item.rows_read}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', color: '#059669', fontWeight: '500' }}>{item.records_new}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', color: '#2563eb', fontWeight: '500' }}>{item.records_updated}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <Badge 
                      label={item.status} 
                      variant={item.status === 'Success' ? 'success' : item.status === 'Warning' ? 'warning' : 'error'} 
                    />
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--color-ink-muted)' }}>{item.uploaded_by_name}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                      <button 
                        onClick={() => setSelectedImportId(item.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => confirmDelete(item, true)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Force Delete All Data"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {history.length === 0 && (
              <tr>
                <td colSpan={9} style={{ padding: '32px', textAlign: 'center', color: 'var(--color-ink-muted)' }}>
                  Belum ada history log.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedImportId && (
        <ImportDetailModal 
          importId={selectedImportId}
          onClose={() => setSelectedImportId(null)}
          apiBaseUrl={apiBaseUrl}
          token={token}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfig.item && (
        <DeleteConfirmDialog 
          taskTitle={deleteConfig.item.import_code}
          onConfirm={executeDelete}
          onCancel={() => setDeleteConfig({ item: null, force: false })}
          message={
            deleteConfig.force ? (
              <span style={{ fontSize: '13px' }}>
                Apakah Anda yakin ingin menghapus paksa <strong style={{ color: 'var(--color-ink)', fontWeight: '600' }}>{deleteConfig.item.import_code}</strong>?<br/><br/>
                Tindakan ini akan <strong>menghapus log ini secara permanen, beserta semua Export Jobs dan dokumen</strong> yang pernah dibuat oleh file ini.<br/><br/>
                <em>Tindakan ini tidak bisa dibatalkan.</em>
              </span>
            ) : null
          }
        />
      )}

      {/* Custom Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '32px',
          right: '32px',
          backgroundColor: toast.type === 'error' ? '#fef2f2' : '#ecfdf5',
          border: `1px solid ${toast.type === 'error' ? '#fecaca' : '#a7f3d0'}`,
          borderRadius: '8px',
          padding: '16px 24px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          zIndex: 9999,
          animation: 'fadein 0.3s, fadeout 0.3s 4.7s'
        }}>
          {toast.type === 'error' ? (
            <XCircle color="#ef4444" size={24} />
          ) : (
            <CheckCircle color="#10b981" size={24} />
          )}
          <span style={{
            color: toast.type === 'error' ? '#991b1b' : '#065f46',
            fontWeight: '500',
            fontSize: '14px'
          }}>
            {toast.message}
          </span>
          <style>
            {`
              @keyframes fadein { from { bottom: 0; opacity: 0; } to { bottom: 32px; opacity: 1; } }
              @keyframes fadeout { from { bottom: 32px; opacity: 1; } to { bottom: 0; opacity: 0; } }
            `}
          </style>
        </div>
      )}
    </>
  );
};

export default ImportHistoryList;
