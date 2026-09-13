      // 2. Upsert masing-masing active category
      for (const cat of activeCategories) {
        if (!cat.inv || String(cat.inv).trim() === '' || cat.dpp <= 0) continue;
        activeKeys.add(cat.key);