import React from 'react';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox,
  IconButton,
  Chip,
  Typography,
  Box,
  Divider
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { formatDate, getDueDateStatus } from '../../utils/dateUtils';
import { getPriorityColor, getPriorityLabel } from '../../utils/taskUtils';
import { priorityColors } from '../../theme/theme';

const TaskList = ({ tasks, onEditTask, onDeleteTask, onToggleComplete }) => {
  if (!tasks || tasks.length === 0) {
    return null;
  }

  const handleToggleComplete = (taskId) => {
    onToggleComplete(taskId);
  };

  const handleEditClick = (task, event) => {
    event.stopPropagation();
    onEditTask(task);
  };

  const handleDeleteClick = (taskId, event) => {
    event.stopPropagation();
    if (window.confirm('Are you sure you want to delete this task?')) {
      onDeleteTask(taskId);
    }
  };

  const getDueDateChipProps = (dueDate) => {
    const status = getDueDateStatus(dueDate);
    
    switch (status) {
      case 'overdue':
        return { color: 'error', label: `Overdue: ${formatDate(dueDate)}` };
      case 'due-soon':
        return { color: 'warning', label: `Due: ${formatDate(dueDate)}` };
      case 'future':
        return { color: 'info', label: `Due: ${formatDate(dueDate)}` };
      default:
        return null;
    }
  };

  return (
    <List sx={{ width: '100%' }}>
      {tasks.map((task, index) => {
        const dueDateChipProps = getDueDateChipProps(task.due_date);
        const priorityColor = getPriorityColor(task.priority);
        
        return (
          <React.Fragment key={task.id}>
            <ListItem
              disablePadding
              sx={{
                borderLeft: 4,
                borderLeftColor: priorityColors[task.priority] || priorityColors.medium,
                mb: 1,
                bgcolor: task.completed ? 'action.hover' : 'background.paper',
                borderRadius: 1,
                '&:hover': {
                  bgcolor: 'action.hover'
                }
              }}
            >
              <ListItemButton
                role={undefined}
                onClick={() => handleToggleComplete(task.id)}
                dense
              >
                <ListItemIcon>
                  <Checkbox
                    edge="start"
                    checked={task.completed}
                    tabIndex={-1}
                    disableRipple
                    color="success"
                  />
                </ListItemIcon>
                
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography
                        variant="body1"
                        sx={{
                          textDecoration: task.completed ? 'line-through' : 'none',
                          color: task.completed ? 'text.secondary' : 'text.primary',
                          fontWeight: task.completed ? 400 : 500
                        }}
                      >
                        {task.title}
                      </Typography>
                      
                      <Chip
                        label={getPriorityLabel(task.priority)}
                        size="small"
                        color={priorityColor}
                        variant="outlined"
                        sx={{ ml: 1 }}
                      />
                    </Box>
                  }
                  secondary={
                    <Box mt={1}>
                      {task.description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mb: 1,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {task.description}
                        </Typography>
                      )}
                      
                      <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                        {dueDateChipProps && (
                          <Chip
                            icon={<ScheduleIcon />}
                            label={dueDateChipProps.label}
                            size="small"
                            color={dueDateChipProps.color}
                            variant="filled"
                          />
                        )}
                        
                        <Typography variant="caption" color="text.secondary">
                          Created: {formatDate(task.created_at)}
                        </Typography>
                        
                        {task.updated_at && task.updated_at !== task.created_at && (
                          <Typography variant="caption" color="text.secondary">
                            • Updated: {formatDate(task.updated_at)}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  }
                />
                
                <ListItemSecondaryAction>
                  <Box display="flex" gap={0.5}>
                    <IconButton
                      edge="end"
                      aria-label="edit"
                      onClick={(event) => handleEditClick(task, event)}
                      size="small"
                      color="primary"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={(event) => handleDeleteClick(task.id, event)}
                      size="small"
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </ListItemSecondaryAction>
              </ListItemButton>
            </ListItem>
            
            {index < tasks.length - 1 && (
              <Divider variant="inset" component="li" sx={{ ml: 7 }} />
            )}
          </React.Fragment>
        );
      })}
    </List>
  );
};

export default TaskList;