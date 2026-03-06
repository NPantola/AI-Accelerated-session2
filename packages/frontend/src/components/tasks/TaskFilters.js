import React from 'react';
import {
  Paper,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  Stack
} from '@mui/material';
import { 
  TASK_STATUS, 
  PRIORITY_LEVELS, 
  SORT_OPTIONS, 
  SORT_ORDERS,
  getPriorityLabel 
} from '../../utils/taskUtils';

const TaskFilters = ({ filters, onFiltersChange, loading }) => {
  const handleFilterChange = (field) => (event) => {
    onFiltersChange({ [field]: event.target.value });
  };

  const getSortLabel = (sortOption) => {
    const labels = {
      [SORT_OPTIONS.DUE_DATE]: 'Due Date',
      [SORT_OPTIONS.PRIORITY]: 'Priority',
      [SORT_OPTIONS.CREATED]: 'Created Date',
      [SORT_OPTIONS.TITLE]: 'Title',
      [SORT_OPTIONS.UPDATED]: 'Last Updated'
    };
    return labels[sortOption] || sortOption;
  };

  const getStatusLabel = (status) => {
    const labels = {
      [TASK_STATUS.ALL]: 'All Tasks',
      [TASK_STATUS.COMPLETED]: 'Completed',
      [TASK_STATUS.INCOMPLETE]: 'Incomplete'
    };
    return labels[status] || status;
  };

  return (
    <Paper elevation={1} sx={{ p: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        Filters & Sorting
      </Typography>
      
      <Stack spacing={2}>
        <Grid container spacing={2}>
          {/* Status Filter */}
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status || TASK_STATUS.ALL}
                onChange={handleFilterChange('status')}
                label="Status"
                disabled={loading}
              >
                {Object.values(TASK_STATUS).map((status) => (
                  <MenuItem key={status} value={status}>
                    {getStatusLabel(status)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Priority Filter */}
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Priority</InputLabel>
              <Select
                value={filters.priority || 'all'}
                onChange={handleFilterChange('priority')}
                label="Priority"
                disabled={loading}
              >
                <MenuItem value="all">All Priorities</MenuItem>
                {Object.values(PRIORITY_LEVELS).map((priority) => (
                  <MenuItem key={priority} value={priority}>
                    {getPriorityLabel(priority)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Sort By */}
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Sort By</InputLabel>
              <Select
                value={filters.sort || SORT_OPTIONS.CREATED}
                onChange={handleFilterChange('sort')}
                label="Sort By"
                disabled={loading}
              >
                {Object.values(SORT_OPTIONS).map((sortOption) => (
                  <MenuItem key={sortOption} value={sortOption}>
                    {getSortLabel(sortOption)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Sort Order */}
        <Box>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Order</InputLabel>
            <Select
              value={filters.order || SORT_ORDERS.DESC}
              onChange={handleFilterChange('order')}
              label="Order"
              disabled={loading}
            >
              <MenuItem value={SORT_ORDERS.ASC}>
                {filters.sort === SORT_OPTIONS.TITLE ? 'A-Z' : 'Oldest First'}
              </MenuItem>
              <MenuItem value={SORT_ORDERS.DESC}>
                {filters.sort === SORT_OPTIONS.TITLE ? 'Z-A' : 'Newest First'}
              </MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Stack>
    </Paper>
  );
};

export default TaskFilters;