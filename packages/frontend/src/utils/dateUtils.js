import { format, formatDistance, parseISO, isPast, isToday, isTomorrow, addDays } from 'date-fns';

/**
 * Format a date for display in the UI
 * @param {string|Date} date - Date to format
 * @param {string} formatStr - Format string (default: 'MMM d, yyyy')
 * @returns {string} Formatted date string
 */
export const formatDate = (date, formatStr = 'MMM d, yyyy') => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatStr);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

/**
 * Format a date and time for display
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date and time string
 */
export const formatDateTime = (date) => {
  return formatDate(date, 'MMM d, yyyy \'at\' h:mm a');
};

/**
 * Get relative time from now (e.g., "2 days ago", "in 3 hours")
 * @param {string|Date} date - Date to compare
 * @returns {string} Relative time string
 */
export const getRelativeTime = (date) => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return formatDistance(dateObj, new Date(), { addSuffix: true });
  } catch (error) {
    console.error('Error getting relative time:', error);
    return '';
  }
};

/**
 * Check if a date is overdue (past and not today)
 * @param {string|Date} date - Date to check
 * @returns {boolean} True if overdue
 */
export const isOverdue = (date) => {
  if (!date) return false;
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return isPast(dateObj) && !isToday(dateObj);
  } catch (error) {
    console.error('Error checking if date is overdue:', error);
    return false;
  }
};

/**
 * Check if a task is due soon (today or tomorrow)
 * @param {string|Date} date - Date to check
 * @returns {boolean} True if due soon
 */
export const isDueSoon = (date) => {
  if (!date) return false;
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return isToday(dateObj) || isTomorrow(dateObj);
  } catch (error) {
    console.error('Error checking if date is due soon:', error);
    return false;
  }
};

/**
 * Get the status of a due date for styling purposes
 * @param {string|Date} date - Due date to check
 * @returns {string} Status: 'overdue', 'due-soon', 'future', or 'none'
 */
export const getDueDateStatus = (date) => {
  if (!date) return 'none';
  
  if (isOverdue(date)) return 'overdue';
  if (isDueSoon(date)) return 'due-soon';
  return 'future';
};

/**
 * Format date for HTML datetime-local input
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string for input
 */
export const formatDateForInput = (date) => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, "yyyy-MM-dd'T'HH:mm");
  } catch (error) {
    console.error('Error formatting date for input:', error);
    return '';
  }
};

/**
 * Check if a date string is valid
 * @param {string} dateString - Date string to validate
 * @returns {boolean} True if valid
 */
export const isValidDate = (dateString) => {
  if (!dateString) return false;
  
  try {
    const date = parseISO(dateString);
    return !isNaN(date.getTime());
  } catch (error) {
    return false;
  }
};

/**
 * Get default due date options for quick selection
 * @returns {Array} Array of due date options
 */
export const getQuickDueDateOptions = () => [
  {
    label: 'Today',
    value: format(new Date(), "yyyy-MM-dd'T'17:00:00")
  },
  {
    label: 'Tomorrow',
    value: format(addDays(new Date(), 1), "yyyy-MM-dd'T'09:00:00")
  },
  {
    label: 'Next Week',
    value: format(addDays(new Date(), 7), "yyyy-MM-dd'T'09:00:00")
  }
];