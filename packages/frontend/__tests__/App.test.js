import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import App from '../src/App';

// Mock server to intercept API requests
const server = setupServer(
  // GET /api/tasks handler
  rest.get('/api/tasks', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        tasks: [
          { 
            id: 1, 
            title: 'Test Task 1', 
            description: 'First test task',
            completed: false,
            priority: 'high',
            due_date: '2026-03-10 17:00:00',
            created_at: '2026-03-06T22:36:06.000Z',
            updated_at: '2026-03-06T22:36:06.000Z'
          },
          { 
            id: 2, 
            title: 'Test Task 2', 
            description: 'Second test task',
            completed: true,
            priority: 'medium',
            due_date: null,
            created_at: '2026-03-06T22:36:06.000Z',
            updated_at: '2026-03-06T22:36:06.000Z'
          },
        ],
        count: 2,
        filters: { status: 'all', priority: 'all', search: '', sort: 'created_at', order: 'desc' }
      })
    );
  }),
  
  // POST /api/tasks handler
  rest.post('/api/tasks', (req, res, ctx) => {
    const { title, description, priority, due_date } = req.body;
    
    if (!title || title.trim() === '') {
      return res(
        ctx.status(400),
        ctx.json({ error: 'Title is required' })
      );
    }
    
    return res(
      ctx.status(201),
      ctx.json({
        id: 3,
        title: title,
        description: description || null,
        completed: false,
        priority: priority || 'medium',
        due_date: due_date || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    );
  }),

  // PATCH /api/tasks/:id/toggle handler
  rest.patch('/api/tasks/:id/toggle', (req, res, ctx) => {
    const { id } = req.params;
    return res(
      ctx.status(200),
      ctx.json({
        id: parseInt(id),
        title: 'Test Task',
        description: 'Test description',
        completed: true,
        priority: 'medium',
        due_date: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    );
  })
);

// Setup and teardown for the mock server
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('App Component', () => {
  test('renders the main app title', async () => {
    render(<App />);
    expect(screen.getByText('Todo Application')).toBeInTheDocument();
  });

  test('loads and displays tasks', async () => {
    render(<App />);
    
    // Wait for tasks to load and be displayed
    await waitFor(() => {
      expect(screen.getByText('Test Task 1')).toBeInTheDocument();
      expect(screen.getByText('Test Task 2')).toBeInTheDocument();
    });
    
    // Check that task overview stats are displayed
    expect(screen.getByText('Total: 2')).toBeInTheDocument();
  });

  test('displays task overview statistics', async () => {
    render(<App />);
    
    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText('Task Overview')).toBeInTheDocument();
      expect(screen.getByText('Total: 2')).toBeInTheDocument();
      expect(screen.getByText('Completed: 1')).toBeInTheDocument();
      expect(screen.getByText('Incomplete: 1')).toBeInTheDocument();
    });
  });

  test('shows add task button', async () => {
    render(<App />);
    
    const addButton = screen.getByRole('button', { name: /add task/i });
    expect(addButton).toBeInTheDocument();
  });
});