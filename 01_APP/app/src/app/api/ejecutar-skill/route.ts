import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import os from "os";

const execAsync = promisify(exec);

const CLAUDE_CMD = "C:\\Users\\PC\\AppData\\Roaming\\npm\\claude.cmd";
const YTDLP_CMD  = "C:\\Users\\PC\\AppData\\Local\\Python\\pythoncore-3.14-64\\Scripts\\yt-dlp.exe";
const VAULT      = "D:\\Disco_D_JohnDuque-6-10-2025\\0- SEGUNDO CEREBRO - OBSIDIAN";
const SELECTED   = path.join(VAULT, "Clippings", "selected");

const ENV = {
  ...process.env,
  PATH: `C:\\Users\\PC\\AppData\\Roaming\\npm;C:\\Users\\PC\\AppData\\Local\\Python\\pythoncore-3.14-64\\Scripts;${process.env.PATH}`,
};

type Tipo = "youtube" | "web" | "texto" | "archivo";

// Ejecuta Claude usando un script PowerShell temporal
// Evita problemas con caracteres especiales (&, <, >) en cmd.exe
async function runClaude(prompt: string): Promise<string> {
  const tmpDir = path.join(os.tmpdir(), "video-obsidian");
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  const promptFile = path.join(tmpDir, `prompt_${Date.now()}.txt`);
  const scriptFile = path.join(tmpDir, `run_${Date.now()}.ps1`);

  fs.writeFileSync(promptFile, prompt, "utf-8");
  fs.writeFileSync(scriptFile, `
$ErrorActionPreference = 'Continue'
$p = Get-Content -Path '${promptFile.replace(/\\/g, "\\\\")}' -Raw
& '${CLAUDE_CMD.replace(/\\/g, "\\\\")}' --dangerously-skip-permissions -p $p
`, "utf-8");

  try {
    const { stdout, stderr } = await execAsync(
      `powershell.exe -NonInteractive -ExecutionPolicy Bypass -File "${scriptFile}"`,
      { cwd: VAULT, timeout: 1800000, env: ENV, maxBuffer: 50 * 1024 * 1024 }
    );
    return stdout || stderr || "";
  } finally {
    try { fs.unlinkSync(promptFile); } catch {}
    try { fs.unlinkSync(scriptFile); } catch {}
  }
}

async function extraerFramesCobertura(url: string): Promise<void> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "obs-cover-"));
  const videoPath = path.join(tmpDir, "video.mp4");

  try {
    await execAsync(
      `"${YTDLP_CMD}" -f "worst[ext=mp4]/worst" --no-playlist -o "${videoPath}" "${url}"`,
      { timeout: 300000, env: ENV, shell: "cmd.exe", maxBuffer: 10 * 1024 * 1024 }
    );

    if (!fs.existsSync(videoPath)) return;

    const pattern = path.join(SELECTED, "cover_%04d.jpg");
    await execAsync(
      `ffmpeg -i "${videoPath}" -vf "fps=1/30,scale=854:-2" -q:v 2 "${pattern}" -y`,
      { timeout: 120000, env: ENV, shell: "cmd.exe", maxBuffer: 10 * 1024 * 1024 }
    );

    const covers = fs.readdirSync(SELECTED)
      .filter(f => /^cover_\d{4}\.jpg$/.test(f))
      .sort();

    covers.forEach((f, i) => {
      const seg = (i + 1) * 30;
      const nuevo = `cover_${String(seg).padStart(5, "0")}s.jpg`;
      fs.renameSync(path.join(SELECTED, f), path.join(SELECTED, nuevo));
    });
  } catch {
    // La cobertura es opcional — no bloquea el proceso principal
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  }
}

function buildPrompt(tipo: Tipo, input: string, nombre: string): string {
  const contexto = nombre ? `Título del contenido: "${nombre}"\n` : "";

  const base = `${contexto}
MODO AUTOMÁTICO - sin validación manual:
- Extrae frames INTELIGENTES (diagramas, datos, dashboards, código, flujos) en los momentos clave
- Guárdalos en Clippings/selected/ con nombres descriptivos (NO uses el prefijo "cover_")
- Crea la nota completa en "Notas de Video/BORRADORES/" con el skill watch-obsidian-v2
- Incluye TODAS las secciones del skill: Aplicación General, Área Vital Inmobiliaria, Rentals, AVIWEBS, Automatización, Ideas de contenido, Oportunidades, Acciones, Referencias, Prompt para Claude
- Solo referencia en la nota los frames descriptivos, NO los que empiezan con cover_
- Al terminar escribe: PROCESO_COMPLETADO`.trim();

  if (tipo === "youtube") return `Usa el skill watch-obsidian-v2 para analizar este video de YouTube: ${input}\n\n${base}`;
  if (tipo === "web")     return `Usa el skill watch-obsidian-v2 para analizar esta página web: ${input}\nUsa web_fetch para obtener el contenido completo.\n\n${base}`;
  if (tipo === "texto")   return `Usa el skill watch-obsidian-v2 para analizar este contenido:\n\n${input}\n\n${base}`;
  return `Usa el skill watch-obsidian-v2 para analizar este archivo: ${input}\n\n${base}`;
}

export async function POST(req: NextRequest) {
  const { tipo, input, nombre = "" } = await req.json() as { tipo: Tipo; input: string; nombre?: string };

  if (!input?.trim()) {
    return NextResponse.json({ error: "Contenido requerido" }, { status: 400 });
  }

  // Limpiar frames anteriores
  if (fs.existsSync(SELECTED)) {
    fs.readdirSync(SELECTED)
      .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
      .forEach(f => { try { fs.unlinkSync(path.join(SELECTED, f)); } catch {} });
  }

  const prompt = buildPrompt(tipo, input, nombre);

  // YouTube: cobertura en paralelo con Claude
  const coberturaPromise = tipo === "youtube" ? extraerFramesCobertura(input) : Promise.resolve();

  try {
    const [output] = await Promise.all([
      runClaude(prompt),
      coberturaPromise,
    ]);

    return NextResponse.json({ ok: true, output: (output || "").slice(-300) });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error ejecutando Claude";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
