import React, { useState, useEffect } from 'react';
import { useAoStore } from '../store/useAoStore';
import { 
    Inbox, 
    CheckCircle, 
    Clock, 
    FileText, 
    MapPin, 
    User 
} from 'lucide-react';
import '../pages/Supervisor/AoControlTower.css';

const AoHandoverInbox = () => {
    const { incomingHandovers: handovers, acceptHandover, isLoading } = useAoStore();
    const [acceptingId, setAcceptingId] = useState(null);

    const handleAccept = async (id) => {
        setAcceptingId(id);
        try {
            await acceptHandover(id);
            alert('Handover diterima dan masuk ke Pool Tugas');
        } catch (error) {
            alert(error.message || 'Gagal menerima handover');
        } finally {
            setAcceptingId(null);
        }
    };

    if (isLoading && handovers.length === 0) {
        return (
            <div className="handover-inbox-section">
                <div className="handover-header">
                    <h2 className="handover-title">
                        <Inbox /> Buku Ekspedisi Masuk (Handovers)
                    </h2>
                </div>
                <div style={{ padding: '40px', textAlign: 'center', color: '#86868b' }}>
                    Memuat data handover...
                </div>
            </div>
        );
    }

    return (
        <div className="handover-inbox-section">
            <div className="handover-header">
                <h2 className="handover-title">
                    <Inbox /> Buku Ekspedisi Masuk (Handovers)
                    {handovers.length > 0 && (
                        <span className="handover-badge">{handovers.length}</span>
                    )}
                </h2>
            </div>

            {handovers.length === 0 ? (
                <div className="empty-inbox">
                    <CheckCircle className="empty-icon" />
                    <h3 className="empty-title">Tidak ada handover baru</h3>
                    <p className="empty-subtitle">Semua dokumen handover dari AE telah diterima atau diproses.</p>
                </div>
            ) : (
                <div className="handover-grid">
                    {handovers.map((item) => (
                        <div key={item.id} className="handover-card">
                            <div className="handover-card-header">
                                <span className="invoice-no">{item.invoice_no}</span>
                                <span className="handover-time">
                                    <Clock style={{ marginRight: '4px', width: '14px' }} />
                                    {new Date(item.ae_handover_at).toLocaleString('id-ID', {
                                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                                    })}
                                </span>
                            </div>

                            <div style={{ margin: '10px 0 12px 0' }}>
                                <div style={{ fontSize: '11px', fontWeight: 600, color: '#86868b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                                    Dokumen Diserahkan ({item.documents?.length || 1}):
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {(item.documents && item.documents.length > 0 ? item.documents : [item.handover_type || item.ae_handover_status]).map((docName, idx) => (
                                        <span 
                                            key={idx} 
                                            style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe',
                                                padding: '3px 8px', borderRadius: '8px', fontSize: '12px', fontWeight: 600
                                            }}
                                        >
                                            <FileText style={{ width: '12px', height: '12px' }} /> {docName}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="handover-details">
                                <div className="detail-row">
                                    <span className="detail-label"><User style={{ marginRight: '4px', width: '14px' }}/> Pengirim (AE)</span>
                                    <span className="detail-value" style={{ fontWeight: 600, color: '#1e293b' }}>{item.sender_name || 'Staff AE'}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label"><User style={{ marginRight: '4px', width: '14px' }}/> Penerima (AO)</span>
                                    <span className="detail-value" style={{ fontWeight: 600, color: '#0369a1' }}>{item.receiver_name ? `${item.receiver_name} (Staff AO)` : 'Tim AO'}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label"><User style={{ marginRight: '4px', width: '14px' }}/> Buyer</span>
                                    <span className="detail-value" title={item.buyer}>{item.buyer}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label"><MapPin style={{ marginRight: '4px', width: '14px' }}/> Destinasi</span>
                                    <span className="detail-value" title={item.destination}>{item.destination}</span>
                                </div>
                                {item.handover_remark && (
                                    <div className="detail-row" style={{ marginTop: '8px', borderTop: '1px dashed #e5e5ea', paddingTop: '8px' }}>
                                        <span className="detail-label">Catatan:</span>
                                        <span className="detail-value" style={{ maxWidth: '100%', textAlign: 'left', whiteSpace: 'normal', fontSize: '12px', color: '#475569', fontStyle: 'italic' }}>
                                            "{item.handover_remark}"
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="handover-actions">
                                <button 
                                    className="btn-accept" 
                                    onClick={() => handleAccept(item.id)}
                                    disabled={acceptingId === item.id}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                                    }}
                                >
                                    {acceptingId === item.id ? 'Memproses...' : (
                                        <>Terima Dokumen ({item.documents?.length || 1}) <CheckCircle size={14} /></>
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AoHandoverInbox;
