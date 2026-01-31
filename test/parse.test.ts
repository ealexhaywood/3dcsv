import { describe, expect, test } from "bun:test";
import { parse, stringify } from "../src/index.js";

describe("parse", () => {
  test("parses simple 3D CSV with headers and object rows", () => {
    const csv = `name,age,tags
Alice,30,"js|ts|rust"
Bob,25,"hiking|photography"`;
    const result = parse(csv);
    expect(result.headers).toEqual(["name", "age", "tags"]);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toEqual({ name: "Alice", age: "30", tags: ["js", "ts", "rust"] });
    expect(result.rows[1]).toEqual({ name: "Bob", age: "25", tags: ["hiking", "photography"] });
  });

  test("toRows() returns array of arrays", () => {
    const csv = `a,b
1,2`;
    const result = parse(csv);
    expect(result.toRows()).toEqual([["1", "2"]]);
  });

  test("toObjects() returns array of row objects", () => {
    const csv = `a,b
1,2`;
    const result = parse(csv);
    expect(result.toObjects()).toEqual([{ a: "1", b: "2" }]);
  });

  test("asObjects: false returns array rows", () => {
    const csv = `x,y
a,b`;
    const result = parse(csv, { asObjects: false });
    expect(result.rows).toEqual([["a", "b"]]);
    expect(result.toRows()).toEqual([["a", "b"]]);
  });
});

describe("roundtrip", () => {
  test("stringify(parse(csv)) equals original for simple case", () => {
    const csv = `name,age,tags
Alice,30,"js|ts|rust"
Bob,25,"hiking|photography"`;
    const result = parse(csv);
    const back = stringify(result);
    expect(back).toBe(csv);
  });
});

describe("stringify", () => {
  test("stringify array of row objects infers headers", () => {
    const rows = [
      { name: "Alice", skills: ["js", "ts"] },
      { name: "Bob", skills: ["design"] },
    ];
    const out = stringify({ headers: ["name", "skills"], rows });
    expect(out).toContain("name,skills");
    expect(out).toContain('Alice,"js|ts"');
    expect(out).toContain("Bob,design");
  });
});
