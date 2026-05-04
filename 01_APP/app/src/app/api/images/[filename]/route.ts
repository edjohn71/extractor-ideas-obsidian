import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const OBSIDIAN_FOLDER = "D:\\Disco_D_JohnDuque-6-10-2025\\0- SEGUNDO CEREBRO - OBSIDIAN\\Clippings\\selected";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  const safeName = path.basename(filename);
  const filePath = path.join(OBSIDIAN_FOLDER, safeName);

  if (!fs.existsSync(filePath)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(safeName).toLowerCase();
  const contentType = ext === ".png" ? "image/png" : "image/jpeg";

  return new NextResponse(buffer, {
    headers: { "Content-Type": contentType },
  });
}
