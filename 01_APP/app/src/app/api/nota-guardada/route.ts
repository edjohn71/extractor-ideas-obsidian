import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const ESTADO_FILE = "C:\\Users\\PC\\AppData\\Local\\Temp\\video-obsidian\\ultima-nota.json";
const NOTAS_DIR   = "D:\\Disco_D_JohnDuque-6-10-2025\\0- SEGUNDO CEREBRO - OBSIDIAN\\Notas de Video";

export async function GET(req: NextRequest) {
  const fileParam = req.nextUrl.searchParams.get("file");

  try {
    // Si piden una nota específica por nombre
    if (fileParam) {
      const ruta = path.join(NOTAS_DIR, path.basename(fileParam));
      if (!fs.existsSync(ruta)) {
        return NextResponse.json({ ok: false, mensaje: "Nota no encontrada" });
      }
      const contenido = fs.readFileSync(ruta, "utf-8");
      // Extraer frames del contenido
      const frames = [...contenido.matchAll(/!\[\[Clippings\/selected\/([^\]]+)\]\]/g)].map(m => m[1]);
      return NextResponse.json({
        ok: true,
        nombre: path.basename(fileParam),
        contenido,
        framesActivos: frames,
        fecha: fs.statSync(ruta).mtime.toISOString(),
      });
    }

    // Si no, devolver la última nota guardada
    if (!fs.existsSync(ESTADO_FILE)) {
      return NextResponse.json({ ok: false, mensaje: "No hay nota guardada aún" });
    }
    const estado = JSON.parse(fs.readFileSync(ESTADO_FILE, "utf-8"));
    return NextResponse.json({ ok: true, ...estado });
  } catch {
    return NextResponse.json({ ok: false, mensaje: "Error leyendo nota" });
  }
}

export async function POST(req: Request) {
  try {
    const datos = await req.json();
    const dir = path.dirname(ESTADO_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(ESTADO_FILE, JSON.stringify(datos, null, 2), "utf-8");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
