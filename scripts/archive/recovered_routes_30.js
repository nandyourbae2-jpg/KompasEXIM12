    let finalTaskNumber = task_unique_number;
    if (!finalTaskNumber) {
      const lastProject = db.prepare('SELECT task_unique_number FROM import_projects ORDER BY id DESC LIMIT 1').get();
      let nextNum = 1;
      if (lastProject && lastProject.task_unique_number) {
        const match = lastProject.task_unique_number.match(/IMP-(\d+)/);
        if (match) nextNum = parseInt(match[1]) + 1;
      }
      const year = new Date().getFullYear();
      finalTaskNumber = `IMP-${String(nextNum).padStart(3, '0')}-${year}`;
    }