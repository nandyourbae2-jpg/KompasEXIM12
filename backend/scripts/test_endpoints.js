async function test() {
  const urls = [
    'http://localhost:3001/api/financial-requests',
    'http://localhost:3001/api/financial-requests/summary',
    'http://localhost:3001/api/financial-requests/pending',
    'http://localhost:3001/api/financial-requests/1/history'
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url);
      console.log(url, res.status);
    } catch(e) {
      console.log(url, e.message);
    }
  }
}
test();
