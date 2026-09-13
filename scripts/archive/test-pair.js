const fetch = require('node-fetch');

(async () => {
  const res = await fetch('http://localhost:3001/api/v2/ao-workboard/supervisor/jobs/1/pair', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ao_assignee_id: 105,
      dscs_assignee_id: 115,
      remarks: 'test remarks'
    })
  });
  console.log(res.status);
  console.log(await res.text());
})();
