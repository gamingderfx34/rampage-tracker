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
  Leader:  { bg:"rgba(251,191,36,0.15)",  color:"#fbbf24", border:"rgba(251,191,36,0.35)"  },
  Elder:   { bg:"rgba(96,165,250,0.15)",  color:"#60a5fa", border:"rgba(96,165,250,0.35)"  },
  Member:  { bg:"rgba(148,163,184,0.1)",  color:"#94a3b8", border:"rgba(148,163,184,0.25)" },
  Recruit: { bg:"rgba(167,139,250,0.15)", color:"#a78bfa", border:"rgba(167,139,250,0.35)" },
  Creator: { bg:"rgba(248,113,113,0.15)", color:"#f87171", border:"rgba(248,113,113,0.35)" },
};

const STATUS_STYLE = {
  Active:  { bg:"rgba(52,211,153,0.12)", color:"#34d399", dot:"#34d399" },
  Offline: { bg:"rgba(100,116,139,0.1)", color:"#64748b", dot:"#475569" },
};

const BOSS_STATUS_STYLE = {
  Alive:      { bg:"rgba(52,211,153,0.15)",  color:"#34d399", border:"rgba(52,211,153,0.35)"  },
  Respawning: { bg:"rgba(251,191,36,0.15)",  color:"#fbbf24", border:"rgba(251,191,36,0.35)"  },
  Waiting:    { bg:"rgba(96,165,250,0.15)",  color:"#60a5fa", border:"rgba(96,165,250,0.35)"  },
};

