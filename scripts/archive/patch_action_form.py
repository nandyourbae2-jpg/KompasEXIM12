import sys

content = """import React, { useState } from 'react';
import { Check, X, Upload, Send, FileText, Printer, Scan } from 'lucide-react';

const ActionFormEngine = ({ activity, onComplete }) => {
  const [remark, setRemark] = useState('');
  const [result, setResult] = useState('');
  const [file, setFile] = useState(null);
  
  // Dynamic fields
  const [receivedFrom, setReceivedFrom] = useState('');
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [transferDest, setTransferDest] = useState('');
  const [handoverReceiver, setHandoverReceiver] = useState('');

  const handleExecute = (overrideResult = null) => {
    const finalResult = overrideResult || result || 'PASS';
    
    // Construct payload dynamically based on activity
    let payload = { remark };
    
    if (activity.activity_name.includes('RECEIVE')) {
        payload.receivedFrom = receivedFrom;
    } else if (activity.activity_name.includes('EMAIL')) {
        payload.emailTo = emailTo;
        payload.emailSubject = emailSubject;
    } else if (activity.activity_name.includes('TRANSFER')) {
        payload.transferDest = transferDest;
    } else if (activity.activity_name.includes('HANDOVER')) {
        payload.handoverReceiver = handoverReceiver;
    }

    onComplete(activity.id, finalResult, file, payload);
  };

  const renderForm = () => {
    const name = activity.activity_name.toUpperCase();
    
    if (name.includes('RECEIVE')) {
       return (
         <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
               <label style={{ fontSize: '12px', fontWeight: 600 }}>Received From</label>
               <input type="text" value={receivedFrom} onChange={e => setReceivedFrom(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }} placeholder="e.g. Courier, Email" />
            </div>
            <div>
               <label style={{ fontSize: '12px', fontWeight: 600 }}>Evidence (Optional)</label>
               <input type="file" onChange={e => setFile(e.target.files[0])} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
            </div>
            <div>
               <label style={{ fontSize: '12px', fontWeight: 600 }}>Remark</label>
               <textarea value={remark} onChange={e => setRemark(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
            </div>
            <button onClick={() => handleExecute('PASS')} style={{ background: '#3b82f6', color: '#fff', padding: '10px', borderRadius: '6px', border: 'none', fontWeight: 600, cursor: 'pointer' }}>[CONFIRM RECEIPT]</button>
         </div>
       );
    }

    if (name.includes('FILE') || name.includes('SERVER FILING')) {
       return (
         <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
               <label style={{ fontSize: '12px', fontWeight: 600 }}>Evidence (Optional)</label>
               <input type="file" onChange={e => setFile(e.target.files[0])} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
            </div>
            <div>
               <label style={{ fontSize: '12px', fontWeight: 600 }}>Remark</label>
               <textarea value={remark} onChange={e => setRemark(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
            </div>
            <button onClick={() => handleExecute('PASS')} style={{ background: '#3b82f6', color: '#fff', padding: '10px', borderRadius: '6px', border: 'none', fontWeight: 600, cursor: 'pointer' }}>[COMPLETE FILING]</button>
         </div>
       );
    }

    if (name.includes('CHECK')) {
       return (
         <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
               <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="radio" name="checkResult" value="PASS" onChange={() => setResult('PASS')} /> <span style={{ color: '#059669', fontWeight: 600 }}>PASS</span>
               </label>
               <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="radio" name="checkResult" value="FAIL" onChange={() => setResult('FAIL')} /> <span style={{ color: '#dc2626', fontWeight: 600 }}>FAIL</span>
               </label>
            </div>
            {result === 'FAIL' && (
              <div>
                 <label style={{ fontSize: '12px', fontWeight: 600 }}>Evidence (Optional)</label>
                 <input type="file" onChange={e => setFile(e.target.files[0])} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
              </div>
            )}
            <div>
               <label style={{ fontSize: '12px', fontWeight: 600 }}>Remark</label>
               <textarea value={remark} onChange={e => setRemark(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
            </div>
            <button onClick={() => handleExecute(result || 'PASS')} disabled={!result} style={{ background: result ? '#3b82f6' : '#94a3b8', color: '#fff', padding: '10px', borderRadius: '6px', border: 'none', fontWeight: 600, cursor: result ? 'pointer' : 'not-allowed' }}>[COMPLETE CHECK]</button>
         </div>
       );
    }

    if (name.includes('FORMAT') || name.includes('SCAN')) {
       const isScan = name.includes('SCAN');
       return (
         <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ background: '#f1f5f9', padding: '8px', borderRadius: '4px', fontSize: '12px' }}>
               Current Version: V{activity.version || 1}
            </div>
            <div>
               <label style={{ fontSize: '12px', fontWeight: 600 }}>{isScan ? 'Scanned File (Required)' : 'File Upload (Required)'}</label>
               <input type="file" onChange={e => setFile(e.target.files[0])} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
            </div>
            <div>
               <label style={{ fontSize: '12px', fontWeight: 600 }}>Remark</label>
               <textarea value={remark} onChange={e => setRemark(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
            </div>
            <button onClick={() => handleExecute('PASS')} disabled={!file} style={{ background: file ? '#3b82f6' : '#94a3b8', color: '#fff', padding: '10px', borderRadius: '6px', border: 'none', fontWeight: 600, cursor: file ? 'pointer' : 'not-allowed' }}>{isScan ? '[COMPLETE SCAN]' : '[COMPLETE FORMATTING]'}</button>
         </div>
       );
    }

    if (name.includes('EMAIL')) {
       return (
         <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
               <label style={{ fontSize: '12px', fontWeight: 600 }}>Recipient</label>
               <input type="text" value={emailTo} onChange={e => setEmailTo(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
            </div>
            <div>
               <label style={{ fontSize: '12px', fontWeight: 600 }}>Subject</label>
               <input type="text" value={emailSubject} onChange={e => setEmailSubject(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
            </div>
            <div>
               <label style={{ fontSize: '12px', fontWeight: 600 }}>Remark</label>
               <textarea value={remark} onChange={e => setRemark(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
            </div>
            <button onClick={() => handleExecute('PASS')} style={{ background: '#3b82f6', color: '#fff', padding: '10px', borderRadius: '6px', border: 'none', fontWeight: 600, cursor: 'pointer' }}>[LOG EMAIL SENT]</button>
         </div>
       );
    }
    
    if (name.includes('REVISE')) {
       return (
         <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
               <label style={{ fontSize: '12px', fontWeight: 600 }}>Revision Reason</label>
               <textarea value={remark} onChange={e => setRemark(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
            </div>
            <div>
               <label style={{ fontSize: '12px', fontWeight: 600 }}>New Version File</label>
               <input type="file" onChange={e => setFile(e.target.files[0])} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
            </div>
            <button onClick={() => handleExecute('PASS')} style={{ background: '#3b82f6', color: '#fff', padding: '10px', borderRadius: '6px', border: 'none', fontWeight: 600, cursor: 'pointer' }}>[CREATE REVISION]</button>
         </div>
       );
    }
    
    if (name.includes('PRINT')) {
       return (
         <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
               <label style={{ fontSize: '12px', fontWeight: 600 }}>Remark</label>
               <textarea value={remark} onChange={e => setRemark(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
            </div>
            <button onClick={() => handleExecute('PASS')} style={{ background: '#3b82f6', color: '#fff', padding: '10px', borderRadius: '6px', border: 'none', fontWeight: 600, cursor: 'pointer' }}>[MARK AS PRINTED]</button>
         </div>
       );
    }

    if (name.includes('CONFIRM')) {
       return (
         <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
               <label style={{ fontSize: '12px', fontWeight: 600 }}>Remark</label>
               <textarea value={remark} onChange={e => setRemark(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
            </div>
            <button onClick={() => handleExecute('PASS')} style={{ background: '#3b82f6', color: '#fff', padding: '10px', borderRadius: '6px', border: 'none', fontWeight: 600, cursor: 'pointer' }}>[CONFIRM]</button>
         </div>
       );
    }

    if (name.includes('TRANSFER')) {
       return (
         <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
               <label style={{ fontSize: '12px', fontWeight: 600 }}>Destination</label>
               <input type="text" value={transferDest} onChange={e => setTransferDest(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
            </div>
            <div>
               <label style={{ fontSize: '12px', fontWeight: 600 }}>Remark</label>
               <textarea value={remark} onChange={e => setRemark(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
            </div>
            <button onClick={() => handleExecute('PASS')} style={{ background: '#3b82f6', color: '#fff', padding: '10px', borderRadius: '6px', border: 'none', fontWeight: 600, cursor: 'pointer' }}>[COMPLETE TRANSFER]</button>
         </div>
       );
    }
    
    if (name.includes('HANDOVER')) {
       return (
         <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
               <label style={{ fontSize: '12px', fontWeight: 600 }}>Receiver (AO)</label>
               <input type="text" value={handoverReceiver} onChange={e => setHandoverReceiver(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
            </div>
            <div>
               <label style={{ fontSize: '12px', fontWeight: 600 }}>Remark</label>
               <textarea value={remark} onChange={e => setRemark(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
            </div>
            <button onClick={() => handleExecute('PASS')} style={{ background: '#3b82f6', color: '#fff', padding: '10px', borderRadius: '6px', border: 'none', fontWeight: 600, cursor: 'pointer' }}>[SHARE HANDOVER]</button>
         </div>
       );
    }

    // Default Fallback
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
         <div>
            <label style={{ fontSize: '12px', fontWeight: 600 }}>Remark</label>
            <textarea value={remark} onChange={e => setRemark(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
         </div>
         <button onClick={() => handleExecute('PASS')} style={{ background: '#3b82f6', color: '#fff', padding: '10px', borderRadius: '6px', border: 'none', fontWeight: 600, cursor: 'pointer' }}>[EXECUTE ACTIVITY]</button>
      </div>
    );
  };

  return (
    <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
       {renderForm()}
    </div>
  );
};

export default ActionFormEngine;
"""

with open('src/pages/Staff/ActionFormEngine.jsx', 'w') as f:
    f.write(content)

print("Rewrote ActionFormEngine.jsx")
