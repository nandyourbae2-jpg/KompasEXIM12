import React, { useState } from 'react';
import { useAppleModal } from '../../../../contexts/AppleModalContext';

const MyNotes = () => {
  const [note, setNote] = useState(
    localStorage.getItem('spv_notes') || ''
  );

  const { alert } = useAppleModal();

  const handleSave = async () => {
    localStorage.setItem('spv_notes', note);
    await alert('Catatan tersimpan');
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', color: 'var(--color-primary)' }}>My Notes / Reminder</h1>
      <textarea
        value={note}
        onChange={e => setNote(e.target.value)}
        rows={15}
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: '8px',
          border: '1px solid var(--color-hairline)',
          fontSize: '14px',
          fontFamily: 'var(--font-family-body)',
          resize: 'vertical'
        }}
        placeholder="Ketik catatan pribadi atau reminder di sini..."
      />
      <button onClick={handleSave} style={{ 
        marginTop: '12px',
        backgroundColor: 'var(--color-primary)',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        padding: '10px 16px',
        fontWeight: '600',
        cursor: 'pointer'
      }}>
        Simpan Catatan
      </button>
    </div>
  );
};

export default MyNotes;
