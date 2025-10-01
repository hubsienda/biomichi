const DRIVE_BASE = "https://www.googleapis.com/drive/v3";
const ACTIVITY_BASE = "https://driveactivity.googleapis.com/v2";

export type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  iconLink?: string;
  webViewLink?: string;
  size?: string;
  owners?: Array<{ displayName?: string; emailAddress?: string }>;
  parents?: string[];
};

export async function driveList({
  accessToken,
  q,
  pageSize = 100,
  fields = "files(id,name,mimeType,modifiedTime,iconLink,webViewLink,size,owners,parents)"
}: {
  accessToken: string;
  q: string;
  pageSize?: number;
  fields?: string;
}): Promise<{ files: DriveFile[] }> {
  const url = new URL(DRIVE_BASE + "/files");
  url.searchParams.set("q", q);
  url.searchParams.set("fields", fields);
  url.searchParams.set("orderBy", "modifiedTime desc");
  url.searchParams.set("pageSize", String(pageSize));
  url.searchParams.set("includeItemsFromAllDrives", "true");
  url.searchParams.set("supportsAllDrives", "true");

  const r = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`Drive list failed: ${r.status} ${t}`);
  }
  const data = await r.json();
  return { files: data.files || [] };
}

export async function driveListChildren({
  accessToken, folderId
}: { accessToken: string; folderId: string; }): Promise<DriveFile[]> {
  const q = `'${folderId}' in parents and trashed = false`;
  const { files } = await driveList({ accessToken, q });
  return files;
}

export async function activityQuery({
  accessToken, ancestorId, pageSize = 50
}: {
  accessToken: string;
  ancestorId: string;
  pageSize?: number;
}) {
  const body = {
    ancestorName: `items/${ancestorId}`,
    pageSize,
    consolidationStrategy: { legacy: {} }
  };
  const r = await fetch(ACTIVITY_BASE + "/activity:query", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`Activity query failed: ${r.status} ${t}`);
  }
  return r.json();
}

/** Recursively crawl descendants (folders & files) to build an ID index */
export async function crawlDescendants({
  accessToken,
  rootId,
  maxDepth = 10
}: {
  accessToken: string;
  rootId: string;
  maxDepth?: number;
}): Promise<string[]> {
  const allIds = new Set<string>();
  const queue: Array<{ id: string; depth: number }> = [{ id: rootId, depth: 0 }];
  while (queue.length) {
    const { id, depth } = queue.shift()!;
    if (depth > maxDepth) continue;
    allIds.add(id);
    const children = await driveListChildren({ accessToken, folderId: id });
    for (const child of children) {
      allIds.add(child.id);
      if (child.mimeType === "application/vnd.google-apps.folder") {
        queue.push({ id: child.id, depth: depth + 1 });
      }
    }
  }
  return Array.from(allIds);
}
