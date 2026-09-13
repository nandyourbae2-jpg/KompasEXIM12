/**
 * Status: Temporary
 * Purpose: Backward Compatibility
 * Planned Removal Phase: Phase 3 (Prisma Migration Completion)
 * 
 * Description: 
 * This middleware normalizes legacy Indonesian payload keys into their Prisma equivalents.
 * It ensures that automated tests and the React frontend can continue functioning
 * without requiring immediate rewrites, while allowing the backend to strictly
 * validate and operate on the newer Prisma schemas (e.g., `title`, `priority`).
 */

function payloadAdapter(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    // Map legacy 'judul' to 'title'
    if (req.body.judul !== undefined && req.body.title === undefined) {
      req.body.title = req.body.judul;
    }
    
    // Map legacy 'deskripsi' or 'catatan' to 'notes' (or 'description' depending on context, assuming tasks)
    if (req.body.deskripsi !== undefined && req.body.notes === undefined) {
      req.body.notes = req.body.deskripsi;
    }

    // Map legacy 'departemen' to 'department'
    if (req.body.departemen !== undefined && req.body.department === undefined) {
      req.body.department = req.body.departemen;
    }

    // Map legacy 'prioritas' to 'priority'
    if (req.body.prioritas !== undefined && req.body.priority === undefined) {
      req.body.priority = req.body.prioritas;
    }
    
    // Map legacy 'tenggat' to 'dueDate'
    if (req.body.tenggat !== undefined && req.body.dueDate === undefined) {
      req.body.dueDate = req.body.tenggat;
    }
    
    // Maintain assignee mapping
    if (req.body.assignee_id !== undefined && req.body.assigneeId === undefined) {
      req.body.assigneeId = req.body.assignee_id;
    }
  }
  
  next();
}

module.exports = { payloadAdapter };
