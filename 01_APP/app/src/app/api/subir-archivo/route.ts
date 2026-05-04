import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const archivo = formData.get("archivo") as File;

    if (!archivo) {
      return NextResponse.json({ error: "No se recibió archivo" }, { status: 400 });
    }

    const bytes = await archivo.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const tmpDir = path.join(os.tmpdir(), "video-obsidian");
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

    const nombreSeguro = archivo.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const rutaArchivo = path.join(tmpDir, nombreSeguro);
    fs.writeFileSync(rutaArchivo, buffer);

    return NextResponse.json({ rutaArchivo, nombre: archivo.name, tipo: archivo.type });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error subiendo archivo";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
