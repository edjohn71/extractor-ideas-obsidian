import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const OBSIDIAN_NOTAS = "D:\\Disco_D_JohnDuque-6-10-2025\\0- SEGUNDO CEREBRO - OBSIDIAN\\Notas de Video";

export async function POST(req: NextRequest) {
  const { titulo, frames } = await req.json();

  try {
    if (!fs.existsSync(OBSIDIAN_NOTAS)) {
      fs.mkdirSync(OBSIDIAN_NOTAS, { recursive: true });
    }

    const today = new Date().toISOString().split("T")[0];
    const nombreLimpio = titulo.replace(/[\\/:*?"<>|]/g, "").trim();
    const nombreArchivo = `${today} - ${nombreLimpio}.md`;
    const rutaCompleta = path.join(OBSIDIAN_NOTAS, nombreArchivo);

    const framesMarkdown = (frames as string[])
      .map((img) => `![[Clippings/selected/${img}]]`)
      .join("\n");

    const contenido = `# ${titulo}

📅 Fecha: ${today}

---

## 🧠 Idea principal
-

---

## 🖼️ Frames clave

${framesMarkdown}

---

## 💡 Insights
-

---

## 🔗 Conexiones
-

---

#video #youtube #conocimiento
`;

    fs.writeFileSync(rutaCompleta, contenido, "utf-8");

    return NextResponse.json({ nombre: nombreArchivo });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error guardando";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
