/**
 * Parse CSV line handling quoted values
 */
const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result.map(col => col.replace(/^["']|["']$/g, ''));
};

/**
 * Extract column headers from uploaded file (CSV)
 * For Excel files, we'll send to the backend API
 */
export const extractColumnsFromFile = async (file: File, room?: string): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const fileName = file.name.toLowerCase();

    if (!fileName.endsWith('.csv') && !fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      reject(new Error('Unsupported file format. Please upload CSV or Excel files.'));
      return;
    }

    // For CSV files, extract locally
    if (fileName.endsWith('.csv')) {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          if (!text) {
            reject(new Error('Failed to read file'));
            return;
          }

          const lines = text.split('\n');
          if (lines.length === 0) {
            resolve([]);
            return;
          }

          const columns = parseCSVLine(lines[0]);
          resolve(columns.filter(col => col && col !== ''));
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsText(file);
    } else {
      // For Excel files, use the backend API to extract columns
      import('../services/api').then(({ extractFileColumns }) => {
        extractFileColumns(file, room)
          .then(columns => resolve(columns))
          .catch(error => reject(error));
      }).catch(error => reject(error));
    }
  });
};
