import { useEffect, useState } from "react";

interface Data {
  headers: string[];
  rows: Record<string, string | string[]>[];
}

function useFileParam(): string | null {
  const [file, setFile] = useState<string | null>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setFile(params.get("file"));
  }, []);
  return file;
}

function Cell({ value }: { value: string | string[] }) {
  if (Array.isArray(value)) {
    return (
      <td>
        <div className="cell-array">
          {value.map((v, i) => (
            <span key={i} className="badge">
              {String(v)}
            </span>
          ))}
        </div>
      </td>
    );
  }
  return <td>{String(value)}</td>;
}

export default function App() {
  const file = useFileParam();
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!file) {
      setLoading(false);
      return;
    }
    fetch("/api/data?file=" + encodeURIComponent(file))
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load: ${res.status}`);
        return res.json();
      })
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, [file]);

  if (loading) return <div className="empty">Loading…</div>;
  if (!file) return <div className="empty">Run: 3dcsv visualize yourfile.csv</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!data) return null;

  return (
    <>
      <h1>3D CSV</h1>
      <table>
        <thead>
          <tr>
            {data.headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, i) => (
            <tr key={i}>
              {data.headers.map((h) => (
                <Cell key={h} value={row[h] ?? ""} />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
