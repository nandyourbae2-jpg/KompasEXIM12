import re
file_path = "backend/src/verify_phase8.js"
with open(file_path, "r") as f:
    content = f.read()

content = content.replace("invoice = '10826'", "invoice_no = '10826'")
content = content.replace("job.invoice", "job.invoice_no")
content = content.replace("goldenJob.invoice", "goldenJob.invoice_no")
content = content.replace("INSERT INTO export_jobs (invoice,", "INSERT INTO export_jobs (job_code, business_key, invoice_no,")
content = content.replace("VALUES ('PARTIAL-123', 'TEST',", "VALUES ('PARTIAL-123', 'PARTIAL-123', 'TEST',")

with open(file_path, "w") as f:
    f.write(content)
