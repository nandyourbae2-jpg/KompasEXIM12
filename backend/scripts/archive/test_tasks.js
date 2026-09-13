const TaskService = require('./src/services/TaskService');
async function test() {
  const user = { id: 7, level_otoritas: 'Staff Dept', departemen: 'Import' };
  const tasks = await TaskService.getTasksForUser(user, 'Import');
  console.log(JSON.stringify(tasks, null, 2));
}
test();
