const { CLIENT_ID, ROOT_FOLDER_ID } = window.APP_CONFIG;

let tokenClient, accessToken = null;

const scopes = [
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/drive.metadata.readonly",
  "https://www.googleapis.com/auth/drive.activity.readonly",
  "openid",
  "email",
  "profile"
].join(" ");

function html(strings, ...values){ return strings.flatMap((s,i)=>[s, values[i]??""]).join(""); }

function setSignedInUI(profile){
  const el = document.getElementById("signin");
  el.innerHTML = html`<span class="muted">Signed in as ${profile?.email || "…"} · </span>
    <button class="btn" id="signoutBtn">Sign out</button>`;
  document.getElementById("signoutBtn").onclick = () => {
    google.accounts.oauth2.revoke(accessToken, () => location.reload());
  };
}

function renderFiles(files){
  const grid = document.getElementById("results");
  grid.innerHTML = files.map(f => html`
    <a class="file" href="${f.webViewLink}" target="_blank" rel="noreferrer">
      <div style="display:flex;align-items:center;gap:8px">
        ${f.iconLink ? `<img src="${f.iconLink}" width="22" height="22" style="border-radius:6px" />` : ""}
        <h4>${f.name}</h4>
      </div>
      <div class="meta">
        <div>${f.mimeType}</div>
        ${f.modifiedTime ? `<div>Modified ${new Date(f.modifiedTime).toLocaleString()}</div>` : ""}
        ${f.owners?.length ? `<div>Owner ${f.owners[0].displayName || f.owners[0].emailAddress}</div>` : ""}
      </div>
    </a>
  `).join("");

  document.getElementById("empty").style.display = files.length ? "none" : "block";
}

async function gapiLoad(){
  return new Promise(resolve => gapi.load("client", resolve));
}

async function gapiInit(){
  await gapi.client.init({ discoveryDocs: [
    "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"
  ]});
}

function initSignin(){
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: scopes,
    callback: async (resp) => {
      accessToken = resp.access_token;
      gapi.client.setToken({ access_token: accessToken });
      // Fetch profile
      const p = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` }
      }).then(r=>r.json()).catch(()=>null);
      setSignedInUI(p);
      buildActivity(); // non-blocking
    }
  });

  const el = document.getElementById("signin");
  el.innerHTML = `<button class="btn primary" id="signinBtn">Sign in with Google</button>`;
  document.getElementById("signinBtn").onclick = () => tokenClient.requestAccessToken();
}

async function driveList(q, pageSize=100){
  const url = new URL("https://www.googleapis.com/drive/v3/files");
  url.searchParams.set("q", q);
  url.searchParams.set("fields", "files(id,name,mimeType,modifiedTime,iconLink,webViewLink,size,owners,parents),nextPageToken");
  url.searchParams.set("orderBy", "modifiedTime desc");
  url.searchParams.set("pageSize", String(pageSize));
  url.searchParams.set("includeItemsFromAllDrives", "true");
  url.searchParams.set("supportsAllDrives", "true");
  const r = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if(!r.ok) throw new Error("Drive list failed");
  return r.json();
}

// Crawl descendants to build an index (stored in localStorage)
async function crawlDescendants(rootId){
  const key = `biomichi_index_${rootId}`;
  const cached = localStorage.getItem(key);
  if (cached) {
    document.getElementById("indexBadge").style.display = "inline-block";
    return new Set(JSON.parse(cached));
  }
  const ids = new Set([rootId]);
  const queue = [rootId];
  while(queue.length){
    const folderId = queue.shift();
    const q = `'${folderId}' in parents and trashed = false`;
    const { files } = await driveList(q, 100);
    for(const f of files){
      ids.add(f.id);
      if (f.mimeType === "application/vnd.google-apps.folder") queue.push(f.id);
    }
  }
  localStorage.setItem(key, JSON.stringify(Array.from(ids)));
  document.getElementById("indexBadge").style.display = "inline-block";
  return ids;
}

async function search(){
  if (!accessToken) return alert("Please sign in first.");
  const qInput = document.getElementById("q").value.trim();
  const type = document.getElementById("type").value;
  // Ensure index exists (so we can filter to subtree)
  const ids = await crawlDescendants(ROOT_FOLDER_ID);

  // Full-text search (could return items outside subtree)
  const parts = ["trashed = false"];
  if (qInput) parts.push(`fullText contains '${qInput.replace(/'/g, "\\'")}'`);
  if (type) parts.push(`mimeType = '${type}'`);
  const { files } = await driveList(parts.join(" and "));
  const filtered = files.filter(f => ids.has(f.id));
  renderFiles(filtered);
}

async function buildActivity(){
  if (!accessToken) return;
  // Drive Activity API (fetch last ~50 events under ancestor)
  const r = await fetch("https://driveactivity.googleapis.com/v2/activity:query", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ ancestorName: `items/${ROOT_FOLDER_ID}`, pageSize: 50, consolidationStrategy: { legacy: {} } })
  });
  const data = r.ok ? await r.json() : { error: await r.text() };
  document.getElementById("activity").textContent = JSON.stringify(data, null, 2);
}

async function main(){
  await gapiLoad();
  await gapiInit();
  initSignin();
  // Wiring
  document.getElementById("searchBtn").onclick = search;
  document.getElementById("q").addEventListener("keydown", e => { if (e.key === "Enter") search(); });
  document.getElementById("indexBtn").onclick = async () => { localStorage.removeItem(`biomichi_index_${ROOT_FOLDER_ID}`); await crawlDescendants(ROOT_FOLDER_ID); };
}

window.addEventListener("load", main);
