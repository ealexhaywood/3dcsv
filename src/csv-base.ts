/**
 * Low-level CSV row parse/stringify.
 * Handles quoted fields and escaped double-quotes; no dimension (pipe) logic here.
 * The real magic happens one layer up.
 */

const DQUOTE = '"';
const COMMA = ',';

/**
 * Parse a single CSV line into an array of field strings.
 * Respects quoted fields and "" as escaped quote.
 */
export function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === DQUOTE) {
      let value = '';
      i += 1;
      while (i < line.length) {
        if (line[i] === DQUOTE) {
          if (line[i + 1] === DQUOTE) {
            value += DQUOTE;
            i += 2;
          } else {
            i += 1;
            break;
          }
        } else {
          value += line[i];
          i += 1;
        }
      }
      fields.push(value);
    } else {
      let value = '';
      while (i < line.length && line[i] !== COMMA) {
        value += line[i];
        i += 1;
      }
      fields.push(value);
      if (i < line.length) i += 1;
    }
  }
  return fields;
}

/**
 * Parse full CSV input into rows of raw string fields.
 * Handles newlines inside quoted fields (one field can span multiple lines).
 */
export function parseCSVRows(input: string): string[][] {
  const rows: string[][] = [];
  const fields: string[] = [];
  let i = 0;
  let current = '';
  let inQuote = false;
  while (i < input.length) {
    const c = input[i];
    if (inQuote) {
      if (c === DQUOTE) {
        if (input[i + 1] === DQUOTE) {
          current += DQUOTE;
          i += 2;
          continue;
        }
        inQuote = false;
        i += 1;
        continue;
      }
      current += c;
      i += 1;
      continue;
    }
    if (c === DQUOTE) {
      inQuote = true;
      i += 1;
      continue;
    }
    if (c === COMMA) {
      fields.push(current);
      current = '';
      i += 1;
      continue;
    }
    if (c === '\n' || (c === '\r' && input[i + 1] === '\n')) {
      if (c === '\r') i += 1;
      fields.push(current);
      current = '';
      rows.push(fields.slice());
      fields.length = 0;
      i += 1;
      continue;
    }
    if (c === '\r') {
      fields.push(current);
      current = '';
      rows.push(fields.slice());
      fields.length = 0;
      i += 1;
      continue;
    }
    current += c;
    i += 1;
  }
  fields.push(current);
  if (fields.length > 0 || current === '') rows.push(fields);
  return rows;
}

/**
 * Escape a field for CSV: if it contains comma, quote, or newline, wrap in quotes and double internal quotes.
 */
export function escapeCSVField(field: string): string {
  if (!/[\n\r,"]/.test(field)) return field;
  return DQUOTE + field.replace(/"/g, '""') + DQUOTE;
}

/**
 * Turn an array of field strings into one CSV line.
 */
export function stringifyCSVRow(fields: string[], quoteAll = false): string {
  return fields.map((f) => (quoteAll ? DQUOTE + f.replace(/"/g, '""') + DQUOTE : escapeCSVField(f))).join(COMMA);
}
