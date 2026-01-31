/**
 * 3D CSV type definitions.
 * Cell = one CSV cell after dimension split (scalar or pipe-separated list).
 * (Infinitely dimensional, one cell at a time.)
 */

/** Value of a single cell: string or array of strings (after splitting on dimension delimiter). */
export type Cell = string | string[];

/** One row as a record: header name → cell value. */
export type RowObject = Record<string, Cell>;

/** One row as an array of cell values (same order as headers). */
export type RowArray = Cell[];

/** Row is either object or array form depending on options. */
export type Row = RowObject | RowArray;

/** Parsed result: headers plus rows, with convenience views. */
export interface Parsed3DCSV<T = unknown> {
  headers: string[];
  rows: T[];
  toRows(): Cell[][];
  toObjects(): RowObject[];
  /** Expand array-valued cells into one row per element (join-table style). Returns regular CSV shape (all scalars). */
  flatten(options?: FlattenOptions): Parsed3DCSV<RowObject>;
}

/** Options for flattening 3D CSV to regular CSV. */
export interface FlattenOptions {
  /** Columns to expand (default: all columns that are arrays, in header order). */
  columns?: string[];
}

/** Options for parsing 3D CSV. */
export interface ParseOptions {
  /** Delimiters for "dimensions" inside a cell (default `['|']`). First splits into array; more = nested. */
  dimensionDelimiters?: string[];
  /** Whether first line is headers (default true). */
  header?: boolean;
  /** Column names when header is false or missing. */
  columns?: string[];
  /** If true, rows are Record<string, Cell>; if false, rows are Cell[] (default true). */
  asObjects?: boolean;
  /** Optional Zod schema for type inference and optional runtime validation. */
  schema?: { parse: (v: unknown) => unknown; _output?: unknown };
  /** If true and schema provided, run schema.parse on each row. */
  validate?: boolean;
  /** If true, coerce numeric-looking cells to number (v1: keep string; Zod can coerce). */
  castNumbers?: boolean;
}

/** Options for stringifying to 3D CSV. */
export interface StringifyOptions {
  dimensionDelimiters?: string[];
  /** Emit a header row (default true). */
  header?: boolean;
  /** Quote all cells vs only when needed (default: only when needed). */
  quoted?: boolean;
}
