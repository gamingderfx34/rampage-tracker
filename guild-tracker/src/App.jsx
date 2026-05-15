import { useState, useRef, useEffect } from "react";

const MOCK_LOGO = "https://mbalsusqtkbtoxuawjau.supabase.co/storage/v1/object/public/asset/RAMPAGE%20FOR%20APP.png";

const INIT_MEMBERS = [
  { id:1, name:"VALIANT",  role:"Leader",  cls:"Berserker",   points:3200, status:"Active"  },
  { id:2, name:"xJINN",    role:"Elder",   cls:"Archer",      points:2400, status:"Active"  },
  { id:3, name:"CHMB",     role:"Elder",   cls:"Volva",       points:2100, status:"Offline" },
  { id:4, name:"YUJIRO",   role:"Member",  cls:"Warlord",     points:1800, status:"Active"  },
  { id:5, name:"SKADI",    role:"Member",  cls:"Skald",       points:1600, status:"Active"  },
  { id:6, name:"ZEROTH",   role:"Recruit", cls:"RuneFighter", points:900,  status:"Offline" },
];

// Boss respawn times in seconds
const INIT_BOSSES = [
  { id:1, name:"Cruel Outlaw Gand",  secs:1274, minR:30, maxR:60, ch:"CH 1", color:"#f59e0b" },
  { id:2, name:"Gatekeeper Amot",    secs:2973, minR:45, maxR:90, ch:"CH 2", color:"#60a5fa" },
  { id:3, name:"Destroyer Hawler",   secs:0,    minR:30, maxR:60, ch:"CH 3", color:"#34d399" },
  { id:4, name:"Assulter Laudd",     secs:4325, minR:30, maxR:60, ch:"CH 1", color:"#a78bfa" },
];

const NAV = [
  { id:"dashboard",  label:"Dashboard",     icon:"⊞" },
  { id:"members",    label:"Members",       icon:"👥" },
  { id:"bosses",     label:"Boss Timers",   icon:"⚔️" },
  { id:"attendance", label:"Attendance",    icon:"📋" },
  { id:"auction",    label:"Auction House", icon:"🏺" },
  { id:"winners",    label:"Winners",       icon:"🥇" },
  { id:"settings",   label:"Settings",      icon:"⚙️" },
];

const ROLE_STYLE = {
  Leader:  { bg:"rgba(251,191,36,0.12)",  color:"#fbbf24", border:"rgba(251,191,36,0.3)"  },
  Elder:   { bg:"rgba(96,165,250,0.12)",  color:"#60a5fa", border:"rgba(96,165,250,0.3)"  },
  Member:  { bg:"rgba(148,163,184,0.08)", color:"#94a3b8", border:"rgba(148,163,184,0.2)" },
  Recruit: { bg:"rgba(167,139,250,0.12)", color:"#a78bfa", border:"rgba(167,139,250,0.3)" },
  Creator: { bg:"rgba(248,113,113,0.12)", color:"#f87171", border:"rgba(248,113,113,0.3)" },
};

const STATUS_STYLE = {
  Active:  { bg:"rgba(52,211,153,0.1)",  color:"#34d399", dot:"#34d399" },
  Offline: { bg:"rgba(100,116,139,0.1)", color:"#64748b", dot:"#475569" },
};

