const taskService = require('../src/services/taskService');

describe('Task Service Unit Tests', () => {
  beforeEach(() => {
    taskService._reset();
  });

  describe('create() and findById()', () => {
    it('creates a task and retrieves it by ID', () => {
      const task = taskService.create({ title: 'Unit Test Task', priority: 'high' });
      expect(task.id).toBeDefined();
      expect(task.title).toBe('Unit Test Task');
      
      const found = taskService.findById(task.id);
      expect(found).toEqual(task);
    });
  });

  describe('getByStatus()', () => {
    it('returns exact matches for status', () => {
      taskService.create({ title: 'Task 1', status: 'todo' });
      taskService.create({ title: 'Task 2', status: 'done' });
      
      const todos = taskService.getByStatus('do'); 
      expect(todos.length).toBe(0);
    });
  });

  describe('getPaginated()', () => {
    it('returns the first page correctly', () => {
      for (let i = 0; i < 5; i++) {
        taskService.create({ title: `Task ${i}` });
      }

      const pageOne = taskService.getPaginated(1, 2);
      expect(pageOne.length).toBe(2);
      expect(pageOne[0].title).toBe('Task 0');
    });
  });

  describe('completeTask()', () => {
    it('marks a task as done without altering other fields', () => {
      const task = taskService.create({ title: 'Keep Priority', priority: 'high' });
      const completed = taskService.completeTask(task.id);
      
      expect(completed.status).toBe('done');
      expect(completed.completedAt).not.toBeNull();
      expect(completed.priority).toBe('high'); 
    });
  });
});