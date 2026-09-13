        for (const docId of document_requirements) {
          console.log("INSERTING docId:", docId);
          insertLink.run(pid, docId);
          insertMonitoring.run(pid, docId);
        }