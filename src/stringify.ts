/**
 * 3D CSV stringify: Parsed3DCSV or rows → raw string.
 * Joins array cells with dimension delimiter (default |); quotes when needed.
 */

import type { Cell, Parsed3DCSV, RowObject, StringifyOptions } from "./types.js";

const DEFAULT_DIMENSION_DELIMITER = "|";

function cellToRaw(cell: Cell, dimensionDelimiter: string): string {
  if (Array.isArray(cell)) return cell.join(dimensionDelimiter);
  return String(cell);
}

function rowToFields(row: RowObject, headers: string[], dimensionDelimiter: string): string[] {
  return headers.map((h) => cellToRaw(row[h] ?? "", dimensionDelimiter));
}

function escapeFieldFor3D(field: string, quoteAll: boolean): string {
  const needsQuote = /[\n\r,"|]/.test(field);
  if (quoteAll || needsQuote) {
    return '"' + field.replace(/"/g, '""') + '"';
  }
  return field;
}

export function stringify3DCSV(
  data: Parsed3DCSV<unknown> | { headers: string[]; rows: RowObject[] | Cell[][] },
  options: StringifyOptions = {}
): string {
  const {
    dimensionDelimiters = [DEFAULT_DIMENSION_DELIMITER],
    header = true,
    quoted = false,
  } = options;
  const delim = dimensionDelimiters[0] ?? DEFAULT_DIMENSION_DELIMITER;

  let headers: string[] = "headers" in data ? data.headers : [];
  const rows = "rows" in data ? data.rows : [];
  if (headers.length === 0 && Array.isArray(rows) && rows.length > 0) {
    const first = rows[0];
    headers = Array.isArray(first)
      ? first.map((_, i) => String(i))
      : Object.keys(first as RowObject);
  }

  const objectRows: RowObject[] = rows.map((r) => {
    if (Array.isArray(r)) {
      const obj: RowObject = {};
      headers.forEach((h, i) => {
        obj[h] = (r as Cell[])[i] ?? "";
      });
      return obj;
    }
    return r as RowObject;
  });

  const lines: string[] = [];
  if (header && headers.length > 0) {
    lines.push(
      headers.map((h) => escapeFieldFor3D(h, quoted)).join(",")
    );
  }
  for (const row of objectRows) {
    const fields = rowToFields(row, headers, delim).map((f) =>
      escapeFieldFor3D(f, quoted)
    );
    lines.push(fields.join(","));
  }
  return lines.join("\n");
}
