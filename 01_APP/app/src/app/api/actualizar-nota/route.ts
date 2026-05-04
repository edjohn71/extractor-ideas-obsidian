import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const BORRADORES = "D:\\Disco_D_JohnDuque-6-10-2025\\0- SEGUNDO CEREBRO - OBSIDIAN\\Notas de Video\\BORRADORES";
const NOTAS_FINAL = "D:\\Disco_D_JohnDuque-6-10-2025\\0- SEGUNDO CEREBRO - OBSIDIAN\\Notas de Video";

function notaMasReciente(carpeta: string): { ruta: string; nombre: string; contenido: string } | null {
  if (!fs.existsSync(carpeta)) return null;
  const archivos = fs.readdirSync(carpeta)
    .filter((f) => f.endsWith(".md"))
    .map((f) => ({ nombre: f, ruta: path.join(carpeta, f), tiempo: fs.statSync(path.join(carpeta, f)).mtimeMs }))
    .sort((a, b) => b.tiempo - a.tiempo);
  if (!archivos.length) return null;
  const mas = archivos[0];
  return { ...mas, contenido: fs.readFileSync(mas.ruta, "utf-8") };
}

// GET — leer borrador más reciente
export async function GET() {
  try {
    const borrador = notaMasReciente(BORRADORES);
    if (borrador) {
      return NextResponse.json({
        notaPath: borrador.ruta,
        notaNombre: borrador.nombre,
        contenido: borrador.contenido,
        esBorrador: true,
      });
    }
    return NextResponse.json({ notaPath: null });
  } catch {
    return NextResponse.json({ notaPath: null });
  }
}

// POST — finalizar: filtrar imágenes + mover borrador a Notas de Video/
export async function POST(req: NextRequest) {
  const { notaPath, framesSeleccionados, imagenesExtras } = await req.json();

  try {
    if (!fs.existsSync(notaPath)) {
      return NextResponse.json({ error: "Borrador no encontrado" }, { status: 404 });
    }

    let contenido = fs.readFileSync(notaPath, "utf-8");

    // 1. Eliminar frames NO seleccionados de la nota
    const frameRegex = /!\[\[Clippings\/selected\/([^\]]+)\]\]/g;
    const todosFrames: string[] = [];
    let m;
    while ((m = frameRegex.exec(contenido)) !== null) todosFrames.push(m[1]);

    for (const f of todosFrames) {
      if (!framesSeleccionados.includes(f)) {
        contenido = contenido.replace(`![[Clippings/selected/${f}]]`, "");
      }
    }

    // 2. Insertar imágenes subidas manualmente (si las hay)
    if (imagenesExtras?.length) {
      const seccionVisual = "## 🖥️ Elementos visuales";
      const extras = imagenesExtras.map((img: string) => `![[Clippings/selected/${img}]]`).join("\n");
      if (contenido.includes(seccionVisual)) {
        contenido = contenido.replace(seccionVisual, `${seccionVisual}\n${extras}`);
      } else {
        contenido += `\n\n${extras}`;
      }
    }

    // 3. Limpiar líneas vacías dobles
    contenido = contenido.replace(/\n{3,}/g, "\n\n").trim();

    // 4. Guardar en Notas de Video/ final (no en BORRADORES)
    const nombre = path.basename(notaPath);
    const rutaFinal = path.join(NOTAS_FINAL, nombre);
    fs.writeFileSync(rutaFinal, contenido, "utf-8");

    // 5. Borrar el borrador
    fs.unlinkSync(notaPath);

    // Guardar estado para la página /nota
    const estadoFile = "C:\\Users\\PC\\AppData\\Local\\Temp\\video-obsidian\\ultima-nota.json";
    const estadoDir = require("path").dirname(estadoFile);
    if (!require("fs").existsSync(estadoDir)) require("fs").mkdirSync(estadoDir, { recursive: true });
    require("fs").writeFileSync(estadoFile, JSON.stringify({
      nombre,
      rutaFinal,
      contenido,
      framesActivos: framesSeleccionados,
      fecha: new Date().toISOString(),
    }), "utf-8");

    return NextResponse.json({
      ok: true,
      rutaFinal,
      nombre,
      contenidoFinal: contenido,
      framesMantenidos: framesSeleccionados.length,
      framesEliminados: todosFrames.filter((f) => !framesSeleccionados.includes(f)).length,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error finalizando nota";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
