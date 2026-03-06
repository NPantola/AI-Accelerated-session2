import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
  Stack
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { 
  PRIORITY_LEVELS, 
  getPriorityLabel, 
  validateTaskData,
  createDefaultTask 
} from '../../utils/taskUtils';
import { getQuickDueDateOptions } from '../../utils/dateUtils';

const TaskForm = ({ open, task, onClose, onSave }) => {
  const [formData, setFormData] = useState(createDefaultTask());
  const [validationErrors, setValidationErrors] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || PRIORITY_LEVELS.MEDIUM,
        due_date: task.due_date ? new Date(task.due_date) : null
      });
    } else {
      setFormData(createDefaultTask());
    }
    setValidationErrors([]);
  }, [task, open]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    // Validate form data
    const errors = validateTaskData({
      ...formData,
      due_date: formData.due_date ? formData.due_date.toISOString() : null
    });
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      setSaving(true);
      setValidationErrors([]);
      
      const taskData = {
        ...formData,
        due_date: formData.due_date ? formData.due_date.toISOString() : null
      };
      
      await onSave(taskData);
    } catch (error) {
      setValidationErrors([error.message]);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    
    // Clear validation errors when user starts typing
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({
      ...prev,
      due_date: date
    }));
    
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const handleQuickDateSelect = (dateValue) => {
    setFormData(prev => ({
      ...prev,
      due_date: new Date(dateValue)
    }));
  };

  const handleClose = () => {
    setValidationErrors([]);
    onClose();
  };

  const isEditing = !!task;
  const quickDueDateOptions = getQuickDueDateOptions();

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="task-form-dialog-title"
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle id="task-form-dialog-title">
          {isEditing ? 'Edit Task' : 'Create New Task'}
        </DialogTitle>
        
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <Alert severity="error">
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </Alert>
            )}

            {/* Title Field */}
            <TextField
              label="Task Title"
              value={formData.title}
              onChange={handleChange('title')}
              fullWidth
              required
              autoFocus={!isEditing}
              variant="outlined"
              placeholder="Enter a descriptive title for your task"
              error={validationErrors.some(error => error.includes('Title'))}
            />

            {/* Description Field */}
            <TextField
              label="Description"
              value={formData.description}
              onChange={handleChange('description')}
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              placeholder="Add details about your task (optional)"
            />

            {/* Priority Selection */}
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={formData.priority}
                onChange={handleChange('priority')}
                label="Priority"
              >
                {Object.values(PRIORITY_LEVELS).map((priority) => (
                  <MenuItem key={priority} value={priority}>
                    {getPriorityLabel(priority)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Due Date Selection */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Due Date (optional)
              </Typography>
              
              {/* Quick Date Options */}
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                {quickDueDateOptions.map((option) => (
                  <Button
                    key={option.label}
                    variant="outlined"
                    size="small"
                    onClick={() => handleQuickDateSelect(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
                {formData.due_date && (
                  <Button
                    variant="outlined"
                    size="small"
                    color="secondary"
                    onClick={() => handleDateChange(null)}
                  >
                    Clear
                  </Button>
                )}
              </Stack>

              {/* Date Time Picker */}
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateTimePicker
                  label="Select due date and time"
                  value={formData.due_date}
                  onChange={handleDateChange}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      variant="outlined"
                    />
                  )}
                  minDateTime={new Date()}
                />
              </LocalizationProvider>
            </Box>
          </Stack>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button
            onClick={handleClose}
            disabled={saving}
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={saving || !formData.title.trim()}
            color="primary"
          >
            {saving 
              ? (isEditing ? 'Updating...' : 'Creating...') 
              : (isEditing ? 'Update Task' : 'Create Task')
            }
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default TaskForm;