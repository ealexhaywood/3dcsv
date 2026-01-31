# 3D CSV

**Pipe-separated comma-separated values** — represent complex, multi-valued data in a single 2D CSV. One table, one header row, list-valued cells via a dimension delimiter (default `|`).

*Yes, it’s still a 2D grid. The “3D” is aspirational.*

## Install

```bash
bun add 3dcsv
# or
npm install 3dcsv
```

For typed rows with runtime validation (recommended):

```bash
bun add 3dcsv zod
```

## Usage

### Parse and stringify

```ts
import { parse, stringify } from "3dcsv";

const csv = `name,age,tags
Alice,30,"js|ts|rust"
Bob,25,"hiking|photography"`;

const { headers, rows } = parse(csv);
// headers: ['name', 'age', 'tags']
// rows: [
//   { name: 'Alice', age: '30', tags: ['js', 'ts', 'rust'] },
//   { name: 'Bob', age: '25', tags: ['hiking', 'photography'] }
// ]

const back = stringify({ headers, rows });
// roundtrip: back === csv
```

### Typed rows (Zod, recommended)

Pass a Zod schema; return type is inferred. No type assertions.

```ts
import { parse } from "3dcsv";
import { z } from "zod";

const personSchema = z.object({
  name: z.string(),
  age: z.coerce.number(),
  tags: z.array(z.string()),
});

const result = parse(csv, { schema: personSchema });
// result.rows is { name: string; age: number; tags: string[] }[]

// Optional runtime validation
const validated = parse(csv, { schema: personSchema, validate: true });
```

### Typed rows (generic, no Zod)

```ts
type Person = { name: string; age: number; tags: string[] };
const result = parse<Person>(csv);
// result.rows is Person[]
```

### Convenience views

```ts
const result = parse(csv);

result.rows; // default: array of row objects
result.toRows(); // always: Cell[][] (array of arrays)
result.toObjects(); // always: Record<string, Cell>[]
```

### No schema, no generic

If you do nothing, you get `{ headers: string[]; rows: unknown[] }`. Typed rows are opt-in via schema or generic.

## API

- **`parse(input, options?)`** — Parse 3D CSV. Options: `dimensionDelimiters`, `header`, `columns`, `asObjects`, `schema`, `validate`.
- **`stringify(data, options?)`** — Stringify to 3D CSV. Accepts `{ headers, rows }` or array of row objects (headers inferred).

*It’s just CSV with pipes in the cells. Sometimes that’s all you need. Sometimes.*

## Format

- Rows and columns as usual; cells can contain a **dimension delimiter** (default `|`).
- A cell like `"a|b|c"` is one cell whose value is the list `["a", "b", "c"]`.
- Quoting and escaping follow standard CSV (e.g. `""` inside quoted fields).

## Contributing

Changesets for versioning: run `bun run changeset` when you change the package. Merge the “Version Packages” PR to publish. See [.changeset/README.md](.changeset/README.md).

## License

MIT

---

*3D CSV: because one dimension was never enough. We’re not saying it’s a good idea — we’re just saying it works.*
