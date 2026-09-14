file_path = "/Users/macbookair/.gemini/antigravity-ide/brain/fd52c19a-ead8-476d-b343-77dc9eb1d7cf/task.md"
with open(file_path, "r") as f:
    content = f.read()

content = content.replace("`[ ]` Delete/Truncate dummy E4-B checklist templates and items.", "`[x]` Delete/Truncate dummy E4-B checklist templates and items.")
content = content.replace("`[ ]` Write Node.js script to seed the 11 AE templates (PBN LOIN, WR, SAMICO, etc.) based on the actual Excel matrix.", "`[x]` Write Node.js script to seed the 11 AE templates (PBN LOIN, WR, SAMICO, etc.) based on the actual Excel matrix.")
content = content.replace("`[ ]` Run the seeder against `kompas-exim.db`.", "`[x]` Run the seeder against `kompas-exim.db`.")
content = content.replace("`[ ]` Enhance `AeChecklistRuleEngine` (or `aeRoutes.js`) to dynamically select the correct template based on `buyer` and `product_type`.", "`[x]` Enhance `AeChecklistRuleEngine` (or `aeRoutes.js`) to dynamically select the correct template based on `buyer` and `product_type`.")
content = content.replace("`[ ]` Create `GET /api/v2/ae/jobs/:id/next-action` endpoint to compute the immediate next required task.", "`[x]` Create `GET /api/v2/ae/jobs/:id/next-action` endpoint to compute the immediate next required task.")
content = content.replace("`[ ]` Integrate `ae_job_document_activities` initialization during checklist generation (optional for this sub-phase, but requested).", "`[x]` Integrate `ae_job_document_activities` initialization during checklist generation (optional for this sub-phase, but requested).")
content = content.replace("`[ ]` Update `AeJobDetail.jsx` to query and display the `Next Action` banner.", "`[x]` Update `AeJobDetail.jsx` to query and display the `Next Action` banner.")
content = content.replace("`[ ]` Ensure it gracefully handles \"Awaiting Source Update\" blockers.", "`[x]` Ensure it gracefully handles \"Awaiting Source Update\" blockers.")
content = content.replace("`[ ]` Test generation against realistic source data (`buyer: 'PBN'`, `product: 'WR'`).", "`[x]` Test generation against realistic source data (`buyer: 'PBN'`, `product: 'WR'`).")
content = content.replace("`[ ]` Check Next Action derivation.", "`[x]` Check Next Action derivation.")
content = content.replace("`[ ]` Build frontend & run server.", "`[x]` Build frontend & run server.")

with open(file_path, "w") as f:
    f.write(content)
