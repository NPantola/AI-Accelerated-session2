const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const Database = require('better-sqlite3');

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Initialize in-memory SQLite database
const db = new Database(':memory:');

// Create tasks table
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    completed BOOLEAN DEFAULT 0,
    priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
    due_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Create indexes for better query performance
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);
  CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
  CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
  CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
`);

// Insert some initial sample tasks
const initialTasks = [
  { title: 'Complete project documentation', description: 'Write comprehensive docs for the todo app', priority: 'high', due_date: '2026-03-10 17:00:00' },
  { title: 'Review code changes', description: 'Review pull requests from team members', priority: 'medium', due_date: '2026-03-08 12:00:00' },
  { title: 'Update dependencies', description: 'Update npm packages to latest versions', priority: 'low', due_date: null },
  { title: 'Plan next sprint', description: null, priority: 'medium', due_date: '2026-03-12 09:00:00' },
  { title: 'Fix responsive design', description: 'Improve mobile layout for better UX', priority: 'high', due_date: '2026-03-07 15:00:00' }
];

const insertTaskStmt = db.prepare(`
  INSERT INTO tasks (title, description, priority, due_date) 
  VALUES (?, ?, ?, ?)
`);

initialTasks.forEach(task => {
  insertTaskStmt.run(task.title, task.description, task.priority, task.due_date);
});

console.log('In-memory database initialized with sample tasks');

// Prepared statements for better performance
const statements = {
  getAllTasks: db.prepare('SELECT * FROM tasks ORDER BY created_at DESC'),
  getTaskById: db.prepare('SELECT * FROM tasks WHERE id = ?'),
  insertTask: db.prepare(`
    INSERT INTO tasks (title, description, priority, due_date) 
    VALUES (?, ?, ?, ?)
  `),
  updateTask: db.prepare(`
    UPDATE tasks 
    SET title = ?, description = ?, priority = ?, due_date = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `),
  toggleTaskCompletion: db.prepare(`
    UPDATE tasks 
    SET completed = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `),
  deleteTask: db.prepare('DELETE FROM tasks WHERE id = ?')
};

// Utility functions
function buildTasksQuery(filters) {
  let sql = 'SELECT * FROM tasks WHERE 1=1';
  const params = [];

  if (filters.status && filters.status !== 'all') {
    if (filters.status === 'completed') {
      sql += ' AND completed = 1';
    } else if (filters.status === 'incomplete') {
      sql += ' AND completed = 0';
    }
  }

  if (filters.priority && filters.priority !== 'all') {
    sql += ' AND priority = ?';
    params.push(filters.priority);
  }

  if (filters.search && filters.search.trim()) {
    sql += ' AND (title LIKE ? OR description LIKE ?)';
    const searchTerm = `%${filters.search.trim()}%`;
    params.push(searchTerm, searchTerm);
  }

  if (filters.dueDateFrom) {
    sql += ' AND due_date >= ?';
    params.push(filters.dueDateFrom);
  }

  if (filters.dueDateTo) {
    sql += ' AND due_date <= ?';
    params.push(filters.dueDateTo);
  }

  // Add sorting
  const validSorts = ['due_date', 'priority', 'created_at', 'title', 'updated_at'];
  const sortBy = validSorts.includes(filters.sort) ? filters.sort : 'created_at';
  const sortOrder = filters.order === 'asc' ? 'ASC' : 'DESC';
  
  // Special handling for priority sorting
  if (sortBy === 'priority') {
    sql += ` ORDER BY CASE priority 
      WHEN 'high' THEN 1 
      WHEN 'medium' THEN 2 
      WHEN 'low' THEN 3 
      END ${sortOrder}, created_at DESC`;
  } else {
    sql += ` ORDER BY ${sortBy} ${sortOrder}`;
  }

  return { sql, params };
}

function validateTask(taskData, isUpdate = false) {
  const errors = [];

  if (!isUpdate || taskData.title !== undefined) {
    if (!taskData.title || typeof taskData.title !== 'string' || taskData.title.trim() === '') {
      errors.push('Title is required and must be a non-empty string');
    }
  }

  if (taskData.priority && !['low', 'medium', 'high'].includes(taskData.priority)) {
    errors.push('Priority must be one of: low, medium, high');
  }

  if (taskData.due_date) {
    const dueDate = new Date(taskData.due_date);
    if (isNaN(dueDate.getTime())) {
      errors.push('Due date must be a valid date');
    }
  }

  if (taskData.completed !== undefined && typeof taskData.completed !== 'boolean') {
    errors.push('Completed must be a boolean value');
  }

  return errors;
}

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Todo API server is running' });
});

// GET /api/tasks - List tasks with filtering, sorting, and search
app.get('/api/tasks', (req, res) => {
  try {
    const filters = {
      status: req.query.status || 'all',
      priority: req.query.priority || 'all',
      search: req.query.search || '',
      sort: req.query.sort || 'created_at',
      order: req.query.order || 'desc',
      dueDateFrom: req.query.dueDateFrom,
      dueDateTo: req.query.dueDateTo
    };

    const { sql, params } = buildTasksQuery(filters);
    const tasks = db.prepare(sql).all(...params);
    
    res.json({
      tasks,
      count: tasks.length,
      filters: filters
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// POST /api/tasks - Create new task
app.post('/api/tasks', (req, res) => {
  try {
    const { title, description, priority = 'medium', due_date } = req.body;
    
    const taskData = { title, description, priority, due_date };
    const validationErrors = validateTask(taskData);
    
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validationErrors 
      });
    }

    const result = statements.insertTask.run(
      title.trim(),
      description ? description.trim() : null,
      priority,
      due_date || null
    );

    const newTask = statements.getTaskById.get(result.lastInsertRowid);
    res.status(201).json(newTask);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// GET /api/tasks/:id - Get specific task
app.get('/api/tasks/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Valid task ID is required' });
    }

    const task = statements.getTaskById.get(parseInt(id));
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// PUT /api/tasks/:id - Update entire task
app.put('/api/tasks/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Valid task ID is required' });
    }

    const existingTask = statements.getTaskById.get(parseInt(id));
    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const { title, description, priority, due_date } = req.body;
    const taskData = { title, description, priority, due_date };
    const validationErrors = validateTask(taskData, true);
    
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validationErrors 
      });
    }

    const result = statements.updateTask.run(
      title ? title.trim() : existingTask.title,
      description !== undefined ? (description ? description.trim() : null) : existingTask.description,
      priority || existingTask.priority,
      due_date !== undefined ? due_date : existingTask.due_date,
      parseInt(id)
    );

    if (result.changes > 0) {
      const updatedTask = statements.getTaskById.get(parseInt(id));
      res.json(updatedTask);
    } else {
      res.status(404).json({ error: 'Task not found' });
    }
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// PATCH /api/tasks/:id/toggle - Toggle completion status
app.patch('/api/tasks/:id/toggle', (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Valid task ID is required' });
    }

    const existingTask = statements.getTaskById.get(parseInt(id));
    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const newCompletedStatus = !existingTask.completed;
    const result = statements.toggleTaskCompletion.run(newCompletedStatus ? 1 : 0, parseInt(id));

    if (result.changes > 0) {
      const updatedTask = statements.getTaskById.get(parseInt(id));
      res.json(updatedTask);
    } else {
      res.status(404).json({ error: 'Task not found' });
    }
  } catch (error) {
    console.error('Error toggling task completion:', error);
    res.status(500).json({ error: 'Failed to toggle task completion' });
  }
});

// DELETE /api/tasks/:id - Delete task
app.delete('/api/tasks/:id', (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Valid task ID is required' });
    }

    const existingTask = statements.getTaskById.get(parseInt(id));
    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const result = statements.deleteTask.run(parseInt(id));

    if (result.changes > 0) {
      res.json({ message: 'Task deleted successfully', id: parseInt(id) });
    } else {
      res.status(404).json({ error: 'Task not found' });
    }
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

module.exports = { app, db, statements };