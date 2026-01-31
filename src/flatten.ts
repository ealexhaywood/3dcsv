/**
 * Flatten 3D CSV to regular CSV: expand array-valued cells into one row per element.
 * Join-table style — one row with tags ["a","b","c"] becomes three rows.
 */

import type { Cell, FlattenOptions, Parsed3DCSV, RowObject } from "./types.js";

function isArrayCell(cell: Cell): cell is string[] {
  return Array.isArray(cell);
}

function scalarize(cell: Cell): string {
  if (isArrayCell(cell)) return cell[0] ?? "";
  return String(cell);
}

/** Expand rows by a single column: each array cell becomes N rows with one value each. */
function expandByColumn(rows: RowObject[], headers: string[], column: string): RowObject[] {
  const out: RowObject[] = [];
  for (const row of rows) {
    const cell = row[column];
    if (isArrayCell(cell)) {
      for (let i = 0; i < cell.length; i++) {
        const flat: RowObject = {};
        for (const h of headers) {
          flat[h] = h === column ? cell[i] : scalarize(row[h] ?? "");
        }
        out.push(flat);
      }
    } else {
      const flat: RowObject = {};
      for (const h of headers) {
        flat[h] = String(row[h] ?? "");
      }
      out.push(flat);
    }
  }
  return out;
}

/** Cartesian product of arrays: [['a','b'], ['x','y']] → [['a','x'],['a','y'],['b','x'],['b','y']]. */
function cartesian<T>(arrays: T[][]): T[][] {
  if (arrays.length === 0) return [[]];
  const [first, ...rest] = arrays;
  const restProduct = cartesian(rest);
  const out: T[][] = [];
  for (const x of first) {
    for (const combo of restProduct) {
      out.push([x, ...combo]);
    }
  }
  return out;
}

/** Expand rows by multiple columns: Cartesian product of array cells (one row per combination). */
function expandByColumnsCartesian(
  rows: RowObject[],
  headers: string[],
  columns: string[]
): RowObject[] {
  const out: RowObject[] = [];
  for (const row of rows) {
    const arrays = columns.map((c) => {
      const cell = row[c];
      return isArrayCell(cell) ? cell : [String(cell ?? "")];
    });
    const combinations = cartesian(arrays);
    for (const combo of combinations) {
      const flat: RowObject = {};
      for (const h of headers) {
        const idx = columns.indexOf(h);
        flat[h] = idx === -1 ? String(row[h] ?? "") : combo[idx];
      }
      out.push(flat);
    }
  }
  return out;
}

/** Detect headers that have at least one array value in the given rows. */
function arrayColumns(headers: string[], rows: RowObject[]): string[] {
  const set = new Set<string>();
  for (const row of rows) {
    for (const h of headers) {
      if (isArrayCell(row[h])) set.add(h);
    }
  }
  return headers.filter((h) => set.has(h));
}

/**
 * Flatten object rows: expand array cells into multiple rows (all scalar).
 * Single column: N values → N rows. Multiple columns: Cartesian product (one row per combination).
 */
export function flattenRows(
  headers: string[],
  rows: RowObject[],
  options: FlattenOptions = {}
): RowObject[] {
  const { columns } = options;
  if (columns && columns.length === 1) {
    return expandByColumn(rows, headers, columns[0]);
  }
  if (columns && columns.length > 1) {
    return expandByColumnsCartesian(rows, headers, columns);
  }
  const toExpand = arrayColumns(headers, rows);
  if (toExpand.length <= 1) {
    return toExpand.length === 1 ? expandByColumn(rows, headers, toExpand[0]) : rows;
  }
  return expandByColumnsCartesian(rows, headers, toExpand);
}

/** Build a Parsed3DCSV from flat (scalar-only) rows. */
export function createFlatResult(headers: string[], flatRows: RowObject[]): Parsed3DCSV<RowObject> {
  const cellRows: Cell[][] = flatRows.map((r) => headers.map((h) => r[h] ?? ""));
  return {
    headers,
    rows: flatRows,
    toRows(): Cell[][] {
      return cellRows;
    },
    toObjects(): RowObject[] {
      return flatRows;
    },
    flatten(options?: FlattenOptions): Parsed3DCSV<RowObject> {
      return createFlatResult(headers, flattenRows(headers, flatRows, options));
    },
  };
}
