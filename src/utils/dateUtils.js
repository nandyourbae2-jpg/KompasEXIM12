/**
 * Parses an EXIM date string robustly and returns a JavaScript Date object.
 * Fixes the 2001 bug where dates without years are parsed incorrectly.
 * 
 * @param {string|Date} dateInput 
 * @returns {Date}
 */
export const parseEximDate = (dateInput) => {
  if (!dateInput) return new Date();
  
  if (dateInput instanceof Date) return dateInput;

  const str = String(dateInput).trim();
  
  // Handle DD/MM or DD/MM/YYYY
  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 2) {
      // e.g. "29/7" -> defaults to 2026
      const [day, month] = parts;
      return new Date(2026, parseInt(month, 10) - 1, parseInt(day, 10));
    }
    if (parts.length === 3) {
      const [day, month, year] = parts;
      let parsedYear = parseInt(year, 10);
      
      // If year is suspiciously small (e.g. "01" or "1" which parses to 2001 by JS Date)
      if (parsedYear < 100) {
        parsedYear += 2000;
      }
      
      // Fix the explicit 2001 bug if the input literally says 2001 but we know the system started in 2024+
      if (parsedYear === 2001) {
        parsedYear = 2026;
      }

      return new Date(parsedYear, parseInt(month, 10) - 1, parseInt(day, 10));
    }
  }

  // Handle standard ISO parsing
  const parsedDate = new Date(str);
  
  // If Invalid Date or year is mysteriously 2001 (fallback fix)
  if (isNaN(parsedDate.getTime())) {
    return new Date(); // Default to today
  }
  
  if (parsedDate.getFullYear() === 2001) {
    parsedDate.setFullYear(2026);
  }

  return parsedDate;
};

/**
 * Formats a date to id-ID format safely
 * @param {string|Date} dateInput 
 * @returns {string}
 */
export const formatEximDate = (dateInput) => {
  if (!dateInput) return '-';
  const date = parseEximDate(dateInput);
  return date.toLocaleDateString('id-ID');
};
