async function test() {
  try {
    // 1. Login as Vicky
    console.log("Logging in as Vicky...");
    const loginRes = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'vicky@kompas.com', password: 'password123' })
    });
    const loginData = await loginRes.json();
    if (!loginData.token) throw new Error("Login failed");
    const token = loginData.token;
    console.log("Login SUCCESS.");

    // 2. Fetch doc planner jobs
    console.log("Fetching Doc Planner Jobs...");
    const jobsRes = await fetch('http://localhost:3001/api/v2/ao-workboard/supervisor/doc-planner/jobs', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const jobsData = await jobsRes.json();
    console.log("Jobs Response:", jobsData.success ? `SUCCESS, Found ${jobsData.data.length} jobs` : "FAILED");
    if (!jobsData.success) {
      console.error(jobsData);
    } else {
      console.log(jobsData.data[0]);
    }
  } catch (err) {
    console.error(err);
  }
}
test();
