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
  const [activityJson, setActivityJson] = useState<string | null>(null);
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
    setActivityJson(JSON.stringify(data, null, 2));
  }

  useEffect(() => {
    doSearch();
    loadActivity();
  }, []);

  return (
    <>
      <section className="card">
        <div className="toolbar" style={{gap: '10px'}}>
          <input
            className="input"
            placeholder="Search files (full text across your Drive tree)"
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') doSearch(); }}
          />
          <select className="select" value={type} onChange={e => setType(e.target.value)}>
            <option value="">All types</option>
            <option value="docs">Docs</option>
            <option value="sheets">Sheets</option>
            <option value="slides">Slides</option>
          </select>
          <button className="btn primary" onClick={doSearch}>Search</button>
          <button className="btn" onClick={refreshIndex}>Refresh index</button>
          {refreshed && <span className="badge">Index updated</span>}
        </div>
      </section>

      <section className="card" style={{marginTop:16}}>
        <h3 style={{marginTop:0, marginBottom:10, fontSize:16}}>Results</h3>
        {loading ? <p>Loading…</p> : (
          <>
            {files.length === 0 ? <p>No files found.</p> : (
              <div className="grid">
                {files.map(f => (
                  <a key={f.id} href={f.webViewLink} target="_blank" rel="noreferrer" className="file">
                    <div style={{display:'flex', alignItems:'center', gap:8}}>
                      {f.iconLink && <img src={f.iconLink} alt="" width={22} height={22} style={{borderRadius:6}} />}
                      <h4>{f.name}</h4>
                    </div>
                    <div className="meta">
                      <div>{f.mimeType}</div>
                      {f.modifiedTime && <div>Modified {new Date(f.modifiedTime).toLocaleString()}</div>}
                      {f.owners?.length ? <div>Owner {f.owners[0].displayName || f.owners[0].emailAddress}</div> : null}
                    </div>
                  </a>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      <section className="card" style={{marginTop:16}}>
        <h3 style={{margin:0, fontSize:16}}>Recent activity (raw)</h3>
        {!activityJson ? <p>Loading…</p> :
          <pre style={{whiteSpace:"pre-wrap", overflowX:"auto", fontSize:12, background:"#fafafa", border:"1px solid #eee", padding:"12px", borderRadius:10}}>
            {activityJson}
          </pre>
        }
        <p className="meta">Use this later for widgets like “Most active files” or “Top collaborators”.</p>
      </section>
    </>
  );
}
