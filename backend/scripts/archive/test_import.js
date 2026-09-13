const test = async () => {
  try {
    const res = await fetch('http://localhost:3001/api/v2/source/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        storedName: 'log-schedule-1788360004570-694677950.xlsx',
        fileName: 'Schedule Export 2026 28-08-26 ..xlsx'
      })
    });
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Body:', text);
  } catch (e) {
    console.error(e);
  }
};
test();
