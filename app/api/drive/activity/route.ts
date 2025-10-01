import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { activityQuery } from "@/lib/drive";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const accessToken = (session as any).access_token as string;
  const rootId = process.env.ROOT_FOLDER_ID!;
  const data = await activityQuery({ accessToken, ancestorId: rootId, pageSize: 50 });
  return NextResponse.json(data);
}
