import { describe, expect, test } from "bun:test";
import { parse, stringify } from "../src/index.js";

describe("flatten", () => {
  test("parse(csv).flatten() expands one list column into multiple rows", () => {
    const csv = `name,age,tags
Alice,30,"js|ts|rust"
Bob,25,"hiking|photography"`;
    const result = parse(csv).flatten();
    expect(result.headers).toEqual(["name", "age", "tags"]);
    expect(result.rows).toHaveLength(5);
    expect(result.rows[0]).toEqual({ name: "Alice", age: "30", tags: "js" });
    expect(result.rows[1]).toEqual({ name: "Alice", age: "30", tags: "ts" });
    expect(result.rows[2]).toEqual({ name: "Alice", age: "30", tags: "rust" });
    expect(result.rows[3]).toEqual({ name: "Bob", age: "25", tags: "hiking" });
    expect(result.rows[4]).toEqual({ name: "Bob", age: "25", tags: "photography" });
  });

  test("flatten({ columns: ['tags'] }) expands only specified column", () => {
    const csv = `name,tags
Alice,"a|b|c"`;
    const result = parse(csv).flatten({ columns: ["tags"] });
    expect(result.rows).toHaveLength(3);
    expect(result.rows.map((r) => r.tags)).toEqual(["a", "b", "c"]);
  });

  test("row with no array column stays one row", () => {
    const csv = `name,age
Alice,30`;
    const result = parse(csv).flatten();
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toEqual({ name: "Alice", age: "30" });
  });

  test("stringify(parse(csv).flatten()) has no pipes (regular CSV)", () => {
    const csv = `name,tags
Alice,"js|ts|rust"`;
    const flat = parse(csv).flatten();
    const out = stringify(flat);
    expect(out).not.toContain("|");
    expect(out).toContain("name,tags");
    expect(out).toContain("Alice,js");
    expect(out).toContain("Alice,ts");
    expect(out).toContain("Alice,rust");
  });

  test("flatten().flatten() is idempotent (already flat)", () => {
    const csv = `name,tags
Alice,"a|b"`;
    const once = parse(csv).flatten();
    const twice = once.flatten();
    expect(twice.rows).toEqual(once.rows);
  });

  test("multiple array columns (no options) use Cartesian product", () => {
    const csv = `name,tags,skills
Alice,"a|b","x|y"`;
    const result = parse(csv).flatten();
    expect(result.rows).toHaveLength(4);
    expect(result.rows.map((r) => ({ tags: r.tags, skills: r.skills }))).toEqual([
      { tags: "a", skills: "x" },
      { tags: "a", skills: "y" },
      { tags: "b", skills: "x" },
      { tags: "b", skills: "y" },
    ]);
  });

  test("flatten({ columns: ['tags', 'skills'] }) uses Cartesian product", () => {
    const csv = `name,tags,skills
Alice,"a|b","x|y"`;
    const result = parse(csv).flatten({ columns: ["tags", "skills"] });
    expect(result.rows).toHaveLength(4);
    expect(result.rows[0]).toEqual({ name: "Alice", tags: "a", skills: "x" });
    expect(result.rows[1]).toEqual({ name: "Alice", tags: "a", skills: "y" });
    expect(result.rows[2]).toEqual({ name: "Alice", tags: "b", skills: "x" });
    expect(result.rows[3]).toEqual({ name: "Alice", tags: "b", skills: "y" });
  });

  test("flattened result toRows() and toObjects() match rows", () => {
    const csv = `name,tags
Alice,"a|b"`;
    const result = parse(csv).flatten();
    expect(result.toObjects()).toEqual(result.rows);
    expect(result.toRows()).toHaveLength(2);
    expect(result.toRows()[0]).toEqual(["Alice", "a"]);
    expect(result.toRows()[1]).toEqual(["Alice", "b"]);
  });

  test("scalar cell (no pipe) stays one row", () => {
    const csv = `name,tags
Alice,solo`;
    const result = parse(csv).flatten();
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toEqual({ name: "Alice", tags: "solo" });
  });

  test("Cartesian with scalar column treats scalar as single value (1×N rows)", () => {
    const csv = `name,tags,skills
Alice,"a|b","x"`;
    const result = parse(csv).flatten({ columns: ["tags", "skills"] });
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toEqual({ name: "Alice", tags: "a", skills: "x" });
    expect(result.rows[1]).toEqual({ name: "Alice", tags: "b", skills: "x" });
  });
});
