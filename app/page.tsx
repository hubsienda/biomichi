'use client';
import { useEffect, useState } from "react";

type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  iconLink?: string;
  webViewLink?: string;
  size?: string;
  owners?: Array<{ displayName?: string; emailAddress?: string }>;
};

export default function HomePage() {
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [activity, setActivity] = useState<any>(null);
  const [refreshed, setRefreshed] = useState(false);

  async function refreshIndex() {
    setLoading(true);
    await fetch("/api/index/refresh");
    setRefreshed(true);
    await doSearch();
    setLoading(false);
  }

  async function doSearch() {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (type) params.set("type", type);
    const r = await fetch("/api/drive/search?" + params.toString());
    const data = await r.json();
    setFiles(data.files || []);
    setLoading(false);
  }

  async function loadActivity() {
    const r = await fetch("/api/drive/activity");
    const data = await r.json();
    setActivity(data);
  }

  useEffect(() => {
    doSearch();
    loadActivity();
  }, []);

  return (
    <div className="container">
      <div className="card">
        <div className="toolbar">
          <input
            placeholder="Search files (full text)"
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') doSearch(); }}
            style={{ padding: ".5rem .75rem", border: "1px solid #ddd", borderRadius: 8, minWidth: 280 }}
          />
          <select value={type} onChange={e => setType(e.target.value)} style={{ padding: ".45rem .5rem", border: "1px solid #ddd", borderRadius: 8 }}>
            <option value="">All types</option>
            <option value="docs">Docs</option>
            <option value="sheets">Sheets</option>
            <option value="slides">Slides</option>
          </select>
          <button onClick={doSearch} style={{ padding: ".5rem .9rem", borderRadius: 8, border: "1px solid #ccc", background: "#111", color: "white" }}>
            Search
          </button>
          <button onClick={refreshIndex} style={{ padding: ".5rem .9rem", borderRadius: 8, border: "1px solid #ccc", background: "white" }}>
            Refresh index
          </button>
          {refreshed && <span className="badge">Index updated</span>}
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Results</h3>
        {loading ? <p>Loading…</p> : (
          <div className="grid">
            {files.map(f => (
              <a key={f.id} href={f.webViewLink} target="_blank" rel="noreferrer" className="card" style={{ borderColor: "#eaeaea" }}>
                <div style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
                  {f.iconLink && <img src={f.iconLink} alt="" width={24} height={24} />}
                  <strong style={{ fontSize: 14 }}>{f.name}</strong>
                </div>
                <div style={{ fontSize: 12, color: "#666", marginTop: ".5rem" }}>
                  <div>{f.mimeType}</div>
                  {f.modifiedTime && <div>Modified: {new Date(f.modifiedTime).toLocaleString()}</div>}
                  {f.owners?.length ? <div>Owner: {f.owners[0].displayName || f.owners[0].emailAddress}</div> : null}
                </div>
              </a>
            ))}
          </div>
        )}
        {!loading && files.length === 0 && <p>No files found.</p>}
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Recent activity (last ~50 events)</h3>
        {!activity ? <p>Loading…</p> : (
          <pre style={{ whiteSpace: "pre-wrap", overflowX: "auto", fontSize: 12, background: "#fafafa", border: "1px solid #eee", padding: "1rem", borderRadius: 8 }}>{JSON.stringify(activity, null, 2)}</pre>
        )}
        <p style={{ fontSize: 12, color: "#666" }}>Tip: use this data to compute “most active files”, “top collaborators”, etc.</p>
      </div>
    </div>
  );
}
