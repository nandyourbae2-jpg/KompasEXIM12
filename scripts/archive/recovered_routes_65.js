      // Insert links to master documents + auto-create monitoring rows
      if (Array.isArray(document_requirements) && document_requirements.length) {
        console.log("INSERTING DOCS", document_requirements, "for PID", pid);
        const insertLink = db.prepare('INSERT INTO import_project_documents (import_project_id, dokumen_id) VALUES (?, ?)');
        const insertMonitoring = db.prepare('INSERT INTO dokumen_monitoring_baris (import_project_id, master_dokumen_id) VALUES (?, ?)');
        for (const docId of document_requirements) {
          insertLink.run(pid, docId);
          insertMonitoring.run(pid, docId);
        }
      }