function fmtSecs(s) {
  if (s <= 0) return "LIVE";
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  if (h > 0) return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
  return `${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
}

function bossStatus(secs) {
  if (secs <= 0) return "Alive";
  if (secs <= 300) return "Respawning";
  return "Waiting";
}

const today = new Date().toLocaleDateString("en-US", { weekday:"short", month:"short", day:"numeric" });

const INIT_ATTENDANCE = INIT_MEMBERS.map(m => ({
  memberId: m.id, name: m.name, role: m.role,
  logs: [
    { date:"Mon, May 12", present:true,  note:"On time" },
    { date:"Tue, May 13", present:true,  note:"On time" },
    { date:"Wed, May 14", present:m.status==="Active", note:m.status==="Active"?"On time":"Absent" },
    { date:today,         present:m.status==="Active", note:m.status==="Active"?"Present":"Absent" },
  ]
}));

const TH = {
  padding:"10px 16px", textAlign:"left", color:"#2d3a52", fontSize:10,
  fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em",
  borderBottom:"1px solid rgba(255,255,255,0.05)", whiteSpace:"nowrap",
};

export default function App() {
  const [activeNav, setActiveNav]     = useState("dashboard");
  const [collapsed, setCollapsed]     = useState(false);
  const [logoUrl, setLogoUrl]         = useState(MOCK_LOGO);
  const [logoErr, setLogoErr]         = useState(false);
  const [uploading, setUploading]     = useState(false);
  const [uploadMsg, setUploadMsg]     = useState("");
  const [members, setMembers]         = useState(INIT_MEMBERS);
  const [bosses, setBosses]           = useState(INIT_BOSSES);
  const [attendance, setAttendance]   = useState(INIT_ATTENDANCE);
  const [search, setSearch]           = useState("");
  const [killFlash, setKillFlash]     = useState(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember]     = useState({ name:"", role:"Member", cls:"Berserker", status:"Active" });
  // Boss manual set modal
  const [bossModal, setBossModal]     = useState(null); // boss id
  const [manualMins, setManualMins]   = useState("");
  const fileRef = useRef(null);

  // Live countdown
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

  // Mark killed → random respawn
  const handleMarkKilled = (id) => {
    setKillFlash(id);
    setTimeout(() => setKillFlash(null), 700);
    setBosses(prev => prev.map(b => {
      if (b.id !== id) return b;
      const secs = Math.floor((b.minR + Math.random() * (b.maxR - b.minR)) * 60);
      return { ...b, secs };
    }));
  };

  // Reset to 0 (missed boss → set LIVE now)
  const handleResetToZero = (id) => {
    setKillFlash(id);
    setTimeout(() => setKillFlash(null), 700);
    setBosses(prev => prev.map(b => b.id === id ? { ...b, secs: 0 } : b));
  };

  // Set manual timer in minutes
  const handleSetManual = () => {
    const mins = parseFloat(manualMins);
    if (isNaN(mins) || mins < 0) return;
    setBosses(prev => prev.map(b => b.id === bossModal ? { ...b, secs: Math.floor(mins * 60) } : b));
    setBossModal(null);
    setManualMins("");
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
    setAttendance(prev => [...prev, { memberId:m.id, name:m.name, role:m.role, logs:[{ date:today, present:true, note:"Joined" }] }]);
    setNewMember({ name:"", role:"Member", cls:"Berserker", status:"Active" });
    setShowAddMember(false);
  };

  const filtered = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.cls.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount   = members.filter(m => m.status === "Active").length;
  const presentToday  = attendance.filter(a => a.logs.some(l => l.date === today && l.present)).length;
  const attendancePct = members.length ? Math.round((presentToday / members.length) * 100) : 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Exo+2:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { height: 100%; background: #07080f; overflow: hidden; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1e2235; border-radius: 4px; }

        /* Sidebar slide */
        .sidebar { transition: width 0.3s cubic-bezier(0.4,0,0.2,1); }
        .sidebar-label { transition: opacity 0.18s, transform 0.18s; white-space: nowrap; overflow: hidden; }
        .collapsed .sidebar-label { opacity: 0; transform: translateX(-6px); pointer-events: none; }

        /* Nav buttons — large tap targets */
        .nav-btn {
          display: flex; align-items: center; gap: 12px;
          width: 100%; padding: 12px 14px; border-radius: 11px;
          background: none; border: 1px solid transparent;
          color: #3d4a63; cursor: pointer; font-size: 13px; font-weight: 600;
          font-family: 'Exo 2', sans-serif;
          transition: background 0.15s, color 0.15s, border-color 0.15s, transform 0.12s;
          -webkit-tap-highlight-color: transparent;
        }
        .nav-btn:hover { background: rgba(255,255,255,0.07); color: #94a3b8; transform: translateX(3px); }
        .nav-btn:active { transform: translateX(1px) scale(0.98); }
        .nav-btn.active { background: rgba(99,102,241,0.18); color: #a5b4fc; border-color: rgba(99,102,241,0.3); }
        .nav-btn.active:hover { background: rgba(99,102,241,0.22); }

        /* Generic button resets */
        .btn {
          cursor: pointer; font-family: 'Exo 2', sans-serif; font-weight: 700;
          border: none; border-radius: 10px; transition: all 0.15s;
          -webkit-tap-highlight-color: transparent;
        }
        .btn:hover { filter: brightness(1.15); transform: translateY(-1px); }
        .btn:active { transform: translateY(0) scale(0.97); filter: brightness(0.95); }

        /* Kill button specifically */
        .kill-btn {
          cursor: pointer; font-family: 'Exo 2', sans-serif; font-weight: 700;
          border-radius: 9px; padding: 9px 0; font-size: 12px; width: 100%;
          transition: all 0.15s; -webkit-tap-highlight-color: transparent;
        }
        .kill-btn:hover { filter: brightness(1.25); transform: scale(1.02); }
        .kill-btn:active { transform: scale(0.97); }

        /* Reset/manual buttons */
        .ghost-btn {
          cursor: pointer; font-family: 'Exo 2', sans-serif; font-weight: 600;
          border-radius: 8px; padding: 7px 10px; font-size: 11px;
          transition: all 0.15s; -webkit-tap-highlight-color: transparent;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #64748b;
        }
        .ghost-btn:hover { background: rgba(255,255,255,0.1); color: #94a3b8; transform: translateY(-1px); }
        .ghost-btn:active { transform: scale(0.96); }

        /* Stat cards */
        .stat-card { transition: transform 0.2s, box-shadow 0.2s; cursor: default; }
        .stat-card:hover { transform: translateY(-4px); box-shadow: 0 18px 50px rgba(0,0,0,0.5) !important; }

        /* Boss cards */
        .boss-card { transition: background 0.15s, transform 0.15s, box-shadow 0.15s; }
        .boss-card:hover { background: rgba(255,255,255,0.05) !important; transform: translateY(-2px); }

        /* Kill flash */
        .kill-flash { animation: kflash 0.6s ease; }
        @keyframes kflash { 0%{opacity:1} 25%{opacity:0.2;filter:brightness(2.5)} 100%{opacity:1} }

        /* Row hover */
        .tr-row { transition: background 0.1s; }
        .tr-row:hover { background: rgba(255,255,255,0.045) !important; }
        .tr-row:hover td { color: #f1f5f9 !important; }

        /* Page slide in */
        .page { animation: pgIn 0.2s cubic-bezier(0.4,0,0.2,1); }
        @keyframes pgIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }

        /* Modal */
        .modal-bg { animation: mfade 0.15s; }
        @keyframes mfade { from{opacity:0} to{opacity:1} }
        .modal-box { animation: mslide 0.2s cubic-bezier(0.4,0,0.2,1); }
        @keyframes mslide { from{opacity:0;transform:translateY(20px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }

        /* Logo ring */
        .logo-ring { transition: box-shadow 0.2s, border-color 0.2s; cursor: pointer; }
        .logo-ring:hover { box-shadow: 0 0 30px rgba(251,191,36,0.45) !important; border-color: rgba(251,191,36,0.85) !important; }
        .logo-ring:hover .logo-ov { opacity: 1 !important; }

        /* Attendance toggle */
        .att-btn { cursor: pointer; padding: 5px 11px; border-radius: 6px; border: none; font-size: 12px; font-weight: 700; transition: all 0.15s; -webkit-tap-highlight-color: transparent; }
        .att-btn:hover { filter: brightness(1.2); transform: scale(1.06); }
        .att-btn:active { transform: scale(0.94); }

        /* Input style */
        .dark-input {
          width: 100%; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
          border-radius: 10px; padding: 10px 14px; color: #e2e8f0; font-size: 13px;
          font-family: 'Exo 2', sans-serif; outline: none; transition: border-color 0.15s;
        }
        .dark-input:focus { border-color: rgba(99,102,241,0.5); }

        /* Collapse button */
        .col-btn { cursor: pointer; transition: all 0.18s; -webkit-tap-highlight-color: transparent; }
        .col-btn:hover { background: rgba(255,255,255,0.12) !important; color: #a5b4fc !important; }
        .col-btn:active { transform: scale(0.9); }
      `}</style>

      <div style={{ display:"flex", height:"100vh", background:"#07080f", fontFamily:"'Exo 2',sans-serif", color:"#e2e8f0", overflow:"hidden", position:"relative" }}>

        {/* Ambient glows */}
        <div style={{ position:"fixed", top:-200, left:-100, width:600, height:600, background:"radial-gradient(circle,rgba(99,102,241,0.07),transparent 70%)", pointerEvents:"none", zIndex:0 }} />
        <div style={{ position:"fixed", bottom:-200, right:-100, width:500, height:500, background:"radial-gradient(circle,rgba(251,191,36,0.05),transparent 70%)", pointerEvents:"none", zIndex:0 }} />

        {/* ══════════ SIDEBAR ══════════ */}
        <aside className={`sidebar${collapsed?" collapsed":""}`}
          style={{ width: collapsed ? 70 : 254, minHeight:"100vh", background:"linear-gradient(180deg,#0a0c18,#080a14)", borderRight:"1px solid rgba(255,255,255,0.06)", display:"flex", flexDirection:"column", flexShrink:0, position:"relative", zIndex:10, boxShadow:"4px 0 32px rgba(0,0,0,0.6)" }}>

          {/* Logo row */}
          <div style={{ display:"flex", alignItems:"center", gap:10, padding:"20px 12px 15px", flexShrink:0 }}>
            <div className="logo-ring"
              onClick={() => fileRef.current?.click()}
              style={{ width:46, height:46, borderRadius:"50%", border:"2px solid rgba(251,191,36,0.45)", background:"rgba(251,191,36,0.07)", display:"flex", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden", flexShrink:0, boxShadow:"0 0 18px rgba(251,191,36,0.15)" }}>
              {logoErr || !logoUrl
                ? <span style={{ fontSize:22 }}>⚔️</span>
                : <img src={logoUrl} alt="logo" style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius:"50%" }} onError={() => setLogoErr(true)} />}
              <div className="logo-ov" style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.65)", display:"flex", alignItems:"center", justifyContent:"center", opacity:0, transition:"opacity 0.2s", borderRadius:"50%", fontSize:16 }}>
                {uploading ? "⏳" : "📷"}
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleLogoUpload} />

            <div className="sidebar-label" style={{ flex:1, minWidth:0 }}>
              <h1 style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:21, fontWeight:700, letterSpacing:"0.12em", background:"linear-gradient(135deg,#fbbf24,#f59e0b)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>RAMPAGE</h1>
              <p style={{ color:"#2d3a52", fontSize:10, letterSpacing:"0.07em" }}>GUILD TRACKER</p>
              {uploadMsg && <p style={{ color:"#34d399", fontSize:10, marginTop:2 }}>{uploadMsg}</p>}
            </div>

            <button className="col-btn" onClick={() => setCollapsed(!collapsed)}
              style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.09)", color:"#475569", borderRadius:8, padding:"6px 9px", fontSize:11, flexShrink:0 }}>
              {collapsed ? "▶" : "◀"}
            </button>
          </div>

          <div style={{ height:1, background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.07),transparent)", margin:"0 12px 10px" }} />

          {/* Nav items */}
          <nav style={{ flex:1, display:"flex", flexDirection:"column", gap:3, padding:"0 8px" }}>
            {NAV.map(item => (
              <button key={item.id} className={`nav-btn${activeNav===item.id?" active":""}`}
                onClick={() => setActiveNav(item.id)}
                style={{ justifyContent: collapsed ? "center" : "flex-start" }}>
                <span style={{ fontSize:17, flexShrink:0, lineHeight:1 }}>{item.icon}</span>
                <span className="sidebar-label">{item.label}</span>
                {activeNav===item.id && !collapsed &&
                  <div style={{ marginLeft:"auto", width:6, height:6, borderRadius:"50%", background:"#818cf8", boxShadow:"0 0 8px #818cf8", flexShrink:0 }} />}
              </button>
            ))}
          </nav>

          {/* User card */}
          <div style={{ margin:"12px 8px 4px", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:12, padding: collapsed?"11px 0":"12px 14px", display:"flex", alignItems:"center", gap:10, position:"relative", justifyContent: collapsed?"center":"flex-start" }}>
            <div style={{ width:34, height:34, borderRadius:"50%", background:"linear-gradient(135deg,#fbbf24,#d97706)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:14, color:"#1c1207", flexShrink:0 }}>V</div>
            <div className="sidebar-label">
              <div style={{ fontSize:13, fontWeight:700, color:"#e2e8f0" }}>VALIANT</div>
              <div style={{ fontSize:11, color:"#fbbf24", marginTop:1 }}>Guild Leader</div>
            </div>
            <div style={{ position:"absolute", top:9, right:10, width:8, height:8, borderRadius:"50%", background:"#34d399", boxShadow:"0 0 8px #34d399" }} />
          </div>
        </aside>

        {/* ══════════ MAIN ══════════ */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0, overflow:"hidden" }}>

          {/* Topbar */}
          <header style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"15px 24px", borderBottom:"1px solid rgba(255,255,255,0.055)", background:"rgba(7,8,15,0.9)", backdropFilter:"blur(14px)", flexShrink:0, gap:12, flexWrap:"wrap" }}>
            <div>
              <h2 style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:24, fontWeight:700, letterSpacing:"0.04em", color:"#f1f5f9" }}>
                {NAV.find(n=>n.id===activeNav)?.icon} {NAV.find(n=>n.id===activeNav)?.label}
              </h2>
              <p style={{ color:"#2d3a52", fontSize:11, marginTop:2 }}>
                {{ dashboard:"Guild overview and live activity", members:"Manage your full guild roster", bosses:"Live countdown and respawn control", attendance:"Daily attendance logs", auction:"Guild auction house", winners:"Past auction winners", settings:"Configure guild settings" }[activeNav]}
              </p>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, padding:"9px 14px" }}>
                <span style={{ color:"#2d3a52" }}>🔍</span>
                <input className="dark-input" placeholder="Search members..." style={{ padding:0, background:"none", border:"none", width:150, fontSize:12 }} value={search} onChange={e=>setSearch(e.target.value)} />
              </div>
              <button className="btn" onClick={() => setShowAddMember(true)}
                style={{ background:"linear-gradient(135deg,#4f46e5,#6366f1)", color:"#fff", padding:"9px 18px", fontSize:13, boxShadow:"0 4px 18px rgba(99,102,241,0.35)", letterSpacing:"0.03em" }}>
                + Add Member
              </button>
              <button className="btn"
                style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.09)", color:"#64748b", padding:"9px 14px", fontSize:12 }}>
                Export
              </button>
            </div>
          </header>

          {/* ══ PAGE CONTENT ══ */}
          <div className="page" key={activeNav} style={{ flex:1, overflow:"auto", padding:"22px 24px" }}>

            {/* ── DASHBOARD ── */}
            {activeNav==="dashboard" && <>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(185px,1fr))", gap:13, marginBottom:20 }}>
                {[
                  { label:"Total Members", value:members.length, icon:"👥", color:"#818cf8", glow:"rgba(129,140,248,0.15)" },
                  { label:"Online Now",    value:activeCount,    icon:"🟢", color:"#34d399", glow:"rgba(52,211,153,0.15)"  },
                  { label:"Attendance",    value:attendancePct+"%", icon:"📋", color:"#fbbf24", glow:"rgba(251,191,36,0.15)"  },
                  { label:"Guild Points",  value:"14.2K",        icon:"🏆", color:"#f87171", glow:"rgba(248,113,113,0.15)" },
                ].map(s => (
                  <div key={s.label} className="stat-card"
                    style={{ background:"linear-gradient(135deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, padding:"18px 20px", display:"flex", alignItems:"center", gap:14, position:"relative", overflow:"hidden" }}>
                    <div style={{ width:44, height:44, borderRadius:12, background:s.glow, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{s.icon}</div>
                    <div>
                      <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:28, fontWeight:700, color:s.color, lineHeight:1 }}>{s.value}</div>
                      <div style={{ color:"#2d3a52", fontSize:10, marginTop:3, textTransform:"uppercase", letterSpacing:"0.07em" }}>{s.label}</div>
                    </div>
                    <div style={{ position:"absolute", bottom:-16, right:-16, width:68, height:68, borderRadius:"50%", background:s.glow, filter:"blur(18px)", pointerEvents:"none" }} />
                    <div style={{ position:"absolute", top:10, right:12, fontSize:8, fontWeight:700, letterSpacing:"0.1em", color:"#34d399", background:"rgba(52,211,153,0.1)", border:"1px solid rgba(52,211,153,0.2)", padding:"2px 7px", borderRadius:4 }}>LIVE</div>
                  </div>
                ))}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 355px", gap:17 }}>
                <MembersTable filtered={filtered} />
                <BossPanel bosses={bosses} onKill={handleMarkKilled} onReset={handleResetToZero} onManual={id=>{setBossModal(id);setManualMins("");}} killFlash={killFlash} />
              </div>
            </>}

            {/* ── MEMBERS ── */}
            {activeNav==="members" && (
              <div style={{ background:"linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))", border:"1px solid rgba(255,255,255,0.07)", borderRadius:18, overflow:"hidden" }}>
                <div style={{ padding:"18px 20px 14px", borderBottom:"1px solid rgba(255,255,255,0.05)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <h3 style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:18, fontWeight:700, color:"#f1f5f9" }}>All Guild Members</h3>
                    <p style={{ color:"#2d3a52", fontSize:11, marginTop:2 }}>{filtered.length} members</p>
                  </div>
                </div>
                <MembersTable filtered={filtered} />
              </div>
            )}

            {/* ── BOSS TIMERS ── */}
            {activeNav==="bosses" && (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:15 }}>
                {bosses.map(b => {
                  const st = bossStatus(b.secs);
                  const bs = BOSS_STATUS_STYLE[st];
                  return (
                    <div key={b.id} className={`boss-card${killFlash===b.id?" kill-flash":""}`}
                      style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:17, padding:"20px 20px 16px", position:"relative", overflow:"hidden" }}>
                      <div style={{ position:"absolute", left:0, top:0, bottom:0, width:4, background:b.color, borderRadius:"3px 0 0 3px" }} />
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                        <div>
                          <div style={{ fontSize:15, fontWeight:700, color:"#e2e8f0" }}>{b.name}</div>
                          <div style={{ fontSize:11, color:"#2d3a52", marginTop:3 }}>{b.ch} · Respawn {b.minR}–{b.maxR} min</div>
                        </div>
                        <span style={{ display:"inline-flex", alignItems:"center", padding:"4px 11px", borderRadius:7, background:bs.bg, color:bs.color, border:`1px solid ${bs.border}`, fontSize:11, fontWeight:700 }}>{st}</span>
                      </div>
                      <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:42, fontWeight:700, color:b.color, letterSpacing:"0.06em", lineHeight:1, marginBottom:16 }}>
                        {fmtSecs(b.secs)}
                      </div>
                      {/* Action buttons */}
                      <button className="kill-btn" onClick={() => handleMarkKilled(b.id)}
                        style={{ background:`${b.color}20`, border:`1px solid ${b.color}45`, color:b.color, marginBottom:8, letterSpacing:"0.03em" }}>
                        ☠️ Mark Killed — start respawn timer
                      </button>
                      <div style={{ display:"flex", gap:8 }}>
                        <button className="ghost-btn" onClick={() => handleResetToZero(b.id)} style={{ flex:1 }}>
                          🔴 Set to LIVE now
                        </button>
                        <button className="ghost-btn" onClick={() => { setBossModal(b.id); setManualMins(""); }} style={{ flex:1 }}>
                          ⏱ Set timer
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── ATTENDANCE ── */}
            {activeNav==="attendance" && (
              <div style={{ background:"linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))", border:"1px solid rgba(255,255,255,0.07)", borderRadius:18, overflow:"hidden" }}>
                <div style={{ padding:"18px 20px 14px", borderBottom:"1px solid rgba(255,255,255,0.05)", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10 }}>
                  <div>
                    <h3 style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:18, fontWeight:700, color:"#f1f5f9" }}>📋 Attendance Log</h3>
                    <p style={{ color:"#2d3a52", fontSize:11, marginTop:2 }}>Click ✓ / ✗ on today's column to update</p>
                  </div>
                  <div style={{ background:"rgba(52,211,153,0.1)", border:"1px solid rgba(52,211,153,0.25)", borderRadius:11, padding:"9px 18px", textAlign:"center" }}>
                    <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:24, fontWeight:700, color:"#34d399" }}>{attendancePct}%</div>
                    <div style={{ fontSize:10, color:"#2d3a52", marginTop:1, letterSpacing:"0.06em" }}>TODAY</div>
                  </div>
                </div>
                <div style={{ overflowX:"auto" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead>
                      <tr style={{ background:"rgba(255,255,255,0.02)" }}>
                        <th style={TH}>Member</th>
                        <th style={TH}>Role</th>
                        {attendance[0]?.logs.map(l => (
                          <th key={l.date} style={{ ...TH, color: l.date===today?"#fbbf24":"#2d3a52" }}>
                            {l.date}{l.date===today?" ★":""}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {attendance.map(a => {
                        const rs = ROLE_STYLE[a.role] || ROLE_STYLE.Member;
                        return (
                          <tr key={a.memberId} className="tr-row" style={{ borderBottom:"1px solid rgba(255,255,255,0.03)" }}>
                            <td style={{ padding:"12px 16px" }}>
                              <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                                <div style={{ width:30, height:30, borderRadius:8, background:rs.bg, border:`1px solid ${rs.border}`, color:rs.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800, flexShrink:0 }}>{a.name[0]}</div>
                                <span style={{ fontWeight:700, fontSize:13, color:"#e2e8f0" }}>{a.name}</span>
                              </div>
                            </td>
                            <td style={{ padding:"12px 16px" }}>
                              <span style={{ display:"inline-flex", padding:"3px 9px", borderRadius:6, background:rs.bg, color:rs.color, border:`1px solid ${rs.border}`, fontSize:10, fontWeight:700 }}>{a.role}</span>
                            </td>
                            {a.logs.map(l => (
                              <td key={l.date} style={{ padding:"12px 16px", textAlign:"center" }}>
                                {l.date===today ? (
                                  <div style={{ display:"flex", gap:5, justifyContent:"center" }}>
                                    <button className="att-btn" onClick={() => handleMarkAttendance(a.memberId, l.date, true)}
                                      style={{ background: l.present?"rgba(52,211,153,0.25)":"rgba(255,255,255,0.06)", color: l.present?"#34d399":"#475569", border: l.present?"1px solid rgba(52,211,153,0.4)":"1px solid rgba(255,255,255,0.08)" }}>✓</button>
                                    <button className="att-btn" onClick={() => handleMarkAttendance(a.memberId, l.date, false)}
                                      style={{ background: !l.present?"rgba(248,113,113,0.25)":"rgba(255,255,255,0.06)", color: !l.present?"#f87171":"#475569", border: !l.present?"1px solid rgba(248,113,113,0.4)":"1px solid rgba(255,255,255,0.08)" }}>✗</button>
                                  </div>
                                ) : (
                                  <span style={{ fontSize:15 }}>{l.present?"✅":"❌"}</span>
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
            )}

            {/* ── PLACEHOLDERS ── */}
            {["auction","winners","settings"].includes(activeNav) && (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"60vh", gap:14, opacity:0.35 }}>
                <div style={{ fontSize:60 }}>{NAV.find(n=>n.id===activeNav)?.icon}</div>
                <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:22, fontWeight:700, color:"#f1f5f9", letterSpacing:"0.08em" }}>{NAV.find(n=>n.id===activeNav)?.label}</div>
                <div style={{ color:"#475569", fontSize:13 }}>Coming soon — connect Supabase tables to enable.</div>
              </div>
            )}
          </div>
        </div>

        {/* ══ ADD MEMBER MODAL ══ */}
        {showAddMember && (
          <div className="modal-bg" onClick={() => setShowAddMember(false)}
            style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.72)", backdropFilter:"blur(5px)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <div className="modal-box" onClick={e=>e.stopPropagation()}
              style={{ background:"#0d1120", border:"1px solid rgba(255,255,255,0.1)", borderRadius:20, padding:"28px 30px", width:380, boxShadow:"0 28px 90px rgba(0,0,0,0.85)" }}>
              <h3 style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:21, fontWeight:700, color:"#f1f5f9", marginBottom:20, letterSpacing:"0.04em" }}>➕ Add New Member</h3>
              <div style={{ marginBottom:14 }}>
                <label style={{ display:"block", color:"#475569", fontSize:11, fontWeight:700, marginBottom:5, textTransform:"uppercase", letterSpacing:"0.07em" }}>Name</label>
                <input className="dark-input" placeholder="Enter member name" value={newMember.name} onChange={e=>setNewMember(p=>({...p,name:e.target.value}))} />
              </div>
              {[
                { label:"Role", key:"role", opts:["Leader","Elder","Member","Recruit","Creator"] },
                { label:"Class", key:"cls", opts:["Berserker","Skald","Warlord","Volva","Archer","RuneFighter"] },
                { label:"Status", key:"status", opts:["Active","Offline"] },
              ].map(f => (
                <div key={f.key} style={{ marginBottom:14 }}>
                  <label style={{ display:"block", color:"#475569", fontSize:11, fontWeight:700, marginBottom:5, textTransform:"uppercase", letterSpacing:"0.07em" }}>{f.label}</label>
                  <select className="dark-input" value={newMember[f.key]} onChange={e=>setNewMember(p=>({...p,[f.key]:e.target.value}))}>
                    {f.opts.map(o=><option key={o} value={o} style={{ background:"#0d1120" }}>{o}</option>)}
                  </select>
                </div>
              ))}
              <div style={{ display:"flex", gap:10, marginTop:22 }}>
                <button className="btn" onClick={() => setShowAddMember(false)}
                  style={{ flex:1, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", color:"#64748b", padding:"10px" }}>Cancel</button>
                <button className="btn" onClick={handleAddMember}
                  style={{ flex:2, background:"linear-gradient(135deg,#4f46e5,#6366f1)", color:"#fff", padding:"10px", boxShadow:"0 4px 18px rgba(99,102,241,0.3)" }}>Add Member</button>
              </div>
            </div>
          </div>
        )}

        {/* ══ SET BOSS TIMER MODAL ══ */}
        {bossModal && (
          <div className="modal-bg" onClick={() => setBossModal(null)}
            style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.72)", backdropFilter:"blur(5px)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <div className="modal-box" onClick={e=>e.stopPropagation()}
              style={{ background:"#0d1120", border:"1px solid rgba(255,255,255,0.1)", borderRadius:20, padding:"28px 30px", width:340, boxShadow:"0 28px 90px rgba(0,0,0,0.85)" }}>
              <h3 style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:20, fontWeight:700, color:"#f1f5f9", marginBottom:6, letterSpacing:"0.04em" }}>⏱ Set Boss Timer</h3>
              <p style={{ color:"#2d3a52", fontSize:12, marginBottom:20 }}>{bosses.find(b=>b.id===bossModal)?.name}</p>
              <label style={{ display:"block", color:"#475569", fontSize:11, fontWeight:700, marginBottom:8, textTransform:"uppercase", letterSpacing:"0.07em" }}>Minutes remaining</label>
              <input className="dark-input" type="number" placeholder="e.g. 45" min="0" value={manualMins} onChange={e=>setManualMins(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&handleSetManual()} style={{ marginBottom:8 }} />
              <p style={{ color:"#334155", fontSize:11, marginBottom:20 }}>Enter 0 to set boss as LIVE right now.</p>
              <div style={{ display:"flex", gap:10 }}>
                <button className="btn" onClick={() => setBossModal(null)}
                  style={{ flex:1, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", color:"#64748b", padding:"10px" }}>Cancel</button>
                <button className="btn" onClick={handleSetManual}
                  style={{ flex:2, background:"linear-gradient(135deg,#0f766e,#14b8a6)", color:"#fff", padding:"10px", boxShadow:"0 4px 18px rgba(20,184,166,0.3)" }}>Set Timer</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}

// ── Members Table Component ──
function MembersTable({ filtered }) {
  return (
    <div style={{ overflowX:"auto" }}>
      <table style={{ width:"100%", borderCollapse:"collapse" }}>
        <thead>
          <tr style={{ background:"rgba(255,255,255,0.02)" }}>
            {["Member","Class","Role","Points","Status",""].map(h=>(
              <th key={h} style={TH}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map(m => {
            const rs = ROLE_STYLE[m.role] || ROLE_STYLE.Member;
            const ss = STATUS_STYLE[m.status] || STATUS_STYLE.Offline;
            return (
              <tr key={m.id} className="tr-row" style={{ borderBottom:"1px solid rgba(255,255,255,0.03)" }}>
                <td style={{ padding:"12px 16px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:32, height:32, borderRadius:9, background:rs.bg, border:`1px solid ${rs.border}`, color:rs.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800, flexShrink:0 }}>{m.name[0]}</div>
                    <span style={{ fontWeight:700, color:"#e2e8f0", fontSize:13, letterSpacing:"0.03em" }}>{m.name}</span>
                  </div>
                </td>
                <td style={{ padding:"12px 16px", color:"#475569", fontSize:12 }}>{m.cls}</td>
                <td style={{ padding:"12px 16px" }}>
                  <span style={{ display:"inline-flex", padding:"4px 10px", borderRadius:6, background:rs.bg, color:rs.color, border:`1px solid ${rs.border}`, fontSize:10, fontWeight:700, letterSpacing:"0.04em" }}>{m.role}</span>
                </td>
                <td style={{ padding:"12px 16px", color:"#fbbf24", fontWeight:700, fontSize:14, fontFamily:"'Rajdhani',sans-serif" }}>{m.points.toLocaleString()}</td>
                <td style={{ padding:"12px 16px" }}>
                  <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"4px 10px", borderRadius:6, background:ss.bg, color:ss.color, fontSize:10, fontWeight:700 }}>
                    <span style={{ width:6, height:6, borderRadius:"50%", background:ss.dot, flexShrink:0 }} />{m.status}
                  </span>
                </td>
                <td style={{ padding:"12px 16px" }}>
                  <button className="btn" style={{ background:"rgba(99,102,241,0.12)", border:"1px solid rgba(99,102,241,0.25)", color:"#a5b4fc", padding:"5px 12px", fontSize:11, borderRadius:7 }}>Edit</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Boss Panel (sidebar in dashboard) ──
function BossPanel({ bosses, onKill, onReset, onManual, killFlash }) {
  return (
    <div style={{ background:"linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))", border:"1px solid rgba(255,255,255,0.07)", borderRadius:18, overflow:"hidden", display:"flex", flexDirection:"column" }}>
      <div style={{ padding:"16px 18px 12px", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
        <h3 style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:16, fontWeight:700, color:"#f1f5f9" }}>⚔️ Boss Timers</h3>
        <p style={{ color:"#2d3a52", fontSize:10, marginTop:2 }}>Live countdown · click to control</p>
      </div>
      <div style={{ flex:1, overflow:"auto", display:"flex", flexDirection:"column", gap:8, padding:"12px 14px" }}>
        {bosses.map(b => {
          const st = bossStatus(b.secs);
          const bs = BOSS_STATUS_STYLE[st];
          return (
            <div key={b.id} className={`boss-card${killFlash===b.id?" kill-flash":""}`}
              style={{ background:"rgba(255,255,255,0.028)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:13, padding:"13px 15px", position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", left:0, top:0, bottom:0, width:3, background:b.color }} />
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:"#e2e8f0" }}>{b.name}</div>
                  <div style={{ fontSize:10, color:"#2d3a52", marginTop:1 }}>{b.ch}</div>
                </div>
                <span style={{ display:"inline-flex", padding:"2px 8px", borderRadius:5, background:bs.bg, color:bs.color, border:`1px solid ${bs.border}`, fontSize:9, fontWeight:700 }}>{st}</span>
              </div>
              <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:26, fontWeight:700, color:b.color, letterSpacing:"0.06em", lineHeight:1, marginBottom:10 }}>
                {fmtSecs(b.secs)}
              </div>
              <button className="kill-btn" onClick={() => onKill(b.id)}
                style={{ background:`${b.color}20`, border:`1px solid ${b.color}45`, color:b.color, marginBottom:6 }}>
                ☠️ Mark Killed
              </button>
              <div style={{ display:"flex", gap:6 }}>
                <button className="ghost-btn" onClick={() => onReset(b.id)} style={{ flex:1, fontSize:10, padding:"5px 6px" }}>🔴 LIVE now</button>
                <button className="ghost-btn" onClick={() => onManual(b.id)} style={{ flex:1, fontSize:10, padding:"5px 6px" }}>⏱ Set timer</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
