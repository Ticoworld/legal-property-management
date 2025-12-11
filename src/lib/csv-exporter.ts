/**
 * CSV Exporter Utility
 * 
 * Converts an array of objects to CSV format for bulk data export.
 * Handles special cases: nulls, dates, and fields containing commas.
 */

/**
 * Format a Date object as YYYY-MM-DD
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Escape a CSV field value:
 * - Wrap in quotes if contains comma, newline, or quote
 * - Escape internal quotes by doubling them
 */
function escapeField(value: string): string {
  const needsQuotes = value.includes(',') || value.includes('\n') || value.includes('"');
  
  if (needsQuotes) {
    // Escape double quotes by doubling them
    const escaped = value.replace(/"/g, '""');
    return `"${escaped}"`;
  }
  
  return value;
}

/**
 * Convert a value to a CSV-safe string
 */
function valueToString(value: unknown): string {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return '';
  }
  
  // Handle Date objects
  if (value instanceof Date) {
    return formatDate(value);
  }
  
  // Handle Decimal/bigint (Prisma Decimal fields)
  if (typeof value === 'bigint') {
    return value.toString();
  }
  
  // Handle objects with toNumber (Prisma Decimal)
  if (typeof value === 'object' && value !== null && 'toNumber' in value) {
    return String((value as { toNumber: () => number }).toNumber());
  }
  
  // Handle other objects (stringify)
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  
  // Convert to string and escape
  return String(value);
}

/**
 * Convert an array of objects to CSV format
 * 
 * @param data - Array of objects to convert
 * @returns CSV string with headers and data rows
 * 
 * @example
 * const data = [
 *   { name: "John", address: "123 Main St, Suite 1", date: new Date('2024-01-15') },
 *   { name: "Jane", address: "456 Oak Ave", date: null }
 * ];
 * const csv = jsonToCsv(data);
 * // Returns:
 * // name,address,date
 * // John,"123 Main St, Suite 1",2024-01-15
 * // Jane,456 Oak Ave,
 */
export function jsonToCsv(data: Record<string, unknown>[]): string {
  if (!data || data.length === 0) {
    return '';
  }

  // Extract headers from the first object
  const headers = Object.keys(data[0]);
  
  // Create header row
  const headerRow = headers.map(escapeField).join(',');
  
  // Create data rows
  const dataRows = data.map(item => {
    return headers.map(header => {
      const value = valueToString(item[header]);
      return escapeField(value);
    }).join(',');
  });

  // Combine header and data rows
  return [headerRow, ...dataRows].join('\n');
}

/**
 * Format a header key to be more readable
 * e.g., "propertyAddress" -> "Property Address"
 */
export function formatHeader(key: string): string {
  return key
    // Insert space before capital letters
    .replace(/([A-Z])/g, ' $1')
    // Capitalize first letter
    .replace(/^./, str => str.toUpperCase())
    // Trim leading space
    .trim();
}

/**
 * Create a CSV with formatted headers
 */
export function jsonToCsvWithFormattedHeaders(
  data: Record<string, unknown>[],
  headerMap?: Record<string, string>
): string {
  if (!data || data.length === 0) {
    return '';
  }

  const keys = Object.keys(data[0]);
  
  // Create header row with formatted or mapped headers
  const headers = keys.map(key => {
    if (headerMap && headerMap[key]) {
      return escapeField(headerMap[key]);
    }
    return escapeField(formatHeader(key));
  });
  
  const headerRow = headers.join(',');
  
  // Create data rows
  const dataRows = data.map(item => {
    return keys.map(key => {
      const value = valueToString(item[key]);
      return escapeField(value);
    }).join(',');
  });

  return [headerRow, ...dataRows].join('\n');
}
