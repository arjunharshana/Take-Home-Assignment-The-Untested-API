const request = require('supertest');
const app = require('../src/app');
const taskService = require('../src/services/taskService');

describe('Tasks API Integration Tests', () => {
  beforeEach(() => {
    taskService._reset();
  });

  describe('POST /tasks', () => {
    it('returns 201 and creates a task (Happy Path)', async () => {
      const res = await request(app)
        .post('/tasks')
        .send({ title: 'API Task', priority: 'high', status: 'todo' });
      
      expect(res.status).toBe(201);
      expect(res.body.title).toBe('API Task');
      expect(res.body.id).toBeDefined();
    });

    it('returns 400 when title is empty (Edge Case 1)', async () => {
      const res = await request(app).post('/tasks').send({ title: '   ' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/title is required/);
    });

    it('returns 400 for invalid dueDate format (Edge Case 2)', async () => {
      const res = await request(app)
        .post('/tasks')
        .send({ title: 'Date Test', dueDate: 'not-a-date' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/valid ISO date/);
    });
  });

  describe('GET /tasks', () => {
    it('returns 200 and lists all tasks (Happy Path)', async () => {
      taskService.create({ title: 'Task A' });
      taskService.create({ title: 'Task B' });
      const res = await request(app).get('/tasks');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
    });

    it('returns 200 and an empty array when no tasks exist (Edge Case 1)', async () => {
      const res = await request(app).get('/tasks');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('handles unexpected query parameters gracefully (Edge Case 2)', async () => {
      taskService.create({ title: 'Task A' });
      const res = await request(app).get('/tasks?unknownParam=true');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
    });
  });

  describe('PUT /tasks/:id', () => {
    it('returns 200 and updates the task (Happy Path)', async () => {
      const task = taskService.create({ title: 'Old Title' });
      const res = await request(app)
        .put(`/tasks/${task.id}`)
        .send({ title: 'New Title' });
      expect(res.status).toBe(200);
      expect(res.body.title).toBe('New Title');
    });

    it('returns 404 for a non-existent task ID (Edge Case 1)', async () => {
      const res = await request(app).put('/tasks/fake-id').send({ title: 'Test' });
      expect(res.status).toBe(404);
    });

    it('returns 400 if trying to update with an invalid priority (Edge Case 2)', async () => {
      const task = taskService.create({ title: 'Priority Test' });
      const res = await request(app)
        .put(`/tasks/${task.id}`)
        .send({ priority: 'urgent' });
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /tasks/:id', () => {
    it('returns 204 when successfully deleted (Happy Path)', async () => {
      const task = taskService.create({ title: 'To Delete' });
      const res = await request(app).delete(`/tasks/${task.id}`);
      expect(res.status).toBe(204);
    });

    it('returns 404 when deleting a non-existent task (Edge Case 1)', async () => {
      const res = await request(app).delete('/tasks/fake-id');
      expect(res.status).toBe(404);
    });

    it('returns 404 when deleting the same task twice (Edge Case 2)', async () => {
      const task = taskService.create({ title: 'Double Delete' });
      await request(app).delete(`/tasks/${task.id}`);
      const res2 = await request(app).delete(`/tasks/${task.id}`);
      expect(res2.status).toBe(404);
    });
  });

  describe('PATCH /tasks/:id/complete', () => {
    it('returns 200 and updates status to done (Happy Path)', async () => {
      const task = taskService.create({ title: 'To Complete' });
      const res = await request(app).patch(`/tasks/${task.id}/complete`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('done');
      expect(res.body.completedAt).not.toBeNull();
    });

    it('returns 404 for a non-existent task (Edge Case 1)', async () => {
      const res = await request(app).patch('/tasks/fake-id/complete');
      expect(res.status).toBe(404);
    });

    it('returns 200 and safely handles completing an already completed task (Edge Case 2)', async () => {
      const task = taskService.create({ title: 'Already Done', status: 'done' });
      const res = await request(app).patch(`/tasks/${task.id}/complete`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('done');
    });
  });

  describe('GET /tasks/stats', () => {
    it('returns 200 with correct aggregate stats (Happy Path)', async () => {
      const res = await request(app).get('/tasks/stats');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ todo: 0, in_progress: 0, done: 0, overdue: 0 });
    });

    it('correctly ignores tasks without due dates when calculating overdue (Edge Case 1)', async () => {
      taskService.create({ title: 'No Due Date', status: 'todo' });
      const res = await request(app).get('/tasks/stats');
      expect(res.body.overdue).toBe(0);
    });

    it('does not count completed tasks as overdue even if the date is past (Edge Case 2)', async () => {
      const pastDate = new Date(Date.now() - 86400000).toISOString();
      taskService.create({ title: 'Past but done', status: 'done', dueDate: pastDate });
      const res = await request(app).get('/tasks/stats');
      expect(res.body.overdue).toBe(0);
    });
  });

  describe('PATCH /tasks/:id/assign', () => {
    it('returns 200 and assigns a user to a task (Happy Path)', async () => {
      const task = taskService.create({ title: 'Task to assign' });
      const res = await request(app)
        .patch(`/tasks/${task.id}/assign`)
        .send({ assignee: 'Alice' });

      expect(res.status).toBe(200);
      expect(res.body.assignee).toBe('Alice');
      expect(res.body.id).toBe(task.id);
    });

    it('returns 404 if the task does not exist', async () => {
      const res = await request(app)
        .patch('/tasks/non-existent-id/assign')
        .send({ assignee: 'Alice' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Task not found');
    });

    it('returns 400 when assignee is missing or empty string', async () => {
      const task = taskService.create({ title: 'Task to assign' });
      
      const emptyRes = await request(app)
        .patch(`/tasks/${task.id}/assign`)
        .send({ assignee: '   ' });
      expect(emptyRes.status).toBe(400);

      const missingRes = await request(app)
        .patch(`/tasks/${task.id}/assign`)
        .send({});
      expect(missingRes.status).toBe(400);
    });

    it('returns 200 and successfully reassigns an already assigned task', async () => {
      const task = taskService.create({ title: 'Task to reassign' });
      await request(app)
        .patch(`/tasks/${task.id}/assign`)
        .send({ assignee: 'Alice' });

      const res = await request(app)
        .patch(`/tasks/${task.id}/assign`)
        .send({ assignee: 'Bob' });

      expect(res.status).toBe(200);
      expect(res.body.assignee).toBe('Bob');
    });
  });
});