function fmtSecs(s) {
  if (s <= 0) return "LIVE";
  const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60;
  if (h > 0) return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
  return `${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
}

function bossStatus(secs) {
  if (secs <= 0) return "Alive";
  if (secs <= 300) return "Respawning";
  return "Waiting";
}

const BOSS_STATUS_STYLE = {
  Alive:      { bg:"rgba(52,211,153,0.12)",  color:"#34d399", border:"rgba(52,211,153,0.3)"  },
  Respawning: { bg:"rgba(251,191,36,0.12)",  color:"#fbbf24", border:"rgba(251,191,36,0.3)"  },
  Waiting:    { bg:"rgba(96,165,250,0.12)",  color:"#60a5fa", border:"rgba(96,165,250,0.3)"  },
};

const today = new Date().toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});
const INIT_ATTENDANCE = INIT_MEMBERS.map(m=>({
  memberId: m.id, name: m.name, role: m.role,
  logs: [
    { date:"Mon, May 12", present:true,  note:"On time" },
    { date:"Tue, May 13", present:true,  note:"On time" },
    { date:"Wed, May 14", present:m.status==="Active", note: m.status==="Active"?"On time":"Absent" },
    { date:today,         present:m.status==="Active", note: m.status==="Active"?"Present":"Absent" },
  ]
}));

export default function App() {
  const [activeNav, setActiveNav]   = useState("dashboard");
  const [collapsed, setCollapsed]   = useState(false);
  const [logoUrl, setLogoUrl]       = useState(MOCK_LOGO);
  const [logoErr, setLogoErr]       = useState(false);
  const [uploading, setUploading]   = useState(false);
  const [uploadMsg, setUploadMsg]   = useState("");
  const [members, setMembers]       = useState(INIT_MEMBERS);
  const [bosses, setBosses]         = useState(INIT_BOSSES);
  const [attendance, setAttendance] = useState(INIT_ATTENDANCE);
  const [search, setSearch]         = useState("");
  const [hovRow, setHovRow]         = useState(null);
  const [killFlash, setKillFlash]   = useState(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember]   = useState({ name:"", role:"Member", cls:"Berserker", status:"Active" });
  const fileRef = useRef(null);

  // Live boss countdown
  useEffect(() => {
    const t = setInterval(() => {
      setBosses(prev => prev.map(b => ({ ...b, secs: Math.max(0, b.secs - 1) })));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true); setUploadMsg("");
    const reader = new FileReader();
    reader.onload = ev => setLogoUrl(ev.target.result);
    reader.readAsDataURL(file);
    try {
      const { supabase } = await import("./supabase");
      const ext = file.name.split(".").pop();
      const path = `guild-logo.${ext}`;
      const { error } = await supabase.storage.from("asset").upload(path, file, { upsert:true });
      if (error) throw error;
      const { data } = supabase.storage.from("asset").getPublicUrl(path);
      setLogoUrl(data.publicUrl + "?t=" + Date.now());
      setUploadMsg("✅ Saved!");
    } catch { setUploadMsg("⚠️ Preview only"); }
    setUploading(false);
    setTimeout(() => setUploadMsg(""), 3000);
  };

  const handleMarkKilled = (id) => {
    setKillFlash(id);
    setTimeout(() => setKillFlash(null), 600);
    setBosses(prev => prev.map(b => {
      if (b.id !== id) return b;
      const respawn = (b.minR + Math.random() * (b.maxR - b.minR)) * 60;
      return { ...b, secs: Math.floor(respawn) };
    }));
  };

  const handleMarkAttendance = (memberId, date, present) => {
    setAttendance(prev => prev.map(a => {
      if (a.memberId !== memberId) return a;
      return { ...a, logs: a.logs.map(l => l.date === date ? { ...l, present, note: present ? "Present" : "Absent" } : l) };
    }));
  };

  const handleAddMember = () => {
    if (!newMember.name.trim()) return;
    const m = { ...newMember, id: Date.now(), points: 0 };
    setMembers(prev => [...prev, m]);
    setAttendance(prev => [...prev, { memberId: m.id, name: m.name, role: m.role, logs: [{ date: today, present: true, note: "Joined" }] }]);
    setNewMember({ name:"", role:"Member", cls:"Berserker", status:"Active" });
    setShowAddMember(false);
  };

  const filtered = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.cls.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = members.filter(m => m.status === "Active").length;
  const presentToday = attendance.filter(a => a.logs.some(l => l.date === today && l.present)).length;
  const attendancePct = members.length ? Math.round((presentToday / members.length) * 100) : 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Exo+2:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; background: #07080f; overflow: hidden; }
        #root { height: 100%; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1e2235; border-radius: 4px; }
        .sidebar { transition: width 0.32s cubic-bezier(0.4,0,0.2,1); overflow: hidden; }
        .sidebar-text { transition: opacity 0.2s, transform 0.2s; }
        .sidebar.collapsed .sidebar-text { opacity: 0; pointer-events: none; transform: translateX(-8px); }
        .sidebar:not(.collapsed) .sidebar-text { opacity: 1; transform: translateX(0); }
        .nav-btn { transition: background 0.15s, color 0.15s, transform 0.1s; border: 1px solid transparent; }
        .nav-btn:hover { background: rgba(255,255,255,0.06) !important; color: #94a3b8 !important; transform: translateX(2px); }
        .nav-btn.active { background: rgba(99,102,241,0.15) !important; color: #a5b4fc !important; border-color: rgba(99,102,241,0.25) !important; }
        .stat-card { transition: transform 0.2s, box-shadow 0.2s; }
        .stat-card:hover { transform: translateY(-4px); box-shadow: 0 16px 48px rgba(0,0,0,0.5) !important; }
        .boss-card { transition: background 0.15s, transform 0.15s; }
        .boss-card:hover { background: rgba(255,255,255,0.05) !important; transform: translateY(-1px); }
        .kill-btn { transition: all 0.15s; }
        .kill-btn:hover { filter: brightness(1.2); transform: scale(1.02); }
        .kill-btn:active { transform: scale(0.97); }
        .kill-flash { animation: flashKill 0.5s ease; }
        @keyframes flashKill { 0%{opacity:1} 30%{opacity:0.3;filter:brightness(2)} 100%{opacity:1} }
        .action-btn { transition: all 0.15s; }
        .action-btn:hover { filter: brightness(1.15); transform: translateY(-1px); }
        .action-btn:active { transform: translateY(0) scale(0.97); }
        .logo-ring { transition: box-shadow 0.2s, border-color 0.2s; }
        .logo-ring:hover { box-shadow: 0 0 28px rgba(251,191,36,0.4) !important; border-color: rgba(251,191,36,0.8) !important; }
        .logo-ring:hover .logo-overlay { opacity: 1 !important; }
        .tr-row { transition: background 0.12s; }
        .tr-row:hover { background: rgba(255,255,255,0.04) !important; }
        .toggle-att { transition: all 0.15s; }
        .toggle-att:hover { filter: brightness(1.2); }
        .slide-in { animation: slideIn 0.22s cubic-bezier(0.4,0,0.2,1); }
        @keyframes slideIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .modal-bg { animation: fadeIn 0.15s; }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        .collapse-btn { transition: all 0.2s; }
        .collapse-btn:hover { background: rgba(255,255,255,0.1) !important; color: #a5b4fc !important; }
        .collapse-btn:active { transform: scale(0.92); }
      `}</style>

      <div style={{ display:"flex", height:"100vh", background:"#07080f", fontFamily:"'Exo 2',sans-serif", color:"#e2e8f0", overflow:"hidden", position:"relative" }}>

        {/* Ambient */}
        <div style={{ position:"fixed", top:-200, left:-100, width:600, height:600, background:"radial-gradient(circle,rgba(99,102,241,0.07) 0%,transparent 70%)", pointerEvents:"none", zIndex:0 }} />
        <div style={{ position:"fixed", bottom:-200, right:-100, width:500, height:500, background:"radial-gradient(circle,rgba(251,191,36,0.05) 0%,transparent 70%)", pointerEvents:"none", zIndex:0 }} />

        {/* ── SIDEBAR ── */}
        <aside className={`sidebar${collapsed?" collapsed":""}`} style={{ width: collapsed ? 68 : 252, minHeight:"100vh", background:"linear-gradient(180deg,#0a0c18,#080a14)", borderRight:"1px solid rgba(255,255,255,0.06)", display:"flex", flexDirection:"column", flexShrink:0, position:"relative", zIndex:10, boxShadow:"4px 0 32px rgba(0,0,0,0.5)" }}>

          {/* Logo */}
          <div style={{ display:"flex", alignItems:"center", gap:10, padding:"20px 12px 14px", flexShrink:0 }}>
            <div className="logo-ring" onClick={() => fileRef.current?.click()} title="Click to change logo" style={{ width:44, height:44, borderRadius:"50%", border:"2px solid rgba(251,191,36,0.45)", background:"rgba(251,191,36,0.07)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", position:"relative", overflow:"hidden", flexShrink:0, boxShadow:"0 0 18px rgba(251,191,36,0.15)" }}>
              {logoErr || !logoUrl
                ? <span style={{ fontSize:20 }}>⚔️</span>
                : <img src={logoUrl} alt="logo" style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius:"50%" }} onError={() => setLogoErr(true)} />
              }
              <div className="logo-overlay" style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.65)", display:"flex", alignItems:"center", justifyContent:"center", opacity:0, transition:"opacity 0.2s", borderRadius:"50%" }}>
                <span>{uploading ? "⏳" : "📷"}</span>
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleLogoUpload} />

            <div className="sidebar-text" style={{ flex:1, minWidth:0, whiteSpace:"nowrap" }}>
              <h1 style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:20, fontWeight:700, letterSpacing:"0.12em", background:"linear-gradient(135deg,#fbbf24,#f59e0b)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>RAMPAGE</h1>
              <p style={{ color:"#2d3a52", fontSize:10, letterSpacing:"0.07em" }}>GUILD TRACKER</p>
              {uploadMsg && <p style={{ color:"#34d399", fontSize:10, marginTop:2 }}>{uploadMsg}</p>}
            </div>

            <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)} style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", color:"#475569", cursor:"pointer", borderRadius:7, padding:"5px 8px", fontSize:11, flexShrink:0 }}>
              {collapsed ? "▶" : "◀"}
            </button>
          </div>

          <div style={{ height:1, background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent)", margin:"0 12px 8px" }} />

          {/* Nav */}
          <nav style={{ flex:1, display:"flex", flexDirection:"column", gap:2, padding:"0 8px" }}>
            {NAV.map(item => (
              <button key={item.id} className={`nav-btn${activeNav===item.id?" active":""}`} onClick={() => setActiveNav(item.id)}
                style={{ display:"flex", alignItems:"center", gap:10, padding: collapsed?"10px 0":"10px 12px", borderRadius:10, background:"none", color: activeNav===item.id?"#a5b4fc":"#3d4a63", cursor:"pointer", fontSize:13, fontWeight:500, fontFamily:"'Exo 2',sans-serif", position:"relative", whiteSpace:"nowrap", justifyContent: collapsed?"center":"flex-start", width:"100%" }}>
                <span style={{ fontSize:16, flexShrink:0 }}>{item.icon}</span>
                <span className="sidebar-text">{item.label}</span>
                {activeNav===item.id && !collapsed && <div style={{ position:"absolute", right:10, width:5, height:5, borderRadius:"50%", background:"#818cf8", boxShadow:"0 0 8px #818cf8" }} />}
              </button>
            ))}
          </nav>

          {/* User */}
          <div style={{ margin:"10px 8px 0", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.055)", borderRadius:12, padding: collapsed?"10px 0":"11px 13px", display:"flex", alignItems:"center", gap:10, position:"relative", justifyContent: collapsed?"center":"flex-start" }}>
            <div style={{ width:32, height:32, borderRadius:"50%", background:"linear-gradient(135deg,#fbbf24,#d97706)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:13, color:"#1c1207", flexShrink:0 }}>V</div>
            <div className="sidebar-text" style={{ whiteSpace:"nowrap" }}>
              <div style={{ fontSize:12, fontWeight:700, color:"#e2e8f0" }}>VALIANT</div>
              <div style={{ fontSize:10, color:"#fbbf24", marginTop:1 }}>Guild Leader</div>
            </div>
            <div style={{ position:"absolute", top:8, right: collapsed?10:10, width:7, height:7, borderRadius:"50%", background:"#34d399", boxShadow:"0 0 7px #34d399" }} />
          </div>
        </aside>

        {/* ── MAIN ── */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0, overflow:"hidden" }}>

          {/* Topbar */}
          <header style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 26px", borderBottom:"1px solid rgba(255,255,255,0.05)", background:"rgba(7,8,15,0.88)", backdropFilter:"blur(12px)", flexShrink:0, gap:12, flexWrap:"wrap" }}>
            <div>
              <h2 style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:24, fontWeight:700, letterSpacing:"0.04em", color:"#f1f5f9" }}>
                {NAV.find(n=>n.id===activeNav)?.icon} {NAV.find(n=>n.id===activeNav)?.label}
              </h2>
              <p style={{ color:"#2d3a52", fontSize:11, marginTop:2 }}>
                {{ dashboard:"Overview of your guild's activity", members:"Manage your full guild roster", bosses:"Live respawn and spawn tracking", attendance:"Track and manage member attendance", auction:"Browse and bid on guild auctions", winners:"View past auction winners", settings:"Configure guild preferences" }[activeNav]}
              </p>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ display:"flex", alignItems:"center", gap:7, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:"7px 13px" }}>
                <span style={{ color:"#2d3a52", fontSize:12 }}>🔍</span>
                <input placeholder="Search members..." style={{ background:"none", border:"none", outline:"none", color:"#94a3b8", fontSize:12, width:150, fontFamily:"'Exo 2',sans-serif" }} value={search} onChange={e=>setSearch(e.target.value)} />
              </div>
              <button className="action-btn" onClick={() => setShowAddMember(true)} style={{ background:"linear-gradient(135deg,#4f46e5,#6366f1)", border:"none", color:"#fff", padding:"8px 16px", borderRadius:10, cursor:"pointer", fontSize:12, fontWeight:700, fontFamily:"'Exo 2',sans-serif", boxShadow:"0 4px 18px rgba(99,102,241,0.3)", letterSpacing:"0.04em" }}>
                + Add Member
              </button>
              <button className="action-btn" style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", color:"#64748b", padding:"8px 13px", borderRadius:10, cursor:"pointer", fontSize:12, fontWeight:600, fontFamily:"'Exo 2',sans-serif" }}>
                Export
              </button>
            </div>
          </header>

          {/* Page content */}
          <div style={{ flex:1, overflow:"auto", padding:"22px 26px" }} className="slide-in" key={activeNav}>

            {/* ── DASHBOARD ── */}
            {activeNav === "dashboard" && <>
              {/* Stats */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(185px,1fr))", gap:13, marginBottom:20 }}>
                {[
                  { label:"Total Members", value:members.length, icon:"👥", color:"#818cf8", glow:"rgba(129,140,248,0.15)" },
                  { label:"Online Now",    value:activeCount,    icon:"🟢", color:"#34d399", glow:"rgba(52,211,153,0.15)"  },
                  { label:"Attendance",    value:attendancePct+"%", icon:"📋", color:"#fbbf24", glow:"rgba(251,191,36,0.15)"  },
                  { label:"Guild Points",  value:"14.2K",        icon:"🏆", color:"#f87171", glow:"rgba(248,113,113,0.15)" },
                ].map(s => (
                  <div key={s.label} className="stat-card" style={{ background:"linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))", border:"1px solid rgba(255,255,255,0.065)", borderRadius:16, padding:"17px 19px", display:"flex", alignItems:"center", gap:13, position:"relative", overflow:"hidden", cursor:"default" }}>
                    <div style={{ width:42, height:42, borderRadius:12, background:s.glow, display:"flex", alignItems:"center", justifyContent:"center", fontSize:17, flexShrink:0 }}>{s.icon}</div>
                    <div>
                      <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:26, fontWeight:700, color:s.color, lineHeight:1 }}>{s.value}</div>
                      <div style={{ color:"#2d3a52", fontSize:10, marginTop:3, textTransform:"uppercase", letterSpacing:"0.07em" }}>{s.label}</div>
                    </div>
                    <div style={{ position:"absolute", bottom:-16, right:-16, width:64, height:64, borderRadius:"50%", background:s.glow, filter:"blur(16px)", pointerEvents:"none" }} />
                    <div style={{ position:"absolute", top:9, right:11, fontSize:8, fontWeight:700, letterSpacing:"0.1em", color:"#34d399", background:"rgba(52,211,153,0.1)", border:"1px solid rgba(52,211,153,0.2)", padding:"2px 6px", borderRadius:4 }}>LIVE</div>
                  </div>
                ))}
              </div>

              {/* Members + Bosses */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 350px", gap:17 }}>
                <MembersTable filtered={filtered} members={members} hovRow={hovRow} setHovRow={setHovRow} />
                <BossPanel bosses={bosses} onKill={handleMarkKilled} killFlash={killFlash} />
              </div>
            </>}

            {/* ── MEMBERS ── */}
            {activeNav === "members" && (
              <div style={{ background:"linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))", border:"1px solid rgba(255,255,255,0.065)", borderRadius:18, overflow:"hidden" }}>
                <div style={{ padding:"18px 20px 14px", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                  <h3 style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:18, fontWeight:700, color:"#f1f5f9" }}>All Guild Members</h3>
                  <p style={{ color:"#2d3a52", fontSize:11, marginTop:2 }}>{filtered.length} members</p>
                </div>
                <MembersTable filtered={filtered} members={members} hovRow={hovRow} setHovRow={setHovRow} full />
              </div>
            )}

            {/* ── BOSS TIMERS ── */}
            {activeNav === "bosses" && (
              <div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14 }}>
                  {bosses.map(b => {
                    const st = bossStatus(b.secs);
                    const bs = BOSS_STATUS_STYLE[st];
                    return (
                      <div key={b.id} className={`boss-card${killFlash===b.id?" kill-flash":""}`} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, padding:"18px 20px", position:"relative", overflow:"hidden" }}>
                        <div style={{ position:"absolute", left:0, top:0, bottom:0, width:4, background:b.color, borderRadius:"3px 0 0 3px" }} />
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                          <div>
                            <div style={{ fontSize:14, fontWeight:700, color:"#e2e8f0" }}>{b.name}</div>
                            <div style={{ fontSize:11, color:"#2d3a52", marginTop:3 }}>{b.ch} · Respawn {b.minR}–{b.maxR} min</div>
                          </div>
                          <span style={{ display:"inline-flex", alignItems:"center", padding:"3px 10px", borderRadius:6, background:bs.bg, color:bs.color, border:`1px solid ${bs.border}`, fontSize:10, fontWeight:700 }}>{st}</span>
                        </div>
                        <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:38, fontWeight:700, color:b.color, letterSpacing:"0.06em", lineHeight:1, marginBottom:14 }}>
                          {fmtSecs(b.secs)}
                        </div>
                        <button className="kill-btn" onClick={() => handleMarkKilled(b.id)} style={{ width:"100%", background:`${b.color}18`, border:`1px solid ${b.color}40`, color:b.color, padding:"8px", borderRadius:9, cursor:"pointer", fontSize:12, fontWeight:700, fontFamily:"'Exo 2',sans-serif", letterSpacing:"0.04em" }}>
                          ☠️ Mark Killed
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── ATTENDANCE ── */}
            {activeNav === "attendance" && (
              <div>
                <div style={{ background:"linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))", border:"1px solid rgba(255,255,255,0.065)", borderRadius:18, overflow:"hidden" }}>
                  <div style={{ padding:"18px 20px 14px", borderBottom:"1px solid rgba(255,255,255,0.05)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div>
                      <h3 style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:18, fontWeight:700, color:"#f1f5f9" }}>📋 Attendance Log</h3>
                      <p style={{ color:"#2d3a52", fontSize:11, marginTop:2 }}>Click Present/Absent to update today's attendance</p>
                    </div>
                    <div style={{ background:"rgba(52,211,153,0.1)", border:"1px solid rgba(52,211,153,0.25)", borderRadius:10, padding:"8px 16px", textAlign:"center" }}>
                      <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:22, fontWeight:700, color:"#34d399" }}>{attendancePct}%</div>
                      <div style={{ fontSize:10, color:"#2d3a52", marginTop:1 }}>TODAY</div>
                    </div>
                  </div>
                  <div style={{ overflowX:"auto" }}>
                    <table style={{ width:"100%", borderCollapse:"collapse" }}>
                      <thead>
                        <tr style={{ background:"rgba(255,255,255,0.02)" }}>
                          <th style={TH}>Member</th>
                          <th style={TH}>Role</th>
                          {attendance[0]?.logs.map(l => (
                            <th key={l.date} style={{ ...TH, color: l.date===today?"#fbbf24":"#1e2a3a" }}>{l.date}{l.date===today?" ★":""}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {attendance.map((a, i) => {
                          const rs = ROLE_STYLE[a.role] || ROLE_STYLE.Member;
                          return (
                            <tr key={a.memberId} className="tr-row" style={{ borderBottom:"1px solid rgba(255,255,255,0.03)" }}>
                              <td style={{ padding:"11px 16px" }}>
                                <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                                  <div style={{ width:28, height:28, borderRadius:7, background:rs.bg, border:`1px solid ${rs.border}`, color:rs.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800 }}>{a.name[0]}</div>
                                  <span style={{ fontWeight:700, fontSize:13, color:"#e2e8f0" }}>{a.name}</span>
                                </div>
                              </td>
                              <td style={{ padding:"11px 16px" }}>
                                <span style={{ display:"inline-flex", padding:"2px 8px", borderRadius:5, background:rs.bg, color:rs.color, border:`1px solid ${rs.border}`, fontSize:10, fontWeight:700 }}>{a.role}</span>
                              </td>
                              {a.logs.map(l => (
                                <td key={l.date} style={{ padding:"11px 16px", textAlign:"center" }}>
                                  {l.date === today ? (
                                    <div style={{ display:"flex", gap:4, justifyContent:"center" }}>
                                      <button className="toggle-att" onClick={() => handleMarkAttendance(a.memberId, l.date, true)} style={{ padding:"3px 8px", borderRadius:5, border:"none", cursor:"pointer", fontSize:10, fontWeight:700, background: l.present?"rgba(52,211,153,0.2)":"rgba(255,255,255,0.05)", color: l.present?"#34d399":"#475569" }}>✓</button>
                                      <button className="toggle-att" onClick={() => handleMarkAttendance(a.memberId, l.date, false)} style={{ padding:"3px 8px", borderRadius:5, border:"none", cursor:"pointer", fontSize:10, fontWeight:700, background: !l.present?"rgba(248,113,113,0.2)":"rgba(255,255,255,0.05)", color: !l.present?"#f87171":"#475569" }}>✗</button>
                                    </div>
                                  ) : (
                                    <span style={{ fontSize:14 }}>{l.present ? "✅" : "❌"}</span>
                                  )}
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── AUCTION / WINNERS / SETTINGS placeholder ── */}
            {["auction","winners","settings"].includes(activeNav) && (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"60vh", gap:16, opacity:0.4 }}>
                <div style={{ fontSize:64 }}>{NAV.find(n=>n.id===activeNav)?.icon}</div>
                <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:24, fontWeight:700, color:"#f1f5f9", letterSpacing:"0.08em" }}>
                  {NAV.find(n=>n.id===activeNav)?.label}
                </div>
                <div style={{ color:"#475569", fontSize:13 }}>Coming soon — connect your Supabase tables to enable this section.</div>
              </div>
            )}

          </div>
        </div>

        {/* ── ADD MEMBER MODAL ── */}
        {showAddMember && (
          <div className="modal-bg" onClick={() => setShowAddMember(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", backdropFilter:"blur(4px)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <div className="slide-in" onClick={e => e.stopPropagation()} style={{ background:"#0d1120", border:"1px solid rgba(255,255,255,0.1)", borderRadius:20, padding:"28px 30px", width:380, boxShadow:"0 24px 80px rgba(0,0,0,0.8)" }}>
              <h3 style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:20, fontWeight:700, color:"#f1f5f9", marginBottom:20, letterSpacing:"0.04em" }}>Add New Member</h3>
              {[
                { label:"Name", key:"name", type:"text", placeholder:"Enter name" },
              ].map(f => (
                <div key={f.key} style={{ marginBottom:14 }}>
                  <label style={{ display:"block", color:"#475569", fontSize:11, fontWeight:600, marginBottom:5, textTransform:"uppercase", letterSpacing:"0.06em" }}>{f.label}</label>
                  <input type={f.type} placeholder={f.placeholder} value={newMember[f.key]} onChange={e => setNewMember(p=>({...p,[f.key]:e.target.value}))}
                    style={{ width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:9, padding:"9px 13px", color:"#e2e8f0", fontSize:13, fontFamily:"'Exo 2',sans-serif", outline:"none" }} />
                </div>
              ))}
              {[
                { label:"Role", key:"role", opts:["Leader","Elder","Member","Recruit","Creator"] },
                { label:"Class", key:"cls", opts:["Berserker","Skald","Warlord","Volva","Archer","RuneFighter"] },
                { label:"Status", key:"status", opts:["Active","Offline"] },
              ].map(f => (
                <div key={f.key} style={{ marginBottom:14 }}>
                  <label style={{ display:"block", color:"#475569", fontSize:11, fontWeight:600, marginBottom:5, textTransform:"uppercase", letterSpacing:"0.06em" }}>{f.label}</label>
                  <select value={newMember[f.key]} onChange={e => setNewMember(p=>({...p,[f.key]:e.target.value}))}
                    style={{ width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:9, padding:"9px 13px", color:"#e2e8f0", fontSize:13, fontFamily:"'Exo 2',sans-serif", outline:"none" }}>
                    {f.opts.map(o => <option key={o} value={o} style={{ background:"#0d1120" }}>{o}</option>)}
                  </select>
                </div>
              ))}
              <div style={{ display:"flex", gap:10, marginTop:20 }}>
                <button className="action-btn" onClick={() => setShowAddMember(false)} style={{ flex:1, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", color:"#64748b", padding:"10px", borderRadius:10, cursor:"pointer", fontSize:13, fontWeight:600, fontFamily:"'Exo 2',sans-serif" }}>Cancel</button>
                <button className="action-btn" onClick={handleAddMember} style={{ flex:2, background:"linear-gradient(135deg,#4f46e5,#6366f1)", border:"none", color:"#fff", padding:"10px", borderRadius:10, cursor:"pointer", fontSize:13, fontWeight:700, fontFamily:"'Exo 2',sans-serif", boxShadow:"0 4px 18px rgba(99,102,241,0.3)" }}>Add Member</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}

const TH = { padding:"9px 16px", textAlign:"left", color:"#1e2a3a", fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", borderBottom:"1px solid rgba(255,255,255,0.04)" };

function MembersTable({ filtered, hovRow, setHovRow, full }) {
  return (
    <div style={{ overflowX:"auto" }}>
      <table style={{ width:"100%", borderCollapse:"collapse" }}>
        <thead>
          <tr style={{ background:"rgba(255,255,255,0.02)" }}>
            {["Member","Class","Role","Points","Status",""].map(h => (
              <th key={h} style={TH}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map((m, i) => {
            const rs = ROLE_STYLE[m.role] || ROLE_STYLE.Member;
            const ss = STATUS_STYLE[m.status] || STATUS_STYLE.Offline;
            return (
              <tr key={m.id} className="tr-row" style={{ borderBottom:"1px solid rgba(255,255,255,0.028)", cursor:"default" }} onMouseEnter={() => setHovRow(i)} onMouseLeave={() => setHovRow(null)}>
                <td style={{ padding:"11px 16px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                    <div style={{ width:30, height:30, borderRadius:8, background:rs.bg, border:`1px solid ${rs.border}`, color:rs.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800, flexShrink:0 }}>{m.name[0]}</div>
                    <span style={{ fontWeight:700, color:"#e2e8f0", fontSize:13, letterSpacing:"0.03em" }}>{m.name}</span>
                  </div>
                </td>
                <td style={{ padding:"11px 16px", color:"#475569", fontSize:12 }}>{m.cls}</td>
                <td style={{ padding:"11px 16px" }}>
                  <span style={{ display:"inline-flex", alignItems:"center", padding:"3px 9px", borderRadius:6, background:rs.bg, color:rs.color, border:`1px solid ${rs.border}`, fontSize:10, fontWeight:700, letterSpacing:"0.04em" }}>{m.role}</span>
                </td>
                <td style={{ padding:"11px 16px", color:"#fbbf24", fontWeight:700, fontSize:14, fontFamily:"'Rajdhani',sans-serif" }}>{m.points.toLocaleString()}</td>
                <td style={{ padding:"11px 16px" }}>
                  <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 9px", borderRadius:6, background:ss.bg, color:ss.color, fontSize:10, fontWeight:700 }}>
                    <span style={{ width:5, height:5, borderRadius:"50%", background:ss.dot }} />
                    {m.status}
                  </span>
                </td>
                <td style={{ padding:"11px 16px" }}>
                  <button className="action-btn" style={{ background:"rgba(99,102,241,0.1)", border:"1px solid rgba(99,102,241,0.22)", color:"#a5b4fc", padding:"4px 10px", borderRadius:6, cursor:"pointer", fontSize:10, fontWeight:700, fontFamily:"'Exo 2',sans-serif" }}>Edit</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function BossPanel({ bosses, onKill, killFlash }) {
  return (
    <div style={{ background:"linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))", border:"1px solid rgba(255,255,255,0.065)", borderRadius:18, overflow:"hidden" }}>
      <div style={{ padding:"16px 18px 12px", borderBottom:"1px solid rgba(255,255,255,0.05)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <h3 style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:16, fontWeight:700, color:"#f1f5f9" }}>Boss Timers</h3>
          <p style={{ color:"#2d3a52", fontSize:10, marginTop:2 }}>Live countdown</p>
        </div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:8, padding:"12px 14px", maxHeight:500, overflow:"auto" }}>
        {bosses.map(b => {
          const st = bossStatus(b.secs);
          const bs = BOSS_STATUS_STYLE[st];
          return (
            <div key={b.id} className={`boss-card${killFlash===b.id?" kill-flash":""}`} style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.055)", borderRadius:12, padding:"12px 14px", position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", left:0, top:0, bottom:0, width:3, background:b.color }} />
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:"#e2e8f0" }}>{b.name}</div>
                  <div style={{ fontSize:10, color:"#2d3a52", marginTop:1 }}>{b.ch}</div>
                </div>
                <span style={{ display:"inline-flex", padding:"2px 8px", borderRadius:5, background:bs.bg, color:bs.color, border:`1px solid ${bs.border}`, fontSize:9, fontWeight:700 }}>{st}</span>
              </div>
              <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:24, fontWeight:700, color:b.color, letterSpacing:"0.06em", lineHeight:1, marginBottom:8 }}>
                {fmtSecs(b.secs)}
              </div>
              <button className="kill-btn" onClick={() => onKill(b.id)} style={{ width:"100%", background:`${b.color}18`, border:`1px solid ${b.color}40`, color:b.color, padding:"5px", borderRadius:7, cursor:"pointer", fontSize:10, fontWeight:700, fontFamily:"'Exo 2',sans-serif" }}>
                ☠️ Mark Killed
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
