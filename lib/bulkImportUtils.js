import * as XLSX from 'xlsx';
import Papa from 'papaparse';

// Validate required fields for different data types
export const validateData = {
  clients: (data) => {
    const requiredFields = ['name', 'balance'];
    return data.map(item => {
      const errors = requiredFields.filter(field => !item[field]);
      return {
        ...item,
        isValid: errors.length === 0,
        errors: errors.length > 0 ? `Missing fields: ${errors.join(', ')}` : null
      };
    });
  },
  invoices: (data) => {
    const requiredFields = ['description', 'amount', 'date'];
    return data.map(item => {
      const errors = requiredFields.filter(field => !item[field]);
      return {
        ...item,
        isValid: errors.length === 0,
        errors: errors.length > 0 ? `Missing fields: ${errors.join(', ')}` : null
      };
    });
  },
  transactions: (data) => {
    const requiredFields = ['date', 'description', 'amount', 'currency', 'rate'];
    return data.map(item => {
      const errors = requiredFields.filter(field => !item[field]);
      return {
        ...item,
        isValid: errors.length === 0,
        errors: errors.length > 0 ? `Missing fields: ${errors.join(', ')}` : null
      };
    });
  },
  expenses: (data) => {
    const requiredFields = ['description', 'amount', 'date'];
    return data.map(item => {
      const errors = requiredFields.filter(field => !item[field]);
      return {
        ...item,
        isValid: errors.length === 0,
        errors: errors.length > 0 ? `Missing fields: ${errors.join(', ')}` : null
      };
    });
  }
};

// Parse different file types to JSON
export const parseFile = (file) => {
  return new Promise((resolve, reject) => {
    const fileExtension = file.name.split('.').pop().toLowerCase();

    const handleParsedData = (parsedData) => {
      // Trim whitespace from keys and convert to lowercase
      const cleanedData = parsedData.map(item => {
        const cleanedItem = Object.fromEntries(
          Object.entries(item).map(([key, value]) => {
            key = key.trim().toLowerCase();
            if (typeof value === 'string') value = value.trim();
            
            // Convert date to ISO string (assuming DD/MM/YYYY format)
            if (key === 'date' && value) {
              const [day, month, year] = value.split('/');
              value = new Date(year, month - 1, day).toISOString();
            }
            
            // Convert amount to integer, handling comma-separated number format
            if (key === 'amount' && value) {
              // Remove commas and parse to integer
              value = parseInt(value.replace(/,/g, ''), 10);
            }
            
            return [key, value];
          })
        );
        return cleanedItem;
      });
      resolve(cleanedData);
    };

    if (fileExtension === 'csv') {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          handleParsedData(results.data);
        },
        error: (error) => reject(error)
      });
    } else if (['xlsx', 'xls'].includes(fileExtension)) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          handleParsedData(jsonData);
        } catch (error) {
          reject(new Error('Failed to parse Excel file: ' + error.message));
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsBinaryString(file);  // Changed from readAsArrayBuffer
    } else {
      reject(new Error('Unsupported file type. Please use CSV or XLSX.'));
    }
  });
};
