import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { crawlDescendants } from "@/lib/drive";
import { setIndexIds } from "@/lib/cache";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const accessToken = (session as any).access_token as string;
  const rootId = process.env.ROOT_FOLDER_ID!;
  const ids = await crawlDescendants({ accessToken, rootId });
  setIndexIds(ids);
  return NextResponse.json({ ok: true, count: ids.length });
}
