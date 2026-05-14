import { useState, useRef } from "react";

const MOCK_LOGO = "https://mbalsusqtkbtoxuawjau.supabase.co/storage/v1/object/public/asset/RAMPAGE%20FOR%20APP.png";

const MEMBERS = [
  { name: "VALIANT",  role: "Leader",  cls: "Berserker",   points: 3200, status: "Active"  },
  { name: "xJINN",    role: "Elder",   cls: "Archer",      points: 2400, status: "Active"  },
  { name: "CHMB",     role: "Elder",   cls: "Volva",       points: 2100, status: "Offline" },
  { name: "YUJIRO",   role: "Member",  cls: "Warlord",     points: 1800, status: "Active"  },
  { name: "SKADI",    role: "Member",  cls: "Skald",       points: 1600, status: "Active"  },
  { name: "ZEROTH",   role: "Recruit", cls: "RuneFighter", points: 900,  status: "Offline" },
];

const BOSSES = [
  { name: "Cruel Outlaw Gand",   timer: "00:21:14", status: "Respawning", ch: "CH 1", color: "#f59e0b" },
  { name: "Gatekeeper Amot",     timer: "00:49:33", status: "Waiting",    ch: "CH 2", color: "#60a5fa" },
  { name: "Destroyer Hawler",    timer: "LIVE",     status: "Alive",      ch: "CH 3", color: "#34d399" },
  { name: "Assulter Laudd",      timer: "01:12:05", status: "Waiting",    ch: "CH 1", color: "#60a5fa" },
];

const STATS = [
  { label: "Total Members", value: "54",    icon: "👥", color: "#818cf8", glow: "rgba(129,140,248,0.15)" },
  { label: "Bosses Active", value: "8",     icon: "⚔️", color: "#f87171", glow: "rgba(248,113,113,0.15)" },
  { label: "Attendance",    value: "92%",   icon: "📋", color: "#34d399", glow: "rgba(52,211,153,0.15)"  },
  { label: "Guild Points",  value: "14.2K", icon: "🏆", color: "#fbbf24", glow: "rgba(251,191,36,0.15)"  },
];

const NAV = [
  { id: "dashboard",  label: "Dashboard",     icon: "⊞" },
  { id: "members",    label: "Members",       icon: "👥" },
  { id: "bosses",     label: "Boss Timers",   icon: "⚔️" },
  { id: "attendance", label: "Attendance",    icon: "📋" },
  { id: "auction",    label: "Auction House", icon: "🏺" },
  { id: "winners",    label: "Winners",       icon: "🥇" },
  { id: "settings",   label: "Settings",      icon: "⚙️" },
];

const ROLE_STYLE = {
  Leader:  { bg: "rgba(251,191,36,0.12)",  color: "#fbbf24", border: "rgba(251,191,36,0.25)" },
  Elder:   { bg: "rgba(96,165,250,0.12)",  color: "#60a5fa", border: "rgba(96,165,250,0.25)" },
  Member:  { bg: "rgba(148,163,184,0.08)", color: "#94a3b8", border: "rgba(148,163,184,0.18)" },
  Recruit: { bg: "rgba(167,139,250,0.12)", color: "#a78bfa", border: "rgba(167,139,250,0.25)" },
};

const STATUS_STYLE = {
  Active:  { bg: "rgba(52,211,153,0.1)",  color: "#34d399", dot: "#34d399" },
  Offline: { bg: "rgba(100,116,139,0.1)", color: "#64748b", dot: "#475569" },
};

const BOSS_STATUS = {
  Alive:      { bg: "rgba(52,211,153,0.12)",  color: "#34d399", border: "rgba(52,211,153,0.25)"  },
  Respawning: { bg: "rgba(251,191,36,0.12)",  color: "#fbbf24", border: "rgba(251,191,36,0.25)"  },
  Waiting:    { bg: "rgba(96,165,250,0.12)",  color: "#60a5fa", border: "rgba(96,165,250,0.25)"  },
};

