/**
 * Task API tests
 */

import { db } from '../../src/api/db/mock';

describe('Task API', () => {
  describe('getTasks', () => {
    it('returns tasks for a project', () => {
      const tasks = db.getTasks('proj-1');
      expect(tasks.length).toBeGreaterThan(0);
      expect(tasks[0].project_id).toBe('proj-1');
    });

    it('returns empty array for non-existent project', () => {
      const tasks = db.getTasks('nonexistent');
      expect(tasks).toEqual([]);
    });
  });

  describe('createTask', () => {
    it('creates a new task', () => {
      const task = db.createTask({
        project_id: 'proj-1',
        title: 'New task',
        status: 'todo',
        priority: 'high',
      });
      expect(task.title).toBe('New task');
      expect(task.project_id).toBe('proj-1');
      expect(task.status).toBe('todo');
    });
  });

  describe('updateTask', () => {
    it('updates task status', () => {
      const originalTask = db.getTasks('proj-1')[0];
      const updated = db.updateTask(originalTask.id, { status: 'done' });
      expect(updated?.status).toBe('done');
      expect(updated?.id).toBe(originalTask.id);
    });
  });

  describe('deleteTask', () => {
    it('deletes a task', () => {
      const task = db.createTask({
        project_id: 'proj-1',
        title: 'Task to delete',
        status: 'todo',
        priority: 'low',
      });
      const success = db.deleteTask(task.id);
      expect(success).toBe(true);
      expect(db.getTask(task.id)).toBeUndefined();
    });

    it('returns false for non-existent task', () => {
      const success = db.deleteTask('nonexistent');
      expect(success).toBe(false);
    });
  });
});
