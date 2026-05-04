import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const OBSIDIAN_FOLDER = "D:\\Disco_D_JohnDuque-6-10-2025\\0- SEGUNDO CEREBRO - OBSIDIAN\\Clippings\\selected";

export async function GET() {
  try {
    const files = fs.readdirSync(OBSIDIAN_FOLDER);
    const images = files.filter((f) =>
      /\.(jpg|jpeg|png|webp)$/i.test(f)
    );
    return NextResponse.json({ images });
  } catch {
    return NextResponse.json({ images: [] });
  }
}
