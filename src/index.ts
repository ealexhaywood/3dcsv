/**
 * 3D CSV — pipe-separated comma-separated values.
 * Infinitely dimensional data in a 2D grid.
 */

import { parse3DCSV } from "./parse.js";
import { stringify3DCSV } from "./stringify.js";
import type { ParseOptions, Parsed3DCSV, StringifyOptions } from "./types.js";

export type { Cell, Parsed3DCSV, ParseOptions, Row, RowArray, RowObject, StringifyOptions } from "./types.js";

/** Schema-like: has parse and optional _output for type inference (e.g. Zod). */
type SchemaWithOutput = { parse: (v: unknown) => unknown; _output?: unknown };

/** Default: no schema, no generic → rows: unknown[] */
export function parse(input: string, options?: ParseOptions): Parsed3DCSV<unknown>;

/** Generic opt-in: parse<Person>(csv) → rows: Person[] */
export function parse<T>(input: string, options?: ParseOptions): Parsed3DCSV<T>;

/** Zod (or schema with _output): return type inferred from schema; optional validate: true for runtime validation */
export function parse<S extends SchemaWithOutput>(
  input: string,
  options: ParseOptions & { schema: S }
): Parsed3DCSV<S["_output"] extends undefined ? unknown : NonNullable<S["_output"]>>;

export function parse<T = unknown>(input: string, options?: ParseOptions): Parsed3DCSV<T> {
  return parse3DCSV(input, options) as Parsed3DCSV<T>;
}

/**
 * Stringify data to 3D CSV. Accepts Parsed3DCSV, { headers, rows }, or array of row objects.
 */
export function stringify(
  data:
    | Parsed3DCSV<unknown>
    | { headers: string[]; rows: import("./types.js").RowObject[] | import("./types.js").Cell[][] },
  options?: StringifyOptions
): string {
  return stringify3DCSV(data, options);
}
