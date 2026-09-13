const express = require('express');
const router = express.Router();
const TaskService = require('../../services/TaskService');
const { authenticateToken, requireRole, authorizeDepartment } = require('../../middleware/auth');
const { validatePayload } = require('../../middleware/validation');
const ApiResponse = require('../../utils/ApiResponse');

router.get('/tasks', authenticateToken, authorizeDepartment(), async (req, res, next) => {
  try {
    const tasks = await TaskService.getTasksForUser(req.user, req.scopedDepartment, req.query);
    ApiResponse.send(req, res, tasks);
  } catch (error) { next(error); }
});

router.post('/tasks', authenticateToken, requireRole(['Supervisor', 'Staff Dept']), authorizeDepartment('Import'), validatePayload(['title', 'status']), async (req, res, next) => {
  try {
    const task = await TaskService.createTask(req.body);
    ApiResponse.send(req, res, task);
  } catch (error) { next(error); }
});

router.patch('/tasks/:id', authenticateToken, requireRole(['Supervisor', 'Staff Dept']), authorizeDepartment(), async (req, res, next) => {
  try {
    const { notes } = req.body;
    const task = await TaskService.updateTaskNotes(req.params.id, notes, req.user, req.scopedDepartment);
    ApiResponse.send(req, res, task);
  } catch (error) { next(error); }
});

router.post('/tasks/:id/move', authenticateToken, requireRole(['Supervisor', 'Staff Dept']), authorizeDepartment(), validatePayload(['status', 'timestamp']), async (req, res, next) => {
  try {
    const task = await TaskService.moveTask(req.params.id, req.body, req.user, req.scopedDepartment);
    ApiResponse.send(req, res, task);
  } catch (error) { next(error); }
});

router.delete('/tasks/:id', authenticateToken, requireRole(['Supervisor', 'Staff Dept']), authorizeDepartment(), async (req, res, next) => {
  try {
    await TaskService.deleteTask(req.params.id, req.user, req.scopedDepartment);
    ApiResponse.send(req, res, { success: true });
  } catch (error) { next(error); }
});

module.exports = router;
