/**
 * 3D CSV parsing: raw string → Parsed3DCSV.
 * Splits cells on dimension delimiter (default |) to produce Cell = string | string[].
 * Where 2D ends and the third dimension begins.
 */

import { parseCSVRows } from "./csv-base.js";
import type { Cell, ParseOptions, Parsed3DCSV, RowObject, RowArray } from "./types.js";

const DEFAULT_DIMENSION_DELIMITER = "|";

function rawToCell(raw: string, dimensionDelimiters: string[]): Cell {
  const delim = dimensionDelimiters[0] ?? DEFAULT_DIMENSION_DELIMITER;
  const parts = raw.split(delim);
  if (parts.length > 1) return parts;
  return raw;
}

export function parse3DCSV(
  input: string,
  options: ParseOptions = {}
): Parsed3DCSV<unknown> {
  const {
    dimensionDelimiters = [DEFAULT_DIMENSION_DELIMITER],
    header = true,
    columns = [],
    asObjects = true,
    schema,
    validate = false,
  } = options;

  const rawRows = parseCSVRows(input.trim());
  if (rawRows.length === 0) {
    return createParsedResult([], [], asObjects);
  }

  const headers = header
    ? rawRows[0].map((h) => h.trim())
    : columns.length > 0
      ? columns
      : rawRows[0].map((_, i) => String(i));
  const dataStart = header ? 1 : 0;
  const rawDataRows = rawRows.slice(dataStart);

  const cellRows: Cell[][] = rawDataRows.map((row) =>
    row.map((raw) => rawToCell(raw, dimensionDelimiters))
  );

  let rows: unknown[] = asObjects
    ? (cellRows.map((cells) => {
        const obj: RowObject = {};
        headers.forEach((h, i) => {
          obj[h] = cells[i] ?? "";
        });
        return obj;
      }) as unknown[])
    : (cellRows as unknown[]);

  if (schema && validate) {
    rows = rows.map((row) => schema.parse(row));
  }

  return createParsedResult(headers, rows, asObjects, cellRows);
}

function createParsedResult<T>(
  headers: string[],
  rows: T[],
  asObjects: boolean,
  cellRows?: Cell[][]
): Parsed3DCSV<T> {
  const rowArrays: Cell[][] = cellRows ?? (asObjects ? [] : (rows as Cell[][]));
  const objectRows: RowObject[] = rowArrays.length
    ? rowArrays.map((cells) => {
        const obj: RowObject = {};
        headers.forEach((h, i) => {
          obj[h] = cells[i] ?? "";
        });
        return obj;
      })
    : (rows as unknown as RowObject[]);

  return {
    headers,
    rows,
    toRows(): Cell[][] {
      if (cellRows) return cellRows;
      if (!asObjects && Array.isArray(rows) && rows.length > 0 && Array.isArray(rows[0]))
        return rows as Cell[][];
      return objectRows.map((o) => headers.map((h) => o[h] ?? ""));
    },
    toObjects(): RowObject[] {
      if (asObjects) return rows as unknown as RowObject[];
      return objectRows;
    },
  };
}
