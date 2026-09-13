const TaskRepository = require('../repositories/TaskRepository');

class TaskService {
  async _verifyOwnership(taskId, user, scopedDepartment) {
    if (user.level_otoritas === 'Manager') return;
    const task = await TaskRepository.findById(taskId);
    if (!task) {
      const { ApiError } = require('../utils/errors');
      throw new ApiError(404, 'NOT_FOUND', 'Task tidak ditemukan');
    }
    if (task.departemen !== scopedDepartment) {
      const { ApiError } = require('../utils/errors');
      throw new ApiError(403, 'FORBIDDEN', 'Akses ditolak. Task ini milik departemen lain.');
    }
  }

  async getTasksForUser(user, scopedDepartment, query = {}) {
    const where = {};
    if (user.level_otoritas !== 'Manager') {
      if (scopedDepartment) where.department = scopedDepartment;
      if (user.level_otoritas === 'Staff Dept') where.assigneeId = user.id;
    }
    
    if (query.sumber_tugas) where.sumber_tugas = query.sumber_tugas;
    if (query.assigned_by_me === 'true') where.assigned_by_id = user.id;
    
    return await TaskRepository.findAll(where);
  }

  async createTask(payload) {
    const { title, department, priority, status, assigneeId, dueDate, importProjectId, shipment_un, sumber_tugas, assigned_by_id, notes, statusHistory } = payload;
    const taskData = {
      task_code: `TSK-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      title,
      department,
      priority,
      status,
      assigneeId,
      dueDate,
      importProjectId,
      shipment_un,
      sumber_tugas,
      assigned_by_id,
      notes
    };
    return await TaskRepository.create(taskData, statusHistory || []);
  }

  async updateTaskNotes(id, notes, reqUser, reqScopedDepartment) {
    await this._verifyOwnership(id, reqUser, reqScopedDepartment);
    return await TaskRepository.update(id, { notes });
  }

  async moveTask(id, payload, reqUser, reqScopedDepartment) {
    await this._verifyOwnership(id, reqUser, reqScopedDepartment);
    
    const { status, label, fromStatus, timestamp, diubah_oleh_id } = payload;
    const columns = ['Backlog', 'Akan Dikerjakan', 'Dalam Proses', 'Review', 'Selesai'];
    const fromIndex = columns.indexOf(fromStatus);
    const toIndex = columns.indexOf(status);

    if (fromIndex === -1 || toIndex === -1) {
      const { ApiError } = require('../utils/errors');
      throw new ApiError(400, 'BAD_REQUEST', 'Status tidak valid');
    }
    
    if (Math.abs(toIndex - fromIndex) !== 1) {
      const { ApiError } = require('../utils/errors');
      throw new ApiError(400, 'BAD_REQUEST', 'Transisi status harus sekuensial (1 langkah maju atau mundur)');
    }

    const historyEntry = {
      status,
      label,
      fromStatus,
      timestamp: new Date(timestamp),
      diubah_oleh_id
    };
    return await TaskRepository.updateWithHistory(id, { status }, historyEntry);
  }

  async deleteTask(id, reqUser, reqScopedDepartment) {
    await this._verifyOwnership(id, reqUser, reqScopedDepartment);
    return await TaskRepository.delete(id);
  }
}

module.exports = new TaskService();