export default function RampageDashboard() {
  const [activeNav, setActiveNav]     = useState("dashboard");
  const [logoUrl, setLogoUrl]         = useState(MOCK_LOGO);
  const [logoError, setLogoError]     = useState(false);
  const [uploading, setUploading]     = useState(false);
  const [uploadMsg, setUploadMsg]     = useState("");
  const [collapsed, setCollapsed]     = useState(false);
  const [hoveredRow, setHoveredRow]   = useState(null);
  const [search, setSearch]           = useState("");
  const fileRef                        = useRef(null);

  const filtered = MEMBERS.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.cls.toLowerCase().includes(search.toLowerCase())
  );

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadMsg("");
    const reader = new FileReader();
    reader.onload = ev => setLogoUrl(ev.target.result);
    reader.readAsDataURL(file);
    try {
      const { supabase } = await import("./supabase");
      const ext = file.name.split(".").pop();
      const path = `guild-logo.${ext}`;
      const { error } = await supabase.storage.from("asset").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("asset").getPublicUrl(path);
      setLogoUrl(data.publicUrl + "?t=" + Date.now());
      setUploadMsg("✅ Logo saved!");
    } catch {
      setUploadMsg("⚠️ Preview only");
    }
    setUploading(false);
    setTimeout(() => setUploadMsg(""), 3000);
  };

  const W = collapsed ? 72 : 256;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Exo+2:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:#07080f;overflow:hidden}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#1e2235;border-radius:4px}
        .nav-btn:hover{background:rgba(255,255,255,0.05)!important;color:#94a3b8!important}
        .stat-card:hover{transform:translateY(-3px);box-shadow:0 12px 40px rgba(0,0,0,0.4)!important}
        .boss-card:hover{background:rgba(255,255,255,0.04)!important}
        .action-btn:hover{filter:brightness(1.15)}
        .logo-ring:hover .logo-overlay{opacity:1!important}
        .row-hover{background:rgba(255,255,255,0.035)!important}
        .nav-active{background:rgba(99,102,241,0.14)!important;color:#a5b4fc!important;border:1px solid rgba(99,102,241,0.22)!important}
      `}</style>

      <div style={{ display:"flex", minHeight:"100vh", background:"#07080f", fontFamily:"'Exo 2',sans-serif", color:"#e2e8f0", overflow:"hidden", position:"relative" }}>

        {/* Ambient glows */}
        <div style={{ position:"fixed", top:-200, left:-100, width:600, height:600, background:"radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)", pointerEvents:"none", zIndex:0 }} />
        <div style={{ position:"fixed", bottom:-200, right:-100, width:500, height:500, background:"radial-gradient(circle, rgba(251,191,36,0.05) 0%, transparent 70%)", pointerEvents:"none", zIndex:0 }} />

        {/* ── SIDEBAR ── */}
        <aside style={{ width:W, minHeight:"100vh", background:"linear-gradient(180deg,#0a0c18 0%,#080a14 100%)", borderRight:"1px solid rgba(255,255,255,0.055)", display:"flex", flexDirection:"column", flexShrink:0, transition:"width .28s cubic-bezier(.4,0,.2,1)", overflow:"hidden", position:"relative", zIndex:10, boxShadow:"4px 0 32px rgba(0,0,0,0.5)" }}>

          {/* Logo row */}
          <div style={{ display:"flex", alignItems:"center", gap:12, padding:"22px 14px 16px", flexShrink:0 }}>
            <div
              className="logo-ring"
              onClick={() => fileRef.current?.click()}
              title="Click to change guild logo"
              style={{ width:46, height:46, borderRadius:"50%", border:"2px solid rgba(251,191,36,0.45)", background:"rgba(251,191,36,0.07)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", position:"relative", overflow:"hidden", flexShrink:0, boxShadow:"0 0 18px rgba(251,191,36,0.18)", transition:"border-color .2s" }}
            >
              {logoError || !logoUrl
                ? <span style={{ fontSize:20 }}>⚔️</span>
                : <img src={logoUrl} alt="logo" style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius:"50%" }} onError={() => setLogoError(true)} />
              }
              <div className="logo-overlay" style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.65)", display:"flex", alignItems:"center", justifyContent:"center", opacity:0, transition:"opacity .2s", borderRadius:"50%" }}>
                <span style={{ fontSize:14 }}>📷</span>
              </div>
              {uploading && <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.6)", display:"flex", alignItems:"center", justifyContent:"center", borderRadius:"50%", fontSize:10 }}>⏳</div>}
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleLogoUpload} />

            {!collapsed && (
              <div style={{ flex:1, minWidth:0 }}>
                <h1 style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:21, fontWeight:700, letterSpacing:"0.12em", background:"linear-gradient(135deg,#fbbf24,#f59e0b)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", whiteSpace:"nowrap" }}>RAMPAGE</h1>
                <p style={{ color:"#3d4a63", fontSize:10, letterSpacing:"0.07em", marginTop:1 }}>GUILD TRACKER</p>
                {uploadMsg && <p style={{ color:"#34d399", fontSize:10, marginTop:3 }}>{uploadMsg}</p>}
              </div>
            )}
            <button onClick={() => setCollapsed(!collapsed)} style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", color:"#3d4a63", cursor:"pointer", borderRadius:6, padding:"4px 7px", fontSize:10, flexShrink:0, marginLeft: collapsed ? "auto" : 0, transition:"all .15s" }}>
              {collapsed ? "▶" : "◀"}
            </button>
          </div>

          <div style={{ height:1, background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.055),transparent)", margin:"0 14px 10px" }} />

          {/* Nav */}
          <nav style={{ flex:1, display:"flex", flexDirection:"column", gap:2, padding:"0 8px" }}>
            {NAV.map(item => (
              <button
                key={item.id}
                className={`nav-btn${activeNav === item.id ? " nav-active" : ""}`}
                onClick={() => setActiveNav(item.id)}
                style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:10, background:"none", border:"1px solid transparent", color: activeNav===item.id ? "#a5b4fc" : "#3d4a63", cursor:"pointer", fontSize:13, fontWeight:500, fontFamily:"'Exo 2',sans-serif", transition:"all .15s", position:"relative", whiteSpace:"nowrap", justifyContent: collapsed ? "center" : "flex-start" }}
              >
                <span style={{ fontSize:15, flexShrink:0 }}>{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
                {activeNav===item.id && <div style={{ position:"absolute", right:10, width:5, height:5, borderRadius:"50%", background:"#818cf8", boxShadow:"0 0 7px #818cf8" }} />}
              </button>
            ))}
          </nav>

          {/* User card */}
          {!collapsed && (
            <div style={{ margin:"12px 8px 0", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.055)", borderRadius:12, padding:"12px 14px", display:"flex", alignItems:"center", gap:10, position:"relative", flexShrink:0 }}>
              <div style={{ width:34, height:34, borderRadius:"50%", background:"linear-gradient(135deg,#fbbf24,#d97706)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:14, color:"#1c1207", flexShrink:0 }}>V</div>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:"#e2e8f0" }}>VALIANT</div>
                <div style={{ fontSize:11, color:"#fbbf24", marginTop:1 }}>Guild Leader</div>
              </div>
              <div style={{ position:"absolute", top:10, right:12, width:7, height:7, borderRadius:"50%", background:"#34d399", boxShadow:"0 0 7px #34d399" }} />
            </div>
          )}
        </aside>

        {/* ── MAIN ── */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0, overflow:"hidden" }}>

          {/* Topbar */}
          <header style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 28px", borderBottom:"1px solid rgba(255,255,255,0.05)", background:"rgba(7,8,15,0.85)", backdropFilter:"blur(12px)", flexShrink:0, gap:12, flexWrap:"wrap" }}>
            <div>
              <h2 style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:26, fontWeight:700, letterSpacing:"0.04em", color:"#f1f5f9" }}>
                {NAV.find(n=>n.id===activeNav)?.label}
              </h2>
              <p style={{ color:"#334155", fontSize:12, marginTop:2 }}>
                {{
                  dashboard: "Overview of your guild's activity",
                  members:   "Manage your full guild roster",
                  bosses:    "Live respawn and spawn tracking",
                  attendance:"Track and manage member attendance",
                  auction:   "Browse and bid on guild auctions",
                  winners:   "View past auction winners",
                  settings:  "Configure guild preferences",
                }[activeNav]}
              </p>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:"8px 14px" }}>
                <span style={{ color:"#334155", fontSize:13 }}>🔍</span>
                <input placeholder="Search members..." style={{ background:"none", border:"none", outline:"none", color:"#94a3b8", fontSize:12, width:160, fontFamily:"'Exo 2',sans-serif" }} value={search} onChange={e=>setSearch(e.target.value)} />
              </div>
              <button className="action-btn" style={{ background:"linear-gradient(135deg,#4f46e5,#6366f1)", border:"none", color:"#fff", padding:"9px 18px", borderRadius:10, cursor:"pointer", fontSize:12, fontWeight:700, fontFamily:"'Exo 2',sans-serif", boxShadow:"0 4px 18px rgba(99,102,241,0.3)", letterSpacing:"0.04em" }}>
                + Add Member
              </button>
              <button className="action-btn" style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", color:"#64748b", padding:"9px 14px", borderRadius:10, cursor:"pointer", fontSize:12, fontWeight:600, fontFamily:"'Exo 2',sans-serif" }}>
                Export
              </button>
            </div>
          </header>

          {/* Scrollable content */}
          <div style={{ flex:1, overflow:"auto", padding:"24px 28px" }}>

            {/* Stats */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))", gap:14, marginBottom:22 }}>
              {STATS.map(s => (
                <div key={s.label} className="stat-card" style={{ background:"linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))", border:"1px solid rgba(255,255,255,0.065)", borderRadius:16, padding:"18px 20px", display:"flex", alignItems:"center", gap:14, position:"relative", overflow:"hidden", transition:"transform .2s,box-shadow .2s", cursor:"default" }}>
                  <div style={{ width:44, height:44, borderRadius:12, background:s.glow, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{s.icon}</div>
                  <div>
                    <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:26, fontWeight:700, color:s.color, lineHeight:1 }}>{s.value}</div>
                    <div style={{ color:"#334155", fontSize:11, marginTop:3, textTransform:"uppercase", letterSpacing:"0.07em" }}>{s.label}</div>
                  </div>
                  <div style={{ position:"absolute", bottom:-16, right:-16, width:70, height:70, borderRadius:"50%", background:s.glow, filter:"blur(18px)", pointerEvents:"none" }} />
                  <div style={{ position:"absolute", top:10, right:12, fontSize:8, fontWeight:700, letterSpacing:"0.1em", color:"#34d399", background:"rgba(52,211,153,0.1)", border:"1px solid rgba(52,211,153,0.2)", padding:"2px 6px", borderRadius:4 }}>LIVE</div>
                </div>
              ))}
            </div>

            {/* Two-column grid */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 360px", gap:18 }}>

              {/* Members table */}
              <div style={{ background:"linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))", border:"1px solid rgba(255,255,255,0.065)", borderRadius:18, overflow:"hidden" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"18px 20px 14px", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                  <div>
                    <h3 style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:17, fontWeight:700, color:"#f1f5f9", letterSpacing:"0.04em" }}>Guild Members</h3>
                    <p style={{ color:"#334155", fontSize:11, marginTop:2 }}>{filtered.length} of {MEMBERS.length} members shown</p>
                  </div>
                  <button className="action-btn" style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", color:"#64748b", padding:"6px 12px", borderRadius:8, cursor:"pointer", fontSize:11, fontWeight:600, fontFamily:"'Exo 2',sans-serif" }}>Manage Roles</button>
                </div>
                <div style={{ overflowX:"auto" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead>
                      <tr style={{ background:"rgba(255,255,255,0.02)" }}>
                        {["Member","Class","Role","Points","Status",""].map(h=>(
                          <th key={h} style={{ padding:"9px 16px", textAlign:"left", color:"#1e2a3a", fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((m,i)=>{
                        const rs = ROLE_STYLE[m.role]   || ROLE_STYLE.Member;
                        const ss = STATUS_STYLE[m.status] || STATUS_STYLE.Offline;
                        return (
                          <tr key={m.name} className={hoveredRow===i?"row-hover":""} style={{ transition:"background .1s", cursor:"default" }} onMouseEnter={()=>setHoveredRow(i)} onMouseLeave={()=>setHoveredRow(null)}>
                            <td style={{ padding:"12px 16px", borderBottom:"1px solid rgba(255,255,255,0.028)" }}>
                              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                                <div style={{ width:30, height:30, borderRadius:8, background:rs.bg, border:`1px solid ${rs.border}`, color:rs.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800, flexShrink:0 }}>{m.name[0]}</div>
                                <span style={{ fontWeight:700, color:"#e2e8f0", fontSize:13, letterSpacing:"0.03em" }}>{m.name}</span>
                              </div>
                            </td>
                            <td style={{ padding:"12px 16px", color:"#64748b", fontSize:12, borderBottom:"1px solid rgba(255,255,255,0.028)" }}>{m.cls}</td>
                            <td style={{ padding:"12px 16px", borderBottom:"1px solid rgba(255,255,255,0.028)" }}>
                              <span style={{ display:"inline-flex", alignItems:"center", padding:"3px 9px", borderRadius:6, background:rs.bg, color:rs.color, border:`1px solid ${rs.border}`, fontSize:10, fontWeight:700, letterSpacing:"0.04em" }}>{m.role}</span>
                            </td>
                            <td style={{ padding:"12px 16px", color:"#fbbf24", fontWeight:700, fontSize:14, fontFamily:"'Rajdhani',sans-serif", letterSpacing:"0.04em", borderBottom:"1px solid rgba(255,255,255,0.028)" }}>{m.points.toLocaleString()}</td>
                            <td style={{ padding:"12px 16px", borderBottom:"1px solid rgba(255,255,255,0.028)" }}>
                              <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 9px", borderRadius:6, background:ss.bg, color:ss.color, fontSize:10, fontWeight:700 }}>
                                <span style={{ width:5, height:5, borderRadius:"50%", background:ss.dot, display:"inline-block" }} />
                                {m.status}
                              </span>
                            </td>
                            <td style={{ padding:"12px 16px", borderBottom:"1px solid rgba(255,255,255,0.028)" }}>
                              <button className="action-btn" style={{ background:"rgba(99,102,241,0.1)", border:"1px solid rgba(99,102,241,0.22)", color:"#a5b4fc", padding:"4px 11px", borderRadius:6, cursor:"pointer", fontSize:10, fontWeight:700, fontFamily:"'Exo 2',sans-serif" }}>Edit</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Boss timers */}
              <div style={{ background:"linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))", border:"1px solid rgba(255,255,255,0.065)", borderRadius:18, overflow:"hidden" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"18px 20px 14px", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                  <div>
                    <h3 style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:17, fontWeight:700, color:"#f1f5f9", letterSpacing:"0.04em" }}>Boss Timers</h3>
                    <p style={{ color:"#334155", fontSize:11, marginTop:2 }}>Live respawn monitoring</p>
                  </div>
                  <button className="action-btn" style={{ background:"rgba(248,113,113,0.1)", border:"1px solid rgba(248,113,113,0.22)", color:"#f87171", padding:"6px 12px", borderRadius:8, cursor:"pointer", fontSize:11, fontWeight:700, fontFamily:"'Exo 2',sans-serif" }}>+ Log Kill</button>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:8, padding:"14px 16px" }}>
                  {BOSSES.map(b=>{
                    const bs = BOSS_STATUS[b.status] || BOSS_STATUS.Waiting;
                    return (
                      <div key={b.name} className="boss-card" style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.055)", borderRadius:12, padding:"13px 15px", position:"relative", overflow:"hidden", transition:"background .15s", cursor:"default" }}>
                        <div style={{ position:"absolute", left:0, top:0, bottom:0, width:3, background:b.color, borderRadius:"2px 0 0 2px" }} />
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                          <div>
                            <div style={{ fontSize:13, fontWeight:700, color:"#e2e8f0" }}>{b.name}</div>
                            <div style={{ fontSize:11, color:"#334155", marginTop:2 }}>{b.ch}</div>
                          </div>
                          <span style={{ display:"inline-flex", alignItems:"center", padding:"3px 9px", borderRadius:6, background:bs.bg, color:bs.color, border:`1px solid ${bs.border}`, fontSize:10, fontWeight:700, letterSpacing:"0.04em" }}>{b.status}</span>
                        </div>
                        <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:26, fontWeight:700, color:b.color, letterSpacing:"0.06em", lineHeight:1 }}>{b.timer}</div>
                        <button className="action-btn" style={{ marginTop:10, width:"100%", background:`${b.color}15`, border:`1px solid ${b.color}35`, color:b.color, padding:"6px", borderRadius:7, cursor:"pointer", fontSize:11, fontWeight:700, fontFamily:"'Exo 2',sans-serif" }}>Mark Killed</button>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
