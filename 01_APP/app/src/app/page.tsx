"use client";

import { useState, useRef } from "react";

type Estado = "idle" | "procesando" | "revisando" | "guardando" | "listo";
type Tipo = "youtube" | "web" | "texto" | "archivo";

const TIPOS = {
  youtube: { label: "YouTube",  dot: "#EF4444" },
  web:     { label: "Web",      dot: "#60A5FA" },
  texto:   { label: "Texto",    dot: "#22C55E" },
  archivo: { label: "Archivo",  dot: "#F59E0B" },
};

function detectar(s: string): Tipo {
  if (/youtube\.com|youtu\.be/i.test(s)) return "youtube";
  if (/^https?:\/\//i.test(s)) return "web";
  return "texto";
}

function extraerFrames(md: string): string[] {
  return [...new Set([...md.matchAll(/!\[\[Clippings\/selected\/([^\]]+)\]\]/g)].map(m => m[1]))];
}

const s: Record<string, React.CSSProperties> = {
  wrap:    { maxWidth: 480, margin: "0 auto", padding: "0 16px 100px", animation: "fadeIn .4s ease" },
  header:  { padding: "32px 0 24px", textAlign: "center" },
  brand:   { fontFamily: "var(--font-ui)", fontSize: 11, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase" as const, color: "var(--muted)", marginBottom: 8 },
  title:   { fontFamily: "var(--font-brand)", fontSize: 38, fontWeight: 900, lineHeight: 1.1, marginBottom: 12, background: "linear-gradient(90deg, #F5C518, #FFD95A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  sub:     { fontSize: 14, fontWeight: 500, color: "#9CA3AF", lineHeight: 1.7, letterSpacing: 0.3 },
  version: { display: "inline-block", marginTop: 12, padding: "2px 10px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 20, fontSize: 10, color: "var(--muted)", fontFamily: "'Syne',sans-serif", letterSpacing: 1 },

  card:    { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "20px", marginBottom: 12 },
  badge:   { display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px", background: "var(--surface2)", borderRadius: 20, fontSize: 11, fontWeight: 600, color: "var(--muted2)", marginBottom: 12 },
  dot:     { width: 6, height: 6, borderRadius: "50%", flexShrink: 0 },

  inputRow: { display: "flex", gap: 8, marginBottom: 10 },
  input:   { flex: 1, padding: "12px 14px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "var(--radius)", color: "var(--text)", fontSize: 14, outline: "none", minWidth: 0 },
  fileBtn: { padding: "12px 14px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "var(--radius)", color: "var(--muted2)", cursor: "pointer", fontSize: 13, flexShrink: 0, whiteSpace: "nowrap" as const },
  btn:     { width: "100%", padding: "14px", background: "linear-gradient(90deg, #F5C518, #FFD95A)", color: "#000", border: "none", borderRadius: 12, fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15, cursor: "pointer", letterSpacing: 0.5, transition: "all 0.2s ease" },
  btnDis:  { width: "100%", padding: "14px", background: "var(--surface2)", color: "var(--muted)", border: "none", borderRadius: "var(--radius)", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15, cursor: "default" },

  progress: { marginTop: 16, padding: 18, borderRadius: 16, border: "1px solid var(--border)", background: "rgba(255,255,255,0.02)", backdropFilter: "blur(10px)", animation: "fadeIn 0.4s ease" },
  dots:    { display: "flex", gap: 5, alignItems: "center" },

  sectionLabel: { fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, color: "var(--muted)", marginBottom: 10 },
  grid:    { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginBottom: 14 },
  imgWrap: { position: "relative" as const, cursor: "pointer" },
  img:     { width: "100%", aspectRatio: "16/10", objectFit: "cover" as const, borderRadius: 8, display: "block" },
  check:   { position: "absolute" as const, top: 4, right: 4, width: 18, height: 18, background: "var(--green)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#fff" },

  tagPill: { display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 20, fontSize: 11, color: "var(--muted2)", marginRight: 6, marginBottom: 6 },
  removeTag: { cursor: "pointer", color: "var(--red)", fontSize: 12, fontWeight: 700, lineHeight: 1 },

  actionRow: { display: "flex", gap: 8, marginBottom: 12 },
  btnSmall: { flex: 1, padding: "10px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", color: "var(--muted2)", cursor: "pointer", fontSize: 12, fontWeight: 600 },

  successCard: { background: "linear-gradient(135deg,#0e2e1a,#142b20)", border: "1px solid #1a4a2e", borderRadius: "var(--radius-lg)", padding: "24px" },
  successTitle: { fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, color: "#F5C518", marginBottom: 6 },

  navBar:  { position: "fixed" as const, bottom: 0, left: 0, right: 0, background: "var(--surface)", borderTop: "1px solid var(--border)", display: "flex", zIndex: 100 },
  navItem: { flex: 1, display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", padding: "10px 0 12px", cursor: "pointer", gap: 3 },
  navIcon: { fontSize: 20, lineHeight: 1 },
  navLabel: { fontSize: 9, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" as const, color: "var(--muted)" },

  zoom:    { position: "fixed" as const, inset: 0, background: "rgba(0,0,0,0.95)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" },
  zoomImg: { maxWidth: "96vw", maxHeight: "88vh", objectFit: "contain" as const, borderRadius: 8 },
  zoomBtns: { position: "absolute" as const, bottom: 20, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 12 },
  zoomBtn: { padding: "12px 28px", border: "none", borderRadius: 10, cursor: "pointer", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14 },

  error:   { background: "#1a0a0a", border: "1px solid #3a1212", borderRadius: "var(--radius)", padding: "12px 14px", color: "#ef4444", fontSize: 13, marginBottom: 12 },
};

export default function Home() {
  const [estado, setEstado] = useState<Estado>("idle");
  const [input, setInput] = useState("");
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<Tipo>("youtube");
  const [fileName, setFileName] = useState("");

  const [notaPath, setNotaPath] = useState("");
  const [notaNombre, setNotaNombre] = useState("");
  const [framesEnNota, setFramesEnNota] = useState<string[]>([]);
  const [framesDisponibles, setFramesDisponibles] = useState<string[]>([]);
  const [framesActivos, setFramesActivos] = useState<string[]>([]);
  const [imagenesExtras, setImagenesExtras] = useState<string[]>([]);

  const [zoom, setZoom] = useState<string | null>(null);
  const [error, setError] = useState("");

  const fileRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);

  const onChange = (v: string) => { setInput(v); if (v.trim()) setTipo(detectar(v)); };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setFileName(f.name); setTipo("archivo");
    if (/\.(txt|md|csv)$/i.test(f.name)) { setInput((await f.text()).slice(0, 50000)); return; }
    const fd = new FormData(); fd.append("archivo", f);
    const d = await fetch("/api/subir-archivo", { method: "POST", body: fd }).then(r => r.json());
    if (d.rutaArchivo) setInput(d.rutaArchivo);
  };

  const handleExtras = async (e: React.ChangeEvent<HTMLInputElement>) => {
    for (const f of Array.from(e.target.files || [])) {
      const fd = new FormData(); fd.append("archivo", f);
      await fetch("/api/subir-archivo", { method: "POST", body: fd });
      setImagenesExtras(p => [...p, f.name]);
      setFramesDisponibles(p => p.includes(f.name) ? p : [...p, f.name]);
    }
    e.target.value = "";
  };

  const procesar = async () => {
    if (estado !== "idle") return;
    if (!input.trim()) return;
    // Limpiar todo el estado anterior antes de empezar
    setEstado("procesando");
    setError("");
    setImagenesExtras([]);
    setNotaPath("");
    setNotaNombre("");
    setFramesEnNota([]);
    setFramesActivos([]);
    setFramesDisponibles([]);
    try {
      const r = await fetch("/api/ejecutar-skill", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tipo, input, nombre }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      const [nr, ir] = await Promise.all([fetch("/api/actualizar-nota"), fetch("/api/images")]);
      const nd = await nr.json(); const id = await ir.json();
      if (!nd.notaPath) throw new Error("No se generó la nota. Intenta de nuevo.");
      const frames = extraerFrames(nd.contenido || "");
      setNotaPath(nd.notaPath); setNotaNombre(nd.notaNombre);
      setFramesEnNota(frames); setFramesActivos(frames);
      setFramesDisponibles(id.images ?? []);
      setEstado("revisando");
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Error"); setEstado("idle"); }
  };

  const toggle = (img: string) => setFramesActivos(p => p.includes(img) ? p.filter(x => x !== img) : [...p, img]);

  const guardar = async () => {
    setEstado("guardando");
    try {
      const r = await fetch("/api/actualizar-nota", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notaPath, framesSeleccionados: framesActivos, imagenesExtras }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setEstado("listo");
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Error guardando"); setEstado("revisando"); }
  };

  const reiniciar = () => {
    setEstado("idle");
    setInput("");
    setNombre("");
    setFileName("");
    setTipo("youtube");
    setFramesActivos([]);
    setFramesEnNota([]);
    setFramesDisponibles([]);
    setImagenesExtras([]);
    setNotaPath("");
    setNotaNombre("");
    setError("");
  };

  const t = TIPOS[tipo];
  const cobertura = framesDisponibles.filter(f => f.startsWith("cover_"));
  const otros = framesDisponibles.filter(f => !framesEnNota.includes(f) && !f.startsWith("cover_") && !imagenesExtras.includes(f));
  const activas = framesActivos.length + imagenesExtras.length;

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulseGlow { 0%,100% { opacity:0.2; transform:scale(0.9); } 50% { opacity:1; transform:scale(1.7); box-shadow:0 0 8px rgba(245,197,24,0.8); } }
      `}</style>

      {zoom && (
        <div style={s.zoom} onPointerDown={() => setZoom(null)}>
          <img src={`/api/images/${zoom}`} style={s.zoomImg} onPointerDown={e => e.stopPropagation()} alt="" />
          <div style={s.zoomBtns}>
            <button onPointerDown={e => { e.stopPropagation(); toggle(zoom); setZoom(null); }}
              style={{ ...s.zoomBtn, background: framesActivos.includes(zoom) ? "#3a1212" : "#0e2e1a", color: framesActivos.includes(zoom) ? "#ef4444" : "#22c55e" }}>
              {framesActivos.includes(zoom) ? "✕ Quitar" : "✓ Incluir"}
            </button>
            <button onPointerDown={e => { e.stopPropagation(); setZoom(null); }}
              style={{ ...s.zoomBtn, background: "var(--surface2)", color: "var(--muted2)" }}>
              Cerrar
            </button>
          </div>
        </div>
      )}

      <div style={s.wrap}>
        {/* HEADER */}
        <div style={s.header}>
          <div style={s.brand}>Knowledge Tool</div>
          <h1 style={s.title}>Extractor de Ideas<br/>y Oportunidades</h1>
          <p style={s.sub}>Convierte contenido en conocimiento<br/>accionable para Obsidian</p>
          <span style={s.version}>v 1.0</span>
        </div>

        {error && <div style={s.error}>⚠ {error}</div>}

        {/* IDLE */}
        {(estado === "idle" || estado === "procesando") && (
          <div style={s.card}>
            {input.trim() && (
              <div style={s.badge}>
                <span style={{ ...s.dot, background: t.dot }} />
                {t.label}
              </div>
            )}
            <input
              style={{ ...s.input, width: "100%", marginBottom: 8, fontWeight: 600 }}
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Nombre del video o contenido (opcional)"
              disabled={estado === "procesando"}
            />
            <div style={s.inputRow}>
              <input
                style={s.input}
                value={input}
                onChange={e => onChange(e.target.value)}
                placeholder="URL o pega texto aquí..."
                disabled={estado === "procesando"}
                onKeyDown={e => e.key === "Enter" && estado === "idle" && procesar()}
              />
              <input ref={fileRef} type="file" accept=".pdf,.txt,.md,.csv" onChange={handleFile} style={{ display: "none" }} />
              <button style={s.fileBtn} onClick={() => fileRef.current?.click()} disabled={estado === "procesando"}>
                {fileName ? "📎" : "📎 Archivo"}
              </button>
            </div>
            <button
              style={estado === "procesando" ? s.btnDis : (input.trim() ? s.btn : s.btnDis)}
              onClick={procesar}
              disabled={estado === "procesando" || !input.trim()}
              onMouseEnter={e => { if (estado === "idle" && input.trim()) { e.currentTarget.style.transform = "scale(1.03)"; e.currentTarget.style.boxShadow = "0 10px 30px rgba(245,197,24,0.4)"; } }}
              onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "none"; }}
            >
              {estado === "procesando" ? "Procesando..." : "Analizar →"}
            </button>

            {estado === "procesando" && (
              <div style={s.progress}>
                <div style={{ fontSize: 13, color: "var(--muted2)", marginBottom: 14 }}>
                  Analizando contenido con inteligencia artificial...{" "}
                  <strong style={{ color: "var(--text)" }}>No cierres esta página.</strong>
                </div>
                <div style={s.dots}>
                  {[0, 0.15, 0.3, 0.45, 0.6].map((d, i) => (
                    <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)", animation: `pulseGlow 1.4s infinite ${d}s` }} />
                  ))}
                  <span style={{ fontSize: 12, color: "var(--muted)", marginLeft: 10 }}>Procesando...</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* REVISANDO */}
        {estado === "revisando" && (
          <>
            <div style={{ ...s.card, borderColor: "#1a4a2e", background: "#0e1a14", marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: "var(--green)", fontWeight: 700, marginBottom: 2 }}>✓ NOTA GENERADA</div>
              <div style={{ fontSize: 13, color: "var(--muted2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{notaNombre}</div>
            </div>

            {/* Frames inteligentes */}
            {framesEnNota.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={s.sectionLabel}>Frames clave · {framesActivos.filter(f => framesEnNota.includes(f)).length}/{framesEnNota.length}</div>
                <div style={s.grid}>
                  {framesEnNota.map(img => (
                    <div key={img} style={s.imgWrap} onPointerDown={() => setZoom(img)}>
                      <img src={`/api/images/${img}`} style={{ ...s.img, border: framesActivos.includes(img) ? "2px solid var(--green)" : "2px solid var(--border)", opacity: framesActivos.includes(img) ? 1 : 0.4 }} alt="" />
                      {framesActivos.includes(img) && <div style={s.check}>✓</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Frames de cobertura */}
            {cobertura.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={s.sectionLabel}>Cobertura completa · toca para ampliar y añadir</div>
                <div style={s.grid}>
                  {cobertura.map(img => (
                    <div key={img} style={s.imgWrap} onPointerDown={() => setZoom(img)}>
                      <img src={`/api/images/${img}`} style={{ ...s.img, border: framesActivos.includes(img) ? "2px solid var(--accent)" : "2px solid transparent", opacity: framesActivos.includes(img) ? 1 : 0.5 }} alt="" />
                      {framesActivos.includes(img) && <div style={{ ...s.check, background: "var(--accent)", color: "#000" }}>✓</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Otros */}
            {otros.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={s.sectionLabel}>Otros disponibles</div>
                <div style={s.grid}>
                  {otros.map(img => (
                    <div key={img} style={s.imgWrap} onPointerDown={() => setZoom(img)}>
                      <img src={`/api/images/${img}`} style={{ ...s.img, border: "2px solid var(--border)", opacity: 0.5 }} alt="" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Imágenes manuales */}
            <input ref={uploadRef} type="file" accept="image/*" multiple onChange={handleExtras} style={{ display: "none" }} />
            <button style={{ ...s.btnSmall, width: "100%", marginBottom: 10 }} onClick={() => uploadRef.current?.click()}>
              + Subir imágenes manualmente
            </button>
            {imagenesExtras.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                {imagenesExtras.map(img => (
                  <span key={img} style={s.tagPill}>
                    📎 {img.slice(0, 18)}
                    <span style={s.removeTag} onClick={() => setImagenesExtras(p => p.filter(x => x !== img))}>✕</span>
                  </span>
                ))}
              </div>
            )}

            <div style={s.actionRow}>
              <button style={s.btnSmall} onClick={() => setFramesActivos([...framesEnNota])}>Todas</button>
              <button style={s.btnSmall} onClick={() => setFramesActivos([])}>Ninguna</button>
            </div>

            <button style={activas > 0 ? s.btn : s.btnDis} onClick={guardar} disabled={activas === 0}>
              Guardar en Obsidian · {activas} imagen{activas !== 1 ? "es" : ""}
            </button>
          </>
        )}

        {/* GUARDANDO */}
        {estado === "guardando" && (
          <div style={s.progress}>
            <div style={{ fontSize: 14, color: "var(--muted2)", marginBottom: 14 }}>Guardando en Obsidian...</div>
            <div style={s.dots}>
              {[0,0.2,0.4].map((d,i) => <div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--accent)", animation: `pulse 1.4s infinite ${d}s` }} />)}
            </div>
          </div>
        )}

        {/* LISTO */}
        {estado === "listo" && (
          <div style={s.successCard}>
            <div style={s.successTitle}>Nota guardada ✓</div>
            <div style={{ fontSize: 12, color: "var(--muted2)", marginBottom: 20, lineHeight: 1.6 }}>{notaNombre}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <a href="/nota" target="_blank" rel="noopener"
                style={{ display: "block", padding: "14px", background: "var(--accent)", color: "#000", borderRadius: "var(--radius)", textAlign: "center", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15 }}>
                Ver nota completa →
              </a>
              <button onClick={reiniciar}
                style={{ padding: "12px", background: "var(--surface2)", color: "var(--muted2)", border: "1px solid var(--border)", borderRadius: "var(--radius)", cursor: "pointer", fontSize: 14 }}>
                Analizar otro contenido
              </button>
            </div>
          </div>
        )}
      </div>

      {/* NAV BAR */}
      <div style={s.navBar}>
        <div style={s.navItem} onClick={reiniciar}>
          <span style={{ ...s.navIcon, color: "var(--accent)", fontSize: 22 }}>✦</span>
          <span style={{ ...s.navLabel, color: "var(--accent)" }}>Capturar</span>
        </div>
        <a href="/nota" target="_blank" style={{ ...s.navItem, textDecoration: "none" }}>
          <span style={{ ...s.navIcon, fontSize: 20 }}>◎</span>
          <span style={s.navLabel}>Última</span>
        </a>
        <a href="/notas" style={{ ...s.navItem, textDecoration: "none" }}>
          <span style={{ ...s.navIcon, fontSize: 20 }}>≡</span>
          <span style={s.navLabel}>Mis notas</span>
        </a>
      </div>
    </>
  );
}
