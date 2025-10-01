import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { driveList } from "@/lib/drive";
import { hasIndex, listIndexIds } from "@/lib/cache";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const url = new URL(req.url);
  const qParam = url.searchParams.get("q") || "";
  const type = url.searchParams.get("type"); // optional mime group
  const nameOnly = url.searchParams.get("nameOnly") === "1";

  const accessToken = (session as any).access_token as string;
  const rootId = process.env.ROOT_FOLDER_ID!;

  let qParts: string[] = ["trashed = false"];

  // Text query
  if (qParam) {
    if (nameOnly) qParts.push(`name contains '${qParam.replace("'","\\'")}'`);
    else qParts.push(`fullText contains '${qParam.replace("'","\\'")}'`);
  }

  // Basic file-type filters
  if (type === "docs") qParts.push(`mimeType = 'application/vnd.google-apps.document'`);
  if (type === "sheets") qParts.push(`mimeType = 'application/vnd.google-apps.spreadsheet'`);
  if (type === "slides") qParts.push(`mimeType = 'application/vnd.google-apps.presentation'`);

  // Run the Drive search (could return beyond subtree)
  const { files } = await driveList({ accessToken, q: qParts.join(" and ") });

  // Filter to our subtree using the in-memory index if available,
  // otherwise fall back to naive filter: include files that either ARE the root,
  // or have the root as immediate parent (first page load before index refresh).
  let idsSet: Set<string> | null = null;
  if (hasIndex()) {
    idsSet = new Set(listIndexIds());
  }

  const filtered = files.filter(f => {
    if (!idsSet) {
      return (f.parents || []).includes(rootId) || f.id === rootId;
    }
    return idsSet.has(f.id);
  });

  return NextResponse.json({ files: filtered });
}
