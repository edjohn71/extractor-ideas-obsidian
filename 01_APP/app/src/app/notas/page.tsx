"use client";

import { useEffect, useState } from "react";

interface NotaItem {
  nombre: string;
  titulo: string;
  fecha: string;
  tags: string[];
  url: string;
}

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function agrupar(notas: NotaItem[]): [string, NotaItem[]][] {
  const m: Record<string, NotaItem[]> = {};
  notas.forEach(n => {
    const [y, mo] = n.fecha.split("-");
    const k = `${MESES[parseInt(mo)-1]} ${y}`;
    if (!m[k]) m[k] = [];
    m[k].push(n);
  });
  return Object.entries(m);
}

export default function NotasPage() {
  const [notas, setNotas]       = useState<NotaItem[]>([]);
  const [cargando, setCargando] = useState(true);
  const [abiertos, setAbiertos] = useState<Record<string,boolean>>({});
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    fetch("/api/listar-notas").then(r => r.json()).then(d => {
      const lista: NotaItem[] = d.notas || [];
      setNotas(lista);
      if (lista.length) {
        const grupos = agrupar(lista);
        if (grupos[0]) setAbiertos({ [grupos[0][0]]: true });
      }
    }).finally(() => setCargando(false));
  }, []);

  const filtradas = busqueda.trim()
    ? notas.filter(n => n.titulo.toLowerCase().includes(busqueda.toLowerCase()) || n.tags.some(t => t.toLowerCase().includes(busqueda.toLowerCase())))
    : notas;

  const grupos = agrupar(filtradas);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Manrope:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:#0C0C0F;color:#EEEEF0;font-family:'Manrope',sans-serif;-webkit-font-smoothing:antialiased}

        .topbar{position:sticky;top:0;z-index:50;background:rgba(12,12,15,0.92);backdrop-filter:blur(12px);border-bottom:1px solid #2A2A32;padding:14px 16px;display:flex;align-items:center;gap:12px}
        .topbar-title{font-family:'Century Gothic','CenturyGothic','Trebuchet MS',Futura,sans-serif;font-size:17px;font-weight:700;flex:1;letter-spacing:-0.2px}
        .topbar a{font-size:12px;font-weight:600;padding:7px 14px;background:#1C1C22;border:1px solid #2A2A32;border-radius:8px;color:#9898A8;text-decoration:none}
        .topbar a:active{background:#2A2A32}

        .wrap{max-width:480px;margin:0 auto;padding:16px 16px 90px}

        .search{width:100%;padding:12px 14px;background:#141418;border:1px solid #2A2A32;border-radius:10px;color:#EEEEF0;font-family:'Manrope',sans-serif;font-size:14px;outline:none;margin-bottom:16px}
        .search::placeholder{color:#6B6B7A}
        .search:focus{border-color:#3A3A44}

        .count{font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#6B6B7A;margin-bottom:14px}

        .mes{margin-bottom:8px}
        .mes-btn{width:100%;display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:#141418;border:1px solid #2A2A32;border-radius:10px;cursor:pointer;margin-bottom:4px;user-select:none;-webkit-tap-highlight-color:transparent}
        .mes-btn:active{background:#1C1C22}
        .mes-name{font-family:'Century Gothic','CenturyGothic','Trebuchet MS',Futura,sans-serif;font-size:13px;font-weight:700;color:#EEEEF0}
        .mes-badge{background:#1C1C22;border:1px solid #2A2A32;border-radius:20px;padding:2px 10px;font-size:11px;font-weight:600;color:#6B6B7A}
        .mes-arrow{font-size:10px;color:#6B6B7A;transition:transform .2s}
        .mes-arrow.open{transform:rotate(90deg)}

        .lista{display:flex;flex-direction:column;gap:4px;margin-bottom:4px}
        .nota-card{display:block;padding:14px 14px;background:#141418;border:1px solid #2A2A32;border-radius:10px;text-decoration:none;transition:border-color .15s}
        .nota-card:active{border-color:#3A3A44;background:#1C1C22}
        .nota-titulo{font-size:13px;font-weight:600;color:#EEEEF0;line-height:1.45;margin-bottom:6px}
        .nota-meta{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
        .nota-fecha{font-size:11px;color:#6B6B7A}
        .nota-tag{font-size:10px;padding:2px 8px;background:#1C1C22;border:1px solid #2A2A32;border-radius:20px;color:#9898A8;font-weight:600}
        .nota-arrow{margin-left:auto;font-size:12px;color:#3A3A44}

        .vacio{text-align:center;padding:48px 20px;color:#6B6B7A;font-size:14px;line-height:1.7}

        .navbar{position:fixed;bottom:0;left:0;right:0;background:#141418;border-top:1px solid #2A2A32;display:flex;z-index:100}
        .nav-item{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:10px 0 14px;cursor:pointer;gap:3px;text-decoration:none;-webkit-tap-highlight-color:transparent}
        .nav-icon{font-size:20px;line-height:1}
        .nav-label{font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6B6B7A}
        .nav-label.active{color:#F5C518}
      `}</style>

      <div className="topbar">
        <span className="topbar-title">Mis Notas</span>
        <a href="/">＋ Nueva</a>
      </div>

      <div className="wrap">
        <input
          type="search"
          className="search"
          placeholder="Buscar por título o tema..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />

        {!cargando && (
          <div className="count">{filtradas.length} nota{filtradas.length !== 1 ? "s" : ""}</div>
        )}

        {cargando && <div className="vacio">Cargando notas...</div>}

        {!cargando && filtradas.length === 0 && (
          <div className="vacio">
            {busqueda ? "Sin resultados para esa búsqueda." : "No hay notas guardadas aún.\nProcesa tu primer video."}
          </div>
        )}

        {grupos.map(([mes, notasMes]) => (
          <div key={mes} className="mes">
            <button className="mes-btn" onClick={() => setAbiertos(p => ({ ...p, [mes]: !p[mes] }))}>
              <span className="mes-name">{mes}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="mes-badge">{notasMes.length}</span>
                <span className={`mes-arrow ${abiertos[mes] ? "open" : ""}`}>▶</span>
              </div>
            </button>

            {abiertos[mes] && (
              <div className="lista">
                {notasMes.map(n => (
                  <a key={n.nombre} href={`/nota?file=${encodeURIComponent(n.nombre)}`} className="nota-card">
                    <div className="nota-titulo">{n.titulo}</div>
                    <div className="nota-meta">
                      <span className="nota-fecha">{n.fecha}</span>
                      {n.tags.slice(0, 2).map(t => <span key={t} className="nota-tag">{t}</span>)}
                      <span className="nota-arrow">›</span>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="navbar">
        <a href="/" className="nav-item">
          <span className="nav-icon">✦</span>
          <span className="nav-label">Capturar</span>
        </a>
        <a href="/nota" target="_blank" className="nav-item">
          <span className="nav-icon">◎</span>
          <span className="nav-label">Última</span>
        </a>
        <a href="/notas" className="nav-item">
          <span className="nav-icon" style={{color:"#F5C518"}}>≡</span>
          <span className="nav-label active">Mis notas</span>
        </a>
      </div>
    </>
  );
}
