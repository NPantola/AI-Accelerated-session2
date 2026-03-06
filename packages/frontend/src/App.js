import React, { useState } from 'react';
import {
  ThemeProvider,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  Fab,
  Box,
  Snackbar,
  Alert,
  Paper,
  Chip,
  Stack
} from '@mui/material';
import { Add as AddIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import theme from './theme/theme';
import useTasks from './hooks/useTasks';
import TaskList from './components/tasks/TaskList';
import TaskForm from './components/tasks/TaskForm';
import TaskFilters from './components/tasks/TaskFilters';
import TaskSearch from './components/tasks/TaskSearch';
import { getTaskStats } from './utils/taskUtils';

function App() {
  const {
    tasks,
    allTasks,
    loading,
    error,
    filters,
    createTask,
    updateTask,
    toggleTaskCompletion,
    deleteTask,
    updateFilters,
    refreshTasks,
    clearError
  } = useTasks();

  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Get task statistics for dashboard
  const taskStats = getTaskStats(allTasks);

  // Handle task creation
  const handleCreateTask = async (taskData) => {
    try {
      await createTask(taskData);
      setTaskFormOpen(false);
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  // Handle task editing
  const handleEditTask = (task) => {
    setEditingTask(task);
    setTaskFormOpen(true);
  };

  // Handle task update
  const handleUpdateTask = async (taskData) => {
    try {
      await updateTask(editingTask.id, taskData);
      setTaskFormOpen(false);
      setEditingTask(null);
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  // Handle form close
  const handleFormClose = () => {
    setTaskFormOpen(false);
    setEditingTask(null);
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    clearError();
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1, minHeight: '100vh', backgroundColor: 'background.default' }}>
        {/* App Bar */}
        <AppBar position="sticky" elevation={2}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Todo Application
            </Typography>
            <Fab
              color="secondary"
              size="small"
              onClick={refreshTasks}
              disabled={loading}
              sx={{ mr: 1 }}
            >
              <RefreshIcon />
            </Fab>
          </Toolbar>
        </AppBar>

        {/* Main Content */}
        <Container maxWidth="lg" sx={{ py: 3 }}>
          <Grid container spacing={3}>
            {/* Task Statistics */}
            <Grid item xs={12}>
              <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Task Overview
                </Typography>
                <Stack direction="row" spacing={2} flexWrap="wrap">
                  <Chip
                    label={`Total: ${taskStats.total}`}
                    color="primary"
                    variant="outlined"
                  />
                  <Chip
                    label={`Completed: ${taskStats.completed}`}
                    color="success"
                    variant="outlined"
                  />
                  <Chip
                    label={`Incomplete: ${taskStats.incomplete}`}
                    color="default"
                    variant="outlined"
                  />
                  {taskStats.overdue > 0 && (
                    <Chip
                      label={`Overdue: ${taskStats.overdue}`}
                      color="error"
                      variant="filled"
                    />
                  )}
                  {taskStats.dueSoon > 0 && (
                    <Chip
                      label={`Due Soon: ${taskStats.dueSoon}`}
                      color="warning"
                      variant="filled"
                    />
                  )}
                </Stack>
              </Paper>
            </Grid>

            {/* Search and Filters */}
            <Grid item xs={12} md={6}>
              <TaskSearch
                searchTerm={filters.search}
                onSearchChange={(search) => updateFilters({ search })}
                loading={loading}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TaskFilters
                filters={filters}
                onFiltersChange={updateFilters}
                loading={loading}
              />
            </Grid>

            {/* Task List */}
            <Grid item xs={12}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    Tasks ({tasks.length})
                  </Typography>
                  
                  {loading && (
                    <Box display="flex" justifyContent="center" p={3}>
                      <Typography>Loading tasks...</Typography>
                    </Box>
                  )}

                  {!loading && tasks.length === 0 && (
                    <Box display="flex" flexDirection="column" alignItems="center" p={4}>
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No tasks found
                      </Typography>
                      <Typography variant="body2" color="text.secondary" mb={2}>
                        {filters.search || filters.status !== 'all' || filters.priority !== 'all'
                          ? 'Try adjusting your filters or search terms'
                          : 'Create your first task to get started'}
                      </Typography>
                    </Box>
                  )}

                  {!loading && tasks.length > 0 && (
                    <TaskList
                      tasks={tasks}
                      onEditTask={handleEditTask}
                      onDeleteTask={deleteTask}
                      onToggleComplete={toggleTaskCompletion}
                    />
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Floating Action Button */}
          <Fab
            color="primary"
            aria-label="add task"
            onClick={() => setTaskFormOpen(true)}
            sx={{
              position: 'fixed',
              bottom: 16,
              right: 16,
              zIndex: 1000
            }}
          >
            <AddIcon />
          </Fab>

          {/* Task Form Modal */}
          <TaskForm
            open={taskFormOpen}
            task={editingTask}
            onClose={handleFormClose}
            onSave={editingTask ? handleUpdateTask : handleCreateTask}
          />

          {/* Error Snackbar */}
          <Snackbar
            open={!!error}
            autoHideDuration={6000}
            onClose={handleSnackbarClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          >
            <Alert
              onClose={handleSnackbarClose}
              severity="error"
              variant="filled"
              sx={{ width: '100%' }}
            >
              {error}
            </Alert>
          </Snackbar>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;