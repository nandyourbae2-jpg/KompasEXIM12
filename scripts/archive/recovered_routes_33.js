    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')");
      values.push(req.params.id);
      db.prepare(`UPDATE import_projects SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }