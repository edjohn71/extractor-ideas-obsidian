import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const NOTAS_DIR = "D:\\Disco_D_JohnDuque-6-10-2025\\0- SEGUNDO CEREBRO - OBSIDIAN\\Notas de Video";

function parseFrontmatter(contenido: string) {
  const match = contenido.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const fm: Record<string, string> = {};
  match[1].split("\n").forEach(line => {
    const [key, ...val] = line.split(":");
    if (key && val.length) fm[key.trim()] = val.join(":").trim().replace(/^"|"$/g, "");
  });
  return fm;
}

export async function GET() {
  try {
    if (!fs.existsSync(NOTAS_DIR)) return NextResponse.json({ notas: [] });

    const archivos = fs.readdirSync(NOTAS_DIR)
      .filter(f => f.endsWith(".md") && !f.startsWith("_"))
      .map(nombre => {
        const ruta = path.join(NOTAS_DIR, nombre);
        const stat = fs.statSync(ruta);
        const contenido = fs.readFileSync(ruta, "utf-8");
        const fm = parseFrontmatter(contenido);

        // Extraer título del frontmatter o del primer H1
        const titulo = fm.title ||
          contenido.match(/^# (.+)$/m)?.[1]?.replace(/🎬\s*/, "") ||
          nombre.replace(/^\d{4}-\d{2}-\d{2}\s*-\s*/, "").replace(".md", "");

        // Fecha del nombre del archivo o frontmatter
        const fechaMatch = nombre.match(/^(\d{4}-\d{2}-\d{2})/);
        const fecha = fm.fecha_analisis || fechaMatch?.[1] || stat.mtime.toISOString().slice(0, 10);

        // Tags
        const tagsRaw = fm.tags || "";
        const tags = tagsRaw.replace(/[\[\]]/g, "").split(",").map(t => t.trim()).filter(Boolean);

        return { nombre, titulo, fecha, tags, url: fm.url || "" };
      })
      .sort((a, b) => b.fecha.localeCompare(a.fecha));

    return NextResponse.json({ notas: archivos });
  } catch (error) {
    return NextResponse.json({ notas: [], error: String(error) });
  }
}
