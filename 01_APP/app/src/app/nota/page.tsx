"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function mdToHtml(md: string, frames: string[]): string {
  let html = md
    .replace(/^---[\s\S]*?---\n/, "")
    .replace(/!\[\[Clippings\/selected\/([^\]]+)\]\]/g, (_, f) =>
      frames.includes(f)
        ? `<figure><img src="/api/images/${f}" alt="${f}" loading="lazy" /><figcaption>${f.replace(/_/g," ").replace(/\.jpg|\.png/,"")}</figcaption></figure>`
        : ""
    )
    .replace(/^#### (.+)$/gm, "<h4>$1</h4>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
    .replace(/^[-*] (.+)$/gm, "<li>$1</li>")
    .replace(/^(\d+)\. (.+)$/gm, "<li>$2</li>")
    .replace(/\|(.+)\|\n\|[-| :]+\|\n((?:\|.+\|\n?)*)/g, (_, h, rows) => {
      const ths = h.split("|").filter(Boolean).map((c: string) => `<th>${c.trim()}</th>`).join("");
      const trs = rows.trim().split("\n").map((r: string) =>
        "<tr>" + r.split("|").filter(Boolean).map((c: string) => `<td>${c.trim()}</td>`).join("") + "</tr>"
      ).join("");
      return `<table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
    })
    .replace(/```[\w]*\n([\s\S]*?)```/g, "<pre><code>$1</code></pre>")
    .replace(/^---$/gm, "<hr/>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br/>");

  html = "<p>" + html + "</p>";
  html = html.replace(/<p>\s*(<h[1-6]>)/g, "$1").replace(/(<\/h[1-6]>)\s*<\/p>/g, "$1");
  html = html.replace(/<p>\s*(<li>)/g, "<ul><p>$1").replace(/(<\/li>)\s*<\/p>/g, "$1</ul>");
  html = html.replace(/<p>\s*(<hr\/>)\s*<\/p>/g, "$1");
  html = html.replace(/<p>\s*(<figure>)/g, "$1").replace(/(<\/figure>)\s*<\/p>/g, "$1");
  html = html.replace(/<p>\s*(<table>)/g, "$1").replace(/(<\/table>)\s*<\/p>/g, "$1");
  html = html.replace(/<p>\s*(<pre>)/g, "$1").replace(/(<\/pre>)\s*<\/p>/g, "$1");
  html = html.replace(/<p>\s*(<blockquote>)/g, "$1").replace(/(<\/blockquote>)\s*<\/p>/g, "$1");
  html = html.replace(/<p>\s*<\/p>/g, "");
  return html;
}

function NotaContent() {
  const params = useSearchParams();
  const fileParam = params.get("file");

  const [nota, setNota] = useState<{ nombre: string; contenido: string; framesActivos: string[]; fecha: string } | null>(null);
  const [cargando, setCargando] = useState(true);
  const [zoomSrc, setZoomSrc] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      if (fileParam) {
        const res = await fetch(`/api/nota-guardada?file=${encodeURIComponent(fileParam)}`);
        const d = await res.json();
        if (d.ok) setNota(d);
      } else {
        const res = await fetch("/api/nota-guardada");
        const d = await res.json();
        if (d.ok) setNota(d);
      }
    } finally {
      setCargando(false);
    }
  }, [fileParam]);

  useEffect(() => { cargar(); }, [cargar]);

  const compartirWhatsApp = () => {
    const url = window.location.href;
    window.open(`https://wa.me/?text=${encodeURIComponent(`📚 Nota de estudio: ${nota?.nombre?.replace(".md","") || ""}\n${url}`)}`, "_blank");
  };

  const imprimirPDF = () => window.print();

  if (cargando) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "Verdana" }}>
      <p style={{ color: "#64748b" }}>Cargando nota...</p>
    </div>
  );

  if (!nota) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "Verdana", gap: "16px", padding: "20px" }}>
      <p style={{ color: "#64748b", fontSize: "16px", textAlign: "center" }}>No hay nota guardada todavía.</p>
      <a href="/" style={{ color: "#2563eb", fontSize: "14px" }}>← Procesar un video</a>
    </div>
  );

  const html = mdToHtml(nota.contenido, nota.framesActivos);
  const fecha = new Date(nota.fecha).toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #ffffff; font-family: Verdana, Geneva, Tahoma, sans-serif; color: #1a1a1a; }

        /* Barra de acciones — oculta al imprimir */
        .barra-acciones { background: #1e293b; color: white; padding: 10px 16px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; position: sticky; top: 0; z-index: 100; }
        .barra-acciones a, .barra-acciones button { color: white; text-decoration: none; font-family: 'Century Gothic','CenturyGothic','Trebuchet MS',Futura,sans-serif; font-size: 12px; font-weight: 700; background: rgba(255,255,255,0.15); border: none; padding: 7px 14px; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; letter-spacing: 0.3px; }
        .barra-acciones a:hover, .barra-acciones button:hover { background: rgba(255,255,255,0.25); }
        .barra-titulo { flex: 1; font-size: 13px; color: rgba(255,255,255,0.7); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        /* Contenido */
        .contenedor { max-width: 720px; margin: 0 auto; padding: 32px 20px 80px; }
        .meta-fecha { font-size: 12px; color: #94a3b8; margin-bottom: 28px; }

        /* Tipografía Verdana — más espaciado para legibilidad */
        .nota h1 { font-size: 24px; line-height: 1.35; color: #111; margin-bottom: 20px; }
        .nota h2 { font-size: 17px; line-height: 1.4; margin: 32px 0 10px; color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; }
        .nota h3 { font-size: 15px; margin: 24px 0 8px; color: #334155; }
        .nota h4 { font-size: 13px; margin: 16px 0 6px; color: #475569; }
        .nota p  { font-size: 14px; line-height: 1.9; margin-bottom: 14px; color: #1a1a1a; }
        .nota li { font-size: 14px; line-height: 1.9; margin-bottom: 6px; color: #1a1a1a; }
        .nota ul { padding-left: 22px; margin-bottom: 16px; }
        .nota a  { color: #2563eb; word-break: break-word; }
        .nota code { background: #f1f5f9; padding: 2px 6px; border-radius: 3px; font-size: 12px; font-family: monospace; }
        .nota pre { background: #1e293b; color: #e2e8f0; padding: 16px; border-radius: 8px; overflow-x: auto; font-size: 12px; margin: 14px 0; }
        .nota pre code { background: none; color: inherit; padding: 0; }
        .nota blockquote { border-left: 4px solid #3b82f6; padding: 10px 16px; margin: 14px 0; color: #374151; background: #f8fafc; border-radius: 0 6px 6px 0; }
        .nota table { border-collapse: collapse; width: 100%; margin: 14px 0; font-size: 13px; }
        .nota th { background: #f1f5f9; padding: 8px 12px; border: 1px solid #e2e8f0; text-align: left; font-weight: bold; }
        .nota td { padding: 8px 12px; border: 1px solid #e2e8f0; }
        .nota tr:nth-child(even) td { background: #fafafa; }
        .nota hr { border: none; border-top: 1px solid #e2e8f0; margin: 24px 0; }
        .nota figure { margin: 22px 0; text-align: center; }
        .nota figure img { max-width: 100%; border-radius: 8px; border: 1px solid #e2e8f0; cursor: zoom-in; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        .nota figure figcaption { font-size: 11px; color: #94a3b8; margin-top: 6px; font-style: italic; }
        .nota strong { color: #111; }

        /* Zoom */
        .zoom-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.92); z-index: 9999; display: flex; align-items: center; justify-content: center; cursor: zoom-out; }
        .zoom-overlay img { max-width: 96vw; max-height: 94vh; object-fit: contain; border-radius: 6px; }

        @media (max-width: 640px) {
          .contenedor { padding: 20px 14px 60px; }
          .nota h1 { font-size: 20px; }
          .nota h2 { font-size: 16px; }
          .nota p, .nota li { font-size: 13px; line-height: 1.8; }
        }

        @media print {
          .barra-acciones { display: none !important; }
          .contenedor { padding: 0; max-width: 100%; }
          .nota figure img { max-width: 80%; }
          body { font-size: 12px; }
        }
      `}</style>

      {/* Zoom */}
      {zoomSrc && (
        <div className="zoom-overlay" onPointerDown={() => setZoomSrc(null)}>
          <img src={zoomSrc} alt="" onPointerDown={e => e.stopPropagation()} />
        </div>
      )}

      {/* Barra superior */}
      <div className="barra-acciones">
        <a href="/notas">≡ Mis notas</a>
        <a href="/">✦ Nueva</a>
        <span className="barra-titulo">{nota.nombre.replace(".md","")}</span>
        <button onClick={compartirWhatsApp}>💬 WhatsApp</button>
        <button onClick={imprimirPDF}>📄 PDF</button>
      </div>

      {/* Nota */}
      <div className="contenedor">
        <p className="meta-fecha">📅 {fecha}</p>
        <div
          className="nota"
          dangerouslySetInnerHTML={{ __html: html }}
          onClick={e => {
            const t = e.target as HTMLElement;
            if (t.tagName === "IMG") setZoomSrc((t as HTMLImageElement).src);
          }}
        />
      </div>
    </>
  );
}

export default function NotaPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, fontFamily: "Verdana", color: "#64748b" }}>Cargando...</div>}>
      <NotaContent />
    </Suspense>
  );
}
