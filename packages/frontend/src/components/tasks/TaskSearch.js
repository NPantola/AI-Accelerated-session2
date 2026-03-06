import React from 'react';
import {
  TextField,
  InputAdornment,
  Paper,
  Box
} from '@mui/material';
import { Search as SearchIcon, Clear as ClearIcon } from '@mui/icons-material';

const TaskSearch = ({ searchTerm, onSearchChange, loading, placeholder = "Search tasks..." }) => {
  const handleSearchChange = (event) => {
    onSearchChange(event.target.value);
  };

  const handleClearSearch = () => {
    onSearchChange('');
  };

  return (
    <Paper elevation={1} sx={{ p: 2 }}>
      <Box>
        <TextField
          fullWidth
          variant="outlined"
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleSearchChange}
          disabled={loading}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <ClearIcon
                  color="action"
                  onClick={handleClearSearch}
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': { color: 'text.primary' }
                  }}
                />
              </InputAdornment>
            )
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              '&:hover fieldset': {
                borderColor: 'primary.main',
              },
            },
          }}
        />
      </Box>
    </Paper>
  );
};

export default TaskSearch;