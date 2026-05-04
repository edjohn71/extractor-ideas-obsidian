import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import os from "os";
import Anthropic from "@anthropic-ai/sdk";

const execAsync = promisify(exec);

const OBSIDIAN_FOLDER = "D:\\Disco_D_JohnDuque-6-10-2025\\0- SEGUNDO CEREBRO - OBSIDIAN\\Clippings\\selected";

function parseVTT(content: string): string {
  return content
    .split("\n")
    .filter(
      (line) =>
        !line.startsWith("WEBVTT") &&
        !line.match(/^\d{2}:\d{2}:\d{2}/) &&
        !line.includes("-->") &&
        !line.startsWith("Kind:") &&
        !line.startsWith("Language:") &&
        line.trim() !== ""
    )
    .join(" ")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 15000);
}

async function findYtDlp(): Promise<string> {
  const candidates = [
    "yt-dlp",
    "C:\\Users\\PC\\AppData\\Local\\Microsoft\\WinGet\\Links\\yt-dlp.exe",
    "C:\\Users\\PC\\AppData\\Local\\Programs\\Python\\Python3\\Scripts\\yt-dlp.exe",
  ];
  for (const cmd of candidates) {
    try {
      await execAsync(`"${cmd}" --version`);
      return cmd;
    } catch {}
  }
  throw new Error("yt-dlp no encontrado. Instálalo con: winget install yt-dlp.yt-dlp");
}

export async function POST(req: NextRequest) {
  const { url } = await req.json();

  if (!url || !url.includes("youtube.com") && !url.includes("youtu.be")) {
    return NextResponse.json({ error: "URL de YouTube inválida" }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY.includes("PEGA-TU")) {
    return NextResponse.json(
      { error: "Falta la API Key de Anthropic. Edita el archivo .env.local" },
      { status: 400 }
    );
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "video-obsidian-"));

  try {
    const ytDlp = await findYtDlp();

    // 1. Limpiar frames anteriores
    const existingFrames = fs.readdirSync(OBSIDIAN_FOLDER).filter((f) =>
      /\.(jpg|jpeg|png)$/i.test(f)
    );
    for (const f of existingFrames) {
      fs.unlinkSync(path.join(OBSIDIAN_FOLDER, f));
    }

    // 2. Descargar subtítulos (rápido, sin video)
    let transcript = "";
    try {
      await execAsync(
        `"${ytDlp}" --write-auto-sub --sub-format vtt --skip-download --sub-lang es,en -o "${tmpDir}\\sub" "${url}"`,
        { timeout: 30000 }
      );
      const subFiles = fs.readdirSync(tmpDir).filter((f) => f.endsWith(".vtt"));
      if (subFiles.length > 0) {
        const content = fs.readFileSync(path.join(tmpDir, subFiles[0]), "utf-8");
        transcript = parseVTT(content);
      }
    } catch {}

    // 3. Descargar video en baja resolución
    const videoPath = path.join(tmpDir, "video.mp4");
    await execAsync(
      `"${ytDlp}" -f "worst[ext=mp4]/worst" -o "${videoPath}" "${url}"`,
      { timeout: 300000 }
    );

    if (!fs.existsSync(videoPath)) {
      throw new Error("No se pudo descargar el video");
    }

    // 4. Extraer frames con ffmpeg (1 cada 30 segundos, máx 20)
    const framesPattern = path.join(OBSIDIAN_FOLDER, "frame_%03d.jpg");
    await execAsync(
      `ffmpeg -i "${videoPath}" -vf "fps=1/30,scale=1280:-2" -frames:v 20 -q:v 2 "${framesPattern}" -y`,
      { timeout: 120000 }
    );

    // 5. Obtener lista de frames generados
    const frames = fs
      .readdirSync(OBSIDIAN_FOLDER)
      .filter((f) => /^frame_\d+\.jpg$/.test(f))
      .sort();

    // 6. Llamar a Claude para generar notas preliminares
    let notas = "";
    let titulo = "Nota de Video";

    if (transcript) {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

      const response = await client.messages.create({
        model: "claude-opus-4-7",
        max_tokens: 2000,
        thinking: { type: "adaptive" },
        system: [
          {
            type: "text",
            text: "Eres un experto en extraer conocimiento valioso de videos de YouTube. Generas notas estructuradas en español para Obsidian. Sé conciso y enfocado en insights accionables.",
            cache_control: { type: "ephemeral" },
          },
        ],
        messages: [
          {
            role: "user",
            content: `Analiza esta transcripción de video y genera:
1. Un título corto (máx 8 palabras)
2. La idea principal (1-2 oraciones)
3. 3-5 insights clave con viñetas
4. 2-3 conexiones con marketing/negocios

Transcripción:
${transcript}

Responde en este formato exacto:
TITULO: [título]
IDEA_PRINCIPAL: [idea]
INSIGHTS:
- [insight 1]
- [insight 2]
CONEXIONES:
- [conexión 1]`,
          },
        ],
      });

      const text = response.content.find((b) => b.type === "text");
      if (text && text.type === "text") {
        const raw = text.text;
        const tituloMatch = raw.match(/TITULO:\s*(.+)/);
        if (tituloMatch) titulo = tituloMatch[1].trim();
        notas = raw;
      }
    }

    return NextResponse.json({ frames, notas, titulo });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  } finally {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  }
}
